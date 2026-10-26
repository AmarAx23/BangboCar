/* BangboCar — ตัวช่วยร่วมทุกหน้า: Skeleton loading (กล่องเทาแสงวิ่ง) + มือถือสั่นเบาๆ
   ใช้ผ่าน BB.xxx · โหลดด้วย <script src="fx.js"></script> ใน <head> */
(function(){
  const css = `
:root{--skb-c:var(--border,var(--line,#e2e8f0));--skg:linear-gradient(90deg,var(--skb-c) 25%,color-mix(in srgb,var(--skb-c),#fff 45%) 45%,var(--skb-c) 65%)}
:root[data-theme="dark"]{--skg:linear-gradient(90deg,var(--skb-c) 25%,color-mix(in srgb,var(--skb-c),#fff 12%) 45%,var(--skb-c) 65%)}
.skb,.mcol .c i.skb{display:block;height:12px;border-radius:8px;background:var(--skb-c);background:var(--skg);background-size:300% 100%;animation:skSh 1.4s linear infinite}
@keyframes skSh{from{background-position:100% 0}to{background-position:-100% 0}}
.kpi-val .skb{height:30px;width:56%}
.kpi-sub .skb{height:10px;width:34%;margin-top:6px}
.mcol .c i.skb{width:100%;max-width:46px;border-radius:8px 8px 3px 3px}
.mcol .c span.skb{height:9px;width:70%}
.hb .r .t .skb{height:7px}
.sk-status{margin:-4px 0 14px;display:flex;flex-direction:column;gap:7px}
.sk-status[hidden]{display:none}
.sk-msg{font-size:13px;color:var(--muted,#64748b);display:flex;gap:7px;align-items:center}
.sk-msg .dot{width:7px;height:7px;border-radius:50%;background:#2563eb;flex:none;animation:skPl 1s ease-in-out infinite}
@keyframes skPl{50%{opacity:.35}}
.sk-stale .kpi-val,.sk-stale .kpi-sub,.sk-stale .mcol,.sk-stale .hb,.sk-stale .type-row,.sk-stale .ov-list,.sk-stale .li-table,.sk-stale .ov-total{opacity:.6;transition:opacity .35s}
.sk-stale .kpi::before,.sk-stale .sz-grid .card::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:1;
  background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);background-size:250% 100%;animation:skSh 1.6s linear infinite}
:root[data-theme="dark"] .sk-stale .kpi::before,:root[data-theme="dark"] .sk-stale .sz-grid .card::before{background:linear-gradient(100deg,transparent 30%,rgba(148,163,184,.14) 50%,transparent 70%);background-size:250% 100%}
.sk-card{gap:10px;animation:skUp .45s ease both}
@keyframes skUp{from{opacity:0;transform:translateY(8px)}}
tr.sk-tr td{padding-top:12px;padding-bottom:12px}
.type-card.sk-tc{pointer-events:none;display:flex;flex-direction:column;gap:8px}
.sk-ov{position:absolute;left:18px;right:18px;top:52px;bottom:16px;display:flex;flex-direction:column;gap:12px;background:var(--surface,#fff);z-index:4;pointer-events:none;border-radius:8px;overflow:hidden}
.kpi .sk-ov{top:38px;left:16px;right:16px;bottom:8px;gap:7px}
.card:has(> .sk-ov){min-height:170px}
.sk-ov .skb{flex:none}
.sk-map{position:absolute;inset:0;z-index:600;display:grid;place-items:center;background:var(--skg);background-size:300% 100%;animation:skSh 1.6s linear infinite;color:var(--muted,#64748b);font-size:13px}
.pf-sk{display:flex;flex-direction:column;gap:10px;padding:4px 0}
.pf-sk .lb{height:10px;width:30%}
.pf-sk .in{height:38px;border-radius:10px}
@media (prefers-reduced-motion:reduce){.skb,.mcol .c i.skb,.sk-msg .dot,.sk-card,.sk-map,.sk-stale .kpi::before,.sk-stale .sz-grid .card::before{animation:none}}
@media print{.sk-ov,.sk-map,.sk-status{display:none!important}}`;
  const st = document.createElement('style'); st.id = 'bb-fx'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();

const BB = (()=>{
  const $id = id=>document.getElementById(id);

  /* ---------- มือถือสั่นเบาๆ ----------
     Android: Vibration API · iPhone (iOS 18 ขึ้นไป ใน Safari): กดสวิตช์ซ่อนเพื่อให้เครื่องสั่น
     ok = สำเร็จ (สั่นสั้น 2 ที) · err = ผิดพลาด/กรอกไม่ครบ (สั่น 3 ที) */
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let lbl = null;
  const iosTap = ()=>{
    if(!lbl){ lbl = document.createElement('label'); lbl.setAttribute('aria-hidden', 'true');
      lbl.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
      const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1; lbl.appendChild(i); document.body.appendChild(lbl); }
    lbl.click(); };
  const VIB = {tap:10, ok:[14,60,20], err:[35,60,35,60,35]}, IOS = {tap:[0], ok:[0,110], err:[0,120,240]};
  const haptic = kind=>{ try{
    if(navigator.vibrate) navigator.vibrate(VIB[kind] || 10);
    else if(ios) (IOS[kind] || [0]).forEach(t=>setTimeout(iosTap, t));
  }catch(_){} };
  /* สั่นตามข้อความแจ้งเตือน (toast) */
  const toastHaptic = m=>{ m = String(m || '');
    if(/^(⚠️|กรุณา|เลขบัตร|แนบได้|กล้อง|อุปกรณ์|ไม่ได้|ตำแหน่ง|โหลดข้อมูลไม่สำเร็จ)/.test(m)) haptic('err');
    else if(/^(✓|✅|🔓|📋|❌|💾)/.test(m)) haptic('ok'); };

  /* ---------- Skeleton: ชิ้นส่วน ---------- */
  const skRows = n=>'<tbody>' + Array.from({length:n}, (_, i)=>`<tr class="sk-tr">${[18, 70 - i%3*12, 50, 40, 26].map(w=>`<td><span class="skb" style="width:${w}%"></span></td>`).join('')}</tr>`).join('') + '</tbody>';
  const skCards = n=>Array.from({length:n}, (_, i)=>`<div class="pd-card sk-card" style="animation-delay:${i*90}ms"><span class="skb" style="width:62%;height:16px"></span><span class="skb" style="width:42%"></span><span class="skb" style="width:86%"></span><span class="skb" style="width:34%;height:30px;border-radius:10px"></span></div>`).join('');
  const skTypeCards = n=>Array.from({length:n}, ()=>'<div class="kpi type-card sk-tc"><span class="skb" style="width:30px;height:30px;border-radius:10px"></span><span class="skb" style="width:62%"></span><span class="skb" style="width:38%;height:22px"></span></div>').join('');
  const stale = (el, on)=>{ if(el) el.classList.toggle('sk-stale', !!on); };

  /* ---------- Skeleton ทับการ์ด (หน้าที่ต้องรอข้อมูลก่อนวาด) ---------- */
  function skelCards(root, skipControls){
    if(!root) return;
    root.querySelectorAll('.card, .kpi').forEach(c=>{
      if(c.querySelector('.sk-ov') || (skipControls && c.querySelector('input, select, textarea'))) return;
      const o = document.createElement('div'); o.className = 'sk-ov';
      o.innerHTML = c.classList.contains('kpi') ? '<span class="skb" style="width:55%;height:24px"></span><span class="skb" style="width:35%;height:9px"></span>'
        : [90,72,84,60,78].map(w=>`<span class="skb" style="width:${w}%"></span>`).join('');
      c.appendChild(o);
    });
  }
  const skelCardsOff = ()=>document.querySelectorAll('.sk-ov, .sk-map').forEach(o=>o.remove());
  function skelMap(el, text){ if(!el) return; const o = document.createElement('div'); o.className = 'sk-map'; o.textContent = text || '🗺️ กำลังโหลดแผนที่…'; el.appendChild(o); }

  /* ---------- Skeleton หน้าแดชบอร์ด (การ์ดตัวเลข · กราฟรายเดือน · แถบสถิติ) ----------
     cfg = {panel, kpi:[ids], month:id, hb:[ids], sheet} · ต้องมี <div id="skStatus"><span id="skMsg"> ในหน้า */
  function dash(cfg){
    let t = 0;
    const on = ()=>{
      const p = $id(cfg.panel); if(p) p.classList.add('sk-loading');
      const s = $id('skStatus'); if(s) s.hidden = false;
      const m = $id('skMsg'); if(m) m.textContent = `กำลังดึงข้อมูลจากชีต "${cfg.sheet}"… ครั้งแรกอาจใช้ 5–10 วินาที`;
      (cfg.kpi || []).forEach(id=>{ const e = $id(id); if(e) e.innerHTML = '<span class="skb"></span>'; const s2 = $id(id + 'Sub'); if(s2) s2.innerHTML = '<span class="skb"></span>'; });
      const mo = cfg.month && $id(cfg.month);
      if(mo) mo.innerHTML = [45,70,55,85,60,75,50,90].map(h=>`<div class="c"><i class="skb" style="height:${h}%"></i><span class="skb"></span></div>`).join('');
      (cfg.hb || []).forEach(id=>{ const e = $id(id); if(e) e.innerHTML = [72,58,44,30].map(w=>`<div class="r"><span class="skb" style="width:${w}%"></span><span class="skb" style="width:22px;justify-self:end"></span><span class="t"><span class="skb" style="width:${w+18}%"></span></span></div>`).join(''); });
      clearTimeout(t); t = setTimeout(()=>{ const m2 = $id('skMsg'); if(m2) m2.textContent = 'ยังโหลดอยู่… เครือข่ายหรือ Google อาจช้า รอสักครู่'; }, 15000);
    };
    const off = ()=>{
      const p = $id(cfg.panel); if(p) p.classList.remove('sk-loading');
      const s = $id('skStatus'); if(s) s.hidden = true; clearTimeout(t);
      setTimeout(()=>{                                   // ช่องที่ไม่ถูกเติมข้อมูล → คืนค่าว่าง
        (cfg.kpi || []).forEach(id=>{ const e = $id(id); if(e && e.querySelector('.skb')) e.textContent = '–'; const s2 = $id(id + 'Sub'); if(s2 && s2.querySelector('.skb')) s2.textContent = ''; });
        [cfg.month].concat(cfg.hb || []).forEach(id=>{ const e = id && $id(id); if(e && e.querySelector('.skb')) e.innerHTML = ''; });
      }, 0);
    };
    return {on, off, stale: v=>stale($id(cfg.panel), v)};
  }

  return {haptic, toastHaptic, skRows, skCards, skTypeCards, stale, skelCards, skelCardsOff, skelMap, dash};
})();
