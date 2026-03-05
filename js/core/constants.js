/* ═══════════════════════════════════════════════════════════════
   js/core/constants.js — Costanti globali: locale
   La versione app viene letta da version.json (unica fonte di verità).
   ═══════════════════════════════════════════════════════════════ */

// ─── VERSIONE APP (caricata da version.json) ──────────────────
let APP_VERSION = '—';
fetch('./version.json')
  .then(r => r.json())
  .then(({ version }) => { APP_VERSION = version; })
  .catch(() => {});

// ─── LOCALE ───────────────────────────────────────────────────
const DI       = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const DI_SHORT = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const MI       = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MI_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

// ─── CONTRATTO (fallback se profilo non configurato) ──────────
const ORE_GIORNATA = 8;

// ─── HELPERS PROFILO ──────────────────────────────────────────
function getUserContract() {
  const p = loadUserProfile();
  return {
    oreStd:   p.oreStd   || 8,
    ferMese:  p.ferMese  || 13.33333,
    permMese: p.permMese || 7.33333,
  };
}

function getLastAnchor(toY, toM) {
  const p = loadUserProfile();
  const buste = (p.bustePagate || []).slice().sort((a,b) => b.data.localeCompare(a.data));
  for (const b of buste) {
    const [by, bm] = b.data.split('-').map(Number);
    if (by < toY || (by === toY && bm <= toM)) {
      return { ...b, y: by, m: bm };
    }
  }
  return null;
}