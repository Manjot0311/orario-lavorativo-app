/* js/components/modal.js — Modal modifica giornata
   Modifica qui: campi del form, validazione, salvataggio
   ═══════════════════════════════════════════════════════════════ */

/** Legge i due campi ore+minuti e restituisce ore decimali */
function readPermFields() {
  const h = parseInt(document.getElementById('m-perm-h').value, 10) || 0;
  const m = parseInt(document.getElementById('m-perm-m').value, 10) || 0;
  return (h * 60 + m) / 60;
}

/** Popola i due campi ore+minuti da ore decimali */
function loadPermFields(dec) {
  const totalMin = Math.round((dec || 0) * 60);
  document.getElementById('m-perm-h').value = totalMin > 0 ? Math.floor(totalMin / 60) : '';
  document.getElementById('m-perm-m').value = totalMin > 0 ? totalMin % 60 : '';
}

/** Apre il modal per la data con chiave key (YYYY-MM-DD) */
function openModal(key) {
  eKey = key;
  const data = loadData(), r = data[key] || {};
  const [y, m, d] = key.split('-').map(Number);
  const dw = new Date(y, m - 1, d).getDay();

  // Banner informativo per i festivi automatici
  const modalHeader = document.querySelector('.modal-header');
  const existingBanner = document.getElementById('modal-auto-holiday-banner');
  if (existingBanner) existingBanner.remove();

  if (r._auto && r.t === 'Festivo') {
    const banner = document.createElement('div');
    banner.id = 'modal-auto-holiday-banner';
    banner.style.cssText = `
      background: var(--bg-secondary, #f5f4f0);
      border-left: 3px solid var(--c-festivo, #e07b39);
      border-radius: 6px;
      padding: 8px 12px;
      margin: 0 0 12px 0;
      font-size: .78rem;
      color: var(--text-secondary, #666);
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    banner.innerHTML = `<span>🇮🇹</span><span>Festivo nazionale — <strong>${r.n || 'festività'}</strong>. Modificabile se hai lavorato.</span>`;
    const modalBody = document.querySelector('.modal-body');
    modalBody.insertBefore(banner, modalBody.firstChild);
  }

  document.getElementById('modal-date').textContent = `${DI[dw]}, ${d} ${MI[m - 1]} ${y}`;
  document.getElementById('m-tipo').value  = r.t  || '';
  document.getElementById('m-e').value    = r.e   || '';
  document.getElementById('m-up').value   = r.up  || '';
  document.getElementById('m-rp').value   = r.rp  || '';
  document.getElementById('m-u').value    = r.u   || '';
  // Per i festivi auto, mostriamo il nome della festività nel campo note
  document.getElementById('m-note').value = r.n   || '';
  document.getElementById('m-fer').value  = '0';
  loadPermFields(r.po || 0);

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
  // Rimuovi banner auto-holiday se presente
  const banner = document.getElementById('modal-auto-holiday-banner');
  if (banner) banner.remove();

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
      const po = readPermFields();
      if (po > 0) r.po = po;
    }
    const n = document.getElementById('m-note').value.trim();
    if (n) r.n = n;
    // NON propaghiamo _auto: l'utente ha scelto esplicitamente,
    // quindi questo giorno non è più "automatico"
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

  // Se era un festivo automatico e l'utente lo "elimina",
  // lo ripristiniamo come festivo auto (reset al default)
  const existing = data[eKey];
  if (existing?._auto) {
    // Recupera il nome dal dizionario festivi
    const [y] = eKey.split('-').map(Number);
    const holidays = getItalianHolidays(y);
    if (holidays[eKey]) {
      data[eKey] = { t: 'Festivo', n: holidays[eKey], _auto: true };
      saveData(data);
      closeModal();
      renderAll();
      showToast('Ripristinato a festivo nazionale');
      return;
    }
  }

  delete data[eKey];
  saveData(data);
  closeModal();
  renderAll();
  showToast('Eliminato');
}

/* ═══════════════════════════════════════════════════════════════ */