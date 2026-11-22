import {esc,money,dateLabel,download,localMode,lineAmount} from './lib.js';
import {brandLogoUrl,invoiceBrandHeader} from './invoice-brand.js';
const known=v=>(typeof v==='number'||typeof v==='string')&&String(v).trim()!==''&&Number.isFinite(Number(v));
const amount=v=>known(v)?money(v):'لم يُحدد';
const number=v=>known(v)?Number(v).toLocaleString('ar-EG',{minimumFractionDigits:2,maximumFractionDigits:2}):'غير محدد';
export function receiptData(i){
 const p=i.payload||i,c=i.customer_snapshot||{name:i.name??p.name,phone:i.phone??p.phone,address:i.address??p.address};
 const source=p.source_intake||{},items=(i.items||p.items||[]).map((x,k)=>({...p.items?.[k],...x,source_price:x.source_price||p.items?.[k]?.source_price}));
 const lines=items.map(x=>{const quote=x.source_price?.basis==='line_total'?x.source_price.quoted_line_total:null;const value=known(quote)?Number(quote):known(x.line_total)?Number(x.line_total):known(x.quantity)&&known(x.unit_price)?lineAmount(x.quantity,x.unit_price):null;return {...x,amount:known(value)?value:null,quoted:known(quote)}});
 const computed=lines.length&&lines.every(x=>known(x.amount))?lines.reduce((s,x)=>s+Math.round(x.amount*100),0)/100:null;
 const subtotal=known(i.subtotal??p.subtotal)?Number(i.subtotal??p.subtotal):computed;
 const fee=i.delivery_fee??p.delivery_fee,discount=i.discount??p.discount;
 const exact=lines.length>0&&lines.every(x=>known(x.quantity)&&Number(x.quantity)>0&&known(x.unit_price)&&Math.round(lineAmount(x.quantity,x.unit_price)*100)===Math.round(Number(x.amount)*100));
 let total=null;if(exact&&known(subtotal)&&known(fee)&&known(discount)&&Number(fee)>=0&&Number(discount)>=0&&Number(discount)<=subtotal+Number(fee)){total=(Math.round(subtotal*100)+Math.round(Number(fee)*100)-Math.round(Number(discount)*100))/100}
 const primary=c.phone||i.customer_phone||p.phone||'';
 const additional=[...new Set(source.additional_phones||[])].filter(x=>typeof x==='string'&&x!==primary);
 return {source_reference:source.source_reference||'',customer:{...c,phone:primary},additional,lines,subtotal,fee,discount,total,invoice_date:i.invoice_date??p.invoice_date,notes:i.notes??p.notes??'',delivery_notes:p.delivery_notes||'',draft:!i.invoice_number||['draft','review','rejected'].includes(i.state),cancelled:i.state==='cancelled',invoice_number:i.invoice_number||'',version:i.version||1};
}
function lineDetail(x){const q=known(x.quantity)?x.quantity:'كمية غير محددة',unit=x.unit||'وحدة غير محددة';return `${q} ${unit} · ${known(x.unit_price)?amount(x.unit_price)+' للوحدة'+(x.quoted&&Number(x.source_price?.calculated_unit_price)===Number(x.unit_price)?'، محسوب من إجمالي الصنف':''):'سعر الوحدة لم يُحدد'}${x.quoted?' · قيمة السطر كما وردت':''}`}
export function invoiceText(i){const r=receiptData(i),c=r.customer;return [localMode?'نسخة تجربة محلية، ليست فاتورة بيع حقيقية':null,'ع الحلة | '+(r.draft?'مسودة غير معتمدة':'فاتورة '+r.invoice_number),r.cancelled?'ملغاة، ليست مطالبة بالسداد':null,r.source_reference?'مرجع الطلب: '+r.source_reference:null,'التاريخ: '+dateLabel(r.invoice_date),'العميل: '+(c.name||'لم يحدد'),'الموبايل: '+(c.phone||'لم يحدد'),...r.additional.map(x=>'تليفون إضافي: '+x),'العنوان: '+(c.address||'لم يحدد'),r.delivery_notes?'ملاحظات التوصيل: '+r.delivery_notes:null,'',...r.lines.map(x=>`${x.name||'صنف غير محدد'}\n${lineDetail(x)}\nقيمة الصنف: ${amount(x.amount)}`),'','قيمة الأصناف: '+amount(r.subtotal),'التوصيل: '+amount(r.fee),'الخصم: '+amount(r.discount),'الإجمالي النهائي: '+amount(r.total),r.notes?'ملاحظات: '+r.notes:null,r.draft?'مسودة للمراجعة، ليست فاتورة نهائية محفوظة':null,'شكرًا لثقتكم في ع الحلة'].filter(x=>x!==null).join('\n')}
export function paper(i,{draft=false,hidePhone=false}={}){const r=receiptData(i),c=r.customer;draft=draft||r.draft;return `<article class="invoice-paper receipt-paper" dir="rtl">${localMode?'<div class="receipt-local">نسخة تجربة محلية، ليست فاتورة بيع حقيقية</div>':''}${invoiceBrandHeader({title:'فاتورة طلب',status:r.cancelled?'فاتورة ملغاة':draft?'مسودة للمراجعة':'فاتورة معتمدة'})}<div class="receipt-meta">${!draft?`<bdi>${esc(r.invoice_number)}</bdi> · النسخة ${esc(r.version)} · `:''}تاريخ الفاتورة: ${esc(dateLabel(r.invoice_date))}</div>${r.source_reference?`<div class="receipt-meta">مرجع الطلب: <bdi>${esc(r.source_reference)}</bdi></div>`:''}${r.cancelled?'<div class="notice error">فاتورة ملغاة، ليست مطالبة بالسداد.</div>':''}<section class="receipt-customer"><small>العميل</small><h3>${esc(c.name||'الاسم لم يحدد')}</h3>${!hidePhone?`<div class="receipt-phone"><span>التليفون الأساسي</span><bdi dir="ltr">${esc(c.phone||'لم يحدد')}</bdi></div>${r.additional.map(x=>`<div class="receipt-phone"><span>تليفون إضافي</span><bdi dir="ltr">${esc(x)}</bdi></div>`).join('')}`:''}</section><div class="receipt-columns"><span>الصنف والكمية</span><span>القيمة (جنيه)</span></div><div class="invoice-lines">${r.lines.map(x=>`<div class="invoice-line"><div class="row"><span>${esc(x.name||'صنف غير محدد')}</span><b>${number(x.amount)}</b></div><small>${esc(lineDetail(x))}</small></div>`).join('')}</div><div class="receipt-subtotal"><span>${known(r.total)?'الإجمالي النهائي':'إجمالي الأصناف'}<small>${known(r.total)?'شامل التوصيل وبعد الخصم':'قبل التوصيل وأي خصم'}</small></span><strong>${amount(known(r.total)?r.total:r.subtotal)}</strong></div><div class="receipt-totals">${known(r.total)?`<div class="row"><span>إجمالي الأصناف</span><span>${amount(r.subtotal)}</span></div>`:''}<div class="row"><span>التوصيل</span><span>${amount(r.fee)}</span></div><div class="row"><span>الخصم</span><span>${amount(r.discount)}</span></div><div class="row receipt-grand"><b>الإجمالي النهائي</b><b>${known(r.total)?amount(r.total):'بانتظار استكمال المراجعة'}</b></div></div><section class="receipt-address"><small>عنوان التوصيل</small><p>${esc(c.address||'العنوان لم يحدد')}</p>${r.delivery_notes?`<p>${esc(r.delivery_notes)}</p>`:''}</section>${r.notes?`<div class="notice">${esc(r.notes)}</div>`:''}${draft?'<p class="receipt-draft-note">مسودة غير معتمدة، ليست فاتورة نهائية. لا حفظ نهائي قبل موافقة حمدي.</p>':''}<p class="tagline">شكرًا لثقتكم في ع الحلة</p></article>`}
export function printInvoice(i,opts){document.getElementById('print-area').innerHTML=paper(i,opts);window.print()}
function wrap(ctx,text,max){const words=String(text||'').split(/\s+/);let line='',out=[];for(const word of words){const next=(line?line+' ':'')+word;if(ctx.measureText(next).width<=max){line=next;continue}if(line){out.push(line);line=''}if(ctx.measureText(word).width<=max){line=word;continue}const units=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ar',{granularity:'grapheme'}).segment(word)].map(x=>x.segment):Array.from(word);for(const char of units){if(ctx.measureText(line+char).width>max&&line){out.push(line);line=char}else line+=char}}if(line)out.push(line);return out}
async function loadLogo(){const img=new Image();img.src=brandLogoUrl;await img.decode();return img}
export async function imageBlobs(i){
 await document.fonts.ready;const logo=await loadLogo(),r=receiptData(i),pages=[],chunks=[];let chunk=[],chars=0;
 for(const item of r.lines){const n=String(item.name).length;if(chunk.length>=12||chars+n>600){chunks.push(chunk);chunk=[];chars=0}chunk.push(item);chars+=n}if(chunk.length||!chunks.length)chunks.push(chunk);
 // Approved design 2: white page, orange accents, cream cards, red grand-total bar, gradient footer. Presentation only; all values come from receiptData above.
 const W=1080,M=70,L=M,CW=W-2*M,R=W-M,WHITE='#fff',RED='#b83411',ORANGE='#cf4a1b',CREAM='#fdf6ec',PILL_BG='#fceee1',INK='#33241c',MUTED='#8a7566',FAINT='#6b5546',LINE='#ead9c8',BAND_A='#d6541e',BAND_B='#b83411';
 const fmtN=v=>Number(v).toLocaleString('ar-EG',{minimumFractionDigits:0,maximumFractionDigits:2});
 const fmtM=v=>known(v)?fmtN(v)+' جنيه':'لم يُحدد';
 const font=(size,bold)=>`${bold?'700':'400'} ${size}px Tahoma,'Noto Sans Arabic',Arial,sans-serif`;
 for(let idx=0;idx<chunks.length;idx++){
  const measure=document.createElement('canvas').getContext('2d'),commands=[];let y=0;measure.textBaseline='top';
  const text=(t,x,ty,o)=>commands.push({t:'text',text:String(t),x,y:ty,size:o.size||30,color:o.color||INK,bold:!!o.bold,align:o.align||'right',direction:o.direction||'rtl'});
  const draw=(t,{size=30,color=INK,bold=false,gap=14,direction='rtl',x=R,align='right',width=CW}={})=>{measure.font=font(size,bold);for(const l of wrap(measure,t,width)){text(l,x,y,{size,color,bold,align,direction});y+=Math.round(size*1.55)}y+=gap};
  const rect=(rx,ry,w,h,rad,fill)=>commands.push({t:'rect',x:rx,y:ry,w,h,r:rad,fill});
  const grad=(gx,gy,w,h,c0,c1)=>commands.push({t:'grad',x:gx,y:gy,w,h,c0,c1});
  const rule=(x0,x1,ry,color=LINE,thick=2)=>commands.push({t:'rule',x0,x1,y:ry,color,thick});
  const dots=(x0,x1,ry)=>commands.push({t:'dots',x0,x1,y:ry});
  const section=title=>{measure.font=font(30,true);const tw=measure.measureText(title).width;text(title,R,y,{size:30,color:RED,bold:true});rule(L,R-tw-30,y+17);y+=47+14};
  // header
  grad(0,0,W,10,BAND_A,BAND_B);y=52;
  commands.push({t:'logo',cx:R-78,cy:y+78,r:78});
  text('فاتورة طلب',W/2,y+8,{size:62,color:RED,bold:true,align:'center'});
  text('ع الحلة · أكل بيتي حقيقي',W/2,y+96,{size:28,color:FAINT,align:'center'});
  if(!r.draft){text(r.invoice_number,M,y+16,{size:38,color:ORANGE,bold:true,align:'left',direction:'ltr'});text('النسخة '+fmtN(r.version),M,y+70,{size:24,color:MUTED,align:'left'})}
  y+=164;
  const btxt=r.cancelled?'فاتورة ملغاة':r.draft?'مسودة للمراجعة':'فاتورة معتمدة';
  measure.font=font(24,true);const bw=measure.measureText(btxt).width+56;rect((W-bw)/2,y,bw,46,23,PILL_BG);text(btxt,W/2,y+10,{size:24,color:r.cancelled?RED:ORANGE,bold:true,align:'center'});y+=46+22;
  if(localMode)draw('نسخة تجربة محلية، ليست فاتورة بيع حقيقية',{size:24,color:ORANGE,gap:6});
  if(chunks.length>1)draw(`صفحة ${idx+1} من ${chunks.length}`,{size:24,color:MUTED,gap:6});
  rule(L,R,y);y+=26;
  // date + reference cards
  const cardH=112,infoCard=(cx,cw,label,value,dir)=>{rect(cx,y,cw,cardH,18,CREAM);text(label,cx+cw-24,y+18,{size:22,color:MUTED});text(value,cx+cw-24,y+54,{size:28,color:INK,bold:true,direction:dir||'rtl'})};
  if(r.source_reference){infoCard(R-458,458,'التاريخ',dateLabel(r.invoice_date));infoCard(L,458,'مرجع الطلب',r.source_reference,'ltr')}else infoCard(L,CW,'التاريخ',dateLabel(r.invoice_date));
  y+=cardH+32;
  // customer
  section('بيانات العميل');
  draw(r.customer.name||'الاسم لم يحدد',{size:42,bold:true,gap:4});
  const phoneRow=(label,num)=>{measure.font=font(28,false);const lw=measure.measureText(label).width;text(label,R,y,{size:28,color:MUTED});text('\u2066'+num+'\u2069',R-lw-8,y,{size:28,color:INK,bold:true,direction:'ltr'});y+=Math.round(28*1.55)};
  phoneRow('التليفون الأساسي: ',r.customer.phone||'لم يحدد');for(const p of r.additional)phoneRow('تليفون إضافي: ',p);
  y+=22;
  // items
  section('الأصناف');
  for(const item of chunks[idx]){
   const q=known(item.quantity)?fmtN(item.quantity)+' '+(item.unit||'وحدة غير محددة'):'كمية غير محددة';
   const det=known(item.unit_price)?fmtM(item.unit_price)+(item.unit?' لل'+item.unit:' للوحدة')+(item.quoted&&Number(item.source_price?.calculated_unit_price)===Number(item.unit_price)?'، محسوب من إجمالي الصنف':''):'سعر الوحدة لم يُحدد';
   const detail=item.quoted?det+' · قيمة السطر كما وردت':det;
   measure.font=font(22,true);const qw=measure.measureText(q).width+40;
   const amountW=210,nameW=CW-48-qw-14-amountW;
   measure.font=font(36,true);const nameLines=wrap(measure,item.name||'صنف غير محدد',nameW);
   measure.font=font(24,false);const detLines=wrap(measure,detail,nameW);
   const ch=22+nameLines.length*Math.round(36*1.5)+6+detLines.length*Math.round(24*1.5)+22,cy=y;
   rect(L,cy,CW,ch,18,CREAM);
   let ty=cy+22;for(const l of nameLines){text(l,R-24,ty,{size:36,color:INK,bold:true});ty+=Math.round(36*1.5)}
   measure.font=font(36,true);const fw=nameLines.length?measure.measureText(nameLines[0]).width:0,bx=Math.max(L+24+amountW,R-24-fw-12-qw);
   rect(bx,cy+28,qw,40,20,ORANGE);text(q,bx+qw/2,cy+37,{size:22,color:WHITE,bold:true,align:'center'});
   text(fmtM(item.amount),L+24,cy+Math.round(ch/2)-17,{size:32,color:ORANGE,bold:true,align:'left'});
   ty+=4;for(const l of detLines){text(l,R-24,ty,{size:24,color:MUTED});ty+=Math.round(24*1.5)}
   y+=ch+18;
  }
  if(idx===chunks.length-1){
   y+=10;
   const rows=[];if(known(r.total))rows.push(['إجمالي الأصناف',fmtM(r.subtotal)]);rows.push(['التوصيل',fmtM(r.fee)]);rows.push(['الخصم',fmtM(r.discount)]);
   rows.forEach((row,k)=>{text(row[0],R,y,{size:28,color:MUTED});text(row[1],L,y,{size:28,color:INK,bold:true,align:'left'});y+=Math.round(28*1.55);if(k<rows.length-1){dots(L,R,y+4);y+=16}});
   y+=20;
   rect(L,y,CW,122,20,RED);
   text(known(r.total)?'الإجمالي النهائي':'إجمالي الأصناف',R-30,y+22,{size:34,color:WHITE,bold:true});
   text(known(r.total)?'شامل التوصيل وبعد الخصم':'قبل التوصيل وأي خصم',R-30,y+74,{size:22,color:'#f6d9c8'});
   text(fmtM(known(r.total)?r.total:r.subtotal),L+30,y+36,{size:44,color:WHITE,bold:true,align:'left'});
   y+=122;
   if(!known(r.total)){y+=18;draw('الإجمالي النهائي: '+amount(r.total),{size:28,bold:true,color:RED})}
   y+=28;
   section('عنوان التوصيل');
   measure.font=font(28,false);const addrLines=wrap(measure,r.customer.address||'العنوان لم يحدد',CW-48);
   measure.font=font(24,false);const dnLines=r.delivery_notes?wrap(measure,'ملاحظات التوصيل: '+r.delivery_notes,CW-48):[];
   const ah=20+addrLines.length*Math.round(28*1.55)+(dnLines.length?8+dnLines.length*Math.round(24*1.55):0)+20;
   rect(L,y,CW,ah,18,CREAM);let ay=y+20;for(const l of addrLines){text(l,W/2,ay,{size:28,color:INK,align:'center'});ay+=Math.round(28*1.55)}
   if(dnLines.length){ay+=8;for(const l of dnLines){text(l,W/2,ay,{size:24,color:MUTED,align:'center'});ay+=Math.round(24*1.55)}}
   y+=ah+22;
   if(r.notes)draw('ملاحظات: '+r.notes,{size:26,color:FAINT});
   if(r.cancelled)draw('فاتورة ملغاة، ليست مطالبة بالسداد',{size:28,bold:true,color:RED});
   if(r.draft)draw('مسودة غير معتمدة. لا حفظ نهائي قبل موافقة حمدي.',{size:26,color:ORANGE});
   y+=30;
   grad(0,y,W,140,BAND_A,BAND_B);
   text('شكرًا لثقتكم في ع الحلة',W/2,y+32,{size:32,color:WHITE,bold:true,align:'center'});
   text('المنيو والطلب: 3al7ella.github.io/card.html',W/2,y+88,{size:24,color:'#ffd9bd',align:'center'});
   y+=140;
  }else y+=30;
  if(y>24000)throw new Error('النص أطول من صورة واحدة. استخدم النسخ أو PDF.');
  const out=document.createElement('canvas');out.width=W;out.height=Math.ceil(y);const ctx=out.getContext('2d');
  ctx.fillStyle=WHITE;ctx.fillRect(0,0,W,out.height);ctx.textBaseline='top';
  const rr=(rx,ry,w,h,rad)=>{ctx.beginPath();ctx.moveTo(rx+rad,ry);ctx.arcTo(rx+w,ry,rx+w,ry+h,rad);ctx.arcTo(rx+w,ry+h,rx,ry+h,rad);ctx.arcTo(rx,ry+h,rx,ry,rad);ctx.arcTo(rx,ry,rx+w,ry,rad);ctx.closePath()};
  for(const c of commands){
   if(c.t==='text'){ctx.direction=c.direction;ctx.textAlign=c.align;ctx.fillStyle=c.color;ctx.font=font(c.size,c.bold);ctx.fillText(c.text,c.x,c.y)}
   else if(c.t==='rect'){ctx.fillStyle=c.fill;rr(c.x,c.y,c.w,c.h,c.r);ctx.fill()}
   else if(c.t==='grad'){const g=ctx.createLinearGradient(c.x,0,c.x+c.w,0);g.addColorStop(0,c.c0);g.addColorStop(1,c.c1);ctx.fillStyle=g;ctx.fillRect(c.x,c.y,c.w,c.h)}
   else if(c.t==='rule'){ctx.fillStyle=c.color;ctx.fillRect(c.x0,c.y,c.x1-c.x0,c.thick)}
   else if(c.t==='dots'){ctx.fillStyle=LINE;for(let dx=c.x0;dx<c.x1;dx+=16){ctx.beginPath();ctx.arc(dx,c.y,2.6,0,7);ctx.fill()}}
   else if(c.t==='logo'){ctx.save();ctx.beginPath();ctx.arc(c.cx,c.cy,c.r,0,7);ctx.clip();ctx.drawImage(logo,c.cx-c.r,c.cy-c.r,c.r*2,c.r*2);ctx.restore();ctx.lineWidth=5;ctx.strokeStyle='#f0e2cf';ctx.beginPath();ctx.arc(c.cx,c.cy,c.r,0,7);ctx.stroke()}
  }
  const blob=await new Promise(resolve=>out.toBlob(resolve,'image/webp',0.90));if(!blob)throw Error('تعذر تجهيز صورة الفاتورة');pages.push(blob)
 }return pages;
}
export async function saveImages(i){const blobs=await imageBlobs(i);blobs.forEach((b,k)=>download(b,`${i.invoice_number||'invoice-review'}-${k+1}.${b.type==='image/webp'?'jpg':'png'}`));return blobs}
