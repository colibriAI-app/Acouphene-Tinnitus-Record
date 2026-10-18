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

/* ---- Pics acouphéniques : comptage mensuel + tendance ---- */
function peakStats(days){
  // comptage par mois (YYYY-MM) sur la période, mois ordonnés
  const perMonth = {};
  days.forEach(d=>{
    const m = d.date.slice(0,7);
    perMonth[m] = (perMonth[m]||0) + ((d.peakM===2||d.peakE===2) ? 1 : 0);
  });
  const months = Object.keys(perMonth).sort();
  const counts = months.map(m=>perMonth[m]);
  const total = counts.reduce((a,b)=>a+b,0);
  // tendance : régression linéaire sur les comptes mensuels (min. 2 mois avec données)
  let slope = null;
  if(counts.length>=2){
    const n = counts.length;
    const mx = (n-1)/2, my = counts.reduce((a,b)=>a+b,0)/n;
    let num=0, den=0;
    counts.forEach((c,i)=>{ num += (i-mx)*(c-my); den += (i-mx)*(i-mx); });
    slope = den===0 ? 0 : num/den;
  }
  // comparaison 1re moitié vs 2de moitié de la période (plus robuste que la pente seule)
  const half = Math.floor(days.length/2);
  const d1 = days.slice(0,half).filter(d=>d.peakM===2||d.peakE===2).length;
  const d2 = days.slice(half).filter(d=>d.peakM===2||d.peakE===2).length;
  const n1 = Math.max(1,half), n2 = Math.max(1,days.length-half);
  const rate1 = d1/n1, rate2 = d2/n2;
  let trend = "stable";
  if(total>0){
    const rel = (rate2-rate1)/(rate1||rate2||1);
    if(rel>0.25) trend = "accel";
    else if(rel<-0.25) trend = "decel";
  }
  return { total, months, counts, slope, trend, rate1, rate2, d1, d2 };
}
function peakTrendLabel(trend){
  return trend==="accel" ? t("peak_accel") : trend==="decel" ? t("peak_decel") : t("peak_stable");
}

function renderStats(){
  const days = last6Months().sort((a,b)=>a.date<b.date?-1:1);
  const kpi = document.getElementById("kpi");
  if(!days.length){
    kpi.innerHTML = '<div class="card"><div class="empty">'+t("empty_stats")+'</div></div>';
    ["chart-trend","chart-bars"].forEach(id=>{ const cc=document.getElementById(id); cc.getContext("2d").clearRect(0,0,cc.width,cc.height); });
    document.getElementById("corr-list").innerHTML = "";
    document.getElementById("corr-sport").innerHTML = "";
    document.getElementById("corr-peaks").innerHTML = "";
    return;
  }
  const tins = days.map(d=>tinAvg(d)).filter(x=>x!==null);
  const tinsM = days.map(d=>d.tinM).filter(x=>x);
  const tinsE = days.map(d=>d.tinE).filter(x=>x);
  const compliance = Math.round(days.length / 182 * 100);
  const pk = peakStats(days);
  const pkArrow = pk.trend==="accel" ? "📈" : pk.trend==="decel" ? "📉" : "➡️";
  kpi.innerHTML = `
    <div class="stat"><div class="v">${mean(tins)?mean(tins).toFixed(1):"–"}</div><div class="l">${t("kpi_avg")}</div></div>
    <div class="stat"><div class="v">${tinsM.length?mean(tinsM).toFixed(1):"–"}</div><div class="l">${t("kpi_morning")}</div></div>
    <div class="stat"><div class="v">${tinsE.length?mean(tinsE).toFixed(1):"–"}</div><div class="l">${t("kpi_evening")}</div></div>
    <div class="stat"><div class="v">${days.length}</div><div class="l">${t("kpi_days")} (${compliance}${t("kpi_of")})</div></div>
    <div class="stat"><div class="v">${pk.total} ${pkArrow}</div><div class="l">${t("rpt_peak_days")}</div></div>`;
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
    [t("c_peak"), pearson(...pairs(d=>(d.peakM===2||d.peakE===2)?1:0, d=>tinAvg(d)))],
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
  // ---- section pics acouphéniques ----
  const pkEl = document.getElementById("corr-peaks");
  if(pk.total===0){
    pkEl.innerHTML = '<div class="row"><span>⚡</span><span class="empty" style="padding:0">'+t("peak_none")+'</span><span></span></div>';
  } else {
    const mx = Math.max(1, ...pk.counts);
    const monthlyHtml = pk.months.map((m,i)=>`<div class="row"><span>${m}</span>
      <div class="bar"><i style="left:0;width:${pk.counts[i]/mx*100}%;background:#f59e0b"></i></div>
      <span>${pk.counts[i]} ⚡</span></div>`).join("");
    const avgM = (pk.total/pk.months.length).toFixed(1);
    const col = pk.trend==="accel"?"#ef4444":pk.trend==="decel"?"#34d399":"#7c8aa8";
    pkEl.innerHTML = monthlyHtml
      + `<div class="row"><span>${avgM} ${t("peak_month")}</span><span></span><span></span></div>`
      + `<div class="row"><span style="color:${col};font-weight:700">${peakTrendLabel(pk.trend)}</span>
          <span style="font-size:.78rem;color:#7c8aa8">${t("rpt_peak_am")}: ${pk.d1+pk.d2>0 ? Math.round(pk.rate1*100)+"% → "+Math.round(pk.rate2*100)+"%" : "–"}</span><span></span></div>`;
  }
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

