/* BangboCar — ผลการตรวจตู้แดงจากชีต (แท็บรายเดือน ต.ค. → ก.ย.) ผ่าน Apps Script
   ใช้คู่กับ redbox-data.js (ข้อมูลเก่าก่อน ต.ค. 69): เดือนที่มีในชีตใช้ตัวเลขจากชีต · เดือนอื่นใช้ไฟล์เดิม
   โหลดหลัง redbox-data.js · เมื่อได้ข้อมูลใหม่จะส่ง event 'redbox-update' ให้หน้าเว็บวาดใหม่ */
(function(){
  var API = '';   // ← URL เว็บแอป Apps Script ของชีตผลการตรวจตู้แดง (ลงท้าย /exec)
  if(!API || !window.fetch) return;
  var BASE = window.REDBOX || null, KEY = 'rb-live';
  function sum(o){ var s = 0; for(var k in o) s += o[k]; return s; }
  function merge(a, b){
    if(!a) return b;
    var bm = {}; (b.months || []).forEach(function(m){ bm[m] = 1; });
    var by = {};
    (a.officers || []).forEach(function(o){
      var x = by[o.name] = {name:o.name, byMonth:{}, byDay:{}, points:o.points || 0};
      for(var m in o.byMonth) if(!bm[m]) x.byMonth[m] = o.byMonth[m];
      for(var d in o.byDay) if(!bm[d.slice(0, 7)]) x.byDay[d] = o.byDay[d];
    });
    (b.officers || []).forEach(function(o){
      var x = by[o.name] || (by[o.name] = {name:o.name, byMonth:{}, byDay:{}, points:0});
      for(var m in o.byMonth) x.byMonth[m] = o.byMonth[m];
      for(var d in o.byDay) x.byDay[d] = o.byDay[d];
      x.points = Math.max(x.points, o.points || 0);
    });
    var list = Object.keys(by).map(function(n){ var x = by[n]; x.days = Object.keys(x.byDay).length; return x; })
      .filter(function(x){ return sum(x.byMonth) > 0; })
      .sort(function(p, q){ return sum(q.byMonth) - sum(p.byMonth); });
    var months = {}, days = [];
    list.forEach(function(x){ for(var m in x.byMonth) months[m] = 1; for(var d in x.byDay) days.push(d); });
    days.sort();
    return {updated:b.updated || a.updated, months:Object.keys(months).sort(), total:list.reduce(function(s, x){ return s + sum(x.byMonth); }, 0),
      pointCount:Math.max(a.pointCount || 0, b.pointCount || 0), firstDay:days[0] || a.firstDay, lastDay:days[days.length - 1] || a.lastDay, officers:list, live:true};
  }
  function apply(j){
    if(!j || !j.ok || !j.officers) return false;
    window.REDBOX = merge(BASE, j);
    try{ document.dispatchEvent(new CustomEvent('redbox-update')); }catch(_){}
    return true;
  }
  var cached = null; try{ cached = localStorage.getItem(KEY); if(cached) apply(JSON.parse(cached)); }catch(_){}   // ข้อมูลที่จำไว้ → ขึ้นทันที
  fetch(API + '?t=' + Date.now()).then(function(r){ return r.text(); }).then(function(t){
    if(t === cached) return;
    var j = JSON.parse(t); if(apply(j)) try{ localStorage.setItem(KEY, t); }catch(_){}
  }).catch(function(){});
})();
