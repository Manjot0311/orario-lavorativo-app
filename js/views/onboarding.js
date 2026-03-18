/* ═══════════════════════════════════════════════════════════════
   js/views/onboarding.js — Configurazione iniziale e reminder busta
   ═══════════════════════════════════════════════════════════════ */

let _obStep = 1;
const OB_STEPS = 3;

function showOnboarding(fromSettings = false) {
  _obStep = 1;
  _renderOnboarding(fromSettings);
}

function _renderOnboarding(fromSettings = false) {
  document.getElementById('onboarding-overlay').classList.add('open');
  _renderObStep(fromSettings);
}

function closeOnboarding() {
  document.getElementById('onboarding-overlay').classList.remove('open');
}

function _renderObStep(fromSettings = false) {
  const body = document.getElementById('ob-body');
  const prog = document.getElementById('ob-progress');
  prog.innerHTML = Array.from({length: OB_STEPS}, (_, i) =>
    `<div class="ob-dot${i + 1 === _obStep ? ' active' : ''}"></div>`
  ).join('');
  if (_obStep === 1) _obStep1(body, fromSettings);
  if (_obStep === 2) _obStep2(body, fromSettings);
  if (_obStep === 3) _obStep3(body, fromSettings);
}

// ── Step 1: Contratto ─────────────────────────────────────────
function _obStep1(body, fromSettings) {
  const cfg = loadUserProfile();
  body.innerHTML = `
    <div class="ob-icon">📋</div>
    <div class="ob-title">Il tuo contratto</div>
    <div class="ob-desc">Queste info le trovi sul tuo contratto o sulla busta paga. Le usi una volta sola.</div>

    <div class="ob-fields">

      <div class="field-group">
        <label class="field-label">Ore giornaliere contrattuali</label>
        <input type="number" id="ob-ore-std" class="field-input" step="0.5" min="1" max="12"
          value="${cfg.oreStd || 8}" placeholder="8">
        <div class="field-hint">Quante ore lavori in una giornata intera — di solito 8</div>
      </div>

      <div class="ob-section-label">Maturazione mensile — dalla busta paga, voce "Maturato"</div>

      <div class="ob-row-2">
        <div class="field-group">
          <label class="field-label">🌤 Ferie / mese (ore)</label>
          <input type="number" id="ob-fer-mat" class="field-input" step="0.01" min="0"
            value="${cfg.ferMese || ''}" placeholder="13.33">
          <div class="field-hint">Quante ore di ferie guadagni ogni mese — uguale sempre</div>
        </div>
        <div class="field-group">
          <label class="field-label">🕐 Permessi / mese (ore)</label>
          <input type="number" id="ob-perm-mat" class="field-input" step="0.01" min="0"
            value="${cfg.permMese || ''}" placeholder="7.33">
          <div class="field-hint">Quante ore di permesso guadagni ogni mese — uguale sempre</div>
        </div>
      </div>

      <div class="field-group">
        <label class="field-label">Pausa pranzo minima</label>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="number" id="ob-pausa-pranzo" class="field-input" step="5" min="0" max="120"
            value="${cfg.pausaPranzoMin ?? 30}" placeholder="30" style="max-width:100px">
          <span class="field-hint" style="margin-top:0">minuti</span>
        </div>
        <div class="field-hint">Durata minima della pausa pranzo — usata per calcolare l'uscita automatica (es. 30 min)</div>
      </div>

      <div class="field-group">
        <label class="field-label">Giorno di ricezione busta paga</label>
        <input type="number" id="ob-busta-giorno" class="field-input" step="1" min="1" max="31"
          value="${cfg.bustaGiorno || ''}" placeholder="Es. 27">
        <div class="field-hint">Il giorno del mese in cui ricevi la busta — l'app ti ricorderà di aggiornare i saldi</div>
      </div>

    </div>

    <div class="ob-actions">
      <button class="btn btn-primary btn-block" onclick="_obNext1(${fromSettings})">Continua →</button>
      ${fromSettings ? `<button class="btn btn-ghost btn-block" onclick="closeOnboarding()">Annulla</button>` : ''}
    </div>
  `;
}

function _obNext1(fromSettings) {
  const oreStd       = parseFloat(document.getElementById('ob-ore-std').value);
  const ferMese      = parseFloat(document.getElementById('ob-fer-mat').value);
  const permMese     = parseFloat(document.getElementById('ob-perm-mat').value);
  const bustaGiorno  = parseInt(document.getElementById('ob-busta-giorno').value);
  const pausaPranzoMin = parseInt(document.getElementById('ob-pausa-pranzo').value);

  if (!oreStd || oreStd < 1)     return _obError('Inserisci le ore giornaliere');
  if (!ferMese || ferMese < 0)   return _obError('Inserisci le ferie mensili');
  if (!permMese || permMese < 0) return _obError('Inserisci i permessi mensili');
  if (!bustaGiorno || bustaGiorno < 1 || bustaGiorno > 31) return _obError('Inserisci un giorno valido (1–31)');
  if (isNaN(pausaPranzoMin) || pausaPranzoMin < 0) return _obError('Inserisci una pausa pranzo valida (in minuti)');

  const profile = loadUserProfile();
  profile.oreStd        = oreStd;
  profile.ferMese       = ferMese;
  profile.permMese      = permMese;
  profile.bustaGiorno   = bustaGiorno;
  profile.pausaPranzoMin = pausaPranzoMin;
  saveUserProfile(profile);

  _obStep = 2;
  _renderObStep(fromSettings);
}

// ── Step 2: Saldi dalla busta paga ───────────────────────────
function _obStep2(body, fromSettings) {
  const cfg  = loadUserProfile();
  const oggi = new Date();

  // Selettori mese/anno
  const anni  = [];
  for (let y = oggi.getFullYear(); y >= oggi.getFullYear() - 2; y--) anni.push(y);

  const mesiOptions = MI.map((nome, i) =>
    `<option value="${i+1}" ${i === oggi.getMonth() ? 'selected' : ''}>${nome}</option>`
  ).join('');
  const anniOptions = anni.map(y =>
    `<option value="${y}" ${y === oggi.getFullYear() ? 'selected' : ''}>${y}</option>`
  ).join('');

  // Pre-popola se già salvato
  let preM = oggi.getMonth() + 1, preY = oggi.getFullYear();
  if (cfg.bustaSaldoData) {
    const [py, pm] = cfg.bustaSaldoData.split('-').map(Number);
    preM = pm; preY = py;
  }

  body.innerHTML = `
    <div class="ob-icon">🧾</div>
    <div class="ob-title">Saldi dalla busta paga</div>
    <div class="ob-desc">
      Apri l'<strong>ultima busta paga</strong> che hai ricevuto e cerca la sezione
      <strong>"Ferie e Permessi"</strong>. Inserisci i valori alla voce <strong>"Saldo"</strong> o <strong>"Residuo"</strong>
      — sono le ore che ti rimangono a quella data.
    </div>

    <div class="ob-fields">

      <div class="field-group">
        <label class="field-label">A quale mese si riferisce la busta?</label>
        <div class="ob-row-2">
          <select id="ob-busta-mese" class="field-select">
            ${MI.map((nome, i) => `<option value="${i+1}" ${i+1 === preM ? 'selected' : ''}>${nome}</option>`).join('')}
          </select>
          <select id="ob-busta-anno" class="field-select">
            ${anni.map(y => `<option value="${y}" ${y === preY ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
        <div class="field-hint">Es. se hai la busta di Febbraio 2026, seleziona Febbraio 2026</div>
      </div>

      <div class="ob-divider">
        <span>Valori dalla busta — voce "Saldo" o "Residuo"</span>
      </div>

      <div class="ob-row-2">
        <div class="field-group">
          <label class="field-label">🌤 Saldo ferie (ore)</label>
          <input type="number" id="ob-fer-saldo" class="field-input" step="0.01"
            value="${cfg.ferSaldo ?? ''}" placeholder="-4.83">
          <div class="field-hint">Può essere negativo</div>
        </div>
        <div class="field-group">
          <label class="field-label">🕐 Saldo permessi (ore)</label>
          <input type="number" id="ob-perm-saldo" class="field-input" step="0.01"
            value="${cfg.permSaldo ?? ''}" placeholder="194.67">
          <div class="field-hint">Di solito positivo</div>
        </div>
      </div>

    </div>

    <div class="ob-actions">
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" style="flex:0 0 auto" onclick="_obBack()">← Indietro</button>
        <button class="btn btn-primary" style="flex:1" onclick="_obNext2()">Continua →</button>
      </div>
      ${fromSettings ? `<button class="btn btn-ghost btn-block" onclick="closeOnboarding()">Annulla</button>` : ''}
    </div>
  `;
}

function _obNext2() {
  const mese     = parseInt(document.getElementById('ob-busta-mese').value);
  const anno     = parseInt(document.getElementById('ob-busta-anno').value);
  const ferSaldo  = parseFloat(document.getElementById('ob-fer-saldo').value);
  const permSaldo = parseFloat(document.getElementById('ob-perm-saldo').value);

  if (!mese || !anno)      return _obError('Seleziona mese e anno della busta');
  if (isNaN(ferSaldo))     return _obError('Inserisci il saldo ferie');
  if (isNaN(permSaldo))    return _obError('Inserisci il saldo permessi');

  // Costruiamo la data come ultimo giorno del mese selezionato
  const lastDay   = new Date(anno, mese, 0).getDate();
  const bustaData = `${anno}-${String(mese).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;

  const profile = loadUserProfile();
  profile.bustaSaldoData = bustaData;
  profile.ferSaldo       = ferSaldo;
  profile.permSaldo      = permSaldo;
  profile.bustePagate    = profile.bustePagate || [];
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
    <div class="ob-desc">Controlla che tutto sia corretto prima di iniziare.</div>

    <div class="ob-recap">
      <div class="ob-recap-section">Contratto</div>
      <div class="ob-recap-row">
        <span>Ore giornaliere</span>
        <strong>${cfg.oreStd}h</strong>
      </div>
      <div class="ob-recap-row">
        <span>Ferie maturate / mese</span>
        <strong>${cfg.ferMese?.toFixed(2)}h</strong>
      </div>
      <div class="ob-recap-row">
        <span>Permessi maturati / mese</span>
        <strong>${cfg.permMese?.toFixed(2)}h</strong>
      </div>
      <div class="ob-recap-row">
        <span>Busta paga ogni mese il</span>
        <strong>giorno ${cfg.bustaGiorno}</strong>
      </div>
      <div class="ob-recap-row">
        <span>Pausa pranzo minima</span>
        <strong>${cfg.pausaPranzoMin ?? 30} min</strong>
      </div>
      <div class="ob-recap-section">Saldi di partenza — busta ${meseBusta}</div>
      <div class="ob-recap-row">
        <span>Saldo ferie</span>
        <strong>${cfg.ferSaldo?.toFixed(2)}h</strong>
      </div>
      <div class="ob-recap-row">
        <span>Saldo permessi</span>
        <strong>${cfg.permSaldo?.toFixed(2)}h</strong>
      </div>
    </div>

    <div class="ob-actions">
      <button class="btn btn-primary btn-block" onclick="_obComplete()">
        ${fromSettings ? 'Salva e chiudi' : 'Inizia a usare l\'app →'}
      </button>
      <button class="btn btn-ghost btn-block" onclick="_obBack()">← Modifica</button>
    </div>
  `;
}

function _obComplete() {
  const profile = loadUserProfile();
  profile.onboardingDone = true;
  saveUserProfile(profile);
  closeOnboarding();
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

function _obError(msg) { showToast(msg, 'error'); }

// ─── REMINDER BUSTA PAGA ──────────────────────────────────────
function checkBustaReminder() {
  const profile = loadUserProfile();
  if (!profile.onboardingDone) return;
  if (!profile.bustaGiorno)    return;

  const oggi = new Date();
  if (oggi.getDate() !== profile.bustaGiorno) return;

  const y = oggi.getFullYear();
  const m = oggi.getMonth() + 1;
  const meseRif = m === 1 ? 12 : m - 1;
  const annoRif = m === 1 ? y - 1 : y;

  const giaInserita = (profile.bustePagate || []).some(b => {
    const [by, bm] = b.data.split('-').map(Number);
    return by === annoRif && bm === meseRif;
  });

  if (!giaInserita) showBustaReminder(meseRif, annoRif);
}

function showBustaReminder(mese, anno) {
  const banner = document.getElementById('busta-reminder');
  if (!banner) return;
  banner.querySelector('.br-text').innerHTML =
    `<strong>Busta di ${MI[mese-1]} ${anno}</strong> — aggiorna i saldi ferie e permessi.`;
  banner.classList.add('visible');
}

function openBustaUpdate() {
  document.getElementById('busta-reminder')?.classList.remove('visible');
  _obStep = 2;
  _renderOnboarding(true);
}

function dismissBustaReminder() {
  document.getElementById('busta-reminder')?.classList.remove('visible');
}