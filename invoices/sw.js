// Cache only this app's static shell. Never cache Auth, RPC, invoice links or customer data.
const RELEASE='20261122-invoice-design-2';
const CACHE='alhella-invoices-v28-invoice-design-2';
const BASE=new URL('./',self.location.href);
const FILES=['index.html','app.css','app.js','app.css?v='+RELEASE,'app.js?v='+RELEASE,'offers.js','intake.js','organized-review.js','extraction-adapter.js','extraction-runtime.js','admin.js','lib.js','export.js','invoice-brand.js','local-parser.js','formatted-parser.js','brand-logo.webp','manifest.webmanifest','icon.svg','icon-192.webp','icon-512.webp'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(FILES.map(x=>new URL(x,BASE).href));await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('alhella-invoices-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();for(const client of await self.clients.matchAll({type:'window'}))client.postMessage({type:'APP_UPDATE_READY',release:RELEASE})})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||request.headers.has('Authorization'))return;
 const relative=url.pathname.slice(BASE.pathname.length)||'index.html';
 if(!FILES.includes(relative+url.search))return;
 event.respondWith(fetch(request,{cache:'no-cache'}).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy))}return response}).catch(async()=>{const cache=await caches.open(CACHE);return await cache.match(request)||(!url.search&&relative==='index.html'?await cache.match(new URL('index.html',BASE).href):null)||Response.error()}));
});
