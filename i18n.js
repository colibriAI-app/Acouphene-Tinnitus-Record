"use strict";
/* ---------- Stockage sûr (iframe sandboxée : localStorage peut être bloqué) ---------- */
const store = (()=>{
  try { localStorage.setItem("__test","1"); localStorage.removeItem("__test"); return localStorage; }
  catch(e){
    const m = new Map();
    return {
      getItem:k=> m.has(k) ? m.get(k) : null,
      setItem:(k,v)=> m.set(k, String(v)),
      removeItem:k=> m.delete(k)
    };
  }
})();
/* ═══════════ I18N ═══════════ */
const I18N = {
  fr: {
    tab_entry:"Saisie", tab_stats:"Visu & corrélations", tab_data:"Données",
    install_app:"⬇️ Installer l'app",
    morning:"🌅 Matin", evening:"🌙 Soir", morning_w:"Matin", evening_w:"Soir",
    q_tinM:"Intensité de l'acouphène au réveil", q_tinE:"Intensité de l'acouphène ce soir",
    q_sleep:"Qualité du sommeil", q_hours:"Heures de sommeil",
    q_stressM:"Niveau de stress actuel", q_stressE:"Niveau de stress de la journée",
    q_sport:"Sport aujourd'hui ?", q_plane:"✈️ Vol en avion aujourd'hui ?", sp_no:"Non", sp_yes:"Oui", h_plane:"Avion", c_plane:"Avion ↔ Acouphène", c_sleep_stressE:"Sommeil ↔ Stress (soir)",
    h_low:"1 = imperceptible", h_high:"10 = insupportable",
    h_sleep_low:"1 = très mauvaise nuit", h_sleep_high:"10 = excellente nuit",
    h_hours:"Nombre d'heures de nuit",
    h_calm:"1 = très calme", h_stressed:"10 = très stressé",
    h_day_calm:"1 = journée très calme", h_day_stress:"10 = journée très stressante",
    sp_none:"Aucun", sp_light:"Léger", sp_mod:"Modéré", sp_int:"Intense", sp_xint:"Intense+",
    save_morning:"Enregistrer le matin ", save_evening:"Enregistrer le soir ",
    save_fill:"Complète les champs ", saved:"✓ Enregistré !",
    toast_morning:"✓ Matin enregistré ! À ce soir 🌙", toast_evening:"✓ Soir enregistré ! Belle nuit ✨",
    saved_for:"✓ {p} enregistré pour le {d}",
    w_title:"Bienvenue sur Tinnitus Tracker 👋",
    w_intro:"Une app simple pour comprendre comment ton acouphène évolue et ce qui l'influence.",
    w_morning_t:"Le matin", w_morning_d:"Note ton acouphène au réveil (1–10), la qualité de ta nuit, tes heures de sommeil et ton stress.",
    w_evening_t:"Le soir", w_evening_d:"Note ton acouphène de la journée, ton stress, et si tu as fait du sport.",
    w_stats_t:"Le visu", w_stats_d:"Après quelques jours, l'onglet « Visu & corrélations » montre l'évolution et les liens entre acouphène, sommeil, stress et sport.",
    w_goal_t:"L'objectif", w_goal_d:"6 mois de données pour identifier ce qui fait varier ton acouphène — et en parler avec des chiffres concrets.",
    w_data_t:"Tes données", w_data_d:"Stockées uniquement dans ce navigateur. Exporte-les régulièrement depuis l'onglet « Données ».",
    w_install_t:"Installer l'app", w_install_d:"Une fois le site déployé (GitHub Pages) : sur Chrome/Android, menu ⋮ → « Installer l'application » ; sur iPhone, bouton Partager → « Sur l'écran d'accueil ». L'app s'ouvrira en plein écran et fonctionnera hors ligne.",
    w_start:"C'est parti ! 🚀",
    pill_morning:"Matin", pill_evening:"Soir", pill_done:"saisi", pill_todo:"à faire", pill_date:"Date",
    kpi_avg:"Acouphène moyen /10", kpi_morning:"Matin /10", kpi_evening:"Soir /10",
    kpi_days:"Jours suivis", kpi_of:"% des 6 mois",
    empty_stats:"Pas encore de données. Commence par la saisie du matin ! 🌅",
    s_trend:"Tendance 6 mois", s_trend_sub:"— courbes lissées (moyenne 7 jours)",
    s_trend30:"30 derniers jours", s_trend30_sub:"— barres matin / soir",
    s_corr:"Corrélations", s_corr_sub:"— coefficient de Pearson sur 6 mois",
    s_sport:"Acouphène : sport vs sans sport",
    l_morning:"Matin", l_evening:"Soir", l_avg:"Moyenne jour (lissée)",
    l_sleep:"Sommeil", l_stress:"Stress (inversé : haut = zen)", l_sport:"Jours avec sport",
    c_sleep:"Sommeil ↔ Acouphène", c_hours:"Heures de sommeil ↔ Acouphène",
    c_stressM:"Stress (matin) ↔ Acouphène", c_stressE:"Stress (soir) ↔ Acouphène",
    c_sleep_stress:"Sommeil ↔ Stress (matin)",
    c_insufficient:"données insuffisantes (≥5 jours)",
    str_negligible:"négligeable", str_weak:"faible", str_moderate:"modérée", str_strong:"forte",
    c_with_sport:"Jour avec sport", c_without_sport:"Jour sans sport",
    c_effect_less:"de moins avec sport", c_effect_more:"de plus avec sport", c_effect_days:"j vs",
    d_install_t:"📱 Installer l'app",
    d_install_p:"Pour installer Tinnitus Tracker comme une vraie app (icône, plein écran, hors ligne) :",
    d_install_1:"Sur <b style=\"color:#fff\">Chrome / Android</b> : ouvre le menu <b style=\"color:#fff\">⋮</b> en haut à droite → <b style=\"color:#fff\">« Installer l'application »</b> (ou utilise le bouton ⬇️ de l'en-tête s'il apparaît).",
    d_install_2:"Sur <b style=\"color:#fff\">iPhone / Safari</b> : bouton <b style=\"color:#fff\">Partager</b> (carré avec flèche) → <b style=\"color:#fff\">« Sur l'écran d'accueil »</b> → Ajouter.",
    d_install_3:"Sur <b style=\"color:#fff\">ordinateur</b> (Chrome/Edge) : icône d'installation <b style=\"color:#fff\">⊕</b> dans la barre d'adresse, ou menu → « Installer Tinnitus Tracker ».",
    d_install_warn:"⚠️ L'installation n'est disponible qu'une fois l'app mise en ligne en HTTPS (ex. GitHub Pages). En local, le bouton peut ne pas apparaître — c'est normal.",
    d_remind_t:"⏰ Rappels quotidiens",
    d_remind_p:"Active les notifications du navigateur : tu recevras un rappel matin et soir tant que l'app reste ouverte. Complète avec le fichier calendrier ci-dessous pour être sûr de ne rien manquer.",
    d_notif:"🔔 Activer les rappels", d_ics:"📅 Rappels natifs (6 mois)",
    d_ics_hint:"💡 Le bouton « Rappels natifs » télécharge un fichier calendrier (.ics) : ouvre-le sur ton téléphone et les notifications 8h/20h fonctionneront tous les jours, même app fermée.",
    d_backup_t:"Sauvegarde",
    d_backup_p:"Vos données sont stockées localement dans ce navigateur. Exportez régulièrement une sauvegarde.",
    d_export_json:"⬇ Exporter JSON", d_export_csv:"⬇ Exporter CSV", d_import:"⬆ Importer JSON", rpt_title:"Bilan Tinnitus Tracker — 6 derniers mois", rpt_generated:"Généré le", rpt_avg:"Acouphène moyen", rpt_morning_avg:"Moyenne matin", rpt_evening_avg:"Moyenne soir", rpt_days:"Jours suivis", rpt_compliance:"Régularité", rpt_corr:"Corrélations (Pearson)", rpt_na:"n/a", rpt_insuff:"Données insuffisantes (min. 5 jours)", rpt_trend:"Évolution (moyenne glissante 7 j)", rpt_table:"Historique détaillé", rpt_sport:"Sport vs sans sport", rpt_pdf_hint:"💡 Le bouton ouvre un rapport imprimable : choisis « Enregistrer en PDF » dans la boîte de dialogue.",
    d_history_t:"Historique", d_danger_t:"🗑 Zone dangereuse", d_clear:"Effacer toutes les données",
    h_date:"Date", h_tinM:"Acou. matin", h_sleep:"Sommeil", h_hours:"Heures", h_stressM:"Stress matin",
    h_tinE:"Acou. soir", h_stressE:"Stress soir", h_sport:"Sport",
    notif_no_support:"⚠️ Ce navigateur ne supporte pas les notifications.",
    notif_on:"✓ Rappels activés à {m} et {e} (laisse l'app ouverte en arrière-plan).",
    notif_off:"✗ Notifications refusées. Autorise-les dans les réglages du navigateur.",
    notif_m_body:"Il est l'heure de noter ton acouphène du matin !",
    notif_e_body:"Il est l'heure de noter ton acouphène du soir !",
    ics_toast:"📅 Fichier calendrier téléchargé — ouvre-le sur ton téléphone !",
    import_ok:"Import réussi : {n} jours.", import_bad:"Fichier JSON invalide.",
    clear_confirm:"Effacer définitivement toutes les données ?",
    lang_switch:"🇬🇧 English"
  },
  en: {
    tab_entry:"Log", tab_stats:"Charts & correlations", tab_data:"Data",
    install_app:"⬇️ Install app",
    morning:"🌅 Morning", evening:"🌙 Evening", morning_w:"Morning", evening_w:"Evening",
    q_tinM:"Tinnitus intensity on waking", q_tinE:"Tinnitus intensity tonight",
    q_sleep:"Sleep quality", q_hours:"Hours of sleep",
    q_stressM:"Current stress level", q_stressE:"Stress level of the day",
    q_sport:"Exercise today?", q_plane:"✈️ Flight today?", sp_no:"No", sp_yes:"Yes", h_plane:"Flight", c_plane:"Flight ↔ Tinnitus", c_sleep_stressE:"Sleep ↔ Stress (evening)",
    h_low:"1 = barely noticeable", h_high:"10 = unbearable",
    h_sleep_low:"1 = very bad night", h_sleep_high:"10 = excellent night",
    h_hours:"Number of hours slept",
    h_calm:"1 = very calm", h_stressed:"10 = very stressed",
    h_day_calm:"1 = very calm day", h_day_stress:"10 = very stressful day",
    sp_none:"None", sp_light:"Light", sp_mod:"Moderate", sp_int:"Intense", sp_xint:"Intense+",
    save_morning:"Save morning ", save_evening:"Save evening ",
    save_fill:"Fill in the fields ", saved:"✓ Saved!",
    toast_morning:"✓ Morning saved! See you tonight 🌙", toast_evening:"✓ Evening saved! Good night ✨",
    saved_for:"✓ {p} saved for {d}",
    w_title:"Welcome to Tinnitus Tracker 👋",
    w_intro:"A simple app to understand how your tinnitus changes and what influences it.",
    w_morning_t:"In the morning", w_morning_d:"Rate your tinnitus on waking (1–10), your sleep quality, hours slept and stress.",
    w_evening_t:"In the evening", w_evening_d:"Rate your tinnitus for the day, your stress, and whether you exercised.",
    w_stats_t:"The charts", w_stats_d:"After a few days, the “Charts & correlations” tab shows trends and links between tinnitus, sleep, stress and exercise.",
    w_goal_t:"The goal", w_goal_d:"6 months of data to identify what drives your tinnitus — and discuss it with concrete numbers.",
    w_data_t:"Your data", w_data_d:"Stored only in this browser. Export a backup regularly from the “Data” tab.",
    w_install_t:"Install the app", w_install_d:"Once the site is deployed (GitHub Pages): on Chrome/Android, menu ⋮ → “Install app”; on iPhone, Share button → “Add to Home Screen”. The app will then open full screen and work offline.",
    w_start:"Let's go! 🚀",
    pill_morning:"Morning", pill_evening:"Evening", pill_done:"logged", pill_todo:"to do", pill_date:"Date",
    kpi_avg:"Average tinnitus /10", kpi_morning:"Morning /10", kpi_evening:"Evening /10",
    kpi_days:"Days tracked", kpi_of:"% of 6 months",
    empty_stats:"No data yet. Start with the morning log! 🌅",
    s_trend:"6-month trend", s_trend_sub:"— smoothed curves (7-day average)",
    s_trend30:"Last 30 days", s_trend30_sub:"— morning / evening bars",
    s_corr:"Correlations", s_corr_sub:"— Pearson coefficient over 6 months",
    s_sport:"Tinnitus: exercise vs no exercise",
    l_morning:"Morning", l_evening:"Evening", l_avg:"Daily average (smoothed)",
    l_sleep:"Sleep", l_stress:"Stress (inverted: high = calm)", l_sport:"Days with exercise",
    c_sleep:"Sleep ↔ Tinnitus", c_hours:"Hours slept ↔ Tinnitus",
    c_stressM:"Stress (morning) ↔ Tinnitus", c_stressE:"Stress (evening) ↔ Tinnitus",
    c_sleep_stress:"Sleep ↔ Stress (morning)",
    c_insufficient:"not enough data (≥5 days)",
    str_negligible:"negligible", str_weak:"weak", str_moderate:"moderate", str_strong:"strong",
    c_with_sport:"Day with exercise", c_without_sport:"Day without exercise",
    c_effect_less:"less with exercise", c_effect_more:"more with exercise", c_effect_days:"d vs",
    d_install_t:"📱 Install the app",
    d_install_p:"To install Tinnitus Tracker as a real app (icon, full screen, offline):",
    d_install_1:"On <b style=\"color:#fff\">Chrome / Android</b>: open the <b style=\"color:#fff\">⋮</b> menu → <b style=\"color:#fff\">“Install app”</b> (or use the ⬇️ button in the header if it appears).",
    d_install_2:"On <b style=\"color:#fff\">iPhone / Safari</b>: <b style=\"color:#fff\">Share</b> button (square with arrow) → <b style=\"color:#fff\">“Add to Home Screen”</b> → Add.",
    d_install_3:"On <b style=\"color:#fff\">desktop</b> (Chrome/Edge): the <b style=\"color:#fff\">⊕</b> install icon in the address bar, or menu → “Install Tinnitus Tracker”.",
    d_install_warn:"⚠️ Installation is only available once the app is live over HTTPS (e.g. GitHub Pages). Locally, the button may not appear — that's normal.",
    d_remind_t:"⏰ Daily reminders",
    d_remind_p:"Enable browser notifications: you'll get a morning and evening reminder while the app stays open. Add the calendar file below to be sure never to miss a log.",
    d_notif:"🔔 Enable reminders", d_ics:"📅 Native reminders (6 months)",
    d_ics_hint:"💡 The “Native reminders” button downloads a calendar (.ics) file: open it on your phone and the 8am/8pm notifications will fire every day, even with the app closed.",
    d_backup_t:"Backup",
    d_backup_p:"Your data is stored locally in this browser. Export a backup regularly.",
    d_export_json:"⬇ Export JSON", d_export_csv:"⬇ Export CSV", d_import:"⬆ Import JSON", rpt_title:"Tinnitus Tracker Report — last 6 months", rpt_generated:"Generated on", rpt_avg:"Average tinnitus", rpt_morning_avg:"Morning average", rpt_evening_avg:"Evening average", rpt_days:"Days tracked", rpt_compliance:"Adherence", rpt_corr:"Correlations (Pearson)", rpt_na:"n/a", rpt_insuff:"Insufficient data (min. 5 days)", rpt_trend:"Trend (7-day rolling average)", rpt_table:"Detailed history", rpt_sport:"Exercise vs no exercise", rpt_pdf_hint:"💡 The button opens a printable report: choose “Save as PDF” in the dialog.",
    d_history_t:"History", d_danger_t:"🗑 Danger zone", d_clear:"Erase all data",
    h_date:"Date", h_tinM:"Tin. morning", h_sleep:"Sleep", h_hours:"Hours", h_stressM:"Stress morning",
    h_tinE:"Tin. evening", h_stressE:"Stress evening", h_sport:"Exercise",
    notif_no_support:"⚠️ This browser does not support notifications.",
    notif_on:"✓ Reminders enabled at {m} and {e} (keep the app open in the background).",
    notif_off:"✗ Notifications denied. Allow them in your browser settings.",
    notif_m_body:"Time to log your morning tinnitus!",
    notif_e_body:"Time to log your evening tinnitus!",
    ics_toast:"📅 Calendar file downloaded — open it on your phone!",
    import_ok:"Import successful: {n} days.", import_bad:"Invalid JSON file.",
    clear_confirm:"Permanently erase all data?",
    lang_switch:"🇫🇷 Français"
  }
};
let LANG = store.getItem("tinnitus-lang") || "fr";
function t(key, vars){
  let s = (I18N[LANG] && I18N[LANG][key]) || I18N.fr[key] || key;
  if(vars) Object.keys(vars).forEach(k=>{ s = s.replace("{"+k+"}", vars[k]); });
  return s;
}
function applyLang(){
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    if(!el.dataset.origHtml) el.dataset.origHtml = el.innerHTML;
    const key = el.dataset.i18n;
    if(I18N[LANG][key] !== undefined) el.innerHTML = I18N[LANG][key];
  });
  document.getElementById("btn-lang").textContent = LANG==="fr" ? "🇬🇧 EN" : "🇫🇷 FR";
  document.getElementById("btn-lang-welcome").textContent = t("lang_switch");
  buildScales(); setPeriod(current.period); renderPills(); renderStats(); renderData();
}
document.getElementById("btn-lang").onclick = ()=>{
  LANG = LANG==="fr" ? "en" : "fr";
  store.setItem("tinnitus-lang", LANG);
  applyLang();
};
document.getElementById("btn-lang-welcome").onclick = ()=> document.getElementById("btn-lang").click();
