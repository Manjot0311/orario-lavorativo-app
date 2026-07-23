/* js/views/ferie.js — Vista ferie & permessi
   Saldo attuale (ferie+permessi in un'unica card a due colonne) in
   evidenza in cima; storico mensile a righe compatte espandibili
   al tocco, per non dover scorrere card intere per ogni mese.
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

  // ── Riepilogo attuale — una card, due colonne ────────────────
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
      <div class="month-card-fp current">
        <div class="month-card-fp-header">
          <span class="month-card-fp-title">Saldo — ${MI[toM - 1]} ${toY}</span>
          <span class="fp-badge">${lbl}</span>
        </div>
        <div class="month-card-fp-body">
          <div class="month-fp-col fer">
            <div class="month-fp-col-title">☀️ Ferie</div>
            <div class="month-fp-row"><span class="k">Residuo A.P.</span><span class="v">${h2display(last.fAP)}</span></div>
            <div class="month-fp-row"><span class="k">Maturato</span><span class="v c-amber">+${h2display(last.fMat)}</span></div>
            <div class="month-fp-row"><span class="k">Goduto</span><span class="v c-red">${last.fG > 0 ? '−' : ''}${h2display(last.fG)}</span></div>
            <div class="month-fp-row total"><span class="k">Saldo</span><span class="v ${fSColor} large">${fSign}${h2display(last.fS)}</span></div>
            <div class="month-fp-row"><span class="k"></span><span class="v ${fSColor}">${fSign}${h2days(last.fS, contract.oreStd)} giorni</span></div>
          </div>
          <div class="month-fp-divider"></div>
          <div class="month-fp-col per">
            <div class="month-fp-col-title">🕐 Permessi</div>
            <div class="month-fp-row"><span class="k">Residuo A.P.</span><span class="v">${h2display(last.pAP)}</span></div>
            <div class="month-fp-row"><span class="k">Maturato</span><span class="v c-teal">+${h2display(last.pMat)}</span></div>
            <div class="month-fp-row"><span class="k">Goduto</span><span class="v c-red">${last.pG > 0 ? '−' : ''}${h2display(last.pG)}</span></div>
            <div class="month-fp-row total"><span class="k">Saldo</span><span class="v ${pSColor} large">${pSign}${h2display(last.pS)}</span></div>
            <div class="month-fp-row"><span class="k"></span><span class="v ${pSColor}">${pSign}${h2days(last.pS, contract.oreStd)} giorni</span></div>
          </div>
        </div>
      </div>`;
  } else {
    summaryHtml = `
      <div class="section-label">Saldo da busta paga</div>
      <div class="month-card-fp current">
        <div class="month-card-fp-header">
          <span class="month-card-fp-title">Busta ${MI[anchor.m - 1]}</span>
        </div>
        <div class="month-card-fp-body">
          <div class="month-fp-col fer">
            <div class="month-fp-col-title">☀️ Ferie</div>
            <div class="month-fp-row total"><span class="k">Saldo</span><span class="v c-amber large">${h2display(anchor.fer)}</span></div>
          </div>
          <div class="month-fp-divider"></div>
          <div class="month-fp-col per">
            <div class="month-fp-col-title">🕐 Permessi</div>
            <div class="month-fp-row total"><span class="k">Saldo</span><span class="v c-teal large">${h2display(anchor.perm)}</span></div>
          </div>
        </div>
      </div>`;
  }

  // ── Storico mensile — righe compatte, espandibili al tocco ──
  // Il mese corrente è già la card "Saldo attuale" sopra: qui va
  // mostrato solo il passato, per non duplicare la stessa info.
  const pastMonths = fp.months.slice(0, -1);

  let storicoHtml = '';
  if (pastMonths.length > 0) {
    const rows = [...pastMonths].reverse().map((mo, idx) => {
      const id      = `fp-hist-${mo.y}-${mo.m}`;
      const fSColor = mo.fS >= 0 ? 'c-amber' : 'c-red';
      const pSColor = mo.pS >= 0 ? 'c-teal'  : 'c-red';
      const fSign   = mo.fS >= 0 ? '+' : '';
      const pSign   = mo.pS >= 0 ? '+' : '';

      return `
        <div class="month-card-fp fp-collapsible" id="${id}">
          <button class="month-card-fp-summary" onclick="toggleFpHistory('${id}')">
            <span class="month-card-fp-title">${MI[mo.m - 1]} ${mo.y}</span>
            <span class="fp-summary-chips">
              <span class="fp-chip ${fSColor}">${fSign}${h2display(mo.fS)}</span>
              <span class="fp-chip ${pSColor}">${pSign}${h2display(mo.pS)}</span>
            </span>
            <svg class="fp-hist-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
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
      <div class="section-label">Storico mensile — tocca un mese per il dettaglio</div>
      <div class="month-list-fp">${rows}</div>`;
  }

  el.innerHTML = `
    ${summaryHtml}
    ${storicoHtml}`;
}

function toggleFpHistory(id) {
  document.getElementById(id)?.classList.toggle('expanded');
}