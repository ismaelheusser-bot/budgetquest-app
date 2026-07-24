const CACHE_NAME='budgetquest-v20';
const APP_SHELL=['./','./index.html','./style.css','./app.js','./smart-import.js','./profiles.js','./home.js','./income-planner.js','./transaction-controls.js','./install.js','./manifest.webmanifest','./icon.svg'];
const MOBILE_NAV_CSS=`@media (max-width:720px){.app{padding-bottom:156px}.fab{bottom:142px}.toast{bottom:148px}.nav{bottom:8px;width:calc(100% - 16px);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,auto);overflow:visible;gap:4px;padding:6px;border-radius:18px}.nav button{min-width:0;padding:9px 2px;font-size:11px;white-space:nowrap}}`;
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.pathname.endsWith('/style.css')){
  event.respondWith(fetch(event.request).then(r=>r.text()).then(css=>new Response(css+'\n'+MOBILE_NAV_CSS,{headers:{'Content-Type':'text/css; charset=utf-8'}})).catch(()=>caches.match(event.request)));
  return;
 }
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html')));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response})));
});