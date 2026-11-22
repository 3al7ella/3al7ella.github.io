export const SUPABASE_URL='https://jijwwqgukheviejogfdy.supabase.co';
// Public publishable key only. Authorization is enforced on the server.
const PUBLIC_KEY='sb_publishable_MhOgUwlO03I2GrVH1TLWjg_3SMic1oW';
export const localMode=['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('local')==='1';
let session;try{session=JSON.parse(sessionStorage.getItem('alhella-invoices-session')||'null')}catch{session=null}
let refreshJob=null;
async function request(path,body,token){
 const headers={'apikey':PUBLIC_KEY,'Content-Type':'application/json'};if(token)headers.Authorization='Bearer '+token;
 const res=await fetch(SUPABASE_URL+path,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store',credentials:'omit'});
 const result=await res.json().catch(()=>({message:'استجابة غير مكتملة من الخادم'}));if(!res.ok)throw new Error(result.message||result.error_description||result.msg||'تعذر تنفيذ العملية');return result;
}
function store(s){session=s;if(s)sessionStorage.setItem('alhella-invoices-session',JSON.stringify(s));else sessionStorage.removeItem('alhella-invoices-session')}
async function token(){if(!session)throw new Error('سجل الدخول أولًا');if(Date.now()/1000>(session.expires_at||0)-60){if(!refreshJob)refreshJob=request('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token}).then(s=>{store({...s,expires_at:Date.now()/1000+s.expires_in});return session.access_token}).catch(e=>{store(null);throw e}).finally(()=>refreshJob=null);return refreshJob}return session.access_token}
export async function login(email,password){if(localMode)return;const s=await request('/auth/v1/token?grant_type=password',{email,password});store({...s,expires_at:Date.now()/1000+s.expires_in})}
export async function logout(){if(session)try{await request('/auth/v1/logout',{},session.access_token)}finally{store(null)}}
export const hasSession=()=>localMode||!!session;
export async function api(action,p={}){
 if(localMode){const r=await fetch('/__api',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Role':sessionStorage.getItem('local-role')||'owner'},body:JSON.stringify({action,p}),cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'خطأ تجربة محلية');return d;}
 return request('/rest/v1/rpc/inv_api',{action,p},await token());
}
export async function shared(tokenValue){if(localMode){const r=await fetch('/__shared',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tokenValue})});const d=await r.json();if(!r.ok)throw new Error(d.error);return d}return request('/rest/v1/rpc/inv_get_shared',{token:tokenValue})}
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=value=>!Number.isFinite(Number(value||0))?'قيمة غير صالحة':Number(value||0).toLocaleString('ar-EG',{minimumFractionDigits:2,maximumFractionDigits:2})+' جنيه';
export function normalizePhone(value){let s=String(value||'').replace(/[٠-٩۰-۹]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.includes(x)?'٠١٢٣٤٥٦٧٨٩'.indexOf(x):'۰۱۲۳۴۵۶۷۸۹'.indexOf(x)));if(/[,،;/\n]|[a-z]/i.test(s))return '';s=s.replace(/[\s().-]/g,'');if(/^00201[0125]\d{8}$/.test(s))s='+'+s.slice(2);if(/^201[0125]\d{8}$/.test(s))s='+'+s;if(/^01[0125]\d{8}$/.test(s))s='+20'+s.slice(1);return /^\+201[0125]\d{8}$/.test(s)?s:''}
export function lineAmount(quantity,price){const scaled=(value,places)=>{const s=String(value),m=s.match(/^(\d+)(?:\.(\d+))?$/);if(!m||((m[2]||'').length>places))return null;return BigInt(m[1])*10n**BigInt(places)+BigInt(((m[2]||'')+'0'.repeat(places)).slice(0,places))};const q=scaled(quantity,3),p=scaled(price,2);if(q===null||p===null)return NaN;return Number((q*p+500n)/1000n)/100}
export const states={draft:'مسودة',review:'تحت المراجعة',rejected:'مرفوضة',ready:'جاهزة للإرسال',approved:'معتمدة',sent:'مرسلة',cancelled:'ملغاة'};
export const badge=s=>`<span class="badge ${esc(s)}">${states[s]||esc(s)}</span>`;
export const dateLabel=s=>s?new Date(s.length===10?s+'T12:00:00':s).toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'}):'لم يحدد';
export function download(blob,name){const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
export async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{const el=document.createElement('textarea');el.value=text;document.body.append(el);el.select();const ok=document.execCommand('copy');el.remove();if(!ok)throw new Error('تعذر النسخ. اختار النص وانسخه يدويًا.');return true}}
