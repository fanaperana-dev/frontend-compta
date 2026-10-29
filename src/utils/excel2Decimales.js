// Exports Excel : tous les montants sont arrondis et affichés avec 2 chiffres après la virgule.
// Les colonnes de comptage (jours, enfants, année, N°...) ne sont pas touchées.
const COLONNE_ENTIERE = /jour|^nb\s|nombre|enfant|ann[ée]e|cong[ée]|absence|^n°$|personnes/i;

/**
 * @param {object} ws  feuille SheetJS
 * @param {object} options
 *   lignesEntete : nombre de premières lignes servant d'en-têtes de colonnes (défaut 1)
 *   tout         : true = tous les nombres de la feuille sont des montants
 */
export function formater2Decimales(ws, { lignesEntete = 1, tout = false } = {}) {
  if (!ws || !ws['!ref']) return ws;
  // XLSX est chargé à la demande par les pages
  const XLSX = require('xlsx');
  const plage = XLSX.utils.decode_range(ws['!ref']);

  const entetes = {};
  for (let c = plage.s.c; c <= plage.e.c; c++) {
    entetes[c] = [];
    for (let r = plage.s.r; r < plage.s.r + lignesEntete; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === 'string') entetes[c].push(cell.v);
    }
  }

  for (let r = plage.s.r + (tout ? 0 : lignesEntete); r <= plage.e.r; r++) {
    for (let c = plage.s.c; c <= plage.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell || cell.t !== 'n') continue;
      if (!tout && entetes[c].some((h) => COLONNE_ENTIERE.test(h.trim()))) continue;
      cell.v = Math.round((cell.v + Number.EPSILON) * 100) / 100;
      cell.z = '#,##0.00';
    }
  }
  return ws;
}
