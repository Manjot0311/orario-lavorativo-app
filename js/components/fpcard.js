/* js/components/fpcard.js — Componente card ferie/permessi
   Usato da: views/mese.js e views/ferie.js
   Modifica qui: layout e contenuto della card FP mensile
   ═══════════════════════════════════════════════════════════════ */

/**
 * Genera l'HTML di una card ferie o permessi.
 * @param {string}  type       — 'fer' | 'per'
 * @param {string}  badge      — testo del badge (es. "fine mese")
 * @param {number}  ap         — residuo anno precedente
 * @param {number}  mat        — maturato nel periodo
 * @param {number}  god        — goduto nel periodo
 * @param {number}  saldo      — saldo finale
 * @param {boolean} isHistoric — se true mostra nota busta paga
 */
function renderFPCard(type, badge, ap, mat, god, saldo, isHistoric = false) {
  const isFer      = type === 'fer';
  const saldoColor = saldo >= 0 ? (isFer ? 'c-amber' : 'c-teal') : 'c-red';
  const matColor   = isFer ? 'c-amber' : 'c-teal';
  const icon       = isFer ? Icons.sun() : Icons.clock();
  const contract   = getUserContract();
  const saldoSign  = saldo >= 0 ? '+' : '';
  const saldoDaysStr = saldoSign + h2days(saldo, contract.oreStd);

  return `
    <div class="fp-card ${type}">
      <div class="fp-card-title">
        ${icon}
        ${isFer ? 'Ferie' : 'Permessi'}
        <span class="fp-badge">${badge}</span>
      </div>
      <div class="fp-stats">
        <div class="fp-stat">
          <span class="v c-muted">${h2display(ap)}</span>
          <span class="k">Res. AP</span>
        </div>
        <div class="fp-stat">
          <span class="v ${matColor}">+${h2display(mat)}</span>
          <span class="k">Maturato</span>
        </div>
        <div class="fp-stat">
          <span class="v c-red">${god > 0 ? '−' : ''}${h2display(god)}</span>
          <span class="k">Goduto</span>
        </div>
        <div class="fp-stat">
          <span class="v ${saldoColor}" style="font-size:1rem">${saldoSign}${h2display(saldo)}</span>
          <span class="k">Saldo ore</span>
        </div>
      </div>
      <div class="fp-saldo-row">
        <span class="label">Saldo giorni</span>
        <span class="value ${saldoColor}">${saldoDaysStr}</span>
      </div>
    </div>`;
}


/* ═══════════════════════════════════════════════════════════════ */