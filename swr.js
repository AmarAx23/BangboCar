/* BangboCar — เปิดหน้าแล้วตัวเลขขึ้นทันที (ข้อมูลชุดล่าสุดที่เครื่องจำไว้) แล้วอัปเดตจากชีตตามหลัง
   - ใช้เฉพาะคำขอแบบ GET ไปที่ Google Apps Script (ข้อมูลสาธารณะที่เปิดได้โดยไม่ต้องใส่รหัส)
   - ไม่จำคำขอที่มีรหัส/โทเคน และไม่จำคำขอแบบ POST (ข้อมูลเจ้าหน้าที่) เด็ดขาด
   - ใช้ข้อมูลที่จำไว้แค่ "ครั้งแรก" ของแต่ละลิงก์ต่อการเปิดหน้า · การรีเฟรช/ดึงซ้ำในหน้าเดิมไปที่ชีตตรงเสมอ
   - ถ้าข้อมูลใหม่จากชีตต่างจากที่แสดงอยู่ → ขึ้นแถบ "มีข้อมูลใหม่ · แตะเพื่อแสดง"
   - บันทึก/แก้ไขข้อมูล (POST) สำเร็จ → ล้างข้อมูลที่จำไว้ของระบบนั้น ครั้งหน้าดึงใหม่จากชีต */
(function(){
  if (window.__bbSWR || !window.fetch || !window.Response) return;
  window.__bbSWR = true;
  const ORIG = window.fetch.bind(window), PFX = 'bb-swr:', MAX_AGE = 12 * 3600e3, MAX_LEN = 1500000;
  const isGAS = u=>/^https:\/\/script\.google(usercontent)?\.com\/macros\//.test(u);
  const secret = u=>/[?&](pin|pass|password|token|key|code|auth)=/i.test(u);
  const base = u=>u.replace(/[?#].*$/, '');
  const keyOf = u=>PFX + u.replace(/([?&])(t|_|ts|nocache|v)=[^&]*&?/g, '$1').replace(/[?&]+$/, '');
  const strip = t=>String(t).replace(/"(updated|now|ts|time|generated|asOf|fetchedAt)"\s*:\s*("[^"]*"|\d+)/g, '');
  const used = new Set();
  const ls = {
    get(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(_){ return null; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){ try{ Object.keys(localStorage).filter(x=>x.indexOf(PFX) === 0).forEach(x=>localStorage.removeItem(x)); }catch(__){} } },
    clear(b){ try{ Object.keys(localStorage).filter(x=>x.indexOf(PFX + b) === 0).forEach(x=>localStorage.removeItem(x)); }catch(_){} }
  };

  let bar = null;
  function newer(){
    if (bar || !document.body) return;
    bar = document.createElement('button');
    bar.type = 'button';
    bar.textContent = '🔄 มีข้อมูลใหม่ · แตะเพื่อแสดง';
    bar.setAttribute('aria-live', 'polite');
    bar.style.cssText = 'position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99999;' +
      'border:0;border-radius:999px;padding:10px 18px;background:#1d4ed8;color:#fff;font:600 14px Prompt,Sarabun,system-ui,sans-serif;' +
      'box-shadow:0 8px 24px rgba(15,23,42,.3);cursor:pointer';
    bar.onclick = ()=>location.reload();
    document.body.appendChild(bar);
  }

  window.fetch = function(input, opt){
    const u = typeof input === 'string' ? input : (input && input.url) || '';
    const method = String((opt && opt.method) || (input && input.method) || 'GET').toUpperCase();
    if (!isGAS(u)) return ORIG(input, opt);
    if (method !== 'GET'){                                   // บันทึก/แก้ไข → ข้อมูลที่จำไว้เก่าแล้ว
      return ORIG(input, opt).then(r=>{ if (r.ok) ls.clear(base(u)); return r; });
    }
    if (secret(u)) return ORIG(input, opt);
    const k = keyOf(u), first = !used.has(k), c = first ? ls.get(k) : null;
    used.add(k);
    const net = ORIG(input, opt).then(r=>{
      if (r.ok) r.clone().text().then(t=>{
        try{ JSON.parse(t); }catch(_){ return; }                // เก็บเฉพาะ JSON ที่สมบูรณ์
        if (t.length > MAX_LEN) return;
        if (c && strip(c.b) !== strip(t)) newer();
        else if (!first && bar){ bar.remove(); bar = null; }   // หน้าดึงข้อมูลใหม่เองแล้ว ไม่ต้องเตือน
        ls.set(k, {t: Date.now(), b: t});
      }).catch(()=>{});
      return r;
    });
    if (c && c.b && Date.now() - c.t < MAX_AGE){
      net.catch(()=>{});
      return Promise.resolve(new Response(c.b, {status: 200, headers: {'Content-Type': 'application/json'}}));
    }
    return net;
  };
})();
