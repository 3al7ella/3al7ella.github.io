// Reads the owner's formatted invoice message without guessing identities or prices.
import {adaptExtraction} from './extraction-adapter.js';
import {asciiDigits} from './intake.js';
export function parseFormattedInvoice(raw,normalizePhone){
 if(!/فاتورة/u.test(raw)||!/^\s*👤/mu.test(raw))return null;
 const proposal={schema_version:1,customer_names:[],addresses:[],phones:[],items:[],quoted_subtotal:null,delivery_fee:null,discount:null,notes:[],unresolved:[]};
 const normalized=asciiDigits(raw).replace(/[\u200e\u200f\u061c]/g,' '),fact=(a,b,value=raw.slice(a,b))=>({value,evidence:{start:a,end:b}}),unknown=[],dates=[],references=[],financialConflicts=new Set();let total=null,deliveryText='',addressExtra=[];
 const set=(key,f)=>{if(proposal[key]&&Number(proposal[key].value)!==Number(f.value)){unknown.push(f.evidence);financialConflicts.add(key)}else proposal[key]=f};
 for(const lineMatch of normalized.matchAll(/[^\r\n]+/gu)){
  const offset=lineMatch.index,original=raw.slice(offset,offset+lineMatch[0].length),line=lineMatch[0];let m;
  if((m=line.match(/^\s*👤\s*(?<name>[^|｜]+?)\s*[|｜]\s*(?<phone>\+?[\d ().-]{10,22})\s*$/du))){const [a,b]=m.indices.groups.name,[c,d]=m.indices.groups.phone;proposal.customer_names.push(fact(offset+a,offset+b));proposal.phones.push({number:fact(offset+c,offset+d),role:'unspecified',role_evidence:null});continue}
  if((m=line.match(/^\s*📍\s*(?<address>.+?)\s*$/du))){const [a,b]=m.indices.groups.address;proposal.addresses.push(fact(offset+a,offset+b));continue}
  if(/^\s*(?:داخل|بجوار|بجوار|أمام|امام|خلف|الدور|شقة|شقه|عمارة|عماره)\s/u.test(line)&&proposal.addresses.length){addressExtra.push(original.trim());continue}
  if((m=line.match(/(?:^|\s)(?<day>\d{1,2})\s*[/.-]\s*(?<month>\d{1,2})\s*[/.-]\s*(?<year>20\d{2})(?:\s|$)/du))&&/رقم الطلب|تاريخ|فاتورة/u.test(line)){const d=Number(m.groups.day),mo=Number(m.groups.month),y=Number(m.groups.year),dt=new Date(Date.UTC(y,mo-1,d));if(dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===d)dates.push({value:`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`,evidence:{start:offset+m.index,end:offset+m.index+m[0].length}});else unknown.push({start:offset,end:offset+line.length});const ref=line.match(/رقم الطلب\s*[:：]\s*([A-Za-z0-9-]+)/u);if(ref)references.push(ref[1]);continue}
  if(/^\s*(?:🛒\s*)?الأصناف\s*[:：]?\s*$/u.test(line)||/^\s*[━─═_-]{3,}\s*$/u.test(line)||/^\s*🧾/u.test(line)||/^\s*❤️?\s*شكر/u.test(line)||/^\s*يوم\s+/u.test(line))continue;
  if((m=line.match(/^\s*(?:💳\s*)?(?:الدفع|طريقة الدفع)\s*[:：]\s*(?<text>.+)$/du))){const [a,b]=m.indices.groups.text;proposal.notes.push(fact(offset,offset+line.length));continue}
  if((m=line.match(/^\s*(?:🕒\s*)?(?:موعد التسليم|ميعاد التسليم)\s*[:：]\s*(?<text>.+)$/du))){deliveryText=raw.slice(offset+m.indices.groups.text[0],offset+m.indices.groups.text[1]);continue}
  const content=line.replace(/^\s*🛒\s*الأصناف\s*[:：]\s*/u,'');const contentOffset=offset+line.length-content.length;
  const chunks=/^\s*(?:🛒\s*)?الأصناف\s*[:：]\s*[^\d\s]/u.test(line)?[...content.matchAll(/[^،,]+/gu)].map(z=>({text:z[0],start:contentOffset+z.index})):[{text:line,start:offset}];let recognized=true;
  for(const chunk of chunks){
   const text=chunk.text,base=chunk.start;
   m=text.match(/^\s*(?:[•*\-]\s*)?(?<name>.+?)\s*(?:[—–-]\s*|\s+)(?<qty>نص|نصف|ربع|\d+(?:\.\d{1,3})?)\s*(?<unit>كيلو|كجم|جرام|جم|طبق|علبة|صينية|قطعة)\s*(?:[—–-]\s*|\s+)(?<amount>\d+(?:\.\d{1,2})?)\s*(?:جنيه|ج|EGP)\s*$/diu);
   if(m){const g=m.indices.groups,quantity=['نص','نصف'].includes(m.groups.qty)?'0.5':m.groups.qty==='ربع'?'0.25':m.groups.qty;proposal.items.push({name:fact(base+g.name[0],base+g.name[1]),quantity:fact(base+g.qty[0],base+g.qty[1],quantity),unit:fact(base+g.unit[0],base+g.unit[1]),price_basis:'line_total',quoted_amount:fact(base+g.amount[0],base+g.amount[1],m.groups.amount),source:{start:base,end:base+text.length}});continue}
   const financialChunks=[...text.matchAll(/(?:^\s*|[،,]\s*|\s*💰\s*)(?<label>الأصناف|إجمالي الأصناف|اجمالي الأصناف|التوصيل|الخصم|الإجمالي|الاجمالي)\s*[:：]\s*(?<amount>\d+(?:\.\d{1,2})?)\s*(?:جنيه|ج|EGP)?/dgu)];
   if(financialChunks.length){for(const z of financialChunks){const [a,b]=z.indices.groups.amount,f= fact(base+a,base+b,z.groups.amount),label=z.groups.label;if(/^(?:الإجمالي|الاجمالي)$/u.test(label)){if(total&&Number(total.value)!==Number(f.value)){unknown.push(f.evidence);financialConflicts.add('quoted_total')}total=f}else set(label==='التوصيل'?'delivery_fee':label==='الخصم'?'discount':'quoted_subtotal',f)}continue}
   recognized=false;unknown.push({start:base,end:base+text.length});
  }
 }
 if(!proposal.customer_names.length)return null;
 proposal.unresolved=unknown;const result=adaptExtraction(raw,proposal,{normalizePhone});result.unparsed_lines=unknown.map(x=>raw.slice(x.start,x.end));result.parser_version='formatted-invoice-2';result.extraction_mode='local_rules';result.local_field_evidence={invoice_date:dates};
 const uniqueDates=[...new Set(dates.map(d=>d.value))];if(uniqueDates.length===1){result.fields.invoice_date=uniqueDates[0];result.requires_manual_date=false}else if(uniqueDates.length>1){result.conflicts.push('invoice_date');result.issues.push('أكثر من تاريخ فاتورة، حدد الصحيح.')}
 if(references.length===1)result.source_reference=references[0];
 result.quoted_total=total?.value??null;for(const key of financialConflicts){result.conflicts.push(key);result.issues.push('قيم مالية متعارضة في الرسالة؛ صحح الأصل قبل الاعتماد.')}

 if(!proposal.discount&&total&&proposal.quoted_subtotal&&proposal.delivery_fee&&Number(total.value)===Number(proposal.quoted_subtotal.value)+Number(proposal.delivery_fee.value)){result.fields.discount='0';result.discount_basis='quoted_total_equals_items_plus_delivery'}
 if(deliveryText){let shown=deliveryText;if(result.fields.invoice_date&&/^بعد\s*(?:بكره|بكرة)$/u.test(deliveryText.trim())){const d=new Date(result.fields.invoice_date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+2);result.fields.delivery_date=d.toISOString().slice(0,10);shown+=' ('+d.toLocaleDateString('ar-EG',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'})+')'}result.fields.delivery_notes=['موعد التسليم: '+shown,...addressExtra].join(' · ')}else if(addressExtra.length)result.fields.delivery_notes=addressExtra.join(' · ');
 return result;
}
