// Supported Egyptian order formats only. All interpretation stays in this browser.
import {parseFormattedInvoice} from './formatted-parser.js';
import {asciiDigits} from './intake.js';
import {adaptExtraction} from './extraction-adapter.js';
const units='كيلوجرام|كيلو|كجم|كغ|جرام|جم|قطعة|قطعه|قطع|علبة|علبه|علب|طبق|أطباق|صينية|صينيه|صواني|فرخات|فراخ|فرخة|فرخه|دجاجة|دجاج';
const qty='\\d+\\/\\d+|\\d+(?:\\.\\d{1,3})?|نص|نصف|ربع';
const explicit=new RegExp(`^(?:و\\s*)?(?:(?:عايز|عايزة|عاوزه|عاوز|محتاج|محتاجة)\\s+)?(?<q>${qty})\\s*(?<u>${units})\\s+(?<rest>.+)$`,'du');
const implicit=/^(?:و\s*)?(?:(?:عايز|عايزة|عاوزه|عاوز|محتاج|محتاجة)\s+)?(?<q>كيلو\s*و\s*(?:نص|نصف|ربع)|كيلوين|كيلو|صينية|صينيه|قطعة|قطعه|علبة|علبه|طبق|فرخة|فرخه|دجاجة)\s+(?<rest>.+)$/du;
const moneyPattern='[0-9][0-9,٬.]*';
export function localMoney(value){let s=asciiDigits(value).trim();if(/^\d{1,3}(?:[,٬]\d{3})+(?:\.\d{1,2})?$/.test(s))s=s.replace(/[,٬]/g,'');if(!/^\d+(?:\.\d{1,2})?$/.test(s)||!Number.isFinite(Number(s))||Number(s)>999999)return null;return s}
function quantityValue(text){const s=asciiDigits(text).trim().replace(/\s+/g,' ');if(['نص','نصف'].includes(s))return '0.5';if(s==='ربع')return '0.25';if(/^كيلو\s*و\s*(?:نص|نصف)$/.test(s))return '1.5';if(/^كيلو\s*و\s*ربع$/.test(s))return '1.25';if(s==='كيلوين')return '2';if(/^(?:كيلو|صينية|صينيه|قطعة|قطعه|علبة|علبه|طبق|فرخة|فرخه|دجاجة)$/.test(s))return '1';let n;if(/^\d+\/\d+$/.test(s)){const [a,b]=s.split('/').map(Number);if(!b)return null;if((BigInt(a)*1000n)%BigInt(b)!==0n)return null;n=a/b}else if(/^\d+(?:\.\d{1,3})?$/.test(s))n=Number(s);else return null;return n>0&&n<=999999?String(n):null}

function* orderSegments(raw){
 const boundary=new RegExp(`[,،;؛]\\s*(?=(?:و\\s*)?(?:(?:عايز|عايزة|عاوزه|عاوز|محتاج|محتاجة)\\s+)?(?:كيلو(?:ين)?(?:\\s*و\\s*(?:نص|نصف|ربع))?\\s+|(?:${qty})\\s*(?:${units})\\s+))`,'gu');
 for(const found of raw.matchAll(/[^\r\n]+/gu)){let from=0;for(const m of found[0].matchAll(boundary)){yield Object.assign([found[0].slice(from,m.index)],{index:found.index+from});from=m.index+m[0].length}yield Object.assign([found[0].slice(from)],{index:found.index+from})}
}
export function parseSupportedOrder(raw,normalizePhone){
 if(typeof raw!=='string'||!raw.trim()||raw.length>20000)throw Error('الصق طلبًا واحدًا، بحد أقصى ٢٠ ألف حرف.');
 const formatted=parseFormattedInvoice(raw,normalizePhone);if(formatted)return formatted;
 const proposal={schema_version:1,customer_names:[],addresses:[],phones:[],items:[],quoted_subtotal:null,delivery_fee:null,discount:null,notes:[],unresolved:[]};
 const localIssues=[],contactParts=[],extras={},assumed=[],moneyValues={};
 const span=(start,end)=>({start,end});const fact=(start,end,value=raw.slice(start,end))=>({value,evidence:span(start,end)});
 const setSingle=(key,value)=>{(moneyValues[key]??=[]).push(value);if(proposal[key]&&proposal[key].value!==value.value){localIssues.push('تعارض في '+({quoted_subtotal:'إجمالي الأصناف',delivery_fee:'التوصيل',discount:'الخصم'}[key]||key));proposal.unresolved.push(value.evidence)}else proposal[key]=value};
 for(const found of orderSegments(raw)){
  let start=found.index,body=found[0];const leading=body.match(/^\s*/u)[0].length;start+=leading;body=body.slice(leading).trimEnd();if(!body)continue;
  const stamp=body.match(/^\[[^\]]{1,90}\]\s*/u);if(stamp){start+=stamp[0].length;body=body.slice(stamp[0].length);const sender=body.match(/^[^:：]{1,70}[:：]\s*/u);if(sender&&!/^(?:الاسم|اسم العميل|العميل|العنوان|عنوان التوصيل|اسم الشارع|المنطقة|رقم|تليفون|الهاتف|الموبايل|ملاحظ)/u.test(body)){start+=sender[0].length;body=body.slice(sender[0].length)}}
  const end=start+body.length,line=asciiDigits(body),at=(a,b)=>span(start+a,start+b),f=(a,b,value)=>fact(start+a,start+b,value);
  let m=body.match(/^(?:الاسم|اسم العميل|العميل|اسم الزبون)(?:\s*[:：]\s*|\s+)(.+?)\s*$/du);if(m){proposal.customer_names.push(f(...m.indices[1]));continue}
  m=body.match(/^(?:العنوان|عنوان التوصيل|اسم الشارع|الشارع|المكان)(?:\s*[:：]\s*|\s+)(.+?)\s*$/du);if(m){proposal.addresses.push(f(...m.indices[1]));continue}
  m=body.match(/^(المنطقة|المحافظة|رقم العمارة|رقم الدور|رقم الشقة|علامة مميزة|ملاحظات التوصيل)(?:\s*[:：]\s*|\s+)(.+?)\s*$/du);if(m){const field=f(...m.indices[2]);contactParts.push({label:m[1],source_line:body,...field});if(m[1]==='المنطقة'||m[1]==='المحافظة'){const key=m[1]==='المنطقة'?'area':'governorate';(extras[key]??=[]).push(field)}continue}
  m=body.match(/^(?:ملاحظات|ملاحظة|ملحوظة)(?:\s*[:：]\s*|\s+)(.+?)\s*$/du);if(m){proposal.notes.push(f(...m.indices[1]));continue}
  const moneyLabel=line.match(new RegExp(`^(?<label>قيمة الأصناف|إجمالي الأصناف|اجمالي الأصناف|مجموع الأصناف|توتل(?:\\s+بدون\\s+توصيل)?|الإجمالي بدون توصيل|التوصيل|رسوم التوصيل|الخصم)\\s*(?:[:：=]\\s*|\\s+)(?<amount>${moneyPattern})(?:\\s*(?:جنيه|ج|EGP))?\\s*$`,'diu'));
  if(moneyLabel){const v=localMoney(moneyLabel.groups.amount);if(v!==null){const key=/التوصيل|رسوم التوصيل/u.test(moneyLabel.groups.label)&&!/^الإجمالي|^توتل/u.test(moneyLabel.groups.label)?'delivery_fee':moneyLabel.groups.label==='الخصم'?'discount':'quoted_subtotal';setSingle(key,f(...moneyLabel.indices.groups.amount,v));continue}}
  const phoneMatches=[...line.matchAll(/(?<!\d)(?:\+20|0020|20)?[ ().-]*0?1[0125](?:[ ().-]*\d){8}(?!\d)/g)];const candidates=phoneMatches.map(x=>normalizePhone(x[0])).filter(Boolean);
  if(candidates.length&&(/^(?:رقم|الموبايل|الهاتف|التليفون|التلفون|تليفون|تلفون|هاتف|موبايل|واتساب|فودافون|محفظة|دفع|تحويل)/u.test(body)||normalizePhone(body))){
   const matches=phoneMatches;
   for(const phone of matches){if(!normalizePhone(phone[0]))continue;const prefix=body.slice(0,phone.index),payment=/(?:تحويل|دفع|كاش|محفظة)/u.test(body),additional=/(?:[إا]ضاف[يى]|تاني|ثاني|بديل)/u.test(body),primary=/(?:أساسي|اساسي|رئيسي)/u.test(prefix)||(matches.length===1&&/^(?:رقم\s*)?(?:الموبايل|الهاتف|التليفون|التلفون|تليفون|تلفون|هاتف|موبايل|رقمي|واتساب)\s*[:：]\s*$/u.test(prefix));
    const role=payment?'payment':additional?'additional':primary?'primary':'unspecified';proposal.phones.push({number:f(phone.index,phone.index+phone[0].length),role,role_evidence:role==='unspecified'?null:span(start,end)});
    const tail=body.slice(phone.index+phone[0].length);if(/[\p{L}]/u.test(tail))proposal.unresolved.push(span(start+phone.index+phone[0].length,end));
   }continue;
  }
  m=line.match(explicit)||line.match(implicit);
  if(m){
   const qText=body.slice(...m.indices.groups.q),q=quantityValue(qText);if(q===null){proposal.unresolved.push(span(start,end));continue}
   let unitIndices=m.indices.groups.u;if(!unitIndices){const qs=m.indices.groups.q;const unitText=qText.startsWith('كيلو')?'كيلو':qText;unitIndices=[qs[0],qs[0]+unitText.length]}
   const restStart=m.indices.groups.rest[0],rest=line.slice(restStart);let nameEnd=line.length,basis='unknown',quoted=null,inferred=false;
   const explicitPrice=rest.match(new RegExp(`\\s*(?:[|،,:=]\\s*)?(?<label>سعر الوحدة|سعر الكيلو|إجمالي السطر|اجمالي السطر|إجمالي الصنف|اجمالي الصنف|إجمالي|اجمالي)\\s*(?:[:：=]\\s*|\\s+)(?<amount>${moneyPattern})(?:\\s*(?:جنيه|ج|EGP))?\\s*$`,'diu'));
   const trailing=explicitPrice||rest.match(new RegExp(`(?<amount>${moneyPattern})(?:\\s*(?:جنيه|ج|EGP))?\\s*$`,'diu'));
   if(trailing){const v=localMoney(trailing.groups.amount),priceAt=restStart+trailing.indices.groups.amount[0],before=rest.slice(0,trailing.index);if(v!==null&&priceAt>restStart&&!/(?:مقاس|حجم|رقم|موديل|الساعة|الساعه|ميعاد|موعد|يوم|[-−eE])\s*$/u.test(before)){nameEnd=restStart+trailing.index;while(nameEnd>restStart&&/[\s|،,:=]/u.test(body[nameEnd-1]))nameEnd--;basis=explicitPrice&&/^سعر/u.test(explicitPrice.groups.label)?'unit_price':'line_total';quoted=f(priceAt,priceAt+trailing.groups.amount.length,v);inferred=!explicitPrice}}
   while(nameEnd>restStart&&/\s/u.test(body[nameEnd-1]))nameEnd--;
   if(nameEnd<=restStart){proposal.unresolved.push(span(start,end));continue}
   const item={name:f(restStart,nameEnd),quantity:f(...m.indices.groups.q,q),unit:f(...unitIndices),price_basis:basis,quoted_amount:quoted,source:span(start,end)};proposal.items.push(item);if(inferred)assumed.push(proposal.items.length-1);continue;
  }
  if(/^(?:الاوردر كله|الأوردر كله|الطلب كله)/u.test(body)){proposal.notes.push(f(0,body.length));continue}
  proposal.unresolved.push(span(start,end));
 }
 for(const [key,values]of Object.entries(moneyValues))if(new Set(values.map(x=>Number(x.value))).size>1){proposal[key]=null;for(const v of values)proposal.unresolved.push(v.evidence)}
 const result=adaptExtraction(raw,proposal,{normalizePhone});for(const [key,values]of Object.entries(moneyValues))if(new Set(values.map(x=>Number(x.value))).size>1)result.conflicts.push(key);
 for(const index of assumed){result.items[index].source_price.assumed_basis=true;result.items[index].source_price.local_rule='trailing_amount_requires_owner_confirmation'}
 if(assumed.length)localIssues.push('اعتبرنا المبلغ في آخر السطر إجمالي الصنف. راجع نوع السعر قبل الاعتماد.');
 for(const [key,values]of Object.entries(extras)){const unique=[...new Set(values.map(x=>x.value))];if(unique.length===1)result.fields[key]=unique[0];else if(unique.length>1)result.conflicts.push(key)}
 const parts=[...new Map(contactParts.filter(x=>!['المنطقة','المحافظة'].includes(x.label)).map(x=>[x.label+':'+x.value,x])).values()];
 if(parts.length)result.fields.delivery_notes=parts.map(x=>x.label+': '+x.value).join(' · ');
 const recognizedParts=new Set(contactParts.map(x=>x.source_line.trim()));result.unparsed_lines=result.unparsed_lines.filter(x=>!recognizedParts.has(x.trim()));result.contact_parts=contactParts;result.local_field_evidence=extras;result.extraction_mode='local_rules';result.parser_version='supported-formats-1';result.issues=[...new Set([...result.issues,...localIssues])];
 if(result.conflicts.length)result.issues.push('توجد بيانات متعارضة، حدد الصحيح من الرسالة قبل الاعتماد.');
 return result;
}
