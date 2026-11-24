// Salaire minimum d'embauche (SME) et plafond CNaPS / OSTIE selon la période.
// ⚠ Doit rester identique au back : src/services/constantesPaie.js
//  - 300 000 Ar du 1er mars au 30 septembre 2026 · 315 000 Ar depuis le 1er octobre 2026
//  - plafond mensuel de l'assiette = 8 × SME (2 400 000 puis 2 520 000 Ar)
const SME_PAR_PERIODE = [
  { depuis: 202610, sme: 315000 },
  { depuis: 0, sme: 300000 }
];
const NOMS_MOIS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

export function numeroMois(mois) {
  if (typeof mois === 'number' || /^\d{1,2}$/.test(String(mois || '').trim())) {
    const n = Number(mois);
    return n >= 1 && n <= 12 ? n : null;
  }
  const i = NOMS_MOIS.indexOf(String(mois || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  return i >= 0 ? i + 1 : null;
}

// mois : nom ("Octobre") ou numéro (10) ; sans période valide, valeur la plus récente.
export function salaireMinimumEmbauche(mois, annee) {
  const m = numeroMois(mois);
  const a = Number(annee);
  const cle = m && Number.isFinite(a) && a > 0 ? a * 100 + m : Infinity;
  return SME_PAR_PERIODE.find(p => cle >= p.depuis).sme;
}

export const plafondCnapsOstie = (mois, annee) => 8 * salaireMinimumEmbauche(mois, annee);
