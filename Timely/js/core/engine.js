/* ═══════════════════════════════════════════════════════════════
   js/core/engine.js — Calcoli business logic
   Usa il profilo utente per ferie/permessi invece di costanti hardcoded.
   ═══════════════════════════════════════════════════════════════ */

function oreG(r) {
  if (!r || (r.t !== 'Lavoro' && r.t !== 'Fuori sede')) return null;
  const e = t2m(r.e), up = t2m(r.up), rp = t2m(r.rp), u = t2m(r.u);
  if (e == null || u == null) return null;
  let tot = u - e;
  if (up != null && rp != null) tot -= (rp - up);
  return tot;
}

function dltG(r, std) {
  const o = oreG(r);
  if (o == null) return null;
  // Le ore di permesso parziale coprono la differenza dallo standard:
  // non devono essere conteggiate come deficit di straordinario
  const permesso = r.po ? Math.round((parseFloat(r.po) || 0) * 60) : 0;
  return (o + permesso) - std;
}

function godutoMese(y, m, upToDay, data) {
  const contract = getUserContract();
  let fG = 0, pG = 0;
  const lim = upToDay ?? dim(y, m);
  for (let d = 1; d <= lim; d++) {
    const r = data[dk(y, m, d)];
    if (!r) continue;
    // Tratto i permessi full-day storici come ferie (regola nuova):
    // se r.t === 'Permesso' viene considerato ferie a tutto il giorno.
    if (r.t === 'Ferie' || r.t === 'Permesso')    fG += contract.oreStd;
    // Considera i parziali per Lavoro e Fuori sede (mezza giornata, po/fo)
    if (r.t === 'Lavoro' || r.t === 'Fuori sede') {
      if (r.po) pG += parseFloat(r.po) || 0;
      if (r.fo) fG += parseFloat(r.fo) || 0;
    }
  }
  return { fG, pG };
}

/**
 * Calcola ferie & permessi partendo dall'anchor più recente.
 * Se non c'è ancora onboarding, ritorna valori vuoti.
 */
function calcFP(toY, toM, toToday = false) {
  const today    = new Date();
  const data     = loadData();
  const contract = getUserContract();
  const anchor   = getLastAnchor(toY, toM);

  if (!anchor) return { fS: 0, pS: 0, months: [] };

  let fS = anchor.fer;
  let pS = anchor.perm;
  let startY = anchor.y;
  let startM = anchor.m;

  // Avanza di un mese dopo l'anchor (quello è il punto di partenza)
  if (++startM > 12) { startM = 1; startY++; }

  // Se il target è prima o uguale all'anchor, ritorna solo l'anchor
  if (startY > toY || (startY === toY && startM > toM)) {
    return { fS, pS, months: [] };
  }

  const months = [];
  let y = startY, m = startM;

  while (y < toY || (y === toY && m <= toM)) {
    const isLast  = y === toY && m === toM;
    const isCurr  = y === today.getFullYear() && m === today.getMonth() + 1;
    const partial = isLast && toToday && isCurr;

    let fMat = contract.ferMese, pMat = contract.permMese, upToDay = null;

    if (partial) {
      const nd   = dim(y, m);
      const gone = today.getDate();
      fMat    = contract.ferMese  * (gone / nd);
      pMat    = contract.permMese * (gone / nd);
      upToDay = today.getDate();
    }

    const { fG, pG } = godutoMese(y, m, upToDay, data);
    const fAP = fS, pAP = pS;
    fS = fAP + fMat - fG;
    pS = pAP + pMat - pG;
    months.push({ y, m, fAP, fMat, fG, fS, pAP, pMat, pG, pS, partial });

    if (++m > 12) { m = 1; y++; }
  }

  return { fS, pS, months };
}

/**
 * Sintesi di un mese: ore lavorate, saldo, assenze, saldo ferie/permessi.
 * Condivisa fra Home e Mese per evitare di duplicare il calcolo.
 */
function getMonthStats(y, m, isNow) {
  const cfg      = getConfig();
  const contract = getUserContract();
  const std      = t2m(cfg.std) || (contract.oreStd * 60);
  const data     = loadData();

  let ggL = 0, str = 0, deb = 0, ferD = 0, malD = 0, permD = 0;
  for (let d = 1; d <= dim(y, m); d++) {
    const r = data[dk(y, m, d)];
    if (!r) continue;
    const o = oreG(r), dl = dltG(r, std);
    if (r.t === 'Lavoro' && o != null) {
      ggL++;
      if (dl > 0) str += dl; else if (dl < 0) deb += dl;
    }
    if (r.t === 'Ferie' || r.t === 'Permesso') ferD++;
    if (r.t === 'Malattia') malD++;
  }
  const totO  = ggL * contract.oreStd * 60;
  const saldo = str + deb;

  const anchor = getLastAnchor(y, m);
  let fS = null, pS = null, hasFP = false;
  if (anchor) {
    const fp  = calcFP(y, m, isNow);
    const cur = fp.months[fp.months.length - 1];
    if (cur) { fS = cur.fS; pS = cur.pS; hasFP = true; }
    else if (fp.months.length === 0) { fS = anchor.fer; pS = anchor.perm; hasFP = true; }
  }

  return { totO, ggL, saldo, str, deb, ferD, malD, permD, fS, pS, hasFP, hasAnchor: !!anchor, std, contract };
}

/**
 * HTML di una singola riga-giorno del registro.
 * Usata sia dal registro mensile (Mese) sia dal recap settimanale (Home).
 * opts.dimOtherMonth: se true, i giorni fuori mese sono attenuati e cliccarli cambia mese.
 */
function renderDayRow({ date, y, m, d, om }, data, std, todayKey, opts = {}) {
  const dimOtherMonth = opts.dimOtherMonth ?? true;
  const we      = isWE(y, m, d);
  const r       = data[dk(y, m, d)];
  const o       = oreG(r);
  const dl      = dltG(r, std);
  const isToday = dk(y, m, d) === todayKey;

  const isAutoHoliday = !we && r?._auto === true && r?.t === 'Festivo';
  const tipo = we ? 'Weekend' : (r?.t || '');

  const badgeMap = { Lavoro:'badge-lavoro', 'Fuori sede':'badge-lavoro', Ferie:'badge-ferie', Festivo:'badge-festivo',
                     Malattia:'badge-malattia', Permesso:'badge-permesso' };
  const badgeCls = badgeMap[tipo] || '';

  const rowClass = [
    'day-row',
    we                                   ? 'weekend'        : '',
    isToday                              ? 'today'          : '',
    (om && dimOtherMonth)                ? 'other-month'    : '',
    isAutoHoliday                        ? 'auto-holiday'   : '',
    r?.t === 'Ferie'      ? 'ferie-row'    : '',
    r?.t === 'Permesso'   ? 'permesso-row' : '',
    r?.t === 'Fuori sede' ? 'fuori-row'    : ''
  ].filter(Boolean).join(' ');

  const dateLabel = (om && dimOtherMonth)
    ? `<span>${d} <span style="color:var(--text-tertiary)">${MI_SHORT[m - 1]}</span></span>`
    : `<strong>${d}</strong> <span style="color:var(--text-tertiary);font-size:.7rem">${DI_SHORT[date.getDay()]}</span>`;

  const timesStr = r?.e ? `${r.e}→${r.u || '?'}` : '';
  const noteStr  = isAutoHoliday ? (r.n || '') : (r?.n || '');

  let absStr = '';
  if (r?.po) absStr += `<span class="c-teal">${parseFloat(r.po).toFixed(2)}h P</span> `;
  if (r?.fo) absStr += `<span class="c-amber">${parseFloat(r.fo).toFixed(2)}h F</span>`;

  const deltaClass = dl == null ? '' : dl > 0 ? 'pos' : dl < 0 ? 'neg' : 'zer';
  const deltaHtml  = dl != null ? `<div class="day-delta ${deltaClass}">${m2t(dl, true)}</div>` : '';

  const clickAttr = we ? ''
    : (om && dimOtherMonth) ? `onclick="cY=${y};cM=${m};showView('mese')"`
                             : `onclick="openModal('${dk(y, m, d)}')"`;

  const autoIcon = isAutoHoliday
    ? `<span class="auto-holiday-icon" title="Festivo nazionale automatico">🇮🇹</span>`
    : '';

  return `
    <div class="${rowClass}" ${clickAttr}>
      <div class="day-date">${dateLabel}</div>
      <div>${tipo && !we ? `<span class="badge ${badgeCls}">${tipo}</span>${autoIcon}` : ''}</div>
      <div class="day-center">
        ${timesStr ? `<div class="day-times">${timesStr}${absStr ? ' · '+absStr : ''}</div>` : (absStr ? `<div class="day-times">${absStr}</div>` : '')}
        ${noteStr  ? `<div class="day-note">${noteStr}</div>` : ''}
      </div>
      <div class="day-right">
        ${o != null ? `<div class="day-hours">${m2t(o)}</div>` : ''}
        ${deltaHtml}
      </div>
    </div>`;
}