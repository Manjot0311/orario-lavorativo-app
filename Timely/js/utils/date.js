/* ═══════════════════════════════════════════════════════════════
   js/utils/date.js — Funzioni di utilità per le date
   Modifica qui: logica settimane ISO, calcolo giorni nel mese
   ═══════════════════════════════════════════════════════════════ */

/** y, m, d → chiave storage "YYYY-MM-DD" */
function dk(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** È weekend? */
function isWE(y, m, d) {
  const w = new Date(y, m - 1, d).getDay();
  return w === 0 || w === 6;
}

/** Giorni nel mese */
function dim(y, m) {
  return new Date(y, m, 0).getDate();
}

/** Numero settimana ISO + anno ISO */
function isoWk(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    wn: Math.ceil((((d - y1) / 86400000) + 1) / 7),
    wy: d.getUTCFullYear()
  };
}

/**
 * I 7 giorni (lun→dom) della settimana che contiene `now`.
 * Usato dalla Home per il recap della settimana corrente.
 */
function currentWeekDays(now) {
  const dow = now.getDay() || 7; // 1=lun … 7=dom
  const mon = new Date(now);
  mon.setDate(now.getDate() - (dow - 1));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    days.push({ date: day, y: day.getFullYear(), m: day.getMonth() + 1, d: day.getDate(), om: false });
  }
  return days;
}
/**
 * Restituisce tutte le settimane ISO del mese,
 * ognuna con i 7 giorni completi (lun→dom).
 * I giorni fuori mese hanno om=true.
 */
function weeksForMonth(y, m) {
  const wkMap = {};

  // Trova le settimane ISO coinvolte dal mese
  for (let d = 1; d <= dim(y, m); d++) {
    const dt = new Date(y, m - 1, d);
    const { wn, wy } = isoWk(dt);
    const k = `${wy}-${String(wn).padStart(2, '0')}`;
    if (!wkMap[k]) wkMap[k] = { wn, wy, days: [] };
  }

  // Per ogni settimana, genera tutti e 7 i giorni partendo dal lunedì
  Object.values(wkMap).forEach(wk => {
    for (let d = 1; d <= dim(y, m); d++) {
      const dt = new Date(y, m - 1, d);
      const { wn, wy } = isoWk(dt);
      if (wn === wk.wn && wy === wk.wy) {
        const dow = dt.getDay() || 7; // 1=lun … 7=dom
        const mon = new Date(dt);
        mon.setDate(dt.getDate() - (dow - 1));
        for (let i = 0; i < 7; i++) {
          const day = new Date(mon);
          day.setDate(mon.getDate() + i);
          const dy = day.getFullYear(), dm = day.getMonth() + 1, dd = day.getDate();
          wk.days.push({ date: day, y: dy, m: dm, d: dd, om: !(dy === y && dm === m) });
        }
        break;
      }
    }
  });

  return Object.entries(wkMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}