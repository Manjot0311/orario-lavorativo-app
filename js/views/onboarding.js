/* ═══════════════════════════════════════════════════════════════
   js/views/onboarding.js — Configurazione iniziale e reminder busta
   Appare al primo avvio e richiamabile da Impostazioni.
   ═══════════════════════════════════════════════════════════════ */

// ─── STEP STATE ───────────────────────────────────────────────
let _obStep = 1;
const OB_STEPS = 3;

function showOnboarding(fromSettings = false) {
  _obStep = 1;
  _renderOnboarding(fromSettings);
}

function _renderOnboarding(fromSettings = false) {
  const overlay = document.getElementById('onboarding-overlay');
  overlay.classList.add('open');
  _renderObStep(fromSettings);
}

function closeOnboarding() {
  document.getElementById('onboarding-overlay').classList.remove('open');
}

function _renderObStep(fromSettings = false) {
  const body = document.getElementById('ob-body');
  const prog = document.getElementById('ob-progress');

  // Progress dots
  prog.innerHTML = Array.from({length: OB_STEPS}, (_, i) =>
    `<div class="ob-dot${i + 1 === _obStep ? ' active' : ''}"></div>`
  ).join('');

  if (_obStep === 1) _obStep1(body, fromSettings);
  if (_obStep === 2) _obStep2(body);
  if (_obStep === 3) _obStep3(body, fromSettings);
}

// ── Step 1: Contratto ─────────────────────────────────────────
function _obStep1(body, fromSettings) {
  const cfg = loadUserProfile();
  body.innerHTML = `
    <div class="ob-icon">📋</div>
    <div class="ob-title">Il tuo contratto</div>
    <div class="ob-desc">Inserisci i dati del tuo contratto di lavoro. Servono per calcolare correttamente ore e saldi.</div>

    <div class="ob-fields">
      <div class="field-group">
        <label class="field-label">Ore giornaliere contrattuali</label>
        <input type="number" id="ob-ore-std" class="field-input" step="0.5" min="1" max="12"
          value="${cfg.oreStd || 8}" placeholder="8">
        <div class="field-hint">Es. 8 per una giornata standard di 8 ore</div>
      </div>

      <div class="ob-row-2">
        <div class="field-group">
          <label class="field-label">Ferie maturate / mese (ore)</label>
          <input type="number" id="ob-fer-mat" class="field-input" step="0.01" min="0"
            value="${cfg.ferMese || ''}" placeholder="13.33">
          <div class="field-hint">Dalla busta paga — voce "Maturato Ferie"</div>
        </div>
        <div class="field-group">
          <label class="field-label">Permessi maturati / mese (ore)</label>
          <input type="number" id="ob-perm-mat" class="field-input" step="0.01" min="0"
            value="${cfg.permMese || ''}" placeholder="7.33">
          <div class="field-hint">Dalla busta paga — voce "Maturato Permessi"</div>
        </div>
      </div>

      <div class="field-group">
        <label class="field-label">Giorno di ricezione busta paga</label>
        <input type="number" id="ob-busta-giorno" class="field-input" step="1" min="1" max="31"
          value="${cfg.bustaGiorno || ''}" placeholder="Es. 27">
        <div class="field-hint">Il giorno del mese in cui ricevi normalmente la busta paga</div>
      </div>
    </div>

    <button class="btn btn-primary btn-block ob-next-btn" onclick="_obNext1(${fromSettings})">
      Continua →
    </button>
    ${fromSettings ? `<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeOnboarding()">Annulla</button>` : ''}
  `;
}

function _obNext1(fromSettings) {
  const oreStd    = parseFloat(document.getElementById('ob-ore-std').value);
  const ferMese   = parseFloat(document.getElementById('ob-fer-mat').value);
  const permMese  = parseFloat(document.getElementById('ob-perm-mat').value);
  const bustaGiorno = parseInt(document.getElementById('ob-busta-giorno').value);

  if (!oreStd || oreStd < 1)        return _obError('Inserisci le ore giornaliere');
  if (!ferMese || ferMese < 0)      return _obError('Inserisci le ferie mensili');
  if (!permMese || permMese < 0)    return _obError('Inserisci i permessi mensili');
  if (!bustaGiorno || bustaGiorno < 1 || bustaGiorno > 31) return _obError('Inserisci un giorno valido (1-31)');

  const profile = loadUserProfile();
  profile.oreStd     = oreStd;
  profile.ferMese    = ferMese;
  profile.permMese   = permMese;
  profile.bustaGiorno = bustaGiorno;
  saveUserProfile(profile);

  _obStep = 2;
  _renderObStep(fromSettings);
}

// ── Step 2: Saldi dalla busta paga ───────────────────────────
function _obStep2(body) {
  const cfg = loadUserProfile();
  const oggi = new Date();
  const maxDate = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2,'0')}-${String(oggi.getDate()).padStart(2,'0')}`;

  body.innerHTML = `
    <div class="ob-icon">🧾</div>
    <div class="ob-title">Saldi dalla busta paga</div>
    <div class="ob-desc">Inserisci i saldi di ferie e permessi dall'<strong>ultima busta paga</strong> che hai ricevuto. Questi diventano il punto di partenza dei calcoli.</div>

    <div class="ob-fields">
      <div class="field-group">
        <label class="field-label">Data di riferimento della busta</label>
        <input type="date" id="ob-busta-data" class="field-input"
          max="${maxDate}"
          value="${cfg.bustaSaldoData || ''}">
        <div class="field-hint">Il mese a cui si riferisce la busta (es. se è la busta di Febbraio, metti l'ultimo giorno di Febbraio)</div>
      </div>

      <div class="ob-row-2">
        <div class="field-group">
          <label class="field-label">Saldo ferie (ore)</label>
          <input type="number" id="ob-fer-saldo" class="field-input" step="0.01"
            value="${cfg.ferSaldo ?? ''}" placeholder="Es. -4.83">
          <div class="field-hint">Voce "Saldo" o "Residuo" Ferie</div>
        </div>
        <div class="field-group">
          <label class="field-label">Saldo permessi (ore)</label>
          <input type="number" id="ob-perm-saldo" class="field-input" step="0.01"
            value="${cfg.permSaldo ?? ''}" placeholder="Es. 194.67">
          <div class="field-hint">Voce "Saldo" o "Residuo" Permessi</div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-ghost" onclick="_obBack()">← Indietro</button>
      <button class="btn btn-primary" style="flex:1" onclick="_obNext2()">Continua →</button>
    </div>
  `;
}

function _obNext2() {
  const bustaData  = document.getElementById('ob-busta-data').value;
  const ferSaldo   = parseFloat(document.getElementById('ob-fer-saldo').value);
  const permSaldo  = parseFloat(document.getElementById('ob-perm-saldo').value);

  if (!bustaData)                        return _obError('Inserisci la data della busta');
  if (isNaN(ferSaldo))                   return _obError('Inserisci il saldo ferie');
  if (isNaN(permSaldo))                  return _obError('Inserisci il saldo permessi');

  const profile = loadUserProfile();
  profile.bustaSaldoData  = bustaData;
  profile.ferSaldo        = ferSaldo;
  profile.permSaldo       = permSaldo;
  // Segnamo che questa è la "busta ancora" — il primo anchor
  profile.bustePagate     = profile.bustePagate || [];
  // Aggiorna o aggiungi questo mese come anchor
  const existing = profile.bustePagate.findIndex(b => b.data === bustaData);
  const anchor   = { data: bustaData, fer: ferSaldo, perm: permSaldo };
  if (existing >= 0) profile.bustePagate[existing] = anchor;
  else profile.bustePagate.push(anchor);
  profile.bustePagate.sort((a,b) => a.data.localeCompare(b.data));

  saveUserProfile(profile);

  _obStep = 3;
  _renderObStep();
}

// ── Step 3: Riepilogo ─────────────────────────────────────────
function _obStep3(body, fromSettings) {
  const cfg = loadUserProfile();
  const [y, m] = (cfg.bustaSaldoData || '').split('-').map(Number);
  const meseBusta = (m && y) ? `${MI[m-1]} ${y}` : '—';

  body.innerHTML = `
    <div class="ob-icon">✅</div>
    <div class="ob-title">${fromSettings ? 'Configurazione aggiornata' : 'Tutto pronto!'}</div>
    <div class="ob-desc">Ecco il riepilogo della tua configurazione.</div>

    <div class="ob-recap">
      <div class="ob-recap-row">
        <span>Ore giornaliere</span>
        <strong>${cfg.oreStd}h</strong>
      </div>
      <div class="ob-recap-row">
        <span>Ferie mensili</span>
        <strong>${cfg.ferMese?.toFixed(2)}h</strong>
      </div>
      <div class="ob-recap-row">
        <span>Permessi mensili</span>
        <strong>${cfg.permMese?.toFixed(2)}h</strong>
      </div>
      <div class="ob-recap-row">
        <span>Busta di riferimento</span>
        <strong>${meseBusta}</strong>
      </div>
      <div class="ob-recap-row">
        <span>Saldo ferie</span>
        <strong>${cfg.ferSaldo?.toFixed(2)}h</strong>
      </div>
      <div class="ob-recap-row">
        <span>Saldo permessi</span>
        <strong>${cfg.permSaldo?.toFixed(2)}h</strong>
      </div>
      <div class="ob-recap-row">
        <span>Busta in arrivo ogni mese il</span>
        <strong>giorno ${cfg.bustaGiorno}</strong>
      </div>
    </div>

    <button class="btn btn-primary btn-block ob-next-btn" onclick="_obComplete()">
      ${fromSettings ? 'Salva e chiudi' : 'Inizia a usare l\'app →'}
    </button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="_obBack()">← Modifica</button>
  `;
}

function _obComplete() {
  const profile = loadUserProfile();
  profile.onboardingDone = true;
  saveUserProfile(profile);
  closeOnboarding();
  // Aggiorna config orario standard
  const stdH = profile.oreStd || 8;
  const hh = String(Math.floor(stdH)).padStart(2,'0');
  const mm = String(Math.round((stdH % 1) * 60)).padStart(2,'0');
  localStorage.setItem(CK, JSON.stringify({ std: `${hh}:${mm}` }));
  renderAll();
  showToast('Configurazione salvata ✓', 'success');
}

function _obBack() {
  if (_obStep > 1) { _obStep--; _renderObStep(); }
}

function _obError(msg) {
  showToast(msg, 'error');
}

// ─── REMINDER BUSTA PAGA ──────────────────────────────────────
/**
 * Controlla se oggi è il giorno della busta e se non è ancora
 * stata registrata per questo mese. Se sì, mostra il reminder.
 */
function checkBustaReminder() {
  const profile = loadUserProfile();
  if (!profile.onboardingDone) return;
  if (!profile.bustaGiorno)    return;

  const oggi = new Date();
  const giornoOggi = oggi.getDate();
  if (giornoOggi !== profile.bustaGiorno) return;

  // Controlla se questo mese ha già un anchor
  const y = oggi.getFullYear();
  const m = oggi.getMonth() + 1;
  // La busta di questo mese si riferisce al mese precedente
  const meseRif = m === 1 ? 12 : m - 1;
  const annoRif = m === 1 ? y - 1 : y;
  const dataRif = `${annoRif}-${String(meseRif).padStart(2,'0')}-01`;

  const giaInserita = (profile.bustePagate || []).some(b => {
    const [by, bm] = b.data.split('-').map(Number);
    return by === annoRif && bm === meseRif;
  });

  if (!giaInserita) {
    showBustaReminder(meseRif, annoRif);
  }
}

function showBustaReminder(mese, anno) {
  const banner = document.getElementById('busta-reminder');
  if (!banner) return;
  banner.querySelector('.br-text').innerHTML =
    `<strong>Hai ricevuto la busta di ${MI[mese-1]} ${anno}?</strong> Aggiorna i saldi ferie e permessi.`;
  banner.classList.add('visible');
}

function openBustaUpdate() {
  document.getElementById('busta-reminder')?.classList.remove('visible');
  // Vai direttamente allo step 2 dell'onboarding (inserimento saldi)
  _obStep = 2;
  _renderOnboarding(true);
}

function dismissBustaReminder() {
  document.getElementById('busta-reminder')?.classList.remove('visible');
}