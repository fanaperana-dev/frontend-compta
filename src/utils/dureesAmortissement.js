// Durées d'amortissement linéaire proposées par type de bien (modifiables à la main).
export const TYPES_BIEN = [
  { cle: 'VEHICULE', libelle: 'Véhicule', ans: 5 },
  { cle: 'MOBILIER', libelle: 'Mobilier de bureau', ans: 5 },
  { cle: 'INFORMATIQUE', libelle: 'Matériel informatique', ans: 3 }
];

export const typeBien = (cle) => TYPES_BIEN.find((t) => t.cle === cle) || null;

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const MOTS = {
  VEHICULE: /\b(vehicule|voiture|camion|camionnette|moto|scooter|pick-?up|4x4|fourgon|minibus|tracteur|remorque)\b/,
  INFORMATIQUE: /\b(ordinateur|ordi|pc|laptop|portable|imprimante|serveur|ecran|tablette|photocopieur|scanner|routeur|onduleur|informatique|smartphone|telephone)\b/,
  MOBILIER: /\b(bureau|chaise|fauteuil|table|armoire|etagere|meuble|mobilier|classeur|canape|caisson)\b/
};

/** Type de bien deviné d'après le libellé (« Ordinateur portable » → INFORMATIQUE), '' si aucun mot connu. */
export function devinerTypeBien(libelle) {
  const t = norm(libelle);
  // « bureau » seul est ambigu avec « matériel de bureau » : véhicule et informatique passent d'abord
  for (const cle of ['VEHICULE', 'INFORMATIQUE', 'MOBILIER']) if (MOTS[cle].test(t)) return cle;
  return '';
}

/** Date + n années (n entier ou décimal), au format AAAA-MM-JJ */
export function ajouterAnnees(dateISO, ans) {
  const d = new Date(`${String(dateISO).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCMonth(d.getUTCMonth() + Math.round(Number(ans) * 12));
  return d.toISOString().slice(0, 10);
}
