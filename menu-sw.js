/* Menu-only worker. Never caches prices, orders, accounts or customer data. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || event.request.mode !== 'navigate' || !['/', '/index.html'].includes(url.pathname)) return;
  // Always network-first with no stored menu: never show stale prices offline.
  event.respondWith(fetch(new Request(event.request, { cache: 'no-store' })).catch(() => new Response(
    '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#D9381E"><title>منيو ع الحلة</title><body style="margin:0;padding:48px 24px;background:#FBF1E4;color:#87350D;font:20px/1.8 system-ui;text-align:center"><h1>ع الحلة</h1><p>وصّل الإنترنت عشان تشوف المنيو والأسعار الحالية وتكمل طلبك.</p><a href="/" style="display:inline-block;padding:12px 24px;background:#D9381E;color:white;border-radius:16px;text-decoration:none">حاول تاني</a></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 200 }
  )));
});
