/* ═══════════════════════════════════════════════════════════════
   js/app.js — Controller principale
   ═══════════════════════════════════════════════════════════════ */

let cY, cM;
let vY;
let eKey = null;

// ─── SPLASH SCREEN ────────────────────────────────────────────
function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  splash.classList.add('splash-hide');
  setTimeout(() => splash.remove(), 500);
}

// ─── INIT ─────────────────────────────────────────────────────
async function init() {
  // Controlla licenza PRIMA di tutto
  if (!isActivated()) {
    await new Promise(r => setTimeout(r, 800));
    hideSplash();
    await showActivationScreen();
    location.reload();
    return;
  }

  setTimeout(hideSplash, 1600);
  const { migrated, fromVersion } = migrateIfNeeded();
  initData();

  const now = new Date();
  cY = now.getFullYear();
  cM = now.getMonth() + 1;
  vY = cY;

  // ── Festivi italiani: pre-compila anno corrente ± 1 ────────
  seedHolidaysRange(cY, 1);

  // Onboarding al primo avvio
  if (!isOnboardingDone()) {
    renderAll();
    setTimeout(() => showOnboarding(false), 150);
    return;
  }

  renderAll();

  if (migrated) {
    setTimeout(() => showToast(`Dati migrati — tutto ok ✓`, 'success'), 600);
  }

  // Controlla reminder busta paga
  setTimeout(checkBustaReminder, 800);
}

function renderAll() {
  const active = document.querySelector('.view.active')?.dataset?.view || 'mese';
  if (active === 'mese')     renderMese();
  if (active === 'anno')     renderAnno();
  if (active === 'ferie')    renderFerie();
  if (active === 'settings') renderSettings();
}

// ─── NAVIGAZIONE ──────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelector(`.nav-item[data-target="${name}"]`)?.classList.add('active');

  if (name === 'mese')     renderMese();
  if (name === 'anno')     renderAnno();
  if (name === 'ferie')    renderFerie();
  if (name === 'settings') renderSettings();
}

function chMonth(d) {
  cM += d;
  if (cM > 12) { cM = 1; cY++; }
  if (cM < 1)  { cM = 12; cY--; }
  // Quando si naviga verso un nuovo anno, assicura i festivi ──
  seedHolidaysRange(cY, 1);
  renderMese();
}

function goToday() {
  const n = new Date();
  cY = n.getFullYear(); cM = n.getMonth() + 1;
  showView('mese');
}

// ─── QUICK SAVE ───────────────────────────────────────────────
function quickSave() {
  const now  = new Date();
  const key  = dk(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const data = loadData();
  data[key] = {
    t:  'Lavoro',
    e:  document.getElementById('q-e').value,
    up: document.getElementById('q-up').value,
    rp: document.getElementById('q-rp').value,
    u:  document.getElementById('q-u').value,
  };
  saveData(data);
  cY = now.getFullYear(); cM = now.getMonth() + 1;
  renderAll();
  showToast('Giornata salvata', 'success');
}

// ─── EXPORT CSV ───────────────────────────────────────────────
function exportCSV() {
  const data = loadData(), cfg = getConfig(), std = t2m(cfg.std) || 480;
  let csv = 'Data,Giorno,Tipo,Entrata,Usc.Pranzo,Rient.Pranzo,Uscita,Ore Totali,Scostamento,Ore Permesso,Ore Ferie Parz.,Note\n';
  Object.keys(data).sort().forEach(k => {
    const [y, m, d] = k.split('-').map(Number), r = data[k];
    const o = oreG(r), dl = dltG(r, std);
    csv += [
      k, DI[new Date(y, m - 1, d).getDay()], r.t || '', r.e || '',
      r.up || '', r.rp || '', r.u || '',
      o  != null ? m2t(o)       : '',
      dl != null ? m2t(dl, true): '',
      r.po || '', r.fo || '',
      `"${(r.n || '').replace(/"/g, '""')}"`
    ].join(',') + '\n';
  });
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'presenze.csv';
  a.click();
  showToast('CSV esportato', 'success');
}

// ─── EXPORT XLSX ──────────────────────────────────────────────
function exportXLSX() {
  if (typeof XLSX === 'undefined') { exportCSV(); return; }
  const data = loadData(), cfg = getConfig(), std = t2m(cfg.std) || 480;
  const contract = getUserContract();
  const rows = [['Data','Giorno','Tipo','Entrata','Usc.Pranzo','Rient.Pranzo','Uscita',
    'Ore Totali','Scostamento','Ore Permesso','Ore Ferie Parz.','Note']];
  Object.keys(data).sort().forEach(k => {
    const [y, m, d] = k.split('-').map(Number), r = data[k];
    const o = oreG(r), dl = dltG(r, std);
    rows.push([k, DI[new Date(y, m-1, d).getDay()], r.t||'', r.e||'', r.up||'', r.rp||'', r.u||'',
      o  != null ? m2t(o)       : '',
      dl != null ? m2t(dl, true): '',
      r.po||'', r.fo||'', r.n||'']);
  });
  const wb  = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(rows);
  ws1['!cols'] = [{wch:12},{wch:11},{wch:10},{wch:8},{wch:12},{wch:14},
                  {wch:8},{wch:10},{wch:12},{wch:10},{wch:14},{wch:35}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Presenze');
  XLSX.writeFile(wb, 'presenze.xlsx');
  showToast('Excel esportato', 'success');
}

// ─── IMPORT XLSX ──────────────────────────────────────────────
function importXLSX(ev) {
  if (typeof XLSX === 'undefined') {
    showToast('xlsx.min.js non presente', 'error');
    ev.target.value = '';
    return;
  }
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb   = XLSX.read(e.target.result, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const data = loadData();
      let imp = 0;
      rows.slice(1).forEach(r => {
        const [ds,,t,en,up,rp,u,,,po,fo,n] = r;
        if (!ds || !t) return;
        const key = String(ds).substring(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        const rec = { t };
        if (t === 'Lavoro') {
          if (en) rec.e = String(en); if (up) rec.up = String(up);
          if (rp) rec.rp = String(rp); if (u) rec.u = String(u);
          if (po) rec.po = parseFloat(po); if (fo) rec.fo = parseFloat(fo);
        }
        if (n) rec.n = String(n);
        data[key] = rec; imp++;
      });
      saveData(data); renderAll();
      showToast(`${imp} righe importate`, 'success');
    } catch { showToast('Errore importazione', 'error'); }
  };
  reader.readAsArrayBuffer(file);
  ev.target.value = '';
}

// ─── UPDATE BANNER ────────────────────────────────────────────
function showUpdateBanner(version) {
  const banner = document.getElementById('update-banner');
  if (!banner) return;
  banner.querySelector('.ub-text').innerHTML =
    `<strong>Versione ${version} disponibile</strong> — ricarica per aggiornare l'app.`;
  banner.classList.add('visible');
}

// ─── TOAST ────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast visible' + (type ? ' ' + type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('visible'), 2400);
}

// ─── TASTIERA ─────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ─── AVVIO ────────────────────────────────────────────────────
init();