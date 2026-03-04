/* ═══════════════════════════════════════════════════════════════
   js/views/ferie.js — Vista ferie & permessi
   Modifica qui: storico mensile FP, saldo progressivo, riepilogo
   ═══════════════════════════════════════════════════════════════ */

function renderFerie() {
  const el  = document.getElementById('view-ferie');
  const now = new Date();

  document.getElementById('header-subtitle').textContent = 'Ferie & Permessi';

  // ── Nessun anchor disponibile ──────────────────────────────
  if (!isOnboardingDone()) {
    el.innerHTML = `
      <div class="fp-empty">
        <p>Completa la configurazione iniziale per vedere ferie e permessi.</p>
        <button class="btn btn-primary" onclick="showOnboarding()">Configura</button>
      </div>`;
    return;
  }

  const anchor = getLastAnchor(now.getFullYear(), now.getMonth() + 1);
  if (!anchor) {
    el.innerHTML = `
      <div class="fp-empty">
        <p>Nessun saldo busta inserito. Aggiungi una busta paga per calcolare ferie e permessi.</p>
        <button class="btn btn-primary" onclick="showOnboarding(true)">Aggiungi busta</button>
      </div>`;
    return;
  }

  // ── Calcolo FP fino ad oggi ────────────────────────────────
  const toY   = now.getFullYear();
  const toM   = now.getMonth() + 1;
  const fp    = calcFP(toY, toM, true);
  const last  = fp.months[fp.months.length - 1];

  // ── Riepilogo attuale ──────────────────────────────────────
  let summaryHtml = '';
  if (last) {
    const lbl = last.partial
      ? `ad oggi ${now.getDate()} ${MI_SHORT[toM - 1]}`
      : 'fine mese';
    summaryHtml = `
      <div class="section-label">Saldo attuale</div>
      <div class="fp-grid">
        ${renderFPCard('fer', lbl, last.fAP, last.fMat, last.fG, last.fS)}
        ${renderFPCard('per', lbl, last.pAP, last.pMat, last.pG, last.pS)}
      </div>`;
  } else {
    // Siamo nel mese dell'anchor o precedente — mostra saldo anchor
    summaryHtml = `
      <div class="section-label">Saldo da busta paga</div>
      <div class="fp-grid">
        ${renderFPCard('fer', `busta ${MI_SHORT[anchor.m - 1]}`, 0, 0, 0, anchor.fer, true)}
        ${renderFPCard('per', `busta ${MI_SHORT[anchor.m - 1]}`, 0, 0, 0, anchor.perm, true)}
      </div>`;
  }

  // ── Storico mensile ────────────────────────────────────────
  let storicoHtml = '';
  if (fp.months.length > 0) {
    const rows = [...fp.months].reverse().map(mo => {
      const isPartial = mo.partial;
      const lbl = isPartial
        ? `ad oggi ${now.getDate()} ${MI_SHORT[mo.m - 1]}`
        : MI_SHORT[mo.m - 1];
      const fSColor = mo.fS >= 0 ? 'c-amber' : 'c-red';
      const pSColor = mo.pS >= 0 ? 'c-teal'  : 'c-red';

      return `
        <div class="month-card">
          <h4>${MI[mo.m - 1]} ${mo.y} <span>${lbl}</span></h4>
          <div class="month-row">
            <span class="k">🌤 Ferie maturate</span>
            <span class="v c-amber">+${hRound(mo.fMat).toFixed(2)}h</span>
          </div>
          <div class="month-row">
            <span class="k">🌤 Ferie godute</span>
            <span class="v c-red">${mo.fG > 0 ? '−' : ''}${hRound(mo.fG).toFixed(2)}h</span>
          </div>
          <div class="month-row">
            <span class="k">🌤 Saldo ferie</span>
            <span class="v ${fSColor}">${hRound(mo.fS).toFixed(2)}h &nbsp;(${(mo.fS / ORE_GIORNATA).toFixed(1)}g)</span>
          </div>
          <div class="month-row">
            <span class="k">🕐 Permessi maturati</span>
            <span class="v c-teal">+${hRound(mo.pMat).toFixed(2)}h</span>
          </div>
          <div class="month-row">
            <span class="k">🕐 Permessi goduti</span>
            <span class="v c-red">${mo.pG > 0 ? '−' : ''}${hRound(mo.pG).toFixed(2)}h</span>
          </div>
          <div class="month-row">
            <span class="k">🕐 Saldo permessi</span>
            <span class="v ${pSColor}">${hRound(mo.pS).toFixed(2)}h &nbsp;(${(mo.pS / ORE_GIORNATA).toFixed(1)}g)</span>
          </div>
        </div>`;
    }).join('');

    storicoHtml = `
      <div class="section-label">Storico mensile</div>
      <div class="month-grid">${rows}</div>`;
  }

  // ── Render finale ──────────────────────────────────────────
  el.innerHTML = `
    ${summaryHtml}
    ${storicoHtml}`;
}