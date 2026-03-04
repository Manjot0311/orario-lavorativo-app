/* ═══════════════════════════════════════════════════════════════
   js/core/storage.js — Accesso al localStorage
   ═══════════════════════════════════════════════════════════════ */

const DATA_VERSION = 6;
const SK     = `pres_v${DATA_VERSION}`;
const CK     = `cfg_v${DATA_VERSION}`;
const VK     = 'presenze_data_version';
const BK_PRE = 'presenze_backup_v';
const PK     = 'presenze_profile';

const OLD_KEYS = [
  { sk: 'pres_v5', ck: 'cfg_v5', v: 5 },
  { sk: 'pres_v4', ck: 'cfg_v4', v: 4 },
  { sk: 'pres_v3', ck: 'cfg_v3', v: 3 },
];

function loadData()   { try { return JSON.parse(localStorage.getItem(SK))  || {}; } catch { return {}; } }
function saveData(d)  { localStorage.setItem(SK, JSON.stringify(d)); }
function loadConfig() { try { return JSON.parse(localStorage.getItem(CK)) || {}; } catch { return {}; } }
function getConfig()  { return { std: loadConfig().std || '08:00' }; }

function saveConfig() {
  const el  = document.getElementById('cfg-std');
  const val = (el && el.value) ? el.value : '08:00';
  localStorage.setItem(CK, JSON.stringify({ std: val }));
}

function loadUserProfile() {
  try { return JSON.parse(localStorage.getItem(PK)) || {}; } catch { return {}; }
}
function saveUserProfile(p) { localStorage.setItem(PK, JSON.stringify(p)); }
function isOnboardingDone() { return !!loadUserProfile().onboardingDone; }

function backupData(fromVersion, data, config) {
  try {
    localStorage.setItem(BK_PRE + fromVersion, JSON.stringify({
      timestamp: new Date().toISOString(), fromVersion, data, config
    }));
  } catch(e) { console.warn('Backup fallito:', e); }
}

function migrateIfNeeded() {
  const savedVersion = parseInt(localStorage.getItem(VK) || '0', 10);
  if (savedVersion === DATA_VERSION && localStorage.getItem(SK)) {
    return { migrated: false, fromVersion: null };
  }
  for (const old of OLD_KEYS) {
    const raw = localStorage.getItem(old.sk);
    if (!raw) continue;
    let oldData = {};
    try { oldData = JSON.parse(raw) || {}; } catch { continue; }
    const oldConfig = (() => { try { return JSON.parse(localStorage.getItem(old.ck)) || {}; } catch { return {}; } })();
    backupData(old.v, oldData, oldConfig);
    const existing = loadData();
    saveData({ ...oldData, ...existing });
    if (!localStorage.getItem(CK) && oldConfig.std) {
      localStorage.setItem(CK, JSON.stringify({ std: oldConfig.std }));
    }
    localStorage.setItem(VK, String(DATA_VERSION));
    console.info(`[Presenze] Migrazione v${old.v} → v${DATA_VERSION} completata.`);
    return { migrated: true, fromVersion: old.v };
  }
  localStorage.setItem(VK, String(DATA_VERSION));
  return { migrated: false, fromVersion: null };
}

// Nessun SEED — nuovi utenti partono da zero
function initData() {}

function clearAll() {
  if (!confirm('Sei sicuro? Tutti i dati verranno eliminati definitivamente.')) return;
  localStorage.removeItem(SK);
  localStorage.removeItem(PK);
  localStorage.removeItem(CK);
  localStorage.removeItem(VK);
  location.reload();
}