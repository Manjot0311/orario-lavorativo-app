/* js/core/engine.js — Calcoli business logic
   Usa il profilo utente per ferie/permessi invece di costanti hardcoded.
   ═══════════════════════════════════════════════════════════════ */

/** Arrotonda i minuti alla mezz'ora più vicina (es. 47→30, 48→60) */
function roundToHalfHour(minutes) {
  return Math.round(minutes / 30) * 30;
}

function oreG(r) {
  if (!r || r.t !== 'Lavoro') return null;
  const e = t2m(r.e), up = t2m(r.up), rp = t2m(r.rp), u = t2m(r.u);
  if (e == null || u == null) return null;
  let tot = u - e;
  if (up != null && rp != null) tot -= (rp - up);
  return tot; // minuti esatti, nessun arrotondamento
}

function dltG(r, std) {
  const o = oreG(r);
  if (o == null) return null;
  return o - std; // minuti esatti
}

function godutoMese(y, m, upToDay, data) {
  const contract = getUserContract();
  let fG = 0, pG = 0;
  const lim = upToDay ?? dim(y, m);
  for (let d = 1; d <= lim; d++) {
    const r = data[dk(y, m, d)];
    if (!r) continue;
    if (r.t === 'Ferie')    fG += contract.oreStd;
    if (r.t === 'Permesso') pG += contract.oreStd;
    if (r.t === 'Lavoro') {
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


/* ═══════════════════════════════════════════════════════════════ */