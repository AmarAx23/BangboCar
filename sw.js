/* BangboCar — service worker ของหน้าฟอร์มสายตรวจ (ลงทะเบียนเฉพาะ patrol.html / survey.html)
   1) จำหน้าฟอร์มไว้ในเครื่อง → เปิดได้แม้ไม่มีสัญญาณ (มีเน็ตใช้ของใหม่เสมอ)
   2) ส่งรายการที่ค้างในเครื่องให้เองเมื่อกลับมามีสัญญาณ (Android/Chrome ส่งได้แม้ปิดหน้าไปแล้ว) */
importScripts('outbox.js');
const CACHE = 'bb-forms-v2';
const LOCAL = ['patrol.html', 'survey.html', 'fx.js', 'outbox.js', 'formkit.js', 'logo.webp', 'favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'patrol.webmanifest', 'survey.webmanifest'];
const CDN = ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'];
const STATIC_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(LOCAL.concat(CDN).map(u=>c.add(new Request(u, {cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('bb-forms-') && k !== CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

/* หน้าเว็บ/ไฟล์ของเว็บ: ลองโหลดใหม่ก่อน (รอไม่เกิน 6 วิ) ไม่ได้ค่อยใช้ที่จำไว้ */
function netFirst(req){
  return caches.open(CACHE).then(c=>new Promise(resolve=>{
    let done = false;
    const fallback = ()=>c.match(req, {ignoreSearch:true}).then(m=>m || (req.mode === 'navigate' ? c.match(new URL(req.url).pathname.split('/').pop() || 'patrol.html') : null));
    const t = setTimeout(()=>fallback().then(m=>{ if(m && !done){ done = true; resolve(m); } }), 6000);
    fetch(req).then(r=>{
      if(r && r.ok) c.put(req.url.split(/[?#]/)[0], r.clone()).catch(()=>{});
      if(!done){ done = true; clearTimeout(t); resolve(r); }
    }).catch(()=>fallback().then(m=>{ if(!done){ done = true; clearTimeout(t); resolve(m || Response.error()); } }));
  }));
}
/* ฟอนต์/ไลบรารีจาก CDN: ใช้ที่จำไว้ก่อน แล้วอัปเดตเบื้องหลัง */
function cacheFirst(req){
  return caches.open(CACHE).then(c=>c.match(req).then(m=>{
    const net = fetch(req).then(r=>{ if(r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()).catch(()=>{}); return r; });
    return m || net;
  }));
}
self.addEventListener('fetch', e=>{
  const req = e.request; if(req.method !== 'GET') return;
  const u = new URL(req.url);
  if(u.origin === location.origin){
    const f = u.pathname.split('/').pop();
    if(req.mode === 'navigate' || LOCAL.includes(f)) e.respondWith(netFirst(req));
    return;
  }
  if(STATIC_HOSTS.includes(u.hostname)) e.respondWith(cacheFirst(req));
  // อื่นๆ (Apps Script, แผนที่) → ปล่อยให้เบราว์เซอร์จัดการตามปกติ
});

/* ส่งรายการค้างให้เอง */
function flushAll(){
  return BBQ.flush().then(r=>self.clients.matchAll({includeUncontrolled:true}).then(cs=>{
    cs.forEach(c=>c.postMessage({type:'bb-outbox', sent:r.sent, left:r.left, bad:r.bad}));
    if(r.net && r.left) throw new Error('ยังไม่มีสัญญาณ');                // ให้ระบบลองใหม่ภายหลัง
  }));
}
self.addEventListener('sync', e=>{ if(e.tag === BBQ.TAG) e.waitUntil(flushAll()); });
self.addEventListener('message', e=>{ if(e.data && e.data.type === 'flush') e.waitUntil(flushAll().catch(()=>{})); });
