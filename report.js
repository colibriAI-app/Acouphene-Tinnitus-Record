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
    [t("c_peak"), corrPairs(d=>(d.peakM===2||d.peakE===2)?1:0, d=>tinAvg(d))],
  ];
  // sport
  const wS=[], woS=[];
  days.forEach(d=>{ const v=tinAvg(d); if(v==null) return; (d.sport>1?wS:woS).push(v); });
  // pics acouphéniques
  const pk = peakStats(days);
  const spikeDays = days.filter(d=>d.peakM===2||d.peakE===2);
  const spM = days.filter(d=>d.peakM===2), spE = days.filter(d=>d.peakE===2);
  const earCnt = {1:0,2:0,3:0};
  days.forEach(d=>{ if(d.peakM===2&&d.earM) earCnt[d.earM]++; if(d.peakE===2&&d.earE) earCnt[d.earE]++; });
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
    +'<div class="kpi"><b>'+spikeDays.length+' ⚡</b><span>'+t("rpt_peak_days")+'</span></div>'
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
    +'<h2>'+t("rpt_peaks")+'</h2><table><tr><th></th><th>'+t("rpt_peak_days")+'</th><th>⚡</th></tr>'
    +'<tr><td style="text-align:left">'+t("rpt_peak_am")+'</td><td>'+spM.length+'</td><td>'+spM.map(d=>d.date.slice(8)+"/"+d.date.slice(5,7)+(d.earM?" — "+EAR_LABELS[LANG][d.earM-1]:"")).join(", ")+'</td></tr>'
    +'<tr><td style="text-align:left">'+t("rpt_peak_pm")+'</td><td>'+spE.length+'</td><td>'+spE.map(d=>d.date.slice(8)+"/"+d.date.slice(5,7)+(d.earE?" — "+EAR_LABELS[LANG][d.earE-1]:"")).join(", ")+'</td></tr>'
    +'<tr><td style="text-align:left">👂 '+t("e_left")+' / '+t("e_right")+' / '+t("e_both")+'</td><td>'+(earCnt[1]+earCnt[2]+earCnt[3])+'</td><td>'+earCnt[1]+' '+t("e_left")+' · '+earCnt[2]+' '+t("e_right")+' · '+earCnt[3]+' '+t("e_both")+'</td></tr>'
    +'</table>'
    +'<table><tr><th style="text-align:left">'+t("s_peaks")+'</th><th>'+t("peak_month")+'</th></tr>'
    +pk.months.map((m,i)=>'<tr><td style="text-align:left">'+m+'</td><td>'+pk.counts[i]+' ⚡</td></tr>').join("")
    +'<tr><td style="text-align:left"><b>'+peakTrendLabel(pk.trend)+'</b> ('+Math.round(pk.rate1*100)+'% → '+Math.round(pk.rate2*100)+'% des jours)</td><td>'+(pk.slope!=null?(pk.slope>0?"+":"")+pk.slope.toFixed(2)+'/'+t("peak_month"):'–')+'</td></tr>'
    +'</table>'
    +'<h2>'+t("rpt_table")+'</h2><table><tr>'
    +[t("h_date"),t("h_tinM"),t("h_sleep"),t("h_hours"),t("h_stressM"),t("h_peakM"),t("h_tinE"),t("h_stressE"),t("h_plane"),t("h_sport"),t("h_peakE")].map(h=>'<th>'+h+'</th>').join("")
    +'</tr>'
    +days.map(d=>{
      const sp = d.sport>1 ? SPORT_LABELS[LANG][d.sport-1] : (d.sport===1?SPORT_LABELS[LANG][0]:"–");
      return '<tr><td>'+d.date+'</td><td>'+(d.tinM||"–")+'</td><td>'+(d.sleep||"–")+'</td><td>'+(d.hours?d.hours+" h":"–")+'</td><td>'+(d.stressM||"–")+'</td><td>'+peakTxt(d.peakM,d.earM)+'</td><td>'+(d.tinE||"–")+'</td><td>'+(d.stressE||"–")+'</td><td>'+(d.plane===2?t("sp_yes"):(d.plane===1?t("sp_no"):"–"))+'</td><td>'+sp+'</td><td>'+peakTxt(d.peakE,d.earE)+'</td></tr>';
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
  // manifeste en fichier réel (manifest.webmanifest) + icône SVG, comme Beer-Runner
  const link = document.createElement("link");
  link.rel = "manifest";
  link.href = "manifest.webmanifest";
  document.head.appendChild(link);
  const fav = document.createElement("link");
  fav.rel = "icon";
  fav.type = "image/svg+xml";
  fav.href = "icon.svg";
  document.head.appendChild(fav);
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

/* ═══════════ init ═══════════ */
applyLang();
setPeriod("morning");
