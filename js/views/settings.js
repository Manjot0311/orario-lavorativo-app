/* ═══════════════════════════════════════════════════════════════
   js/views/settings.js — Vista impostazioni
   ═══════════════════════════════════════════════════════════════ */

function renderSettings() {
  const cfg     = getConfig();
  const profile = loadUserProfile();
  const el      = document.getElementById('view-settings');

  document.getElementById('header-subtitle').textContent = 'Impostazioni';

  const anchor = getLastAnchor(9999, 12);
  const [ay, am] = anchor ? anchor.data.split('-').map(Number) : [null, null];
  const anchorLabel = anchor
    ? `Busta di ${MI[am-1]} ${ay} — ferie ${anchor.fer?.toFixed(2)}h, permessi ${anchor.perm?.toFixed(2)}h`
    : 'Nessuna busta inserita';

  // Piccole icone circolari che anticipano ogni riga — rendono la
  // lista scansionabile senza dover leggere ogni etichetta per intero.
  const icoContratto = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>`;
  const icoMatura     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>`;
  const icoBusta      = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`;
  const icoCalendario = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const icoOrologio   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`;
  const icoPranzo      = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 2v9a3 3 0 0 1-3 3"/><path d="M9 2v9a3 3 0 0 0 3 3"/></svg>`;

  el.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Contratto</div>
      <div class="settings-card">
        <div class="settings-row">
          <span class="settings-row-icon">${icoContratto}</span>
          <div class="settings-row-info">
            <div class="label">Ore standard / giorno</div>
            <div class="desc">${profile.oreStd || 8}h contrattuali</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="showOnboarding(true)">Modifica</button>
        </div>
        <div class="settings-row">
          <span class="settings-row-icon">${icoMatura}</span>
          <div class="settings-row-info">
            <div class="label">Maturazione mensile</div>
            <div class="desc">Ferie ${profile.ferMese?.toFixed(2) || '—'}h · Permessi ${profile.permMese?.toFixed(2) || '—'}h</div>
          </div>
        </div>
        <div class="settings-row">
          <span class="settings-row-icon">${icoBusta}</span>
          <div class="settings-row-info">
            <div class="label">Ultimo saldo busta</div>
            <div class="desc">${anchorLabel}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="_obStep=2;_renderOnboarding(true)">Aggiorna</button>
        </div>
        <div class="settings-row">
          <span class="settings-row-icon">${icoCalendario}</span>
          <div class="settings-row-info">
            <div class="label">Busta paga ogni mese il</div>
            <div class="desc">giorno ${profile.bustaGiorno || '—'}</div>
          </div>
        </div>
        <div class="settings-row">
          <span class="settings-row-icon">${icoOrologio}</span>
          <div class="settings-row-info">
            <div class="label">Ore standard giornaliere</div>
            <div class="desc">Usato per calcolo scostamento</div>
          </div>
          <input type="time" id="cfg-std" class="time-input"
            value="${cfg.std}" onchange="saveConfig(); renderAll()">
        </div>
        <div class="settings-row">
          <span class="settings-row-icon">${icoPranzo}</span>
          <div class="settings-row-info">
            <div class="label">Pausa pranzo minima</div>
            <div class="desc">Usata per calcolo automatico orari</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <input type="number" id="cfg-pausa-pranzo" class="time-input"
              style="width:64px;text-align:center"
              step="5" min="0" max="120"
              value="${profile.pausaPranzoMin ?? 30}"
              onchange="savePausaPranzo(); renderAll()">
            <span style="font-size:.8rem;color:var(--text-secondary)">min</span>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Dati</div>
      <div class="io-grid">
        <button class="btn btn-ghost btn-block" onclick="exportXLSX()">
          ${Icons.download()} Esporta Excel
        </button>
        <label for="imp-file" class="btn btn-ghost btn-block" style="cursor:pointer">
          ${Icons.upload()} Importa da Excel
        </label>
        <input type="file" id="imp-file" style="display:none"
          accept=".xlsx,.xls" onchange="importXLSX(event)">
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Zona pericolo</div>
      <div class="settings-card settings-card-danger">
        <div class="settings-row">
          <div class="settings-row-info">
            <div class="label">Disattiva dispositivo</div>
            <div class="desc">Rimuove la licenza da questo dispositivo</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="deactivateLicense()">Disattiva</button>
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <div class="label">Elimina tutti i dati</div>
            <div class="desc">Cancella tutto e riparte dall'onboarding</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="clearAll()">Elimina</button>
        </div>
      </div>
    </div>

    <div class="settings-footer">
      Timely · Dati salvati localmente sul dispositivo
    </div>`;
}

function savePausaPranzo() {
  const el  = document.getElementById('cfg-pausa-pranzo');
  const val = el ? parseInt(el.value) : 30;
  if (isNaN(val) || val < 0) return;
  const profile = loadUserProfile();
  profile.pausaPranzoMin = val;
  saveUserProfile(profile);
}