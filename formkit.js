/* BangboCar — ตัวช่วยแบบฟอร์มสายตรวจ (patrol.html · survey.html)
   1) BBF.draft   : บันทึกร่างอัตโนมัติในเครื่อง → เผลอปิดแอป/มีสายเข้า เปิดใหม่ข้อมูลยังอยู่ (เก็บ 3 วัน · ส่งแล้วลบทิ้ง)
   2) BBF.review  : หน้าสรุปให้ตรวจทานก่อนกดส่ง
   3) BBF.pull    : ดึงหน้าลงเพื่อรีเฟรช (เฉพาะตอนเปิดจากไอคอนหน้าจอโฮม / ในแอป LINE ที่ไม่มีให้เอง) */
const BBF = (()=>{
  const css = `
.bbf-draft{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid #93c5fd;background:color-mix(in srgb,var(--surface,#fff),#3b82f6 8%);border-radius:14px;padding:10px 14px;margin:0 0 14px;font-size:13.5px;color:var(--text,#0f172a)}
.bbf-draft[hidden]{display:none}
.bbf-draft b{font-weight:600}
.bbf-draft small{color:var(--muted,#64748b);display:block;font-size:12px}
.bbf-draft .t{flex:1;min-width:180px}
.bbf-draft button{border:1px solid var(--input-border,#cbd5e1);background:var(--surface,#fff);color:var(--text,#0f172a);border-radius:99px;padding:6px 12px;font:600 12.5px 'Prompt',sans-serif;cursor:pointer}
#bbfReview{border:0;padding:0;border-radius:18px;width:min(94vw,560px);max-width:none;max-height:min(88vh,88dvh);background:var(--surface,#fff);color:var(--text,#0f172a);box-shadow:0 24px 60px rgba(0,0,0,.35);overflow:hidden}
#bbfReview[open]{display:flex;flex-direction:column;margin:auto;animation:bbfPop .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes bbfPop{from{opacity:0;transform:scale(.94)}}
#bbfReview::backdrop{background:rgba(15,23,42,.55);backdrop-filter:blur(3px)}
#bbfReview .hd{padding:16px 18px 10px;font:700 17px 'Prompt',sans-serif;color:var(--text-strong,var(--text,#0f172a))}
#bbfReview .hd small{display:block;font-weight:400;font-size:12.5px;color:var(--muted,#64748b);margin-top:2px}
#bbfReview .bd{padding:0 18px 6px;overflow:auto;flex:1;-webkit-overflow-scrolling:touch}
#bbfReview .sec{font:700 13px 'Prompt',sans-serif;color:var(--muted,#64748b);margin:12px 0 4px}
#bbfReview dl{margin:0;display:grid;grid-template-columns:minmax(96px,38%) 1fr;border-top:1px solid var(--border,#e2e8f0)}
#bbfReview dt,#bbfReview dd{margin:0;padding:8px 0;border-bottom:1px solid var(--border,#e2e8f0);font-size:14px;line-height:1.45}
#bbfReview dt{color:var(--muted,#64748b);padding-right:10px}
#bbfReview dd{color:var(--text,#0f172a);font-weight:600;word-break:break-word}
#bbfReview dd.empty{color:var(--muted,#94a3b8);font-weight:400}
#bbfReview .ph{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 2px}
#bbfReview .ph img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--border,#e2e8f0)}
#bbfReview .nt{white-space:pre-line;margin:12px 0 4px;font-size:12.5px;color:#92400e;background:#fef3c7;border-radius:10px;padding:8px 10px}
:root[data-theme="dark"] #bbfReview .nt{background:#3a2f12;color:#f0c55a}
#bbfReview .ft{display:flex;gap:10px;padding:12px 18px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--border,#e2e8f0)}
#bbfReview .ft button{flex:1;min-height:46px;border-radius:12px;font:600 15px 'Prompt',sans-serif;cursor:pointer}
#bbfReview .ft .no{background:var(--surface2,#f1f5f9);border:1px solid var(--input-border,#cbd5e1);color:var(--text,#0f172a)}
#bbfReview .ft .ok{background:#2563eb;border:1px solid #2563eb;color:#fff}
.bbf-ptr{position:fixed;left:50%;top:0;z-index:300;width:40px;height:40px;margin-left:-20px;border-radius:50%;background:var(--surface,#fff);box-shadow:0 4px 14px rgba(15,23,42,.25);display:grid;place-items:center;color:#2563eb;transform:translateY(-52px);opacity:0;pointer-events:none}
.bbf-ptr svg{width:22px;height:22px}
.bbf-ptr.go svg{animation:bbfSpin .8s linear infinite}
@keyframes bbfSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){#bbfReview[open]{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  const esc = s=>String(s == null ? '' : s).replace(/[&<>"']/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const hm = t=>{ const d = new Date(t), p = n=>String(n).padStart(2, '0'); return (new Date().toDateString() === d.toDateString() ? 'วันนี้ ' : d.getDate() + '/' + (d.getMonth() + 1) + ' ') + p(d.getHours()) + ':' + p(d.getMinutes()) + ' น.'; };

  /* ---------- 1) ร่างอัตโนมัติ ----------
     cfg = {key, form, mount, get:()=>obj, set:obj=>void, isEmpty:obj=>bool, toast}
     ไม่เก็บรูปถ่าย (ไฟล์ใหญ่) · เก็บไว้ไม่เกิน 3 วัน */
  function draft(cfg){
    const K = 'bbf-draft:' + cfg.key, MAX = 3 * 864e5;
    let t = 0, paused = false;
    const bar = document.createElement('div'); bar.className = 'bbf-draft'; bar.hidden = true;
    bar.innerHTML = '<span>↩️</span><div class="t"><b>กู้ข้อมูลที่กรอกค้างไว้แล้ว</b><small></small></div><button type="button">🗑️ ล้างฟอร์ม</button>';
    cfg.mount.parentNode.insertBefore(bar, cfg.mount);
    const read = ()=>{ try{ const d = JSON.parse(localStorage.getItem(K) || 'null'); return d && Date.now() - d.at < MAX ? d : null; }catch(_){ return null; } };
    const clear = ()=>{ clearTimeout(t); try{ localStorage.removeItem(K); }catch(_){} bar.hidden = true; };
    const saveNow = ()=>{ if(paused) return; let v; try{ v = cfg.get(); }catch(_){ return; }
      try{ if(cfg.isEmpty(v)) localStorage.removeItem(K); else localStorage.setItem(K, JSON.stringify({at:Date.now(), v})); }catch(_){} };
    const save = ()=>{ clearTimeout(t); t = setTimeout(saveNow, 400); };
    cfg.form.addEventListener('input', save); cfg.form.addEventListener('change', save);
    addEventListener('pagehide', saveNow); document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') saveNow(); });
    bar.querySelector('button').addEventListener('click', ()=>{
      if(!confirm('ล้างข้อมูลที่กรอกไว้ทั้งหมด แล้วเริ่มใหม่?')) return;
      clear(); paused = true; try{ cfg.reset && cfg.reset(); }catch(_){} paused = false; cfg.toast && cfg.toast('🗑️ ล้างฟอร์มแล้ว');
    });
    function restore(){
      const d = read(); if(!d) return false;
      paused = true; try{ cfg.set(d.v); }catch(_){} paused = false;
      bar.querySelector('small').textContent = 'กรอกไว้เมื่อ ' + hm(d.at) + (cfg.note ? ' · ' + cfg.note : '');
      bar.hidden = false; return true;
    }
    return {save, saveNow, clear, restore, hideBar:()=>{ bar.hidden = true; }};
  }

  /* ---------- 2) หน้าสรุปก่อนส่ง ----------
     opt = {title, sub, sections:[{title, rows:[[label, value]]}], photos:[url], note}  → Promise<true|false> */
  function review(opt){
    let dlg = document.getElementById('bbfReview');
    if(!dlg){ dlg = document.createElement('dialog'); dlg.id = 'bbfReview'; dlg.setAttribute('aria-labelledby', 'bbfRvT'); document.body.appendChild(dlg); }
    const sec = (opt.sections || []).map(s=>{
      const rows = s.rows.filter(r=>r && r[0] && (r[2] || String(r[1] == null ? '' : r[1]).trim() !== ''));   // ช่องที่เว้นว่างไว้ ไม่ต้องแสดง (r[2]=true = แสดงเสมอ)
      if(!rows.length) return '';
      return (s.title ? `<div class="sec">${esc(s.title)}</div>` : '') + '<dl>' + rows.map(([k, v])=>{ const e = v == null || String(v).trim() === '';
        return `<dt>${esc(k)}</dt><dd class="${e ? 'empty' : ''}">${e ? '—' : esc(v)}</dd>`; }).join('') + '</dl>';
    }).join('');
    const ph = (opt.photos || []).length ? `<div class="sec">📷 รูปถ่าย ${opt.photos.length} รูป</div><div class="ph">${opt.photos.map(u=>`<img src="${u}" alt="">`).join('')}</div>` : '';
    dlg.innerHTML = `<div class="hd" id="bbfRvT">${esc(opt.title || 'ตรวจทานก่อนส่ง')}<small>${esc(opt.sub || 'ตรวจข้อมูลให้ถูกต้อง ส่งแล้วแก้เองไม่ได้')}</small></div>
      <div class="bd">${sec}${ph}${opt.note ? `<div class="nt">${esc(opt.note)}</div>` : ''}</div>
      <div class="ft"><button type="button" class="no">✏️ กลับไปแก้</button><button type="button" class="ok">${esc(opt.ok || '📤 ยืนยันส่ง')}</button></div>`;
    return new Promise(res=>{
      let done = false;
      const end = v=>{ if(done) return; done = true; if(dlg.open) dlg.close(); res(v); };
      dlg.querySelector('.no').onclick = ()=>end(false);
      dlg.querySelector('.ok').onclick = ()=>end(true);
      dlg.oncancel = e=>{ e.preventDefault(); end(false); };
      dlg.onclick = e=>{ if(e.target === dlg) end(false); };
      dlg.showModal(); dlg.querySelector('.bd').scrollTop = 0;
      setTimeout(()=>dlg.querySelector('.ok').focus(), 50);
    });
  }

  /* ---------- 3) ดึงลงเพื่อรีเฟรช ----------
     เปิดจากไอคอนหน้าจอโฮม (ไม่มีแถบเบราว์เซอร์) หรือในแอป LINE/Facebook · Safari/Chrome ปกติมีให้อยู่แล้ว */
  function pull(opt){
    opt = opt || {};
    const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    const inApp = /Line\/|FBAN|FBAV|Instagram/i.test(navigator.userAgent);
    if(!(standalone || inApp || opt.force) || !('ontouchstart' in window)) return;
    const el = document.createElement('div'); el.className = 'bbf-ptr'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
    document.body.appendChild(el);
    const TH = 80;
    let y0 = null, dy = 0, busy = false;
    const blocked = t=>t.closest && t.closest('dialog,.leaflet-container,.cbx-pop,textarea,select,input');
    const show = d=>{ const k = Math.min(1, d / TH); el.style.opacity = k; el.style.transform = `translateY(${Math.min(d, TH + 20) * .7 - 40}px) rotate(${d * 3}deg)`; };
    addEventListener('touchstart', e=>{ if(busy || e.touches.length !== 1 || scrollY > 0 || blocked(e.target)) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; el.style.transition = 'none'; }, {passive:true});
    addEventListener('touchmove', e=>{ if(y0 == null) return; dy = e.touches[0].clientY - y0; if(dy <= 0 || scrollY > 0){ dy = 0; show(0); return; } show(dy); }, {passive:true});
    addEventListener('touchend', ()=>{
      if(y0 == null) return; y0 = null; el.style.transition = 'transform .25s, opacity .25s';
      if(dy >= TH){ busy = true; el.classList.add('go'); el.style.transform = 'translateY(16px)'; el.style.opacity = 1;
        try{ BB.haptic && BB.haptic('tap'); }catch(_){}
        (opt.before ? Promise.resolve(opt.before()) : Promise.resolve()).finally(()=>setTimeout(()=>location.reload(), 150));
      } else show(0);
      dy = 0;
    });
  }
  return {draft, review, pull};
})();
