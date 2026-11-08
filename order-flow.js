
/* #ع_الحلة — mobile WhatsApp store flow. Loads after the existing storefront script. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const source=(params.get('src')||'site').trim().slice(0,40)||'site';
const waEntry=source==='wa';
let step=1,orderNo='',lastInvoice='';
window.__ALH_SOURCE=source;
try{T('menu_entry_source',{source:source,entry:waEntry?'whatsapp_welcome':'website'})}catch(_){}

/* Keep the agreed delivery rules independent of old remote settings. */
function lockDelivery(){DEF_DEL=60;FREE_OVER=1000;}
function markChickenOffers(){
 try{OFFERS.filter(o=>o.g==='chicken').forEach(o=>FREE_DEL.add(o.id));}catch(_){}
}
lockDelivery();markChickenOffers();
const baseStart=start;
window.start=function(rows){baseStart(rows);lockDelivery();markChickenOffers();if(typeof bar==='function')bar();};
const baseReMenu=window.reMenu;
window.reMenu=function(){if(baseReMenu)baseReMenu();lockDelivery();markChickenOffers();if(typeof bar==='function')bar();};
const baseSettings=window.applySettings;
window.applySettings=function(st){if(baseSettings)baseSettings(st);lockDelivery();markChickenOffers();updateKitchenStatus();if(typeof bar==='function')bar();};
const baseBar=bar;
window.bar=function(){
 baseBar();
 const n=Object.keys(cart).length;
 const host=$('bar'),fab=$('cartFab');
 if(!host)return;
 host.hidden=!n;
 if(fab)fab.hidden=true;
 const button=$('openCart');
 if(button){
  button.innerHTML='<span>راجع الطلب · <span class="cnt num" id="cnt">'+fmt(n)+'</span> أصناف</span><span class="num" id="barTotal">'+fmt(sub()+delFee())+' ج.م</span>';
 }
 const hint=$('barHint'),s=sub();
 if(hint){
  if(n&&isFree()){hint.textContent='توصيلك مجاني 🎉';hint.hidden=false;hint.className='barhint ok';}
  else if(n&&s<FREE_OVER){hint.textContent='فاضلك '+fmt(FREE_OVER-s)+' ج والتوصيل يبقى مجاني';hint.hidden=false;hint.className='barhint';}
  else hint.hidden=true;
 }
};
const baseOpenSheet=openSheet;
window.openSheet=function(){baseOpenSheet();setStep(1);};
const baseShowAgain=showAgain;
window.showAgain=function(){baseShowAgain();updateRepeatPrompt();};
const baseApplyView=applyView;
window.applyView=function(){baseApplyView();syncQuickNav();};

/* Status above the menu and a five-chip quick category strip. */
const stripNav=document.querySelector('nav.strip');
if(stripNav&&!$('waEntryHead')){
 stripNav.insertAdjacentHTML('beforebegin','<div id="waEntryHead"><div id="waStatus" role="status"></div></div>');
 const head=$('waEntryHead');
 const notice=$('notice'),again=$('again');
 if(notice)head.appendChild(notice);
 if(again)head.appendChild(again);
 const searchBox=stripNav.querySelector('.sbox');
 if(searchBox)searchBox.insertAdjacentHTML('afterend','<div id="waQuickNav" aria-label="الأقسام السريعة"><button type="button" data-wa-cat="mahshi" aria-pressed="false">محاشي</button><button type="button" data-wa-cat="veg" aria-pressed="false">خضار متنضف</button><button type="button" data-wa-cat="chicken" aria-pressed="false">فراخ ولحوم</button><button type="button" data-wa-cat="meals" aria-pressed="false">وجبات</button><button type="button" data-wa-cat="offers" aria-pressed="false">عروض</button></div>');
}
function updateKitchenStatus(){
 const s=$('waStatus');if(!s)return;
 const closed=!!window.__CLOSED;
 s.classList.toggle('closed',closed);
 s.textContent=closed?'● المطبخ لا يستقبل طلبات الموقع حاليًا · تواصل معنا على واتساب':'● بنستقبل الطلبات · التوصيل لكل إسكندرية · آخر طلب لنفس اليوم 2 ظهرًا';
}
updateKitchenStatus();
function syncQuickNav(active){
 const nav=$('waQuickNav');if(!nav)return;
 let key=active||'';
 if(!key){
  if(document.body.dataset.view==='cat'&&CUR==='offers')key='offers';
  else if(document.body.dataset.view==='task')key=CUR==='mahshi'?'mahshi':CUR==='veg'?'veg':CUR==='freezer'?'chicken':CUR==='cook'?'meals':'';
  else key='';
 }
 nav.querySelectorAll('[data-wa-cat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.waCat===key)));
}
if($('waQuickNav'))$('waQuickNav').addEventListener('click',e=>{
 const b=e.target.closest('[data-wa-cat]');if(!b)return;
 const k=b.dataset.waCat;syncQuickNav(k);
 if(k==='offers')openCat('offers');
 else openTask(k==='mahshi'?'mahshi':k==='veg'?'veg':k==='chicken'?'freezer':'cook');
});
if('IntersectionObserver'in window){
 const io=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   const id=entry.target.id;
   if(id==='offers'){syncQuickNav('offers');return;}
   const title=entry.target.querySelector('h2')?.textContent||'';
   if(title==='المحاشي'||title==='جاهز على الحشو')syncQuickNav('mahshi');
   else if(title==='الخضار المتنضف')syncQuickNav('veg');
   else if(['فراخ متبلة','مصنعات الفراخ','مصنعات اللحمة','الحمام والبط','المقبلات'].includes(title))syncQuickNav('chicken');
   else if(['الوجبات','صواني الفرن','طواجن وطبيخ','بولات وشوربة','الرز المعمر'].includes(title))syncQuickNav('meals');
  });
 },{rootMargin:'-120px 0px -65% 0px'});
 document.querySelectorAll('#sections .sec,#offers').forEach(x=>io.observe(x));
}

/* Direct WhatsApp welcome link: open straight into the menu, not the homepage. */
if(waEntry){
 document.body.classList.add('wa-entry');
 if(typeof openTask==='function')openTask('mahshi',false);
 setTimeout(()=>{const target=$('s'+Math.max(0,secs.indexOf('المحاشي')))||$('menu');if(target)window.scrollTo({top:target.getBoundingClientRect().top+window.scrollY-115,behavior:'instant'});},100);
}

/* Make every non-brand photo lazy; product rows already use lazy loading. */
document.querySelectorAll('img:not(.brand img):not(.fblogo)').forEach(img=>{if(!img.hasAttribute('loading'))img.loading='lazy';img.decoding='async';});

/* Selectable Alexandria areas and an actual delivery-date field. */
const areaOld=$('fArea');
if(areaOld&&areaOld.tagName!=='SELECT'){
 const areas=[...document.querySelectorAll('#areas option')].map(o=>o.value).filter(Boolean);
 const savedArea=areaOld.value||localStorage.getItem('alhella-fArea')||'';
 const sel=document.createElement('select');sel.id='fArea';sel.required=true;sel.setAttribute('aria-label','المنطقة');
 sel.innerHTML='<option value="">اختار المنطقة</option>'+areas.map(a=>'<option value="'+a.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">'+a+'</option>').join('');
 areaOld.replaceWith(sel);if(areas.includes(savedArea))sel.value=savedArea;
}
const whenOld=$('fWhen');
if(whenOld&&whenOld.type!=='date'){
 const wrap=document.createElement('label');wrap.id='fWhenWrap';wrap.textContent='يوم التوصيل';
 const date=document.createElement('input');date.type='date';date.id='fWhen';date.required=true;date.setAttribute('aria-label','يوم التوصيل');
 const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const minDate=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 date.min=minDate(today);
 if(now.getHours()>=14)today.setDate(today.getDate()+1);
 date.value=minDate(today);wrap.appendChild(date);whenOld.replaceWith(wrap);
}
const phone=$('fPhone');
if(phone){phone.maxLength=11;phone.pattern='01[0-9]{9}';phone.inputMode='numeric';phone.autocomplete='tel';}

/* Save the selected customer data and last order locally on this device. */
function readLast(){try{return JSON.parse(localStorage.getItem('alhella-last')||'null')}catch(_){return null}}
function readCustomer(){try{return JSON.parse(localStorage.getItem('alhella-customer-v1')||'{}')}catch(_){return {}}}
function saveCustomerNow(){
 const d={name:$('fName')?.value.trim()||'',phone:$('fPhone')?.value.trim()||'',area:$('fArea')?.value||'',addr:$('fAddr')?.value.trim()||''};
 try{localStorage.setItem('alhella-customer-v1',JSON.stringify(d));}catch(_){}
}
['fName','fPhone','fArea','fAddr','fWhen','fNote'].forEach(id=>{
 const el=$(id);if(!el)return;
 el.addEventListener('change',()=>{saveCustomerNow();if(id==='fArea'&&typeof renderCart==='function'){renderCart();bar();}});
 el.addEventListener('input',()=>{if(id==='fName'||id==='fPhone'||id==='fAddr'||id==='fNote')saveCustomerNow();});
});
function updateRepeatPrompt(){
 const box=$('again');if(!box||box.hidden)return;
 const last=readLast()||{},customer=last.customer||readCustomer(),name=customer.name||$('fName')?.value.trim()||'';
 const itemsText=Object.keys(last.cart||{}).map(k=>{try{return lineName(k)}catch(_){return k}}).slice(0,3).join('، ');
 $('againTxt').textContent='أهلاً يا '+(name||'بينا')+' 👋 تحب تطلب نفس أوردرك اللي فات؟'+(itemsText?' ('+itemsText+')':'');
 const btn=$('againBtn');if(btn)btn.textContent='رجّع نفس الأوردر';
 if(customer.name&&!$('fName').value)$('fName').value=customer.name;
 if(customer.phone&&!$('fPhone').value)$('fPhone').value=customer.phone;
 if(customer.area&&!$('fArea').value)$('fArea').value=customer.area;
 if(customer.addr&&!$('fAddr').value)$('fAddr').value=customer.addr;
 if(last.when&&$('fWhen')&&!$('fWhen').value)$('fWhen').value=last.when;
 if(last.pay){const r=[...document.querySelectorAll('input[name=pay]')].find(x=>x.value===last.pay);if(r)r.checked=true;}
 if(last.note&&$('fNote')&&!$('fNote').value)$('fNote').value=last.note;
}
updateRepeatPrompt();

/* Build the three stages inside the existing bottom sheet without replacing cart logic. */
const panel=document.querySelector('#sheet .panel'),form=$('orderForm'),lines=$('lines'),totals=$('totals'),addons=$('addons'),done=$('done');
if(panel&&form&&lines&&totals&&addons&&!$('orderFlowProgress')){
 const ph=panel.querySelector('.ph');
 const progress=document.createElement('div');progress.id='orderFlowProgress';
 progress.innerHTML='<span data-step-label="1" aria-current="step"><i>1</i> السلة</span><span data-step-label="2"><i>2</i> البيانات</span><span data-step-label="3"><i>3</i> المراجعة</span>';
 ph.insertAdjacentElement('afterend',progress);
 const s1=document.createElement('section');s1.id='cfStep1';
 const s2=document.createElement('section');s2.id='cfStep2';s2.hidden=true;
 const s3=document.createElement('section');s3.id='cfStep3';s3.hidden=true;
 const next1=document.createElement('button');next1.type='button';next1.className='cf-next';next1.textContent='كمّل بيانات الطلب';
 const actions1=document.createElement('div');actions1.className='cf-actions';actions1.appendChild(next1);
 s1.append(lines,totals,addons,actions1);
 const oldSubmit=$('sendBtn');if(oldSubmit)oldSubmit.hidden=true;
 form.insertAdjacentElement('beforebegin',s2);s2.appendChild(form);
 s2.insertAdjacentHTML('afterbegin','<h4 class="cf-step-title">بيانات التوصيل والدفع</h4>');
 const actions2=document.createElement('div');actions2.className='cf-actions';
 const back2=document.createElement('button');back2.type='button';back2.className='cf-back';back2.textContent='رجوع للسلة';
 const next2=document.createElement('button');next2.type='button';next2.className='cf-next';next2.textContent='راجع الفاتورة';
 actions2.append(back2,next2);form.appendChild(actions2);
 s3.innerHTML='<h4 class="cf-review-title">راجع الفاتورة قبل الإرسال</h4><pre class="cf-review" id="cfInvoice"></pre><div class="cf-actions"><button type="button" class="cf-back" id="cfBackData">تعديل البيانات</button><button type="button" class="cf-send" id="cfSend">ابعت الأوردر على واتساب</button></div>';
 s2.insertAdjacentElement('afterend',s3);
 panel.insertBefore(s1,s2);
 if(done)panel.appendChild(done);
 next1.addEventListener('click',()=>{if(!Object.keys(cart).length){toast('السلة فاضية، اختار صنف الأول');return;}setStep(2);});
 back2.addEventListener('click',()=>setStep(1));
 next2.addEventListener('click',()=>goReview());
 $('cfBackData').addEventListener('click',()=>setStep(2));
 $('cfSend').addEventListener('click',sendOrder);
}
function setStep(n){
 step=n;
 ['cfStep1','cfStep2','cfStep3'].forEach((id,i)=>{const el=$(id);if(el)el.hidden=(i+1)!==n;});
 document.querySelectorAll('#orderFlowProgress [data-step-label]').forEach(el=>el.setAttribute('aria-current',String(+el.dataset.stepLabel===n?'step':'false')));
 if($('done'))$('done').hidden=true;
 const title=$('sheetTitle');if(title)title.textContent=n===1?'راجع السلة':n===2?'بيانات الطلب':'مراجعة الفاتورة';
 if(n===1&&typeof renderCart==='function')renderCart();
 if(n===2){saveCustomerNow();if($('fName'))$('fName').focus({preventScroll:true});}
 if(n===3)renderInvoice();
 const p=document.querySelector('#sheet .panel');if(p)p.scrollTo({top:0,behavior:'instant'});
}
function validData(){
 const name=$('fName')?.value.trim()||'',phone=$('fPhone')?.value.replace(/\s/g,'')||'',area=$('fArea')?.value||'',addr=$('fAddr')?.value.trim()||'',date=$('fWhen')?.value||'';
 const errors=[];
 if(!Object.keys(cart).length)errors.push('اختار صنف واحد على الأقل');
 if(!name)errors.push('اكتب الاسم');
 if(!/^01\d{9}$/.test(phone))errors.push('رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01');
 if(!area)errors.push('اختار المنطقة من الليستة');
 if(!addr)errors.push('اكتب العنوان بالتفصيل');
 if(!date)errors.push('اختار يوم التوصيل');
 const eq=Object.entries(cart).filter(([k])=>{const o=offerOf(pidOf(k));return o&&o.ebox}).reduce((a,[,q])=>a+q,0);
 if(eq&&eq<10)errors.push('بوكسات الضيافة أقل طلب 10 بوكسات');
 if(window.__CLOSED)errors.push('المطبخ لا يستقبل طلبات الموقع حاليًا');
 return errors;
}
function goReview(){
 const errors=validData(),err=$('err');
 if(errors.length){setStep(2);if(err){err.hidden=false;err.textContent=errors.join(' · ');}return false;}
 if(err)err.hidden=true;
 saveCustomerNow();renderInvoice();setStep(3);return true;
}
function makeOrderNumber(){
 const d=new Date(),dd=String(d.getDate()).padStart(2,'0'),mm=String(d.getMonth()+1).padStart(2,'0'),key='alhella-order-ids-'+dd+mm;
 let used=[];try{used=JSON.parse(localStorage.getItem(key)||'[]')}catch(_){}
 let n=0,tries=0;do{n=100+Math.floor(Math.random()*900);tries++;}while(used.includes(n)&&tries<1000);
 used.push(n);try{localStorage.setItem(key,JSON.stringify(used.slice(-300)))}catch(_){}
 return 'AH-'+dd+mm+'-'+String(n).padStart(3,'0');
}
function deliveryDateLabel(v){
 if(!v)return '';
 const d=new Date(v+'T12:00:00');
 return isNaN(d.getTime())?v:d.toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
function paymentLabel(){
 const r=document.querySelector('input[name=pay]:checked');
 if(!r)return 'كاش';
 if(r.id==='pInsta')return 'InstaPay';
 if(r.id==='pWallet')return 'محفظة';
 return 'كاش';
}
function invoiceText(){
 const ent=Object.entries(cart),s=sub(),free=isFree(),deliveryText=free?'مجاني':'60 ج.م',total=s+(free?0:60);
 const name=$('fName').value.trim(),mobile=$('fPhone').value.replace(/\s/g,''),area=$('fArea').value,addr=$('fAddr').value.trim(),date=deliveryDateLabel($('fWhen').value);
 const rows=ent.map(([k,q])=>{const p=byId[pidOf(k)];return fmtE(q)+' × '+lineName(k)+' ........ '+fmtE(up5(p.price*q))+' ج.م';});
 const pay=paymentLabel(),note=$('fNote').value.trim()||'لا يوجد';
 return [
  '#ع_الحله 🧾',
  'فاتورة الطلب رقم '+orderNo,
  '──────────────────',
  '👤 '+name+' · 📞 '+mobile,
  '📍 '+area+' — '+addr,
  '📅 '+date,
  '──────────────────',
  ...rows,
  '──────────────────',
  '💰 إجمالي الأصناف: '+fmtE(s)+' ج.م',
  '🚚 التوصيل: '+deliveryText,
  '💵 الإجمالي النهائي: '+fmtE(total)+' ج.م',
  '💳 الدفع: '+pay+(pay==='كاش'?'':' على 01275165496'),
  '📝 ملاحظات: '+note
 ].join('\n');
}
function renderInvoice(){
 if(!orderNo)orderNo=makeOrderNumber();
 lastInvoice=invoiceText();
 const pre=$('cfInvoice');if(pre)pre.textContent=lastInvoice;
}
function sendOrder(){
 const errors=validData(),err=$('err');
 if(errors.length){if(err){err.hidden=false;err.textContent=errors.join(' · ');}setStep(2);return;}
 if(!orderNo)orderNo=makeOrderNumber();
 lastInvoice=invoiceText();
 const s=sub(),d=isFree()?0:60,pay=paymentLabel(),customer={name:$('fName').value.trim(),phone:$('fPhone').value.replace(/\s/g,''),area:$('fArea').value,addr:$('fAddr').value.trim()};
 const date=$('fWhen').value,note=$('fNote').value.trim();
 const ent=Object.entries(cart);
 const itemsData=ent.map(([k,q])=>{const p=byId[pidOf(k)];return {k:k,name:lineName(k),qty:q,unit:(offerOf(p.id)||p.name.startsWith(p.unit))?'':p.unit,price:p.price,total:up5(p.price*q)};});
 try{localStorage.setItem('alhella-last',JSON.stringify({cart:{...cart},at:Date.now(),customer:customer,when:date,pay:pay==='InstaPay'?'إنستاباي':pay,note:note,orderNumber:orderNo,src:source}));localStorage.setItem('alhella-customer-v1',JSON.stringify(customer));}catch(_){}
 let dbId='';
 try{
  if(window.FB){dbId=FB.newId();FB.save(dbId,{orderNumber:orderNo,name:customer.name,phone:customer.phone,area:customer.area,addr:customer.addr,when:date,pay:pay,items:itemsData,sub:s,delivery:d,deliveryFree:d===0,total:s+d,note:note,src:source}).catch(()=>{});}
 }catch(_){}
 try{gtag('event','purchase',{transaction_id:orderNo,currency:'EGP',value:s,source:source,items:ent.map(([k,q])=>{const p=byId[pidOf(k)];return {item_id:p.id,item_name:p.name,item_category:p.section,price:p.price,quantity:q};})});T('order_whatsapp_sent',{order_number:orderNo,source:source,value:s+d,currency:'EGP'});}catch(_){}
 const url='https://wa.me/'+PHONE+'?text='+encodeURIComponent(lastInvoice);
 if($('orderText'))$('orderText').textContent=lastInvoice;
 if($('waLink'))$('waLink').href=url;
 ['cfStep1','cfStep2','cfStep3'].forEach(id=>{if($(id))$(id).hidden=true;});
 if($('orderFlowProgress'))$('orderFlowProgress').hidden=true;
 if(done)done.hidden=false;
 const title=$('sheetTitle');if(title)title.textContent='الأوردر جاهز للإرسال';
 const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
}
document.addEventListener('submit',e=>{
 if(e.target!==$('orderForm'))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(step===2)goReview();else if(step===3)sendOrder();
},true);

/* The old one-step submit handler is stopped above; opening the cart always begins at step 1. */
document.addEventListener('click',e=>{
 if(e.target.closest('#openCart,#cartFab'))setTimeout(()=>setStep(1),0);
 if(e.target.closest('#closeCart'))setTimeout(()=>{if($('orderFlowProgress'))$('orderFlowProgress').hidden=false;},0);
},true);
const oldNew=$('newOrder');if(oldNew)oldNew.addEventListener('click',()=>{orderNo='';if($('orderFlowProgress'))$('orderFlowProgress').hidden=false;setStep(1);},{capture:true});
if($('fArea'))$('fArea').addEventListener('change',()=>{saveCustomerNow();if(!$('sheet').hidden){renderCart();bar();}});
if($('fPhone'))$('fPhone').addEventListener('input',()=>{ $('fPhone').setCustomValidity(/^01\d{0,9}$/.test($('fPhone').value.replace(/\s/g,''))?'':'اكتب 11 رقم يبدأ بـ 01');});
syncQuickNav();
window.__ALH_ORDER_FLOW={get source(){return source;},get step(){return step;},get orderNumber(){return orderNo;},invoiceText:invoiceText,validate:validData};
})();
