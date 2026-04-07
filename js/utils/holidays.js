/* ═══════════════════════════════════════════════════════════════
   js/utils/holidays.js — Festività nazionali italiane
   Calcola automaticamente i festivi per qualsiasi anno,
   incluse le festività mobili (Pasqua e Pasquetta).
   ═══════════════════════════════════════════════════════════════ */

/**
 * Algoritmo di Butcher per il calcolo della Pasqua (Gregoriano).
 * Ritorna { m, d } con mese (1-based) e giorno del mese.
 */
function _easterDate(y) {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return { m: month, d: day };
}

/**
 * Ritorna la mappa dei festivi italiani per l'anno y.
 * Chiave: "YYYY-MM-DD", valore: nome della festività.
 *
 * Festività fisse:
 *   01-01  Capodanno
 *   01-06  Epifania
 *   04-25  Liberazione
 *   05-01  Festa del Lavoro
 *   06-02  Festa della Repubblica
 *   08-15  Ferragosto
 *   11-01  Ognissanti
 *   12-08  Immacolata Concezione
 *   12-25  Natale
 *   12-26  Santo Stefano
 *
 * Festività mobili:
 *   Pasqua     (domenica)
 *   Pasquetta  (lunedì dopo Pasqua)
 */
function getItalianHolidays(y) {
  const holidays = {};

  const add = (m, d, name) => {
    holidays[dk(y, m, d)] = name;
  };

  // ── Festività fisse ───────────────────────────────────────
  add(1,  1,  'Capodanno');
  add(1,  6,  'Epifania');
  add(4,  25, 'Festa della Liberazione');
  add(5,  1,  'Festa del Lavoro');
  add(6,  2,  'Festa della Repubblica');
  add(8,  15, 'Ferragosto');
  add(11, 1,  'Ognissanti');
  add(12, 8,  'Immacolata Concezione');
  add(12, 25, 'Natale');
  add(12, 26, 'Santo Stefano');

  // ── Pasqua e Pasquetta (mobili) ───────────────────────────
  const easter = _easterDate(y);
  add(easter.m, easter.d, 'Pasqua');

  // Pasquetta = giorno dopo Pasqua
  const easterDate    = new Date(y, easter.m - 1, easter.d);
  const pasquettaDate = new Date(easterDate);
  pasquettaDate.setDate(pasquettaDate.getDate() + 1);
  add(pasquettaDate.getMonth() + 1, pasquettaDate.getDate(), 'Pasquetta');

  return holidays;
}

/**
 * Pre-compila nel localStorage tutti i festivi dell'anno y
 * come { t: 'Festivo', n: '<nome festività>', _auto: true }.
 *
 * Regole:
 * - Salta i weekend (sabato/domenica): sono già non-lavorativi
 * - NON sovrascrive giorni già compilati manualmente dall'utente
 *   (= record già presenti nel localStorage senza flag _auto)
 * - I record con _auto: true vengono aggiornati se il nome cambia
 *   (non dovrebbe mai succedere, ma è difensivo)
 */
function seedHolidays(y) {
  const data     = loadData();
  const holidays = getItalianHolidays(y);
  let   changed  = false;

  for (const [key, name] of Object.entries(holidays)) {
    const [ky, km, kd] = key.split('-').map(Number);

    // Salta weekend: l'azienda è già chiusa
    if (isWE(ky, km, kd)) continue;

    const existing = data[key];

    if (!existing) {
      // Giorno vuoto → inserisco il festivo automatico
      data[key] = { t: 'Festivo', n: name, _auto: true };
      changed = true;
    } else if (existing._auto) {
      // Era già un festivo auto → aggiorno solo il nome (difensivo)
      if (existing.n !== name) {
        data[key].n = name;
        changed = true;
      }
    }
    // Se esiste un record senza _auto → l'utente l'ha compilato
    // manualmente, non tocco nulla.
  }

  if (changed) saveData(data);
}

/**
 * Chiama seedHolidays per un range di anni.
 * Di default copre anno corrente ± 1.
 */
function seedHolidaysRange(centerYear, range = 1) {
  for (let y = centerYear - range; y <= centerYear + range; y++) {
    seedHolidays(y);
  }
}