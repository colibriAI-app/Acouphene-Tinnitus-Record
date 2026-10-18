/* ═══════════ Data tab ═══════════ */
function renderData(){
  const days = Object.values(db).sort((a,b)=>a.date<b.date?1:-1);
  document.getElementById("rec-count").textContent = "— "+days.length+" "+(LANG==="fr"?"jours":"days");
  const tb = document.getElementById("history-table");
  if(!days.length){ tb.innerHTML = '<tr><td class="empty">–</td></tr>'; return; }
  tb.innerHTML = "<tr><th>"+[t("h_date"),t("h_tinM"),t("h_sleep"),t("h_hours"),t("h_stressM"),t("h_peakM"),t("h_tinE"),t("h_stressE"),t("h_plane"),t("h_sport"),t("h_peakE")].join("</th><th>")+"</th></tr>" +
    days.map(d=>{
      const sp = d.sport>1 ? SPORT_LABELS[LANG][d.sport-1] : (d.sport===1?SPORT_LABELS[LANG][0]:"–");
      return `<tr><td>${d.date}</td><td>${d.tinM||"–"}</td><td>${d.sleep||"–"}</td><td>${d.hours?d.hours+" h":"–"}</td><td>${d.stressM||"–"}</td><td>${peakTxt(d.peakM,d.earM)}</td><td>${d.tinE||"–"}</td><td>${d.stressE||"–"}</td><td>${d.plane===2?t("sp_yes"):(d.plane===1?t("sp_no"):"–")}</td><td>${sp}</td><td>${peakTxt(d.peakE,d.earE)}</td></tr>`;
    }).join("");
}
function download(name, content, type){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content],{type}));
  a.download = name; a.click();
}
document.getElementById("btn-export-json").onclick = ()=> download("tinnitus-tracker-"+todayKey()+".json", JSON.stringify(db,null,2), "application/json");
document.getElementById("btn-export-csv").onclick = ()=>{
  const rows = [["date","tinnitus_morning","sleep_quality","sleep_hours","stress_morning","peak_morning","peak_morning_ear","tinnitus_evening","stress_evening","flight","exercise","peak_evening","peak_evening_ear"]];
  const earCsv = e => e ? ["left","right","both"][e-1] : "";
  Object.values(db).sort((a,b)=>a.date<b.date?-1:1).forEach(d=>
    rows.push([d.date,d.tinM||"",d.sleep||"",d.hours||"",d.stressM||"",d.peakM===2?"yes":(d.peakM===1?"no":""),earCsv(d.earM),d.tinE||"",d.stressE||"",d.plane===2?"yes":(d.plane===1?"no":""),d.sport||"",d.peakE===2?"yes":(d.peakE===1?"no":""),earCsv(d.earE)]));
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
  const now = new Date(); const today = todayKey();
  const hm = String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
  const d = db[today]||{};
  const m = document.getElementById("rem-morning").value;
  const e = document.getElementById("rem-evening").value;
  if(hm===m && !notifSentToday.m && !d.tinM){ notifSentToday.m=1; showNotif("🌅 Tinnitus Tracker", t("notif_m_body")); }
  if(hm===e && !notifSentToday.e && !d.tinE){ notifSentToday.e=1; showNotif("🌙 Tinnitus Tracker", t("notif_e_body")); }
  // 🧲 Re-nudge amical : hier partiellement complété → un seul rappel par jour, pas de harcèlement
  const lastNudge = store.getItem("tinnitus-last-nudge");
  if(lastNudge!==today){
    const y = db[dateAdd(today,-1)];
    if(y && (y.tinM||y.tinE) && !(y.tinM&&y.tinE)){
      const p = y.tinM ? t("pill_evening") : t("pill_morning");
      showNotif("🧲 Tinnitus Tracker", t("renudge_body",{p, d:dateAdd(today,-1)}));
      store.setItem("tinnitus-last-nudge", today);
    }
  }
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

