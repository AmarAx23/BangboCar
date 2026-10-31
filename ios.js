/* BangboCar — ให้เว็บรู้สึกเหมือนแอปบนมือถือ (ใช้ได้ทุกหน้า · โหลดด้วย <script src="ios.js" defer></script>)
   1) หน้าต่าง (dialog) บนมือถือ → เลื่อนขึ้นจากขอบล่าง (bottom sheet) · ปัดลงที่แถบด้านบนเพื่อปิด
   2) แตะปุ่มแล้วปุ่มยุบลงนิดๆ + สั่นเบาๆ
   3) สีแถบสถานะ/แถบเบราว์เซอร์ด้านบน = สีหัวเว็บ (เปลี่ยนตามโหมดมืด)
   4) เปิดจากไอคอนหน้าจอโฮม → หน้าโลโก้สั้นๆ ก่อนเข้าหน้า (splash) */
(function(){
  if(window.__bbIos) return; window.__bbIos = true;
  const me = document.currentScript, base = me ? me.src : location.href;
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
/* ---- 2) ปุ่มยุบตอนแตะ ---- */
.ios-pressable{transition:transform .14s cubic-bezier(.3,.7,.4,1),filter .14s}
.ios-pressable.ios-down{transform:scale(.96);filter:brightness(.96)}
/* ---- 1) bottom sheet (มือถือ) ---- */
@media (max-width:640px){
  dialog.ios-sheet[open]{margin:auto 0 0 0!important;width:100%!important;max-width:100%!important;max-height:92dvh!important;
    border-radius:22px 22px 0 0!important;padding-bottom:env(safe-area-inset-bottom)!important;
    animation:iosSheetUp .34s cubic-bezier(.2,.9,.25,1)!important;transform-origin:50% 100%;will-change:transform}
  dialog.ios-sheet.ios-closing{animation:iosSheetDown .22s ease-in forwards!important}
  dialog.ios-sheet.ios-dragging{animation:none!important;transition:none!important}
  dialog.ios-sheet .ios-grab{display:block;position:sticky;top:0;z-index:5;height:22px;margin:0 0 -6px;cursor:grab;touch-action:none;background:inherit}
  dialog.ios-sheet .ios-grab::before{content:'';position:absolute;left:50%;top:8px;width:40px;height:5px;margin-left:-20px;border-radius:3px;background:rgba(120,120,128,.42)}
  dialog.ios-sheet::backdrop{animation:iosFade .3s ease both}
  /* หน้าต่างที่เป็นการ์ดลอย (เช่น ใส่รหัส) → การ์ดเต็มความกว้าง ชิดขอบล่าง */
  dialog.ios-sheet.ios-card{padding:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;padding-bottom:0!important}
  dialog.ios-sheet.ios-card > :not(.ios-grab){width:100%!important;max-width:none!important;margin:0!important;box-sizing:border-box}
  dialog.ios-sheet.ios-card > :not(.ios-grab),dialog.ios-sheet.ios-card > :not(.ios-grab) > *,dialog.ios-sheet.ios-card > :not(.ios-grab) > * > *{border-bottom-left-radius:0!important;border-bottom-right-radius:0!important}
  dialog.ios-sheet.ios-card .ios-wrap{padding-bottom:0!important}
  dialog.ios-sheet.ios-card .ios-pad{padding-bottom:max(28px, calc(16px + env(safe-area-inset-bottom)))!important}
  dialog.ios-sheet.ios-card .ios-grab{position:absolute;left:0;right:0;top:0;height:24px;margin:0;background:none}
}
@keyframes iosSheetUp{from{transform:translateY(100%)}}
@keyframes iosSheetDown{to{transform:translateY(105%)}}
@keyframes iosFade{from{opacity:0}}
/* ---- 4) splash ---- */
#iosSplash{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:var(--bg,#f1f5f9);transition:opacity .35s ease,visibility .35s;pointer-events:none;animation:iosSplashOut .4s ease 1.8s forwards}
@keyframes iosSplashOut{to{opacity:0;visibility:hidden}}
#iosSplash.out{opacity:0;visibility:hidden}
#iosSplash > div{display:flex;flex-direction:column;align-items:center;text-align:center}
#iosSplash .lg{width:104px;height:120px;margin:0 auto;background:center/contain no-repeat;filter:drop-shadow(0 8px 18px rgba(15,23,42,.28));animation:iosLogo .7s cubic-bezier(.2,.9,.25,1.2) both}
#iosSplash .nm{margin-top:16px;font:600 16px 'Prompt',sans-serif;letter-spacing:.2px;color:var(--text-strong,#1e293b);text-align:center;animation:iosFade .6s .15s ease both}
@keyframes iosLogo{from{opacity:0;transform:scale(.6) rotateY(-90deg)}}
@media (prefers-reduced-motion:reduce){ .ios-pressable{transition:none} dialog.ios-sheet[open],dialog.ios-sheet.ios-closing,#iosSplash .lg{animation:none!important} }`;
  const st = document.createElement('style'); st.id = 'ios-app'; st.textContent = css; (document.head || document.documentElement).appendChild(st);

  /* ---------- ตัวช่วยสั่น ---------- */
  let sw = null;
  function haptic(){ try{
    if(navigator.vibrate) return navigator.vibrate(8);
    if(!IOS) return;
    if(!sw){ sw = document.createElement('label'); sw.setAttribute('aria-hidden', 'true'); sw.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
      const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1; sw.appendChild(i); document.body.appendChild(sw); }
    sw.click();
  }catch(_){} }

  /* ---------- 2) ปุ่มยุบตอนแตะ (เฉพาะจอสัมผัส) ---------- */
  const PRESS = 'button,.btn,a.btn,[role="button"],[role="tab"],.tab,.seg label,.lvpick label,.drop,.pt-badge,.a2hs-btn';
  const SKIP = '.theme-switch,.leaflet-container,.ios-grab,[disabled],.cbx-btn';
  if(touch){
    let cur = null, sx = 0, sy = 0;
    const up = ()=>{ if(cur){ cur.classList.remove('ios-down'); cur = null; } };
    addEventListener('touchstart', e=>{
      const el = e.target.closest && e.target.closest(PRESS);
      if(!el || el.closest(SKIP)) return;
      cur = el; el.classList.add('ios-pressable', 'ios-down'); sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, {passive:true});
    addEventListener('touchmove', e=>{ if(cur && Math.hypot(e.touches[0].clientX - sx, e.touches[0].clientY - sy) > 10) up(); }, {passive:true});
    addEventListener('touchend', up, {passive:true}); addEventListener('touchcancel', up, {passive:true});
    // สั่นเบาๆ ทุกครั้งที่กดปุ่ม/แท็บ
    document.addEventListener('click', e=>{
      const el = e.target.closest && e.target.closest('button,.btn,[role="tab"],.tab,.seg label,.lvpick label');
      if(!el || el.closest(SKIP) || !e.isTrusted) return;
      haptic();
    }, true);
  }

  /* ---------- 1) bottom sheet ---------- */
  const narrow = ()=>innerWidth <= 640;
  const isClear = d=>{ const c = getComputedStyle(d).backgroundColor; return /rgba\(.*,\s*0\)$/.test(c) || c === 'transparent'; };
  function prep(d){
    const photo = d.children.length && [...d.children].every(c=>/^(IMG|VIDEO|PICTURE)$/.test(c.tagName) || c.classList.contains('ios-grab'));
    if(d.dataset.noSheet != null || !narrow() || photo) { d.classList.remove('ios-sheet', 'ios-card'); return; }
    if(!d.classList.contains('ios-sheet')){ d.classList.toggle('ios-card', isClear(d));
      // ชั้นที่เป็นกรอบ/ตัวห่อ (มีลูกชั้นเดียว) → ไม่เว้นขอบล่าง · ชั้นที่มีพื้นหลังจริง → เว้นขอบล่างให้พ้นแถบโฮมของ iPhone
      let el = d.querySelector(':scope > :not(.ios-grab)');
      while(el && el.children.length === 1 && el.firstElementChild.tagName !== 'INPUT'){ el.classList.add('ios-wrap'); el = el.firstElementChild; }
      if(el){ el.classList.remove('ios-wrap'); el.classList.add('ios-pad'); } }
    d.classList.add('ios-sheet');
    if(!d.querySelector(':scope > .ios-grab')){ const g = document.createElement('div'); g.className = 'ios-grab'; g.setAttribute('aria-hidden', 'true'); d.prepend(g); }
    if(d.__iosBound) return; d.__iosBound = true;
    // ปัดลงเพื่อปิด: เริ่มที่แถบจับด้านบน หรือส่วนหัว (ไม่รวมแผนที่/ช่องกรอก)
    let y0 = null, dy = 0, t0 = 0;
    d.addEventListener('touchstart', e=>{
      if(!d.classList.contains('ios-sheet') || e.touches.length !== 1) return;
      const r = d.getBoundingClientRect(), y = e.touches[0].clientY;
      const onGrab = e.target.closest('.ios-grab'), nearTop = y - r.top < 64 && !e.target.closest('input,textarea,select,button,a,.leaflet-container');
      if(!onGrab && !nearTop) return;
      y0 = y; dy = 0; t0 = Date.now(); d.classList.add('ios-dragging');
    }, {passive:true});
    d.addEventListener('touchmove', e=>{ if(y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); d.style.transform = `translateY(${dy}px)`; }, {passive:true});
    const end = ()=>{
      if(y0 == null) return; y0 = null; d.classList.remove('ios-dragging');
      const fast = dy > 40 && dy / Math.max(1, Date.now() - t0) > .6;
      if(dy > 110 || fast){
        d.style.transition = 'transform .2s ease-in'; d.style.transform = 'translateY(105%)';
        setTimeout(()=>{ d.style.transition = ''; d.style.transform = '';
          const ev = new Event('cancel', {cancelable:true}); d.dispatchEvent(ev); if(!ev.defaultPrevented && d.open) d.close(); }, 190);
      } else { d.style.transition = 'transform .25s cubic-bezier(.2,.9,.25,1)'; d.style.transform = ''; setTimeout(()=>{ d.style.transition = ''; }, 260); }
    };
    d.addEventListener('touchend', end, {passive:true}); d.addEventListener('touchcancel', end, {passive:true});
  }
  /* แป้นพิมพ์ขึ้น → ยก sheet ขึ้นให้อยู่เหนือแป้นพิมพ์ */
  if(window.visualViewport){
    const vv = visualViewport, lift = ()=>{ document.querySelectorAll('dialog.ios-sheet[open]').forEach(d=>{
      const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop); d.style.marginBottom = kb > 60 ? kb + 'px' : ''; }); };
    vv.addEventListener('resize', lift); vv.addEventListener('scroll', lift);
  }
  if(window.HTMLDialogElement){
    const P = HTMLDialogElement.prototype, show = P.showModal, close = P.close;
    // เปิดซ้ำระหว่างกำลังเลื่อนปิด (เช่น ใส่รหัสผิดแล้วหน้าต่างเด้งกลับ) → ปิดให้จบทันทีก่อน แล้วค่อยเปิดใหม่
    P.showModal = function(){ const d = this;
      if(d.__iosClosing){ clearTimeout(d.__iosT); d.classList.remove('ios-closing'); d.__iosClosing = false; close.call(d); }
      try{ prep(d); }catch(_){} return show.apply(d, arguments); };
    // ปิดแบบเลื่อนลง (ถ้าเป็น sheet)
    P.close = function(){
      const d = this, args = arguments;
      if(!d.open || reduce || !d.classList.contains('ios-sheet') || !narrow() || d.__iosClosing) return close.apply(d, args);
      d.__iosClosing = true; d.classList.add('ios-closing');
      d.__iosT = setTimeout(()=>{ d.classList.remove('ios-closing'); d.__iosClosing = false; close.apply(d, args); }, 200);
    };
  }

  /* ---------- 3) สีแถบด้านบน = สีหัวเว็บ ---------- */
  function themeColor(){
    const h = document.querySelector('body > nav, body > header, nav, header'); if(!h) return;
    let c = getComputedStyle(h).backgroundColor;
    if(!c || /rgba\(.*,\s*0\)$/.test(c) || c === 'transparent') c = getComputedStyle(document.body).backgroundColor;
    let m = document.querySelector('meta[name="theme-color"]:not([media])');
    document.querySelectorAll('meta[name="theme-color"][media]').forEach(x=>x.remove());
    if(!m){ m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    if(m.content !== c) m.content = c;
  }
  const ready = fn=>document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();
  ready(()=>{
    themeColor();
    new MutationObserver(()=>setTimeout(themeColor, 260)).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme', 'class']});
    if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>setTimeout(themeColor, 50));
  });

  /* ---------- 4) splash (เปิดจากไอคอนหน้าจอโฮม · ครั้งแรกของการเปิดแอป) ---------- */
  let first = false; try{ first = standalone && !sessionStorage.getItem('bb-splash'); sessionStorage.setItem('bb-splash', '1'); }catch(_){}
  if(first && !reduce){
    const logo = new URL(document.querySelector('meta[name="bb-logo"]') ? document.querySelector('meta[name="bb-logo"]').content : 'logo.webp', base).href;
    const sp = document.createElement('div'); sp.id = 'iosSplash'; sp.setAttribute('aria-hidden', 'true');
    sp.innerHTML = `<div><div class="lg" style="background-image:url('${logo}')"></div><div class="nm">สถานีตำรวจภูธรบางบ่อ</div></div>`;
    const put = ()=>{ (document.body || document.documentElement).appendChild(sp); };
    document.body ? put() : document.addEventListener('DOMContentLoaded', put);
    const t0 = Date.now();
    const hide = ()=>setTimeout(()=>{ sp.classList.add('out'); setTimeout(()=>sp.remove(), 400); }, Math.max(0, 750 - (Date.now() - t0)));
    if(document.readyState === 'complete') hide(); else addEventListener('load', hide);
    setTimeout(hide, 2500);                                                       // เน็ตช้า → ไม่ค้างหน้าโลโก้
    addEventListener('pageshow', hide);                                           // กลับมาจากพื้นหลัง (iPhone หยุดตัวจับเวลาไว้)
    document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) hide(); });
    /* กันค้าง: CSS ซ่อนหน้าโลโก้เองหลัง 1.8 วิ แม้สคริปต์จะไม่ได้ทำงาน · แตะทะลุได้ตลอด */
  }
})();
