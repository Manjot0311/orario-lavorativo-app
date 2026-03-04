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

  el.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Profilo contratto</div>
      <div class="settings-card">
        <div class="settings-row">
          <div class="settings-row-info">
            <div class="label">Ore standard / giorno</div>
            <div class="desc">${profile.oreStd || 8}h contrattuali</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="showOnboarding(true)">Modifica</button>
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <div class="label">Maturazione mensile</div>
            <div class="desc">Ferie ${profile.ferMese?.toFixed(2) || '—'}h · Permessi ${profile.permMese?.toFixed(2) || '—'}h</div>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <div class="label">Ultimo saldo busta</div>
            <div class="desc">${anchorLabel}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="_obStep=2;_renderOnboarding(true)">Aggiorna</button>
        </div>
        <div class="settings-row">
          <div class="settings-row-info">
            <div class="label">Busta paga ogni mese il</div>
            <div class="desc">giorno ${profile.bustaGiorno || '—'}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Orario</div>
      <div class="settings-card">
        <div class="settings-row">
          <div class="settings-row-info">
            <div class="label">Ore standard giornaliere</div>
            <div class="desc">Usato per calcolo scostamento</div>
          </div>
          <input type="time" id="cfg-std" class="time-input"
            value="${cfg.std}" onchange="saveConfig(); renderAll()">
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Esporta dati</div>
      <div class="io-grid">
        <button class="btn btn-ghost btn-block" onclick="exportXLSX()">
          ${Icons.download()} Esporta Excel
        </button>
        <button class="btn btn-ghost btn-block" onclick="exportCSV()">
          ${Icons.download()} Esporta CSV
        </button>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Importa dati</div>
      <label for="imp-file" class="btn btn-ghost btn-block" style="cursor:pointer">
        ${Icons.upload()} Importa da Excel
      </label>
      <input type="file" id="imp-file" style="display:none"
        accept=".xlsx,.xls" onchange="importXLSX(event)">
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Zona pericolo</div>
      <div class="settings-card">
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
      presenze · v${APP_VERSION} · dati salvati localmente sul dispositivo
    </div>`;
}