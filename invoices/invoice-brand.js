// Shared original-brand header. No customer data or external requests.
export const brandLogoUrl=new URL('./brand-logo.webp',import.meta.url).href;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function invoiceBrandHeader({title='فاتورة طلب',status='مسودة للمراجعة'}={}){return `<header class="receipt-header"><img class="receipt-logo" src="${escape(brandLogoUrl)}" width="80" height="80" alt="الشعار الأصلي لع الحلة"><div class="receipt-heading"><div class="receipt-title">${escape(title)}</div><span class="receipt-status">${escape(status)}</span></div></header>`}
