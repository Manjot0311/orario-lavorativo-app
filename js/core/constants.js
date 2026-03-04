/* ═══════════════════════════════════════════════════════════════
   js/core/constants.js — Costanti globali: locale
   I valori di contratto ora vengono dal profilo utente (onboarding).
   ═══════════════════════════════════════════════════════════════ */

// ─── VERSIONE APP ─────────────────────────────────────────────
const APP_VERSION = '1.1.0';

// ─── LOCALE ───────────────────────────────────────────────────
const DI       = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const DI_SHORT = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const MI       = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MI_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

// ─── CONTRATTO (fallback se profilo non configurato) ──────────
// Questi valori vengono sovrascritti dinamicamente da getUserContract()
const ORE_GIORNATA = 8;

// ─── HELPERS PROFILO ──────────────────────────────────────────
/** Restituisce i parametri contrattuali dal profilo utente */
function getUserContract() {
  const p = loadUserProfile();
  return {
    oreStd:   p.oreStd   || 8,
    ferMese:  p.ferMese  || 13.33333,
    permMese: p.permMese || 7.33333,
  };
}

/**
 * Trova l'anchor più recente (busta paga) precedente o uguale a (toY, toM).
 * Ritorna { data, fer, perm, y, m } oppure null.
 */
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