/* js/components/modal.js — Modal modifica giornata
   Modifica qui: campi del form, validazione, salvataggio
   ═══════════════════════════════════════════════════════════════ */

/** Converte input "30" → 0.5h | "1:30" → 1.5h, arrotonda a mezz'ora */
function parsePermInput(raw) {
  if (!raw || raw.trim() === '') return 0;
  raw = raw.trim();
  let totalMinutes;
  if (raw.includes(':')) {
    const [h, m] = raw.split(':').map(s => parseInt(s, 10) || 0);
    totalMinutes = h * 60 + m;
  } else {
    const n = parseInt(raw, 10) || 0;
    totalMinutes = n <= 12 ? n * 60 : n;
  }
  const rounded = Math.round(totalMinutes / 30) * 30;
  return rounded / 60;
}

/** Converte ore decimali in stringa leggibile: 1.5 → "1:30", 0.5 → "30" */
function decimalToHHMM(dec) {
  if (!dec || dec <= 0) return '';
  const totalMin = Math.round(dec * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}`;
}

/** Apre il modal per la data con chiave key (YYYY-MM-DD) */
function openModal(key) {
  eKey = key;
  const data = loadData(), r = data[key] || {};
  const [y, m, d] = key.split('-').map(Number);
  const dw = new Date(y, m - 1, d).getDay();

  document.getElementById('modal-date').textContent = `${DI[dw]}, ${d} ${MI[m - 1]} ${y}`;
  document.getElementById('m-tipo').value  = r.t  || '';
  document.getElementById('m-e').value    = r.e   || '';
  document.getElementById('m-up').value   = r.up  || '';
  document.getElementById('m-rp').value   = r.rp  || '';
  document.getElementById('m-u').value    = r.u   || '';
  document.getElementById('m-note').value = r.n   || '';
  document.getElementById('m-perm').value = decimalToHHMM(r.po);
  document.getElementById('m-fer').value  = '0';

  onTipo();
  document.getElementById('modal-overlay').classList.add('open');
}

/** Mostra/nasconde i campi lavoro in base al tipo selezionato */
function onTipo() {
  const t  = document.getElementById('m-tipo').value;
  const wf = document.getElementById('modal-work-fields');
  const ab = document.getElementById('modal-absence-section');
  const show = t === 'Lavoro';
  wf.style.display = show ? '' : 'none';
  if (ab) ab.style.display = show ? '' : 'none';
}

/** Chiude il modal */
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  eKey = null;
}

/** Salva i dati del giorno correntemente in modifica */
function saveDay() {
  if (!eKey) return;
  const t    = document.getElementById('m-tipo').value;
  const data = loadData();

  if (!t) {
    delete data[eKey];
  } else {
    const r = { t };
    if (t === 'Lavoro') {
      const e  = document.getElementById('m-e').value;
      const up = document.getElementById('m-up').value;
      const rp = document.getElementById('m-rp').value;
      const u  = document.getElementById('m-u').value;
      if (e)  r.e  = e;
      if (up) r.up = up;
      if (rp) r.rp = rp;
      if (u)  r.u  = u;
      const po = parsePermInput(document.getElementById('m-perm').value);
      if (po > 0) r.po = po;
    }
    const n = document.getElementById('m-note').value.trim();
    if (n) r.n = n;
    data[eKey] = r;
  }

  saveData(data);
  closeModal();
  renderAll();
  showToast('Salvato', 'success');
}

/** Elimina la giornata corrente */
function delDay() {
  if (!eKey) return;
  const data = loadData();
  delete data[eKey];
  saveData(data);
  closeModal();
  renderAll();
  showToast('Eliminato');
}

/* ═══════════════════════════════════════════════════════════════ */