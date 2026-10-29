/* Static, scope-relative offline shell. No account or API responses are cached. */
'use strict';
const BASE=new URL('./',self.location.href);
const PREFIX='verdant:'+BASE.pathname+':';
const CACHE=PREFIX+'release-aca84330a77249ca';
const FILES=['index.html','style.css?v=3','enhancements.css?v=3','mobile.css?v=3','core.js?v=3','saves.js?v=3','graphics.js?v=3','botany.js?v=3','world.js?v=3','game.js?v=3','pwa.js?v=3','vendor/babylon.js','manifest.webmanifest','assets/studio.env','assets/textures/forest_ground_04_diff.jpg','assets/textures/forest_ground_04_nor_gl.jpg','assets/textures/forest_ground_04_arm.jpg','assets/textures/bark_brown_01_diff.jpg','assets/textures/bark_brown_01_nor_gl.jpg','assets/textures/bark_brown_01_arm.jpg','assets/textures/rock_01_diff.jpg','assets/textures/rock_01_nor_gl.jpg','assets/textures/rock_01_arm.jpg','assets/textures/sand_01_diff.jpg','assets/textures/sand_01_nor_gl.jpg','assets/textures/sand_01_arm.jpg','assets/verdant-logo.png','assets/icon.svg','assets/icon-192.png','assets/icon-512.png','assets/icon-maskable-512.png','assets/apple-touch-icon.png'];
const PATHS=new Set(FILES.map(file=>new URL(file,BASE).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new Request(new URL(file,BASE),{cache:'reload'}))))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==BASE.origin)return;
  const isHome=url.pathname===BASE.pathname||url.pathname===new URL('index.html',BASE).pathname;
  // Keep HTML and scripts from the same release; the app offers waiting updates.
  if(request.mode==='navigate'&&isHome){event.respondWith((async()=>{const page=await (await caches.open(CACHE)).match(new URL('index.html',BASE));return page||fetch(request);})());return;}
  if(PATHS.has(url.pathname))event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(request,{ignoreSearch:true});return cached||fetch(request);})());
});
