/* ═══════════════════════════════════════════════════════════════
   js/views/home.js — Home: inserimento rapido + colpo d'occhio
   ═══════════════════════════════════════════════════════════════ */

function renderHome() {
  const contract = getUserContract();
  const data     = loadData();
  const now      = new Date();
  const todayKey = dk(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const el       = document.getElementById('view-home');

  document.getElementById('header-subtitle').textContent = 'Oggi';

  // ── Inserimento rapido ───────────────────────────────────────
  const qbarHtml = `
    <div class="quick-bar">
      <div class="quick-bar-label">
        ${DI[now.getDay()]}, ${now.getDate()} ${MI[now.getMonth()]} ${now.getFullYear()}
      </div>
      <div class="quick-inputs">
        <div class="quick-field"><label>Entrata</label><input type="time" id="q-e"  value="00:00" onchange="qCalcUscita()"></div>
        <div class="quick-field"><label>Usc. Pranzo</label><input type="time" id="q-up" value="00:00" onchange="qCalcRientro()"></div>
        <div class="quick-field"><label>Rient. Pr.</label><input type="time" id="q-rp" value="00:00" onchange="qCalcUscita()"></div>
        <div class="quick-field"><label>Uscita</label><input type="time" id="q-u"  value="00:00"></div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="quickSave()">Salva oggi</button>
    </div>`;

  // ── Sintesi mese corrente — colpo d'occhio ───────────────────
  const cyNow = now.getFullYear(), cmNow = now.getMonth() + 1;
  const stats = getMonthStats(cyNow, cmNow, true);

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

  const summaryHtml = `
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Ore lavorate</div>
        <div class="stat-value c-blue">${mInt(stats.totO)}</div>
        <div class="stat-sub">${stats.ggL} giorni</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Saldo ore</div>
        <div class="stat-value ${stats.saldo >= 0 ? 'c-green' : 'c-red'}">${m2t(stats.saldo, true)}</div>
        <div class="stat-sub">${m2t(stats.str, true)} str. / ${m2t(stats.deb, true)} deb.</div>
      </div>
      ${fpCells}
    </div>`;

  // ── Settimana corrente ────────────────────────────────────────
  const stdMin  = t2m(getConfig().std) || (contract.oreStd * 60);
  const wkDays  = currentWeekDays(now);
  let wDl = 0, wO = 0;
  wkDays.forEach(({ y, m, d }) => {
    const r = data[dk(y, m, d)];
    const o = oreG(r), dl = dltG(r, stdMin);
    if (o != null) { wDl += dl || 0; wO += Math.min(o, stdMin); }
  });
  const { wn: curWn } = isoWk(now);
  const weekDaysHtml = wkDays.map(day => renderDayRow(day, data, stdMin, todayKey, { dimOtherMonth: false })).join('');

  const weekHtml = `
    <div class="week-block">
      <div class="week-header current">
        <div class="week-num">
          <span class="cur-dot"></span>
          Settimana ${curWn}
        </div>
        <div class="week-total">
          ${m2t(wO)} · <span class="${wDl >= 0 ? 'c-green' : 'c-red'}">${m2t(wDl, true)}</span>
        </div>
      </div>
      <div class="day-rows">${weekDaysHtml}</div>
    </div>`;

  el.innerHTML = `
    ${qbarHtml}
    <div class="section-label">Sintesi mese</div>
    ${summaryHtml}
    <div class="section-label">Questa settimana</div>
    ${weekHtml}
    <div class="home-summary-link">
      <a href="#" onclick="event.preventDefault();showView('mese')">Vedi recap completo del mese →</a>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   Quick bar — calcoli automatici (entrata/pranzo/uscita)
   ═══════════════════════════════════════════════════════════════ */

function _qParse(id) {
  const el = document.getElementById(id);
  if (!el || !el.value || el.value === '00:00') return null;
  return t2m(el.value);
}

function _qSet(id, minuti) {
  const el = document.getElementById(id);
  if (!el || minuti == null || minuti < 0) return;
  const clamped = Math.min(minuti, 23 * 60 + 59);
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  el.value = `${hh}:${mm}`;
}

function qCalcUscita() {
  const contract    = getUserContract();
  const pausaMin    = getPausaPranzoMin();
  const stdMin      = Math.round(contract.oreStd * 60);

  const entrata     = _qParse('q-e');
  const uscPranzo   = _qParse('q-up');
  const rientPranzo = _qParse('q-rp');

  if (entrata == null) return;

  let uscita;
  if (rientPranzo != null) {
    const orePrePranzo = (uscPranzo != null && uscPranzo > entrata)
      ? uscPranzo - entrata : 0;
    const oreRimanenti = Math.max(0, stdMin - orePrePranzo);
    uscita = rientPranzo + oreRimanenti;
  } else {
    uscita = entrata + stdMin + pausaMin;
  }

  _qSet('q-u', uscita);
}

function qCalcRientro() {
  const pausaMin  = getPausaPranzoMin();
  const uscPranzo = _qParse('q-up');
  if (uscPranzo == null) return;
  _qSet('q-rp', uscPranzo + pausaMin);
  qCalcUscita();
}