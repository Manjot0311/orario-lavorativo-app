/* ═══════════════════════════════════════════════════════════════
   js/views/anno.js — Vista annuale
   Modifica qui: griglia mesi, riepilogo FP annuale, statistiche anno
   ═══════════════════════════════════════════════════════════════ */

function renderAnno() {
  const cfg  = getConfig(), std = t2m(cfg.std) || 480, data = loadData();
  const now  = new Date(), isCY = vY === now.getFullYear();
  const el   = document.getElementById('view-anno');

  document.getElementById('header-subtitle').textContent = String(vY);

  // ── Selezione anno ─────────────────────────────────────────
  const years = new Set([2026]);
  Object.keys(data).forEach(k => {
    const y = parseInt(k);
    if (y >= 2020 && y <= 2035) years.add(y);
  });
  const yearBtns = [...years].sort().map(y =>
    `<button class="year-btn${y === vY ? ' active' : ''}" onclick="vY=${y};renderAnno()">${y}</button>`
  ).join('');

  // ── Statistiche annuali ────────────────────────────────────
  let tO = 0, tG = 0, tS = 0, tD = 0;
  for (let mo = 1; mo <= 12; mo++) {
    for (let d = 1; d <= dim(vY, mo); d++) {
      const r  = data[dk(vY, mo, d)];
      if (!r || r.t !== 'Lavoro') continue;
      const o  = oreG(r), dl = dltG(r, std);
      if (o  != null) { tO += o; tG++; }
      if (dl != null) { if (dl > 0) tS += dl; else tD += dl; }
    }
  }
  const saldo = tS + tD;

  const statCards = `
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Ore anno</div>
        <div class="stat-value c-blue">${m2t(tO)}</div>
        <div class="stat-sub">${tG} giorni lavorati</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Saldo netto</div>
        <div class="stat-value ${saldo >= 0 ? 'c-green' : 'c-red'}">${m2t(saldo, true)}</div>
        <div class="stat-sub">${m2t(tS, true)} str. totale</div>
      </div>
    </div>`;

  // ── Griglia mesi ───────────────────────────────────────────
  const monthCards = [];
  for (let mo = 1; mo <= 12; mo++) {
    let mO = 0, g = 0, s = 0, dv = 0, mFerD = 0, mPermD = 0;
    for (let d = 1; d <= dim(vY, mo); d++) {
      const r = data[dk(vY, mo, d)];
      if (!r) continue;
      const o = oreG(r), dl = dltG(r, std);
      if (r.t === 'Lavoro' && o != null) { mO += o; g++; if (dl > 0) s += dl; else if (dl < 0) dv += dl; }
      if (r.t === 'Ferie')   mFerD++;
      if (r.t === 'Permesso') mPermD++;
    }
    const pct      = g > 0 ? Math.min(100, Math.round(mO / (g * std) * 100)) : 0;
    const barColor = pct >= 100 ? 'var(--green)' : pct >= 80 ? 'var(--amber)' : 'var(--red)';
    const mSaldo   = s + dv;

    monthCards.push(`
      <div class="month-card" onclick="cM=${mo};cY=${vY};showView('mese')">
        <h4>${MI[mo - 1]} <span>${g} gg lav.</span></h4>
        <div class="month-row"><span class="k">Ore lavorate</span><span class="v">${m2t(mO)}</span></div>
        <div class="month-row"><span class="k">Saldo ore</span><span class="v ${mSaldo >= 0 ? 'c-green' : 'c-red'}">${m2t(mSaldo, true)}</span></div>
        ${mFerD  > 0 ? `<div class="month-row"><span class="k">Ferie</span><span class="v c-amber">${mFerD} gg</span></div>` : ''}
        ${mPermD > 0 ? `<div class="month-row"><span class="k">Permessi</span><span class="v c-teal">${mPermD} gg</span></div>` : ''}
        <div class="month-bar-track">
          <div class="month-bar-fill" style="width:${pct}%;background:${barColor}"></div>
        </div>
      </div>`);
  }

  // ── Render finale ──────────────────────────────────────────
  el.innerHTML = `
    <div class="year-selector">${yearBtns}</div>
    ${statCards}
    <div class="section-label">Dettaglio mensile — tocca per aprire</div>
    <div class="month-grid">${monthCards.join('')}</div>`;
}