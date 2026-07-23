/* ═══════════════════════════════════════════════════════════════
   js/utils/time.js — Funzioni di conversione orari
   Modifica qui: formati di visualizzazione ore, arrotondamenti
   ═══════════════════════════════════════════════════════════════ */

/** "HH:MM" → minuti (intero) oppure null */
function t2m(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** minuti → stringa "HH:MM", con segno opzionale */
function m2t(m, sign = false) {
  if (m == null || isNaN(m)) return '—';
  const neg = m < 0, a = Math.abs(m);
  const h = Math.floor(a / 60), mn = a % 60;
  const prefix = sign ? (neg ? '−' : '+') : (neg ? '−' : '');
  return prefix + String(h).padStart(2, '0') + ':' + String(mn).padStart(2, '0');
}

/** Ore decimali → "Xh Ym" */
function h2display(h) {
  if (h == null || isNaN(h)) return '—';
  const neg = h < 0, a = Math.abs(h);
  const hh = Math.floor(a), mm = Math.round((a - hh) * 60);
  let s = (neg ? '−' : '') + hh + 'h';
  if (mm > 0) s += ' ' + mm + 'm';
  return s;
}

/** Ore decimali → giorni con resto, es. "2g 4h" */
function h2days(hours, hoursPerDay = 8) {
  if (hours == null || isNaN(hours)) return '—';
  const neg = hours < 0, a = Math.abs(hours);
  const days = Math.floor(a / hoursPerDay);
  const rem  = Math.round((a - days * hoursPerDay) * 10) / 10;
  let s = neg ? '−' : '';
  if (days > 0) s += days + 'g';
  if (rem  > 0) s += (days > 0 ? ' ' : '') + rem + 'h';
  if (days === 0 && rem === 0) s += '0g';
  return s;
}

/** Minuti → ore intere, es. "168h" (per totali aggregati tipo "ore lavorate") */
function mInt(m) {
  if (m == null || isNaN(m)) return '—';
  const neg = m < 0, a = Math.abs(m);
  return (neg ? '−' : '') + Math.round(a / 60) + 'h';
}

/** Arrotonda ore a 2 decimali */
function hRound(h) {
  return Math.round(h * 100) / 100;
}