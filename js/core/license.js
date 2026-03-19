/* ═══════════════════════════════════════════════════════════════
   js/core/license.js — Sistema di licenza Timely
   ═══════════════════════════════════════════════════════════════ */

const LK = 'timely_license_v1';

/** Ritorna la licenza salvata in localStorage, o null */
function getLicense() {
  try { return JSON.parse(localStorage.getItem(LK)) || null; } catch { return null; }
}

/** Salva la licenza nel localStorage */
function saveLicense(code) {
  localStorage.setItem(LK, JSON.stringify({ code, activatedAt: new Date().toISOString() }));
}

/** Verifica se l'app è attivata */
function isActivated() {
  const lic = getLicense();
  return !!(lic && lic.code);
}

/**
 * Controlla il codice contro licenses.json (nella root del sito).
 * Ritorna { ok: true } oppure { ok: false, reason: '...' }
 */
async function verifyLicense(code) {
  if (!code || code.trim().length < 4) {
    return { ok: false, reason: 'Codice non valido.' };
  }
  try {
    // Aggiunge ?v= per evitare cache del browser
    const res = await fetch(`licenses.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('File non raggiungibile');
    const list = await res.json();
    if (!Array.isArray(list)) throw new Error('Formato non valido');
    const found = list.map(c => c.trim().toUpperCase())
                      .includes(code.trim().toUpperCase());
    if (found) return { ok: true };
    return { ok: false, reason: 'Codice non riconosciuto.' };
  } catch (e) {
    return { ok: false, reason: 'Impossibile verificare il codice. Controlla la connessione.' };
  }
}

/**
 * Mostra la schermata di attivazione.
 * Risolve la Promise solo quando l'attivazione va a buon fine.
 */
function showActivationScreen() {
  return new Promise((resolve) => {

    const overlay = document.createElement('div');
    overlay.id = 'activation-overlay';
    overlay.innerHTML = `
      <div class="act-card">
        <div class="act-logo">
          <img src="assets/web-app-manifest-192x192.png" alt="Timely">
        </div>
        <h1 class="act-title">Timely</h1>
        <p class="act-subtitle">Inserisci il codice di attivazione<br>per iniziare a usare l'app.</p>

        <div class="act-field-wrap">
          <input
            id="act-input"
            class="act-input"
            type="text"
            placeholder="Txxxxx-XXXX-XXXX"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            maxlength="32"
          >
        </div>

        <div id="act-error" class="act-error"></div>

        <button id="act-btn" class="act-btn" onclick="handleActivation()">
          Attiva
        </button>

        <p class="act-help">Hai problemi? Contatta lo sviluppatore.</p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Focus automatico sull'input
    setTimeout(() => {
      const inp = document.getElementById('act-input');
      if (inp) inp.focus();
    }, 300);

    // Enter per confermare
    document.getElementById('act-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleActivation();
    });

    // Formattazione automatica maiuscolo
    document.getElementById('act-input').addEventListener('input', e => {
      const pos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(pos, pos);
    });

    // Funzione globale chiamata dal bottone
    window.handleActivation = async function() {
      const input = document.getElementById('act-input');
      const btn   = document.getElementById('act-btn');
      const err   = document.getElementById('act-error');
      const code  = input.value.trim();

      err.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Verifica in corso…';

      const result = await verifyLicense(code);

      if (result.ok) {
        saveLicense(code);
        overlay.classList.add('act-success');
        btn.textContent = '✓ Attivato!';
        setTimeout(() => {
          overlay.remove();
          delete window.handleActivation;
          resolve();
        }, 900);
      } else {
        err.textContent = result.reason;
        btn.disabled = false;
        btn.textContent = 'Attiva';
        input.classList.add('act-shake');
        setTimeout(() => input.classList.remove('act-shake'), 500);
      }
    };
  });
}