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
const EAR_LABELS = { fr:["Gauche","Droite","Les deux"], en:["Left","Right","Both"] };
function peakTxt(p, ear){
  if(p===2) return "⚡ " + (ear ? EAR_LABELS[LANG][ear-1] : "?");
  return p===1 ? t("sp_no") : "–";
}
function updateEarVis(){
  document.getElementById("ear-wrap-M").style.display = form.peakM===2 ? "" : "none";
  document.getElementById("ear-wrap-E").style.display = form.peakE===2 ? "" : "none";
}
function buildScales(){
  document.querySelectorAll(".scale[data-field]").forEach(sc=>{
    const f = sc.dataset.field;
    const isSport = f==="sport";
    const isPlane = f==="plane";
    const isPeak = f==="peakM"||f==="peakE";
    const isEar = f==="earM"||f==="earE";
    const n = isSport ? 5 : (isPlane||isPeak ? 2 : (isEar ? 3 : 10));
    const sel = form[f];
    sc.innerHTML = "";
    for(let i=1;i<=n;i++){
      const b = document.createElement("button");
      b.textContent = isPlane||isPeak ? (i===1?t("sp_no"):t("sp_yes")) : (isEar ? EAR_LABELS[LANG][i-1] : (isSport ? SPORT_LABELS[LANG][i-1] : i));
      if(sel===i) b.classList.add("sel");
      b.onclick = ()=>{
        form[f] = i;
        sc.querySelectorAll("button").forEach(x=>x.classList.remove("sel"));
        b.classList.add("sel");
        updateEarVis();
        updateSaveBtn();
      };
      sc.appendChild(b);
    }
  });
  updateEarVis();
}
function updateSaveBtn(){
  // ⚡ Mode éclair : l'intensité de l'acouphène suffit pour enregistrer
  const quickOk = current.period==="morning" ? !!form.tinM : !!form.tinE;
  const required = current.period==="morning" ? ["tinM","sleep","hours","stressM"] : ["tinE","stressE","plane","sport"];
  const done = required.filter(f=>form[f]).length;
  const allDone = done===required.length;
  const btn = document.getElementById("btn-save");
  btn.disabled = !quickOk && !allDone;
  document.getElementById("save-count").textContent = allDone ? "✓" : "("+done+"/"+required.length+")";
  document.getElementById("save-label").textContent = allDone
    ? t(current.period==="morning" ? "save_morning" : "save_evening")
    : (quickOk ? t("quick_save") : t("save_fill"));
  [["v-tin-m","tinM"],["v-tin-e","tinE"],["v-sleep","sleep"],["v-hours","hours"],["v-stress-m","stressM"],["v-stress-e","stressE"],["v-plane","plane"],["v-peak-m","peakM"],["v-peak-e","peakE"],["v-ear-m","earM"],["v-ear-e","earE"]].forEach(([id,f])=>{
    const el = document.getElementById(id); if(!el) return;
    if(f==="peakM") el.textContent = peakTxt(form.peakM, form.earM);
    else if(f==="peakE") el.textContent = peakTxt(form.peakE, form.earE);
    else if(f==="earM"||f==="earE") el.textContent = form[f] ? EAR_LABELS[LANG][form[f]-1] : "–";
    else if(f==="plane") el.textContent = form[f] ? (form[f]===2?t("sp_yes"):t("sp_no")) : "–";
    else el.textContent = form[f] ? form[f]+(f==="hours"?" h":"/10") : "–";
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
  el.appendChild(mk("🔥 "+t("streak_lbl"), streak()>0, streak()+" "+(streak()===1?t("streak_day"):t("streak_days"))));
  el.appendChild(mk(t("capital_lbl"), true, capitalTxt()));
}
/* ---- Série de jours consécutifs (streak) ---- */
function dateAdd(k, n){ const d = new Date(k+"T12:00"); d.setDate(d.getDate()+n); return todayKey(d); }
function streak(){
  let n = 0, k = todayKey();
  const today = db[k];
  if(!today || (!today.tinM && !today.tinE)) k = dateAdd(k,-1); // série pas encore démarrée aujourd'hui = grace
  while(db[k] && (db[k].tinM || db[k].tinE)){ n++; k = dateAdd(k,-1); }
  return n;
}
function streakBadge(n){
  if(n>=100) return t("streak_100"); if(n>=30) return t("streak_30"); if(n>=7) return t("streak_7"); return null;
}
/* ---- Capital données ---- */
function capitalTxt(){
  const days = Object.values(db).filter(d=>d.date);
  const n = days.reduce((a,d)=>a+((d.tinM?1:0)+(d.tinE?1:0)),0);
  return t("capital_val",{n, d:days.length});
}

/* ═══════════ Save ═══════════ */
document.getElementById("btn-save").onclick = ()=>{
  const prevStreak = streak();
  const d = day(todayKey());
  Object.assign(d, form);
  d.date = todayKey();
  save();
  const btn = document.getElementById("btn-save");
  btn.textContent = t("saved");
  btn.classList.add("saved");
  btn.disabled = true;
  const isMorning = current.period==="morning";
  const newStreak = streak();
  let streakToast = "";
  if(newStreak>prevStreak){
    streakToast = " "+t("streak_msg",{n:newStreak});
    const bd = streakBadge(newStreak);
    if(bd && streakBadge(prevStreak)!==bd) streakToast += " "+bd;
  }
  document.getElementById("save-msg").textContent = t("saved_for",{p:isMorning?t("pill_morning"):t("pill_evening"), d:todayKey()});
  showToast((isMorning ? t("toast_morning") : t("toast_evening")) + streakToast);
  renderInsight();
  setTimeout(()=>{
    btn.innerHTML = '<span id="save-label"></span><span id="save-count"></span>';
    btn.classList.remove("saved");
    document.getElementById("save-msg").textContent = "";
    setPeriod(isMorning ? "evening" : "morning");
    renderPills();
    document.querySelector('.tab[data-tab="stats"]').click();
  }, 1600);
};

/* ---- ✨ Insight post-saisie : ce que les données de l'utilisateur révèlent ---- */
function buildInsight(){
  const days = Object.values(db).filter(d=>d.date).sort((a,b)=>a.date<b.date?-1:1).slice(-90);
  if(days.length<5) return t("insight_need",{n:days.length});
  const tips = [];
  const avg = days.map(d=>tinAvg(d));
  // sommeil : nuits ≥8h vs <7h
  const good = [], bad = [];
  days.forEach(d=>{ const v=tinAvg(d); if(v==null) return; if(d.hours>=8) good.push(v); else if(d.hours&&d.hours<7) bad.push(v); });
  const mg = mean(good), mb = mean(bad);
  if(mg!=null && mb!=null && good.length>=3 && bad.length>=3){
    const diff = (mg-mb).toFixed(1);
    if(mg<mb) tips.push(t("insight_hours_up",{h:8, v:mg.toFixed(1), d:diff}));
    else tips.push(t("insight_hours_dn",{h:7, v:mb.toFixed(1), d:(mb-mg).toFixed(1)}));
  }
  // stress
  const rS = pearson(...(()=>{ const xs=[],ys=[]; days.forEach(d=>{ const v=tinAvg(d); if(v!=null&&d.stressM){xs.push(d.stressM);ys.push(v);} }); return [xs,ys]; })());
  if(rS!=null && Math.abs(rS)>=0.3) tips.push(t("insight_stress",{r:rS.toFixed(2)}));
  // sport
  const wS=[], wo=[];
  days.forEach(d=>{ const v=tinAvg(d); if(v==null) return; (d.sport>1?wS:wo).push(v); });
  const ms=mean(wS), mw=mean(wo);
  if(ms!=null&&mw!=null&&wS.length>=3&&wo.length>=3){
    const diff=Math.abs(ms-mw).toFixed(1);
    if(ms<mw) tips.push(t("insight_sport",{d:diff}));
    else if(ms>mw) tips.push(t("insight_sport_bad",{d:diff}));
  }
  // pics
  const last30 = days.slice(-30);
  const pk30 = last30.filter(d=>d.peakM===2||d.peakE===2).length;
  if(pk30>0) tips.push(t("insight_peak",{d:pk30, tr:t("peak_stable")}));
  if(!tips.length) return null;
  return tips[Math.floor(Math.random()*tips.length)]; // un insight à la fois, ça change = surprise
}
function renderInsight(){
  const el = document.getElementById("insight-box");
  if(!el) return;
  const txt = buildInsight();
  el.innerHTML = txt ? "<b>"+t("insight_t")+"</b><br>"+txt : "";
  el.style.display = txt ? "" : "none";
}
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

