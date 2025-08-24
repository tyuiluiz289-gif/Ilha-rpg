const CACHE_VERSION = 'miguel-ilha-v1.0.0';
const CACHE_ASSETS = [
  './','./index.html','./style.css','./game.js','./manifest.json','./story.json',
  './icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_VERSION).then(c=>c.addAll(CACHE_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    const hit=await cache.match(e.request);
    if(hit) return hit;
    try{
      const res=await fetch(e.request);
      if(res && res.status===200 && (url.origin===location.origin)){ cache.put(e.request,res.clone()); }
      return res;
    }catch(err){
      if(e.request.mode==='navigate'){ return cache.match('./index.html'); }
      throw err;
    }
  })());
});
