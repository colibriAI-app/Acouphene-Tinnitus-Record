/* ═══════════ Storage ═══════════ */
const KEY = "tinnitus-tracker-v1";
let db = load();
function load(){ try { return JSON.parse(store.getItem(KEY)) || {}; } catch(e){ return {}; } }
function save(){ store.setItem(KEY, JSON.stringify(db)); }
function todayKey(d){
  const t2 = d || new Date();
  return t2.getFullYear()+"-"+String(t2.getMonth()+1).padStart(2,"0")+"-"+String(t2.getDate()).padStart(2,"0");
}
function day(k){ if(!db[k]) db[k] = {}; return db[k]; }

/* ═══════════ Tabs ═══════════ */
document.querySelectorAll(".tab[data-tab]").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".tab[data-tab]").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    ["entry","stats","data"].forEach(x=>{
      document.getElementById("tab-"+x).style.display = (x===btn.dataset.tab)?"":"none";
    });
    if(btn.dataset.tab==="stats") renderStats();
    if(btn.dataset.tab==="data") renderData();
  };
});

/* ═══════════ Scales ═══════════ */
let current = { period:"morning" };
let form = {};
const SPORT_LABELS = { fr:["Aucun","Léger","Modéré","Intense","Intense+"], en:["None","Light","Moderate","Intense","Intense+"] };
function buildScales(){
  document.querySelectorAll(".scale[data-field]").forEach(sc=>{
    const f = sc.dataset.field;
    const isSport = f==="sport";
    const isPlane = f==="plane";
    const n = isSport ? 5 : (isPlane ? 2 : 10);
    const sel = form[f];
    sc.innerHTML = "";
    for(let i=1;i<=n;i++){
      const b = document.createElement("button");
      b.textContent = isPlane ? (i===1?t("sp_no"):t("sp_yes")) : (isSport ? SPORT_LABELS[LANG][i-1] : i);
      if(sel===i) b.classList.add("sel");
      b.onclick = ()=>{
        form[f] = i;
        sc.querySelectorAll("button").forEach(x=>x.classList.remove("sel"));
        b.classList.add("sel");
        updateSaveBtn();
      };
      sc.appendChild(b);
    }
  });
}
function updateSaveBtn(){
  const required = current.period==="morning" ? ["tinM","sleep","hours","stressM"] : ["tinE","stressE","plane","sport"];
  const done = required.filter(f=>form[f]).length;
  const allDone = done===required.length;
  document.getElementById("btn-save").disabled = !allDone;
  document.getElementById("save-count").textContent = allDone ? "✓" : "("+done+"/"+required.length+")";
  document.getElementById("save-label").textContent = allDone
    ? t(current.period==="morning" ? "save_morning" : "save_evening")
    : t("save_fill");
  [["v-tin-m","tinM"],["v-tin-e","tinE"],["v-sleep","sleep"],["v-hours","hours"],["v-stress-m","stressM"],["v-stress-e","stressE"],["v-plane","plane"]].forEach(([id,f])=>{
    document.getElementById(id).textContent = form[f] ? (f==="plane" ? (form[f]===2?t("sp_yes"):t("sp_no")) : form[f]+(f==="hours"?" h":"/10")) : "–";
  });
}

/* ═══════════ Period ═══════════ */
function setPeriod(p){
  current.period = p;
  form = {};
  document.getElementById("form-morning").style.display = p==="morning"?"":"none";
  document.getElementById("form-evening").style.display = p==="evening"?"":"none";
  document.getElementById("seg-morning").classList.toggle("active", p==="morning");
  document.getElementById("seg-evening").classList.toggle("active", p==="evening");
  buildScales();
  updateSaveBtn();
  renderPills();
}
document.getElementById("seg-morning").onclick = ()=>setPeriod("morning");
document.getElementById("seg-evening").onclick = ()=>setPeriod("evening");

/* ═══════════ Pills ═══════════ */
function renderPills(){
  const d = db[todayKey()] || {};
  const el = document.getElementById("today-pills");
  el.innerHTML = "";
  const mk = (label, done, val)=>{
    const p = document.createElement("div");
    p.className = "pill"+(done?" done":"");
    p.innerHTML = label+" : <b>"+val+"</b>"+(done?" ✓":"");
    return p;
  };
  el.appendChild(mk(t("pill_date"), true, todayKey()));
  el.appendChild(mk(t("pill_morning"), !!d.tinM, d.tinM ? t("pill_done") : t("pill_todo")));
  el.appendChild(mk(t("pill_evening"), !!d.tinE, d.tinE ? t("pill_done") : t("pill_todo")));
}

/* ═══════════ Save ═══════════ */
document.getElementById("btn-save").onclick = ()=>{
  const d = day(todayKey());
  Object.assign(d, form);
  d.date = todayKey();
  save();
  const btn = document.getElementById("btn-save");
  btn.textContent = t("saved");
  btn.classList.add("saved");
  btn.disabled = true;
  const isMorning = current.period==="morning";
  document.getElementById("save-msg").textContent = t("saved_for",{p:isMorning?t("pill_morning"):t("pill_evening"), d:todayKey()});
  showToast(isMorning ? t("toast_morning") : t("toast_evening"));
  setTimeout(()=>{
    btn.innerHTML = '<span id="save-label"></span><span id="save-count"></span>';
    btn.classList.remove("saved");
    document.getElementById("save-msg").textContent = "";
    setPeriod(isMorning ? "evening" : "morning");
    renderPills();
    document.querySelector('.tab[data-tab="stats"]').click();
  }, 1600);
};
function showToast(txt){
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = txt;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 2600);
}

/* ═══════════ Welcome ═══════════ */
const welcome = document.getElementById("welcome");
function openWelcome(){ welcome.hidden = false; }
function closeWelcome(){ welcome.hidden = true; store.setItem("tinnitus-welcomed","1"); }
openWelcome(); // affichée à chaque ouverture de l'app
document.getElementById("btn-start").onclick = ()=>{ closeWelcome(); setPeriod("morning"); };
document.getElementById("btn-help").onclick = openWelcome;

/* ═══════════ Analytics ═══════════ */
function last6Months(){
  const cut = new Date(); cut.setMonth(cut.getMonth()-6);
  return Object.values(db).filter(d=>d.tinM||d.tinE).filter(d=> new Date(d.date+"T12:00") >= cut );
}
function tinAvg(d){ const v=[d.tinM,d.tinE].filter(x=>x); return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; }
function pearson(xs,ys){
  const n = xs.length; if(n<5) return null;
  const mx = xs.reduce((a,b)=>a+b,0)/n, my = ys.reduce((a,b)=>a+b,0)/n;
  let num=0,dx=0,dy=0;
  for(let i=0;i<n;i++){ const a=xs[i]-mx, b=ys[i]-my; num+=a*b; dx+=a*a; dy+=b*b; }
  const den = Math.sqrt(dx*dy);
  return den===0 ? null : num/den;
}
function mean(a){ return a.length ? a.reduce((x,y)=>x+y,0)/a.length : null; }

function renderStats(){
  const days = last6Months().sort((a,b)=>a.date<b.date?-1:1);
  const kpi = document.getElementById("kpi");
  if(!days.length){
    kpi.innerHTML = '<div class="card"><div class="empty">'+t("empty_stats")+'</div></div>';
    ["chart-trend","chart-bars"].forEach(id=>{ const cc=document.getElementById(id); cc.getContext("2d").clearRect(0,0,cc.width,cc.height); });
    document.getElementById("corr-list").innerHTML = "";
    document.getElementById("corr-sport").innerHTML = "";
    return;
  }
  const tins = days.map(d=>tinAvg(d)).filter(x=>x!==null);
  const tinsM = days.map(d=>d.tinM).filter(x=>x);
  const tinsE = days.map(d=>d.tinE).filter(x=>x);
  const compliance = Math.round(days.length / 182 * 100);
  kpi.innerHTML = `
    <div class="stat"><div class="v">${mean(tins)?mean(tins).toFixed(1):"–"}</div><div class="l">${t("kpi_avg")}</div></div>
    <div class="stat"><div class="v">${tinsM.length?mean(tinsM).toFixed(1):"–"}</div><div class="l">${t("kpi_morning")}</div></div>
    <div class="stat"><div class="v">${tinsE.length?mean(tinsE).toFixed(1):"–"}</div><div class="l">${t("kpi_evening")}</div></div>
    <div class="stat"><div class="v">${days.length}</div><div class="l">${t("kpi_days")} (${compliance}${t("kpi_of")})</div></div>`;
  drawBars(days.slice(-30));
  drawTrend(days);
  const pairs = (fa, fb)=>{
    const xs=[],ys=[];
    days.forEach(d=>{
      const a = typeof fa==="function" ? fa(d) : d[fa];
      const b = typeof fb==="function" ? fb(d) : d[fb];
      if(a!=null && b!=null){ xs.push(a); ys.push(b); }
    });
    return [xs,ys];
  };
  const rows = [
    [t("c_sleep"), pearson(...pairs("sleep", d=>tinAvg(d)))],
    [t("c_hours"), pearson(...pairs("hours", d=>tinAvg(d)))],
    [t("c_stressM"), pearson(...pairs("stressM", d=>tinAvg(d)))],
    [t("c_stressE"), pearson(...pairs("stressE", d=>tinAvg(d)))],
    [t("c_sleep_stress"), pearson(...pairs("sleep","stressM"))],
    [t("c_sleep_stressE"), pearson(...pairs("sleep","stressE"))],
    [t("c_plane"), pearson(...pairs(d=>d.plane===2?1:0, d=>tinAvg(d)))],
  ];
  document.getElementById("corr-list").innerHTML = rows.map(([label,r])=>{
    if(r===null) return `<div class="row"><span>${label}</span><div class="empty" style="padding:0">${t("c_insufficient")}</div><span></span></div>`;
    const pct = Math.round(Math.abs(r)*100);
    const col = (r>0?"#ef4444":"#34d399");
    const st = Math.abs(r)<0.2 ? "str_negligible" : Math.abs(r)<0.4 ? "str_weak" : Math.abs(r)<0.6 ? "str_moderate" : "str_strong";
    return `<div class="row">
      <span>${label}</span>
      <div class="bar"><i style="background:${col}; ${r>0? "left:50%; width:"+pct/2+"%" : "left:"+(50-pct/2)+"%; width:"+pct/2+"%"}"></i>
        <i style="left:50%; width:1px; background:#3a4666;"></i></div>
      <span style="color:${col};font-weight:700">${r.toFixed(2)} (${t(st)})</span>
    </div>`;
  }).join("");
  const withSport=[], without=[];
  days.forEach(d=>{
    const tv = tinAvg(d);
    if(tv==null) return;
    if(d.sport && d.sport>1) withSport.push(tv); else without.push(tv);
  });
  const ms = mean(withSport), mw = mean(without);
  const delta = (ms!=null && mw!=null) ? ((ms-mw)/mw*100) : null;
  document.getElementById("corr-sport").innerHTML = `
    <div class="row"><span>${t("c_with_sport")}</span>
      <div class="bar"><i style="left:0;width:${ms!=null?ms*10:0}%;background:#8b5cf6"></i></div>
      <span>${ms!=null?ms.toFixed(1):"–"}</span></div>
    <div class="row"><span>${t("c_without_sport")}</span>
      <div class="bar"><i style="left:0;width:${mw!=null?mw*10:0}%;background:#64748b"></i></div>
      <span>${mw!=null?mw.toFixed(1):"–"}</span></div>
    ${delta!=null?`<div class="row"><span>${delta<0?"▼":"▲"} ${Math.abs(delta).toFixed(0)}%</span><span style="color:${delta<0?"#34d399":"#ef4444"};font-weight:700">${delta<0?t("c_effect_less"):t("c_effect_more")} (${withSport.length} ${t("c_effect_days")} ${without.length})</span><span></span></div>`:""}`;
}

function smooth(days, getter, win){
  // moyenne mobile sur `win` jours pour lisser la courbe
  const vals = days.map(getter);
  return vals.map((_,i)=>{
    const from = Math.max(0, i-(win-1));
    const seg = vals.slice(from, i+1).filter(v=>v!=null);
    return seg.length ? seg.reduce((a,b)=>a+b,0)/seg.length : null;
  });
}
/* ---- Graphique barres : 30 derniers jours (duo matin/soir) ---- */
function drawBars(days){
  const c = document.getElementById("chart-bars");
  const x = c.getContext("2d");
  const W = c.width = (c.clientWidth||400)*2, H = c.height = 520;
  c.style.height = "260px";
  x.clearRect(0,0,W,H);
  const n = days.length;
  const pad = {l:52,r:14,t:24,b:64};
  const iw = W-pad.l-pad.r, ih = H-pad.t-pad.b;
  const slot = iw/n;
  const Y = v => pad.t + (1-v/10)*ih;
  // grille
  x.strokeStyle="#242e4a"; x.fillStyle="#7c8aa8"; x.font="18px system-ui"; x.lineWidth=2;
  for(let v=0;v<=10;v+=2){
    x.beginPath(); x.moveTo(pad.l,Y(v)); x.lineTo(W-pad.r,Y(v)); x.stroke();
    x.fillText(v+"/10", 6, Y(v)+6);
  }
  const bw = Math.max(3, Math.min(22, slot*0.28));
  days.forEach((d,i)=>{
    const cx = pad.l + slot*i + slot/2;
    // pastille sport sous l'axe
    if(d.sport>1){ x.fillStyle="rgba(139,92,246,.8)"; x.beginPath(); x.arc(cx, H-46, 6, 0, 7); x.fill(); }
    // barres duo
    const pairs = [[d.tinM,"#5b8cff",-1.2],[d.tinE,"#f472b6",1.2]];
    pairs.forEach(([val,col,side])=>{
      if(!val) return;
      const g = x.createLinearGradient(0,Y(val),0,Y(0));
      g.addColorStop(0,col); g.addColorStop(1,col+"55");
      x.fillStyle=g;
      const bx = cx + (side<0 ? -bw-1 : 1);
      roundRect(x, bx, Y(val), bw, Y(0)-Y(val), Math.min(4,bw/2));
      // valeur au sommet de la barre (si assez de place)
      if(slot>16){
        x.fillStyle="#aab6cf"; x.textAlign="center"; x.font="15px system-ui";
        x.fillText(val, bx+bw/2, Y(val)-6);
        x.textAlign="left"; x.font="18px system-ui";
      }
    });
    // date (une sur N)
    if(n<=14 || i%Math.ceil(n/10)===0){
      x.fillStyle="#7c8aa8"; x.textAlign="center"; x.font="17px system-ui";
      x.fillText(d.date.slice(8)+"/"+d.date.slice(5,7), cx, H-10);
      x.textAlign="left"; x.font="18px system-ui";
    }
  });
}
function roundRect(x, bx, by, w, h, r){
  if(h<=0) return;
  r = Math.min(r, w/2, h);
  x.beginPath();
  x.moveTo(bx, by+h);
  x.lineTo(bx, by+r); x.arcTo(bx, by, bx+r, by, r);
  x.lineTo(bx+w-r, by); x.arcTo(bx+w, by, bx+w, by+r, r);
  x.lineTo(bx+w, by+h);
  x.closePath(); x.fill();
}
function drawTrend(days){
  const c = document.getElementById("chart-trend");
  const x = c.getContext("2d");
  const W = c.width = (c.clientWidth||400)*2, H = c.height = 560;
  c.style.height = "280px";
  x.clearRect(0,0,W,H);
  const pad = {l:52,r:16,t:28,b:52};
  const iw = W-pad.l-pad.r, ih = H-pad.t-pad.b;
  const n = days.length;
  const X = i => pad.l + (n<=1?iw/2:i*iw/(n-1));
  const Y = v => pad.t + (1-v/10)*ih;
  // fond dégradé
  const bg = x.createLinearGradient(0,pad.t,0,pad.t+ih);
  bg.addColorStop(0,"rgba(91,140,255,.10)");
  bg.addColorStop(1,"rgba(91,140,255,0)");
  x.fillStyle=bg; x.fillRect(pad.l,pad.t,iw,ih);
  // grille + labels axe Y
  x.strokeStyle="#242e4a"; x.fillStyle="#7c8aa8"; x.font="19px system-ui"; x.lineWidth=2;
  for(let v=0;v<=10;v+=2){
    x.beginPath(); x.moveTo(pad.l,Y(v)); x.lineTo(W-pad.r,Y(v)); x.stroke();
    x.fillText(v+"/10", 6, Y(v)+7);
  }
  // axe X : dates
  x.textAlign="center";
  const step = Math.max(1, Math.ceil(n/7));
  for(let i=0;i<n;i+=step) x.fillText(days[i].date.slice(5).replace("-","/"), X(i), H-14);
  x.textAlign="left";
  // zone sport (bandes violettes)
  days.forEach((d,i)=>{
    if(d.sport>1){
      const g = x.createLinearGradient(0,pad.t,0,pad.t+ih);
      g.addColorStop(0,"rgba(139,92,246,.22)"); g.addColorStop(1,"rgba(139,92,246,.05)");
      x.fillStyle=g; x.fillRect(X(i)-(n>1?iw/(n-1)/2:20), pad.t, n>1?iw/(n-1):40, ih);
    }
  });
  // traçage
  function path(vals){
    x.beginPath(); let started=false;
    vals.forEach((v,i)=>{ if(v==null){ started=false; return; }
      if(!started){ x.moveTo(X(i),Y(v)); started=true; } else x.lineTo(X(i),Y(v)); });
    x.stroke();
  }
  function dots(daysArr, getter, color){
    x.fillStyle=color;
    daysArr.forEach((d,i)=>{ const v=getter(d); if(v!=null){ x.beginPath(); x.arc(X(i),Y(v),4.5,0,7); x.fill(); }});
  }
  const win = Math.min(7, Math.max(2, Math.round(n/4)));
  // moyenne jour : aire + trait fin
  const avgs = smooth(days, d=>tinAvg(d), win);
  x.strokeStyle="rgba(226,232,240,.75)"; x.lineWidth=2; x.setLineDash([4,5]); path(avgs); x.setLineDash([]);
  // sommeil & stress : traits fins lissés
  x.strokeStyle="rgba(52,211,153,.85)"; x.lineWidth=2.5; path(smooth(days, d=>d.sleep, win));
  x.strokeStyle="rgba(251,191,36,.85)"; x.lineWidth=2.5; x.setLineDash([7,5]); path(smooth(days, d=>d.stressM!=null?10-d.stressM:null, win)); x.setLineDash([]);
  // acouphène matin : ligne + aire
  const mS = smooth(days, d=>d.tinM, win);
  x.lineWidth=4; x.strokeStyle="#5b8cff";
  x.beginPath();
  let first=null,last=null;
  mS.forEach((v,i)=>{ if(v==null) return; const px=X(i),py=Y(v); if(first===null){x.moveTo(px,py);first=[px,py];} else x.lineTo(px,py); last=[px,py]; });
  x.stroke();
  if(first&&last&&mS.some(v=>v!=null)){
    const g=x.createLinearGradient(0,pad.t,0,pad.t+ih);
    g.addColorStop(0,"rgba(91,140,255,.28)"); g.addColorStop(1,"rgba(91,140,255,0)");
    x.lineTo(last[0],Y(0)); x.lineTo(first[0],Y(0)); x.closePath();
    x.fillStyle=g; x.fill();
  }
  // acouphène soir : ligne + points
  const eS = smooth(days, d=>d.tinE, win);
  x.lineWidth=4; x.strokeStyle="#f472b6"; path(eS);
  // points réels matin/soir si peu de données
  if(n<=60){ dots(days, d=>d.tinM, "#8fb4ff"); dots(days, d=>d.tinE, "#f9a8d4"); }
}

/* ═══════════ Data tab ═══════════ */
function renderData(){
  const days = Object.values(db).sort((a,b)=>a.date<b.date?1:-1);
  document.getElementById("rec-count").textContent = "— "+days.length+" "+(LANG==="fr"?"jours":"days");
  const tb = document.getElementById("history-table");
  if(!days.length){ tb.innerHTML = '<tr><td class="empty">–</td></tr>'; return; }
  tb.innerHTML = "<tr><th>"+[t("h_date"),t("h_tinM"),t("h_sleep"),t("h_hours"),t("h_stressM"),t("h_tinE"),t("h_stressE"),t("h_plane"),t("h_sport")].join("</th><th>")+"</th></tr>" +
    days.map(d=>{
      const sp = d.sport>1 ? SPORT_LABELS[LANG][d.sport-1] : (d.sport===1?SPORT_LABELS[LANG][0]:"–");
      return `<tr><td>${d.date}</td><td>${d.tinM||"–"}</td><td>${d.sleep||"–"}</td><td>${d.hours?d.hours+" h":"–"}</td><td>${d.stressM||"–"}</td><td>${d.tinE||"–"}</td><td>${d.stressE||"–"}</td><td>${d.plane===2?t("sp_yes"):(d.plane===1?t("sp_no"):"–")}</td><td>${sp}</td></tr>`;
    }).join("");
}
function download(name, content, type){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content],{type}));
  a.download = name; a.click();
}
document.getElementById("btn-export-json").onclick = ()=> download("tinnitus-tracker-"+todayKey()+".json", JSON.stringify(db,null,2), "application/json");
document.getElementById("btn-export-csv").onclick = ()=>{
  const rows = [["date","tinnitus_morning","sleep_quality","sleep_hours","stress_morning","tinnitus_evening","stress_evening","flight","exercise"]];
  Object.values(db).sort((a,b)=>a.date<b.date?-1:1).forEach(d=>
    rows.push([d.date,d.tinM||"",d.sleep||"",d.hours||"",d.stressM||"",d.tinE||"",d.stressE||"",d.plane===2?"yes":(d.plane===1?"no":""),d.sport||""]));
  download("tinnitus-tracker-"+todayKey()+".csv", rows.map(r=>r.join(",")).join("\n"), "text/csv");
};
document.getElementById("btn-import").onclick = ()=> document.getElementById("file-import").click();
document.getElementById("file-import").onchange = e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try {
      const data = JSON.parse(r.result);
      db = data; save(); renderData(); renderPills();
      alert(t("import_ok",{n:Object.keys(data).length}));
    } catch(err){ alert(t("import_bad")); }
  };
  r.readAsText(f);
};
document.getElementById("btn-clear").onclick = ()=>{
  if(confirm(t("clear_confirm"))){ db={}; save(); renderData(); renderPills(); }
};

/* ═══════════ Rappels ═══════════ */
let notifSentToday = {};
function showNotif(title, body){
  if(Notification.permission==="granted" && document.visibilityState!=="visible"){
    new Notification(title,{body});
  }
}
function notifTick(){
  const now = new Date();
  const hm = String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
  const d = db[todayKey()]||{};
  const m = document.getElementById("rem-morning").value;
  const e = document.getElementById("rem-evening").value;
  if(hm===m && !notifSentToday.m && !d.tinM){ notifSentToday.m=1; showNotif("🌅 Tinnitus Tracker", t("notif_m_body")); }
  if(hm===e && !notifSentToday.e && !d.tinE){ notifSentToday.e=1; showNotif("🌙 Tinnitus Tracker", t("notif_e_body")); }
}
document.getElementById("btn-notif").onclick = async ()=>{
  const msg = document.getElementById("notif-msg");
  if(!("Notification" in window)){ msg.textContent=t("notif_no_support"); msg.style.color="#ef4444"; return; }
  const perm = await Notification.requestPermission();
  if(perm==="granted"){
    msg.style.color="var(--ok)";
    msg.textContent = t("notif_on",{m:document.getElementById("rem-morning").value,e:document.getElementById("rem-evening").value});
    new Notification("Tinnitus Tracker",{body:"✓"});
  } else {
    msg.style.color="#ef4444";
    msg.textContent = t("notif_off");
  }
};
setInterval(notifTick, 20000);

document.getElementById("btn-ics").onclick = ()=>{
  const mk = (h, m, title, desc)=>{
    const dt = (d)=>d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const start = new Date(); start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime()+10*60000);
    const stop = new Date(); stop.setMonth(stop.getMonth()+6);
    let ev = "BEGIN:VEVENT\r\n";
    ev += "SUMMARY:"+title+"\r\n";
    ev += "DESCRIPTION:"+desc+"\r\n";
    ev += "DTSTART:"+dt(start)+"\r\nDTEND:"+dt(end)+"\r\n";
    ev += "RRULE:FREQ=DAILY;UNTIL="+dt(stop)+"\r\n";
    ev += "BEGIN:VALARM\r\nTRIGGER:-PT0M\r\nACTION:DISPLAY\r\nDESCRIPTION:"+title+"\r\nEND:VALARM\r\n";
    ev += "END:VEVENT\r\n";
    return ev;
  };
  const ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TinnitusTracker//FR\r\n" +
    mk(8,0,"🌅 Tinnitus Tracker – "+t("pill_morning"), t("notif_m_body")) +
    mk(20,0,"🌙 Tinnitus Tracker – "+t("pill_evening"), t("notif_e_body")) +
    "END:VCALENDAR\r\n";
  download("tinnitus-rappels-6mois.ics", ics, "text/calendar");
  showToast(t("ics_toast"));
};

/* ═══════════ Bilan PDF (rapport imprimable 6 mois) ═══════════ */
document.getElementById("btn-report").onclick = ()=>{
  const days = last6Months().sort((a,b)=>a.date<b.date?-1:1);
  if(!days.length){ alert(t("empty_stats")); return; }
  const tins = days.map(d=>tinAvg(d)).filter(v=>v!==null);
  const tM = days.map(d=>d.tinM).filter(x=>x); const tE = days.map(d=>d.tinE).filter(x=>x);
  const fmt = v => v!=null ? v.toFixed(1) : t("rpt_na");
  // corrélations
  const corrPairs = (fa, fb)=>{
    const xs=[],ys=[];
    days.forEach(d=>{
      const a = typeof fa==="function"?fa(d):d[fa], b = typeof fb==="function"?fb(d):d[fb];
      if(a!=null && b!=null){ xs.push(a); ys.push(b); }
    });
    return pearson(xs,ys);
  };
  const corrRows = [
    [t("c_sleep"), corrPairs("sleep", d=>tinAvg(d))],
    [t("c_hours"), corrPairs("hours", d=>tinAvg(d))],
    [t("c_stressM"), corrPairs("stressM", d=>tinAvg(d))],
    [t("c_stressE"), corrPairs("stressE", d=>tinAvg(d))],
    [t("c_sleep_stress"), corrPairs("sleep","stressM")],
    [t("c_sleep_stressE"), corrPairs("sleep","stressE")],
    [t("c_plane"), corrPairs(d=>d.plane===2?1:0, d=>tinAvg(d))],
  ];
  // sport
  const wS=[], woS=[];
  days.forEach(d=>{ const v=tinAvg(d); if(v==null) return; (d.sport>1?wS:woS).push(v); });
  const mS = wS.length?mean(wS):null, mwo = woS.length?mean(woS):null;
  // images des graphiques
  const imgTrend = document.getElementById("chart-trend").toDataURL("image/png", .9);
  // dessiner un graphe de rapport (SVG inline, lisible en N&B) : moyenne glissante
  const win=7; const sm = smooth(days, d=>tinAvg(d), win);
  const W2=560, H2=160, pts=[];
  const valid = sm.map((v,i)=>v==null?null:[i,v]).filter(Boolean);
  const all = valid.map(p=>p[1]);
  const mn = Math.max(0, Math.min(...all)-.5), mx = Math.min(10, Math.max(...all)+.5);
  valid.forEach(([i,v])=>{
    const px = 40 + i*(W2-60)/Math.max(1,days.length-1);
    const py = 10 + (1-(v-mn)/(mx-mn||1))*(H2-30);
    pts.push([px,py]);
  });
  const pathStr = pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
  const dateFmt = d => d.date.slice(8)+"/"+d.date.slice(5,7);

  const html = '<!doctype html><html lang="'+LANG+'"><head><meta charset="utf-8"><title>'+t("rpt_title")+'</title><style>'
    +'body{font-family:Helvetica,Arial,sans-serif;color:#111;max-width:700px;margin:0 auto;padding:24px}'
    +'h1{font-size:20px;border-bottom:2px solid #5b8cff;padding-bottom:8px}'
    +'.meta{color:#666;font-size:11px;margin:4px 0 18px}'
    +'table{width:100%;border-collapse:collapse;font-size:11px;margin:8px 0 18px}'
    +'th,td{border:1px solid #ccc;padding:5px 7px;text-align:center}th{background:#f0f4ff}'
    +'.kpis{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}'
    +'.kpi{border:1px solid #ccc;border-radius:8px;padding:10px 14px;text-align:center;flex:1}'
    +'.kpi b{display:block;font-size:20px;color:#5b8cff}'
    +'.kpi span{font-size:10px;color:#666}'
    +'h2{font-size:14px;margin:16px 0 6px;color:#223}'
    +'footer{margin-top:22px;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px}'
    +'@media print{body{padding:0}}'
    +'</style></head><body>'
    +'<h1>🎧 '+t("rpt_title")+'</h1>'
    +'<p class="meta">'+t("rpt_generated")+': '+new Date().toLocaleDateString(LANG==="fr"?"fr-FR":"en-GB")+' — tinnitus-tracker</p>'
    +'<div class="kpis">'
    +'<div class="kpi"><b>'+fmt(mean(tins))+'/10</b><span>'+t("rpt_avg")+'</span></div>'
    +'<div class="kpi"><b>'+fmt(mean(tM))+'/10</b><span>'+t("rpt_morning_avg")+'</span></div>'
    +'<div class="kpi"><b>'+fmt(mean(tE))+'/10</b><span>'+t("rpt_evening_avg")+'</span></div>'
    +'<div class="kpi"><b>'+days.length+'</b><span>'+t("rpt_days")+'</span></div>'
    +'<div class="kpi"><b>'+Math.round(days.length/182*100)+'%</b><span>'+t("rpt_compliance")+'</span></div>'
    +'</div>'
    +'<h2>'+t("rpt_trend")+'</h2>'
    +'<svg viewBox="0 0 '+W2+' '+H2+'" style="width:100%">'
    +'<line x1="40" y1="140" x2="'+(W2-20)+'" y2="140" stroke="#999"/><line x1="40" y1="10" x2="40" y2="140" stroke="#999"/>'
    +'<path d="'+pathStr+'" fill="none" stroke="#5b8cff" stroke-width="2.5"/>'
    +'<text x="42" y="18" font-size="9" fill="#666">'+dateFmt(days[0])+'</text>'
    +'<text x="'+(W2-70)+'" y="18" font-size="9" fill="#666">'+dateFmt(days[days.length-1])+'</text>'
    +'</svg>'
    +'<h2>'+t("rpt_corr")+'</h2><table><tr><th></th><th>r</th></tr>'
    +corrRows.map(([lb,r])=>'<tr><td style="text-align:left">'+lb+'</td><td>'+(r==null?t("rpt_insuff"):r.toFixed(2))+'</td></tr>').join("")
    +'</table>'
    +'<h2>'+t("rpt_sport")+'</h2><table><tr><th></th><th>'+t("rpt_avg")+'</th><th>n</th></tr>'
    +'<tr><td style="text-align:left">'+t("c_with_sport")+'</td><td>'+fmt(mS)+'</td><td>'+wS.length+'</td></tr>'
    +'<tr><td style="text-align:left">'+t("c_without_sport")+'</td><td>'+fmt(mwo)+'</td><td>'+woS.length+'</td></tr>'
    +'</table>'
    +'<h2>'+t("rpt_table")+'</h2><table><tr>'
    +[t("h_date"),t("h_tinM"),t("h_sleep"),t("h_hours"),t("h_stressM"),t("h_tinE"),t("h_stressE"),t("h_plane"),t("h_sport")].map(h=>'<th>'+h+'</th>').join("")
    +'</tr>'
    +days.map(d=>{
      const sp = d.sport>1 ? SPORT_LABELS[LANG][d.sport-1] : (d.sport===1?SPORT_LABELS[LANG][0]:"–");
      return '<tr><td>'+d.date+'</td><td>'+(d.tinM||"–")+'</td><td>'+(d.sleep||"–")+'</td><td>'+(d.hours?d.hours+" h":"–")+'</td><td>'+(d.stressM||"–")+'</td><td>'+(d.tinE||"–")+'</td><td>'+(d.stressE||"–")+'</td><td>'+(d.plane===2?t("sp_yes"):(d.plane===1?t("sp_no"):"–"))+'</td><td>'+sp+'</td></tr>';
    }).join("")
    +'</table>'
    +'<footer>Tinnitus Tracker — '+t("w_data_d")+'</footer>'
    +'</body></html>';

  const w = window.open("", "_blank");
  if(!w){ alert(LANG==="fr"?"⚠️ Autorise les fenêtres pop-up pour générer le PDF.":"⚠️ Allow pop-ups to generate the PDF."); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(()=>{ w.focus(); w.print(); }, 400);
};

/* ═══════════ Synchro ═══════════ */


/* ═══════════ PWA ═══════════ */
(function(){
  const manifest = {
    name:"Tinnitus Tracker",
    short_name:"Acouphènes",
    start_url:".",
    display:"standalone",
    background_color:"#0f1420",
    theme_color:"#0f1420",
    description:"Suivi quotidien des acouphènes : intensité, sommeil, stress, sport.",
    icons:[{
      src:"data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#0f1420"/><circle cx="256" cy="256" r="150" fill="none" stroke="#5b8cff" stroke-width="40"/><circle cx="256" cy="256" r="40" fill="#8b5cf6"/></svg>'),
      sizes:"512x512", type:"image/svg+xml", purpose:"any"
    }]
  };
  const link = document.createElement("link");
  link.rel = "manifest";
  link.href = "data:application/manifest+json,"+encodeURIComponent(JSON.stringify(manifest));
  document.head.appendChild(link);
  const meta = document.createElement("meta");
  meta.name="theme-color"; meta.content="#0f1420";
  document.head.appendChild(meta);
  let deferred = null;
  const btn = document.getElementById("btn-install");
  window.addEventListener("beforeinstallprompt", e=>{
    e.preventDefault();
    deferred = e;
    btn.hidden = false;
  });
  btn.onclick = async ()=>{
    if(!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null; btn.hidden = true;
  };
  window.addEventListener("appinstalled", ()=>{ btn.hidden = true; });
  if("serviceWorker" in navigator && location.protocol==="https:"){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
})();

/* init */
applyLang();
setPeriod("morning");
