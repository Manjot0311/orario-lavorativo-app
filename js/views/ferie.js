/* js/views/ferie.js — Vista ferie & permessi
   Modifica qui: storico mensile FP, saldo progressivo, riepilogo
   ═══════════════════════════════════════════════════════════════ */

function renderFerie() {
  const el  = document.getElementById('view-ferie');
  const now = new Date();

  document.getElementById('header-subtitle').textContent = 'Ferie & Permessi';

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

  const toY      = now.getFullYear();
  const toM      = now.getMonth() + 1;
  const fp       = calcFP(toY, toM, true);
  const last     = fp.months[fp.months.length - 1];
  const contract = getUserContract();

  // ── Riepilogo attuale ──────────────────────────────────────
  let summaryHtml = '';
  if (last) {
    const lbl     = last.partial
      ? `AD OGGI ${now.getDate()} ${MI_SHORT[toM - 1].toUpperCase()}`
      : 'FINE MESE';
    const fSColor = last.fS >= 0 ? 'c-amber' : 'c-red';
    const pSColor = last.pS >= 0 ? 'c-teal'  : 'c-red';
    const fSign   = last.fS >= 0 ? '+' : '';
    const pSign   = last.pS >= 0 ? '+' : '';

    summaryHtml = `
      <div class="section-label">Saldo attuale</div>
      <div class="fp-summary-card fer">
        <div class="fp-summary-header">
          <div class="fp-summary-title">☀️ Ferie</div>
          <span class="fp-badge">${lbl}</span>
        </div>
        <div class="fp-summary-rows">
          <div class="fp-summary-row">
            <span class="k">Residuo anno prec.</span>
            <span class="v">${h2display(last.fAP)}</span>
          </div>
          <div class="fp-summary-row">
            <span class="k">Maturato</span>
            <span class="v c-amber">+${h2display(last.fMat)}</span>
          </div>
          <div class="fp-summary-row">
            <span class="k">Goduto</span>
            <span class="v c-red">${last.fG > 0 ? '−' : ''}${h2display(last.fG)}</span>
          </div>
          <div class="fp-summary-row total">
            <span class="k">Saldo ore</span>
            <span class="v ${fSColor}">${fSign}${h2display(last.fS)}</span>
          </div>
          <div class="fp-summary-row days">
            <span class="k">Saldo giorni</span>
            <span class="v ${fSColor} large">${fSign}${h2days(last.fS, contract.oreStd)}</span>
          </div>
        </div>
      </div>
      <div class="fp-summary-card per">
        <div class="fp-summary-header">
          <div class="fp-summary-title">🕐 Permessi</div>
          <span class="fp-badge">${lbl}</span>
        </div>
        <div class="fp-summary-rows">
          <div class="fp-summary-row">
            <span class="k">Residuo anno prec.</span>
            <span class="v">${h2display(last.pAP)}</span>
          </div>
          <div class="fp-summary-row">
            <span class="k">Maturato</span>
            <span class="v c-teal">+${h2display(last.pMat)}</span>
          </div>
          <div class="fp-summary-row">
            <span class="k">Goduto</span>
            <span class="v c-red">${last.pG > 0 ? '−' : ''}${h2display(last.pG)}</span>
          </div>
          <div class="fp-summary-row total">
            <span class="k">Saldo ore</span>
            <span class="v ${pSColor}">${pSign}${h2display(last.pS)}</span>
          </div>
          <div class="fp-summary-row days">
            <span class="k">Saldo giorni</span>
            <span class="v ${pSColor} large">${pSign}${h2days(last.pS, contract.oreStd)}</span>
          </div>
        </div>
      </div>`;
  } else {
    summaryHtml = `
      <div class="section-label">Saldo da busta paga</div>
      <div class="fp-summary-card fer">
        <div class="fp-summary-header">
          <div class="fp-summary-title">☀️ Ferie</div>
          <span class="fp-badge">BUSTA ${MI_SHORT[anchor.m - 1].toUpperCase()}</span>
        </div>
        <div class="fp-summary-rows">
          <div class="fp-summary-row days">
            <span class="k">Saldo ore</span>
            <span class="v c-amber large">${h2display(anchor.fer)}</span>
          </div>
        </div>
      </div>
      <div class="fp-summary-card per">
        <div class="fp-summary-header">
          <div class="fp-summary-title">🕐 Permessi</div>
          <span class="fp-badge">BUSTA ${MI_SHORT[anchor.m - 1].toUpperCase()}</span>
        </div>
        <div class="fp-summary-rows">
          <div class="fp-summary-row days">
            <span class="k">Saldo ore</span>
            <span class="v c-teal large">${h2display(anchor.perm)}</span>
          </div>
        </div>
      </div>`;
  }

  // ── Storico mensile ────────────────────────────────────────
  let storicoHtml = '';
  if (fp.months.length > 0) {
    const rows = [...fp.months].reverse().map(mo => {
      const isPartial = mo.partial;
      const lbl       = isPartial
        ? `ad oggi ${now.getDate()} ${MI_SHORT[mo.m - 1]}`
        : MI_SHORT[mo.m - 1];
      const fSColor   = mo.fS >= 0 ? 'c-amber' : 'c-red';
      const pSColor   = mo.pS >= 0 ? 'c-teal'  : 'c-red';
      const fSign     = mo.fS >= 0 ? '+' : '';
      const pSign     = mo.pS >= 0 ? '+' : '';

      return `
        <div class="month-card-fp${isPartial ? ' current' : ''}">
          <div class="month-card-fp-header">
            <span class="month-card-fp-title">${MI[mo.m - 1]} ${mo.y}</span>
            <span class="fp-badge">${lbl}</span>
          </div>
          <div class="month-card-fp-body">
            <div class="month-fp-col fer">
              <div class="month-fp-col-title">☀️ Ferie</div>
              <div class="month-fp-row">
                <span class="k">Maturate</span>
                <span class="v c-amber">+${h2display(mo.fMat)}</span>
              </div>
              <div class="month-fp-row">
                <span class="k">Godute</span>
                <span class="v c-red">${mo.fG > 0 ? '−' : ''}${h2display(mo.fG)}</span>
              </div>
              <div class="month-fp-row total">
                <span class="k">Saldo</span>
                <span class="v ${fSColor}">${fSign}${h2display(mo.fS)} <em>(${h2days(mo.fS, contract.oreStd)})</em></span>
              </div>
            </div>
            <div class="month-fp-divider"></div>
            <div class="month-fp-col per">
              <div class="month-fp-col-title">🕐 Permessi</div>
              <div class="month-fp-row">
                <span class="k">Maturati</span>
                <span class="v c-teal">+${h2display(mo.pMat)}</span>
              </div>
              <div class="month-fp-row">
                <span class="k">Goduti</span>
                <span class="v c-red">${mo.pG > 0 ? '−' : ''}${h2display(mo.pG)}</span>
              </div>
              <div class="month-fp-row total">
                <span class="k">Saldo</span>
                <span class="v ${pSColor}">${pSign}${h2display(mo.pS)} <em>(${h2days(mo.pS, contract.oreStd)})</em></span>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    storicoHtml = `
      <div class="section-label">Storico mensile</div>
      <div class="month-list-fp">${rows}</div>`;
  }

  el.innerHTML = `
    ${summaryHtml}
    ${storicoHtml}`;
}

/* ═══════════════════════════════════════════════════════════════ */