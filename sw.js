/* Service worker на „Алиф“: пази приложението в кеша, за да работи без интернет. Версия: c13ca98451 */
const CACHE='alif-c13ca98451';
const FILES=['./','./index.html','./account.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png','./favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('alif-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
/* Страниците (index.html) и account.js: първо от мрежата, за да се вижда винаги последната версия; без интернет — от кеша. */
const fresh=(r,key)=>fetch(r,{cache:'no-store'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(ca=>ca.put(key||r,cp))}return res});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  if(r.mode==='navigate'){e.respondWith(fresh(r,'./index.html').catch(()=>caches.match('./index.html')));return}
  if(/account\.js$/.test(new URL(r.url).pathname)){e.respondWith(fresh(r).catch(()=>caches.match(r,{ignoreSearch:true})));return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(c=>c||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(ca=>ca.put(r,cp))}return res})));
});
