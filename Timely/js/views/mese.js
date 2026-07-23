/* ═══════════════════════════════════════════════════════════════
   js/views/mese.js — Vista mensile: recap completo del mese
   L'inserimento rapido vive nella Home; qui c'è solo il registro
   completo (tutte le settimane) più la sintesi del mese.
   ═══════════════════════════════════════════════════════════════ */

function renderMese() {
  const contract = getUserContract();
  const data     = loadData();
  const now      = new Date();
  const todayKey = dk(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const isNow    = cY === now.getFullYear() && cM === now.getMonth() + 1;
  const el       = document.getElementById('view-mese');

  document.getElementById('header-subtitle').textContent = `${MI[cM - 1]} ${cY}`;

  const stats = getMonthStats(cY, cM, isNow);
  const std   = stats.std;

  // ── Sintesi mese — un'unica griglia compatta ─────────────────
  // (il dettaglio completo di ferie/permessi vive nel tab Ferie:
  //  qui serve solo il colpo d'occhio, non la scomposizione riga per riga)
  const absRow = (stats.ferD > 0 || stats.malD > 0 || stats.permD > 0) ? `
    <div class="stat-card" style="grid-column:1/-1">
      <div class="stat-label">Assenze questo mese</div>
      <div style="display:flex;gap:16px;margin-top:4px">
        ${stats.ferD  > 0 ? `<div><span class="stat-value c-amber" style="font-size:.95rem">${stats.ferD}</span> <span class="stat-sub">ferie</span></div>` : ''}
        ${stats.permD > 0 ? `<div><span class="stat-value c-teal"  style="font-size:.95rem">${stats.permD}</span> <span class="stat-sub">permesso</span></div>` : ''}
        ${stats.malD  > 0 ? `<div><span class="stat-value c-red"   style="font-size:.95rem">${stats.malD}</span> <span class="stat-sub">malattia</span></div>` : ''}
      </div>
    </div>` : '';

  const fpCells = stats.hasFP ? `
    <div class="stat-card">
      <div class="stat-label">Ferie</div>
      <div class="stat-value ${stats.fS >= 0 ? 'c-amber' : 'c-red'}">${stats.fS >= 0 ? '+' : ''}${h2display(stats.fS)}</div>
      <div class="stat-sub">${stats.fS >= 0 ? '+' : ''}${h2days(stats.fS, contract.oreStd)} giorni</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Permessi</div>
      <div class="stat-value ${stats.pS >= 0 ? 'c-teal' : 'c-red'}">${stats.pS >= 0 ? '+' : ''}${h2display(stats.pS)}</div>
      <div class="stat-sub">${stats.pS >= 0 ? '+' : ''}${h2days(stats.pS, contract.oreStd)} giorni</div>
    </div>` : '';

  const fpEmptyHtml = (!stats.hasAnchor && isOnboardingDone()) ? `
    <div class="fp-empty" style="margin-top:8px">
      <p>Nessun saldo busta inserito per questo periodo. <a href="#" onclick="event.preventDefault();showView('ferie')" style="color:var(--accent);text-decoration:underline">Aggiungila →</a></p>
    </div>` : '';

  const statCards = `
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Ore lavorate</div>
        <div class="stat-value c-blue">${m2t(stats.totO)}</div>
        <div class="stat-sub">${stats.ggL} giorni</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Saldo ore</div>
        <div class="stat-value ${stats.saldo >= 0 ? 'c-green' : 'c-red'}">${m2t(stats.saldo, true)}</div>
        <div class="stat-sub">${m2t(stats.str, true)} str. / ${m2t(stats.deb, true)} deb.</div>
      </div>
      ${fpCells}
      ${absRow}
    </div>
    ${fpEmptyHtml}`;

  // ── Settimane ──────────────────────────────────────────────
  const weeks = weeksForMonth(cY, cM);
  const { wn: todayWn, wy: todayWy } = isoWk(now);

  const weeksHtml = weeks.map(wk => {
    const isCur = wk.wn === todayWn && wk.wy === todayWy;
    let wDl = 0, wO = 0;
    wk.days.filter(x => !x.om).forEach(({ y, m, d }) => {
      const r = data[dk(y, m, d)];
      const o = oreG(r), dl = dltG(r, std);
      if (o != null) {
        wDl += dl || 0;
        wO  += Math.min(o, std);
      }
    });
    const extraMonths = [...new Set(wk.days.filter(x => x.om).map(x => MI_SHORT[x.m - 1]))].join(', ');

    const daysHtml = wk.days.map(day => renderDayRow(day, data, std, todayKey, { dimOtherMonth: true })).join('');

    return `
      <div class="week-block">
        <div class="week-header${isCur ? ' current' : ''}">
          <div class="week-num">
            ${isCur ? '<span class="cur-dot"></span>' : ''}
            Settimana ${wk.wn}
            ${extraMonths ? `<span class="week-extra-months">+${extraMonths}</span>` : ''}
          </div>
          <div class="week-total">
            ${m2t(wO)} · <span class="${wDl >= 0 ? 'c-green' : 'c-red'}">${m2t(wDl, true)}</span>
          </div>
        </div>
        <div class="day-rows">${daysHtml}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="month-nav">
      <button class="nav-btn" onclick="chMonth(-1)">${Icons.chevronLeft()}</button>
      <h2>${MI[cM - 1]} ${cY}</h2>
      <button class="nav-btn" onclick="chMonth(1)">${Icons.chevronRight()}</button>
    </div>
    ${statCards}
    <div class="section-label">Registro presenze</div>
    ${weeksHtml}`;
}
