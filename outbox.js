/* BangboCar — กล่องรอส่งของแบบฟอร์มสายตรวจ (patrol.html · survey.html)
   ไม่มีสัญญาณ → เก็บรายการไว้ในเครื่อง (IndexedDB) → กลับมาออนไลน์แล้วส่งให้เอง
   ใช้ได้ทั้งในหน้าเว็บและใน sw.js (importScripts) · ส่งสำเร็จแล้วลบออกจากเครื่องทันที */
(function(G){
  const DBN = 'bb-outbox', ST = 'q', TAG = 'bb-outbox';
  const open = ()=>new Promise((res, rej)=>{
    const r = indexedDB.open(DBN, 1);
    r.onupgradeneeded = ()=>r.result.createObjectStore(ST, {keyPath:'cid'});
    r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error);
  });
  function run(mode, fn){
    return open().then(db=>new Promise((res, rej)=>{
      const t = db.transaction(ST, mode), s = t.objectStore(ST); let out;
      const q = fn(s); if(q) q.onsuccess = ()=>{ out = q.result; };
      t.oncomplete = ()=>{ db.close(); res(out); };
      t.onerror = t.onabort = ()=>{ db.close(); rej(t.error || new Error('บันทึกในเครื่องไม่ได้')); };
    }));
  }
  const all = kind=>run('readonly', s=>s.getAll()).then(a=>(a || []).filter(x=>!kind || x.kind === kind).sort((a, b)=>a.at - b.at));
  const put = it=>run('readwrite', s=>s.put(it));
  const del = cid=>run('readwrite', s=>s.delete(cid));
  const newId = ()=>Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const online = ()=>!G.navigator || G.navigator.onLine !== false;
  const locks = G.navigator && G.navigator.locks;
  const locked = fn=>locks ? locks.request(TAG, fn) : fn();

  /* ส่ง 1 รายการ · ต่อเน็ตไม่ได้/หมดเวลา → throw {net:true} */
  function send(it, ms){
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const tm = ac ? setTimeout(()=>ac.abort(), ms || 60000) : 0;
    return fetch(it.url, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(it.body), signal: ac ? ac.signal : undefined})
      .then(r=>r.json())
      .catch(e=>{ throw {net:true, error:String(e && e.message || e)}; })
      .finally(()=>clearTimeout(tm));
  }
  const busy = m=>/ถี่เกินไป|ลองใหม่|timeout|Service invoked too many|Exception: (Service|Address)/i.test(m || '');

  /* ส่งทุกรายการที่ค้าง (kind ว่าง = ทุกฟอร์ม) · ผลลัพธ์ {sent, left, bad, net} */
  function flush(kind){
    if(!online()) return Promise.resolve({sent:0, left:-1, bad:0, net:true});
    return locked(async ()=>{
      const r = {sent:0, left:0, bad:0, net:false, ids:[]};
      const list = await all(kind);
      for(const it of list){
        if(it.bad){ r.bad++; continue; }                              // ข้อมูลไม่ผ่าน → รอผู้ส่งตัดสินใจ ไม่ส่งซ้ำเอง
        if(r.net){ r.left++; continue; }
        try{
          const j = await send(it);
          if(j && j.ok){ await del(it.cid); r.sent++; r.ids.push(j.id || ''); continue; }
          const m = (j && j.error) || 'ส่งไม่สำเร็จ';
          it.tries = (it.tries || 0) + 1; it.err = m;
          if(busy(m)){ r.left++; r.net = true; } else { it.bad = true; r.bad++; }
          await put(it);
        }catch(e){ it.tries = (it.tries || 0) + 1; it.err = ''; await put(it).catch(()=>{}); r.left++; r.net = true; }
      }
      return r;
    });
  }
  /* ขอให้ระบบ (Android/Chrome) ส่งให้แม้ปิดหน้าไปแล้ว · iPhone ไม่รองรับ จะส่งตอนเปิดหน้าครั้งถัดไป */
  function bgSync(){
    try{ if(G.navigator.serviceWorker) G.navigator.serviceWorker.ready.then(r=>r.sync && r.sync.register(TAG)).catch(()=>{}); }catch(_){}
  }

  G.BBQ = {all, put, del, send, flush, bgSync, newId, online, TAG};
  if(typeof document === 'undefined') return;

  /* ---------------- ส่วนหน้าจอ ---------------- */
  const css = `
.ob{border:1px solid var(--border,#e2e8f0);background:var(--surface,#fff);border-radius:14px;padding:12px 14px;margin:0 0 14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 1px 3px rgba(15,23,42,.06)}
.ob[hidden]{display:none}
.ob.off{border-color:#f59e0b;background:color-mix(in srgb,var(--surface,#fff),#f59e0b 9%)}
.ob-hd{display:flex;align-items:center;gap:10px}
.ob-ic{font-size:22px;line-height:1;flex:none}
.ob-tx{flex:1;min-width:0;font-size:13px;color:var(--muted,#64748b);line-height:1.45}
.ob-tx b{display:block;font-size:14.5px;color:var(--text-strong,var(--text,#0f172a))}
.ob-go{flex:none;white-space:nowrap;font-size:13px!important;padding:8px 12px!important}
.ob-list{display:flex;flex-direction:column;gap:6px}
.ob-list:empty{display:none}
.ob-it{display:flex;align-items:center;gap:8px;font-size:13px;background:var(--surface2,#f1f5f9);border-radius:10px;padding:7px 10px}
.ob-it .t{flex:1;min-width:0}
.ob-it .t b{font-weight:600;color:var(--text,#0f172a);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ob-it .t small{color:var(--muted,#64748b)}
.ob-it .t .e{color:#dc2626;display:block}
:root[data-theme="dark"] .ob-it .t .e{color:#fca5a5}
.ob-it button{flex:none;border:0;background:transparent;color:var(--muted,#64748b);font:inherit;font-size:12.5px;cursor:pointer;padding:4px 6px;border-radius:6px}
.ob-it button:hover{background:var(--border,#e2e8f0)}
.ob-spin{display:inline-block;animation:obSp 1s linear infinite}
@keyframes obSp{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ob-spin{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  const esc = s=>String(s == null ? '' : s).replace(/[&<>"']/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const when = t=>{ const d = new Date(t), p = n=>String(n).padStart(2, '0'), today = new Date().toDateString() === d.toDateString();
    return (today ? 'วันนี้ ' : d.getDate() + '/' + (d.getMonth() + 1) + ' ') + p(d.getHours()) + ':' + p(d.getMinutes()) + ' น.'; };

  /* cfg = {kind, mount(element ที่จะใส่แถบ), btn(ปุ่มส่ง), label(ข้อความปุ่มปกติ), toast} */
  function ui(cfg){
    const box = document.createElement('div'); box.className = 'ob'; box.hidden = true; box.setAttribute('role', 'status');
    box.innerHTML = '<div class="ob-hd"><span class="ob-ic"></span><div class="ob-tx"><b></b><span></span></div><button type="button" class="btn ob-go">📤 ส่งตอนนี้</button></div><div class="ob-list"></div>';
    cfg.mount.parentNode.insertBefore(box, cfg.mount);
    const [ic, tt, ts, go, lst] = ['.ob-ic', '.ob-tx b', '.ob-tx span', '.ob-go', '.ob-list'].map(s=>box.querySelector(s));
    let sending = false;
    async function draw(){
      let q = []; try{ q = await all(cfg.kind); }catch(_){}
      const off = !online(), wait = q.filter(x=>!x.bad).length;
      box.classList.toggle('off', off);
      if(cfg.btn && !cfg.btn.disabled) cfg.btn.textContent = off ? '💾 บันทึกไว้ในเครื่อง (ส่งเองเมื่อมีสัญญาณ)' : cfg.label;
      box.hidden = !off && !q.length;
      if(box.hidden) return;
      ic.innerHTML = sending ? '<span class="ob-spin">⏳</span>' : off ? '📴' : '📦';
      tt.textContent = sending ? 'กำลังส่งรายการที่ค้างไว้…' : q.length ? `รอส่ง ${q.length} รายการ (เก็บไว้ในเครื่องนี้)` : 'ไม่มีสัญญาณอินเทอร์เน็ต';
      ts.textContent = off ? (q.length ? 'จะส่งให้เองเมื่อกลับมามีสัญญาณ · กรอกรายการต่อไปได้เลย' : 'กรอกแล้วกดส่งได้ตามปกติ ระบบจะเก็บไว้ในเครื่องแล้วส่งเองเมื่อมีสัญญาณ')
        : wait ? 'มีสัญญาณแล้ว ระบบกำลังส่งให้ หรือกด "ส่งตอนนี้"' : 'รายการด้านล่างส่งไม่ผ่าน ตรวจข้อความแล้วลบทิ้ง หรือกรอกใหม่';
      go.hidden = off || !wait || sending;
      lst.innerHTML = q.map(x=>`<div class="ob-it"><div class="t"><b>${esc(x.label || 'รายการ')}</b><small>บันทึก ${esc(when(x.at))}${x.files ? ' · 📷 ' + x.files + ' รูป' : ''}</small>${x.bad ? `<span class="e">⚠️ ${esc(x.err || 'ส่งไม่ผ่าน')}</span>` : ''}</div>${x.bad ? `<button type="button" data-retry="${esc(x.cid)}">↻ ลองใหม่</button>` : ''}<button type="button" data-del="${esc(x.cid)}" aria-label="ลบรายการนี้">🗑️</button></div>`).join('');
    }
    async function go2(manual){
      if(sending || !online()) return;
      let q = []; try{ q = await all(cfg.kind); }catch(_){}
      if(!q.some(x=>!x.bad)){ if(manual) draw(); return; }
      sending = true; draw();
      let r = {sent:0}; try{ r = await flush(cfg.kind); }catch(_){}
      sending = false; await draw();
      if(r.sent) cfg.toast && cfg.toast(`✅ ส่งรายการที่ค้างไว้แล้ว ${r.sent} รายการ`);
      else if(manual && r.net) cfg.toast && cfg.toast('⚠️ ยังส่งไม่ได้ สัญญาณอาจยังไม่เสถียร ระบบจะลองใหม่เอง');
      if(r.bad && manual) cfg.toast && cfg.toast('⚠️ มีรายการที่ส่งไม่ผ่าน ดูข้อความในกล่องรอส่ง');
    }
    go.addEventListener('click', ()=>go2(true));
    lst.addEventListener('click', async e=>{
      const d = e.target.closest('[data-del]'), rt = e.target.closest('[data-retry]');
      if(d){ if(!confirm('ลบรายการนี้ออกจากเครื่อง? (ยังไม่ได้ส่ง ข้อมูลจะหายไป)')) return; await del(d.dataset.del); draw(); }
      if(rt){ const q = await all(cfg.kind), it = q.find(x=>x.cid === rt.dataset.retry); if(it){ it.bad = false; it.err = ''; await put(it); go2(true); } }
    });
    addEventListener('online', ()=>{ draw(); setTimeout(()=>go2(false), 1200); });
    addEventListener('offline', draw);
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible'){ draw(); go2(false); } });
    if(G.navigator.serviceWorker) G.navigator.serviceWorker.addEventListener('message', e=>{ if(e.data && e.data.type === 'bb-outbox'){ draw(); if(e.data.sent) cfg.toast && cfg.toast(`✅ ส่งรายการที่ค้างไว้แล้ว ${e.data.sent} รายการ`); } });
    setInterval(()=>{ if(online()) go2(false); }, 60000);                 // สัญญาณกลับมาแต่เบราว์เซอร์ไม่แจ้ง → ลองทุก 1 นาที
    draw(); setTimeout(()=>go2(false), 800);

    /* ส่งแบบฟอร์ม: มีเน็ต → ส่งเลย · ไม่มี/ส่งไม่ออก → เก็บไว้ในเครื่อง
       ผลลัพธ์ {ok,id} | {queued:true} | {ok:false,error} */
    async function submit(it){
      it.cid = it.cid || newId(); it.kind = cfg.kind; it.at = Date.now();
      const keep = async ()=>{ try{ await put(it); }catch(e){ return {ok:false, error:'ไม่มีสัญญาณ และบันทึกในเครื่องไม่ได้ (พื้นที่เต็ม หรือเปิดโหมดส่วนตัว) ลองใหม่เมื่อมีสัญญาณ'}; } bgSync(); draw(); return {queued:true}; };
      if(!online()) return keep();
      try{ const j = await send(it, it.files ? 90000 : 45000); return j && j.ok ? j : {ok:false, error:(j && j.error) || 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง'}; }
      catch(e){ return keep(); }
    }
    return {submit, draw, flush:()=>go2(true)};
  }
  /* ติดตั้ง service worker เฉพาะหน้าฟอร์ม เพื่อให้เปิดหน้าได้แม้ไม่มีสัญญาณ */
  function installSW(scope){
    if(!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    addEventListener('load', ()=>navigator.serviceWorker.register('sw.js', {scope}).catch(()=>{}));
  }
  G.BBQ.ui = ui; G.BBQ.installSW = installSW;
})(typeof self !== 'undefined' ? self : window);
