// Cache only this app's static shell. Never cache Auth, RPC, invoice links or customer data.
const CACHE='alhella-invoices-v21';
const BASE=new URL('./',self.location.href);
const FILES=['index.html','app.css','app.js','intake.js','organized-review.js','extraction-adapter.js','extraction-runtime.js','admin.js','lib.js','export.js','invoice-brand.js','local-parser.js','brand-logo.webp','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(FILES.map(x=>new URL(x,BASE).href));await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('alhella-invoices-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||request.headers.has('Authorization')||url.search)return;
 const relative=url.pathname.slice(BASE.pathname.length)||'index.html';
 if(!FILES.includes(relative))return;
 event.respondWith(fetch(request,{cache:'no-cache'}).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy))}return response}).catch(()=>caches.match(request).then(hit=>hit||Response.error())));
});
