/* ═══════════════════════════════════════════════════════════════
   js/views/mese.js — Vista mensile
   ═══════════════════════════════════════════════════════════════ */

function renderMese() {
  const cfg      = getConfig();
  const contract = getUserContract();
  const std      = t2m(cfg.std) || (contract.oreStd * 60);
  const data     = loadData();
  const now      = new Date();
  const todayKey = dk(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const isNow    = cY === now.getFullYear() && cM === now.getMonth() + 1;
  const el       = document.getElementById('view-mese');

  // Header subtitle: solo mese e anno
  document.getElementById('header-subtitle').textContent = `${MI[cM - 1]} ${cY}`;

  // ── Statistiche mensili ────────────────────────────────────
  let totO = 0, ggL = 0, str = 0, deb = 0, ferD = 0, malD = 0, permD = 0;
  for (let d = 1; d <= dim(cY, cM); d++) {
    const r = data[dk(cY, cM, d)];
    if (!r) continue;
    const o = oreG(r), dl = dltG(r, std);
    if (r.t === 'Lavoro' && o != null) {
      totO += o; ggL++;
      if (dl > 0) str += dl; else if (dl < 0) deb += dl;
    }
    if (r.t === 'Ferie')    ferD++;
    if (r.t === 'Malattia') malD++;
    if (r.t === 'Permesso') permD++;
  }
  const saldo = str + deb;

  // ── Stat cards ─────────────────────────────────────────────
  const absRow = (ferD > 0 || malD > 0 || permD > 0) ? `
    <div class="stat-card" style="grid-column:1/-1">
      <div class="stat-label">Assenze questo mese</div>
      <div style="display:flex;gap:16px;margin-top:4px">
        ${ferD  > 0 ? `<div><span class="stat-value c-amber" style="font-size:.95rem">${ferD}</span> <span class="stat-sub">ferie</span></div>` : ''}
        ${permD > 0 ? `<div><span class="stat-value c-teal"  style="font-size:.95rem">${permD}</span> <span class="stat-sub">permesso</span></div>` : ''}
        ${malD  > 0 ? `<div><span class="stat-value c-red"   style="font-size:.95rem">${malD}</span> <span class="stat-sub">malattia</span></div>` : ''}
      </div>
    </div>` : '';

  const statCards = `
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Ore lavorate</div>
        <div class="stat-value c-blue">${m2t(totO)}</div>
        <div class="stat-sub">${ggL} giorni</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Saldo ore</div>
        <div class="stat-value ${saldo >= 0 ? 'c-green' : 'c-red'}">${m2t(saldo, true)}</div>
        <div class="stat-sub">${m2t(str, true)} str. / ${m2t(deb, true)} deb.</div>
      </div>
      ${absRow}
    </div>`;

  // ── FP Panel ───────────────────────────────────────────────
  let fpHtml = '';
  const anchor = getLastAnchor(cY, cM);
  if (anchor) {
    const fp  = calcFP(cY, cM, isNow);
    const cur = fp.months[fp.months.length - 1];
    if (cur) {
      const lbl = cur.partial
        ? `ad oggi ${now.getDate()} ${MI_SHORT[cM - 1]}`
        : 'fine mese';
      fpHtml = `<div class="fp-stack">
        ${renderFPCard('fer', lbl, cur.fAP, cur.fMat, cur.fG, cur.fS)}
        ${renderFPCard('per', lbl, cur.pAP, cur.pMat, cur.pG, cur.pS)}
      </div>`;
    } else if (fp.months.length === 0) {
      fpHtml = `<div class="fp-stack">
        ${renderFPCard('fer', `busta ${MI_SHORT[anchor.m-1]}`, 0, 0, 0, anchor.fer, true)}
        ${renderFPCard('per', `busta ${MI_SHORT[anchor.m-1]}`, 0, 0, 0, anchor.perm, true)}
      </div>`;
    }
  } else if (isOnboardingDone()) {
    fpHtml = `<div class="fp-empty">
      <p>Nessun saldo busta inserito per questo periodo.</p>
    </div>`;
  }

  // ── Quick bar (solo mese corrente) ─────────────────────────
  const qbarHtml = isNow ? `
    <div class="quick-bar">
      <div class="quick-bar-label">
        Inserimento rapido — ${DI[now.getDay()]}, ${now.getDate()} ${MI[now.getMonth()]} ${now.getFullYear()}
      </div>
      <div class="quick-inputs">
        <div class="quick-field"><label>Entrata</label><input type="time" id="q-e"  value="00:00" onchange="qCalcUscita()"></div>
        <div class="quick-field"><label>Usc. Pranzo</label><input type="time" id="q-up" value="00:00" onchange="qCalcRientro()"></div>
        <div class="quick-field"><label>Rient. Pr.</label><input type="time" id="q-rp" value="00:00" onchange="qCalcUscita()"></div>
        <div class="quick-field"><label>Uscita</label><input type="time" id="q-u"  value="00:00"></div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="quickSave()">Salva oggi</button>
    </div>` : '';

  // ── Settimane ──────────────────────────────────────────────
  const weeks = weeksForMonth(cY, cM);
  const { wn: todayWn, wy: todayWy } = isoWk(now);

  const weeksHtml = weeks.map(wk => {
    const isCur = wk.wn === todayWn && wk.wy === todayWy;
    let wO = 0, wDl = 0;
    wk.days.filter(x => !x.om).forEach(({ y, m, d }) => {
      const r = data[dk(y, m, d)];
      const o = oreG(r), dl = dltG(r, std);
      if (o != null) { wO += o; wDl += dl || 0; }
    });
    const extraMonths = [...new Set(wk.days.filter(x => x.om).map(x => MI_SHORT[x.m - 1]))].join(', ');

    const daysHtml = wk.days.map(({ date, y, m, d, om }) => {
      const we      = isWE(y, m, d);
      const r       = data[dk(y, m, d)];
      const o       = oreG(r);
      const dl      = dltG(r, std);
      const isToday = dk(y, m, d) === todayKey;

      // ── Festivo automatico ─────────────────────────────────
      const isAutoHoliday = !we && r?._auto === true && r?.t === 'Festivo';
      const tipo = we ? 'Weekend' : (r?.t || '');

      const badgeMap = { Lavoro:'badge-lavoro', Ferie:'badge-ferie', Festivo:'badge-festivo',
                         Malattia:'badge-malattia', Permesso:'badge-permesso' };
      const badgeCls = badgeMap[tipo] || '';

      const rowClass = [
        'day-row',
        we            ? 'weekend'        : '',
        isToday       ? 'today'          : '',
        om            ? 'other-month'    : '',
        isAutoHoliday ? 'auto-holiday'   : '',
        r?.t === 'Ferie'    ? 'ferie-row'    : '',
        r?.t === 'Permesso' ? 'permesso-row' : ''
      ].filter(Boolean).join(' ');

      const dateLabel = om
        ? `<span>${d} <span style="color:var(--text-tertiary)">${MI_SHORT[m - 1]}</span></span>`
        : `<strong>${d}</strong> <span style="color:var(--text-tertiary);font-size:.7rem">${DI_SHORT[date.getDay()]}</span>`;

      const timesStr = r?.e ? `${r.e}→${r.u || '?'}` : '';
      // Per i festivi auto, mostriamo il nome della festività come nota
      const noteStr  = isAutoHoliday ? (r.n || '') : (r?.n || '');

      let absStr = '';
      if (r?.po) absStr += `<span class="c-teal">${parseFloat(r.po).toFixed(2)}h P</span> `;
      if (r?.fo) absStr += `<span class="c-amber">${parseFloat(r.fo).toFixed(2)}h F</span>`;

      const deltaClass = dl == null ? '' : dl > 0 ? 'pos' : dl < 0 ? 'neg' : 'zer';
      const deltaHtml  = dl != null ? `<div class="day-delta ${deltaClass}">${m2t(dl, true)}</div>` : '';

      // I festivi automatici sono comunque cliccabili (modificabili)
      const clickAttr = we ? ''
        : om ? `onclick="cY=${y};cM=${m};renderMese()"`
             : `onclick="openModal('${dk(y, m, d)}')"`;

      // Icona festivo automatico
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
    }).join('');

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
    ${qbarHtml}
    ${statCards}
    ${fpHtml}
    <div class="section-label">Registro presenze</div>
    ${weeksHtml}`;
}

/* ═══════════════════════════════════════════════════════════════
   Quick bar — calcoli automatici
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