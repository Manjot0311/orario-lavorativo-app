/* ═══════════════════════════════════════════════════════════════
   js/views/settings.js — Vista impostazioni
   Card profilo in cima + liste raggruppate in stile iOS sotto.
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

  // Icone — ogni riga ha un'icona in un chip colorato per categoria,
  // convenzione iOS Settings (icona = scorciatoia visiva per il tipo di dato)
  const icoBusta      = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`;
  const icoCalendario = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const icoOrologio   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`;
  const icoSole       = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/><line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/></svg>`;
  const icoOrologioPerm = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7"/><polyline points="12 10 12 13 14 14"/><path d="M9 2h6"/></svg>`;
  const icoPranzo     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 2v9a3 3 0 0 1-3 3"/><path d="M9 2v9a3 3 0 0 0 3 3"/></svg>`;
  const icoDownload   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13"/><polyline points="7 11 12 16 17 11"/><path d="M5 20h14"/></svg>`;
  const icoUpload     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V7"/><polyline points="7 12 12 7 17 12"/><path d="M5 20h14"/></svg>`;
  const icoOff        = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`;
  const icoTrash      = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;
  const icoBriefcase  = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;

  el.innerHTML = `
    <!-- ── Profilo — card in evidenza (solo identità) ──────────── -->
    <div class="settings-section-title" style="padding-left:4px">Il tuo profilo</div>
    <div class="profile-header">
      <button class="profile-edit-btn" onclick="showOnboarding(true)">Modifica</button>
      <div class="profile-icon">${icoBriefcase}</div>
      <div class="profile-name">${profile.nome ? profile.nome : 'Ciao 👋'}</div>
    </div>

    <!-- ── Contratto ────────────────────────────────────────────── -->
    <div class="settings-section">
      <div class="settings-section-title">Contratto</div>
      <div class="ios-list">
        <div class="ios-row">
          <span class="ios-row-icon chip-accent">${icoOrologio}</span>
          <div class="ios-row-info">
            <div class="label">Ore giornaliere</div>
            <div class="desc">Contrattuali</div>
          </div>
          <span class="ios-row-value">${profile.oreStd || 8}h</span>
        </div>
        <div class="ios-row">
          <span class="ios-row-icon chip-amber">${icoSole}</span>
          <div class="ios-row-info">
            <div class="label">Maturazione ferie</div>
            <div class="desc">Ogni mese</div>
          </div>
          <span class="ios-row-value">${profile.ferMese?.toFixed(2) || '—'}h</span>
        </div>
        <div class="ios-row">
          <span class="ios-row-icon chip-teal">${icoOrologioPerm}</span>
          <div class="ios-row-info">
            <div class="label">Maturazione permessi</div>
            <div class="desc">Ogni mese</div>
          </div>
          <span class="ios-row-value">${profile.permMese?.toFixed(2) || '—'}h</span>
        </div>
      </div>
    </div>

    <!-- ── Busta paga ───────────────────────────────────────────── -->
    <div class="settings-section">
      <div class="settings-section-title">Busta paga</div>
      <div class="ios-list">
        <div class="ios-row">
          <span class="ios-row-icon chip-amber">${icoBusta}</span>
          <div class="ios-row-info">
            <div class="label">Ultimo saldo busta</div>
            <div class="desc">${anchorLabel}</div>
          </div>
          <button class="ios-row-action" onclick="_obStep=2;_renderOnboarding(true)">Aggiorna</button>
        </div>
        <div class="ios-row">
          <span class="ios-row-icon chip-amber">${icoCalendario}</span>
          <div class="ios-row-info">
            <div class="label">Pagamento busta</div>
            <div class="desc">Ogni mese il giorno ${profile.bustaGiorno || '—'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Orario di lavoro ─────────────────────────────────────── -->
    <div class="settings-section">
      <div class="settings-section-title">Orario di lavoro</div>
      <div class="ios-list">
        <div class="ios-row">
          <span class="ios-row-icon chip-accent">${icoOrologio}</span>
          <div class="ios-row-info">
            <div class="label">Ore standard giornaliere</div>
            <div class="desc">Usato per calcolo scostamento</div>
          </div>
          <input type="time" id="cfg-std" class="time-input"
            value="${cfg.std}" onchange="saveConfig(); renderAll()">
        </div>
        <div class="ios-row">
          <span class="ios-row-icon chip-accent">${icoPranzo}</span>
          <div class="ios-row-info">
            <div class="label">Pausa pranzo minima</div>
            <div class="desc">Usata per calcolo automatico orari</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <input type="number" id="cfg-pausa-pranzo" class="time-input"
              style="width:56px;text-align:center"
              step="5" min="0" max="120"
              value="${profile.pausaPranzoMin ?? 30}"
              onchange="savePausaPranzo(); renderAll()">
            <span style="font-size:.78rem;color:var(--text-tertiary)">min</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Dati ─────────────────────────────────────────────────── -->
    <div class="settings-section">
      <div class="settings-section-title">Dati</div>
      <div class="ios-list">
        <button class="ios-row ios-row-tap" onclick="exportXLSX()">
          <span class="ios-row-icon chip-green">${icoDownload}</span>
          <div class="ios-row-info"><div class="label link-label">Esporta Excel</div></div>
        </button>
        <label for="imp-file" class="ios-row ios-row-tap" style="cursor:pointer">
          <span class="ios-row-icon chip-green">${icoUpload}</span>
          <div class="ios-row-info"><div class="label link-label">Importa da Excel</div></div>
        </label>
        <input type="file" id="imp-file" style="display:none"
          accept=".xlsx,.xls" onchange="importXLSX(event)">
      </div>
    </div>

    <!-- ── Zona pericolo ────────────────────────────────────────── -->
    <div class="settings-section">
      <div class="settings-section-title">Zona pericolo</div>
      <div class="ios-list">
        <button class="ios-row ios-row-tap" onclick="deactivateLicense()">
          <span class="ios-row-icon chip-red">${icoOff}</span>
          <div class="ios-row-info"><div class="label danger-label">Disattiva dispositivo</div></div>
        </button>
        <button class="ios-row ios-row-tap" onclick="clearAll()">
          <span class="ios-row-icon chip-red">${icoTrash}</span>
          <div class="ios-row-info"><div class="label danger-label">Elimina tutti i dati</div></div>
        </button>
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