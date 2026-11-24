// Secteurs d'activité proposés dans les fiches entreprise (liste fermée, sert au minimum de perception de l'impôt).
// ⚠ Même liste et mêmes montants que le back : src/services/impotSynthetique.js. Si l'un change, changer l'autre.
// is  = minimum de perception de l'impôt synthétique (Ar)
// ir  = minimum de l'impôt sur les revenus : fixe + pct × chiffre d'affaires HT
export const SECTEURS_ACTIVITE = [
  { code: 'PRIMAIRE', libelle: 'Secteur primaire / petit exploitant (agriculture, élevage, pêche, petite mine)', is: 16000, ir: { fixe: 500000, pct: 0.01 } },
  { code: 'EXPORT_AGRICOLE', libelle: 'Exportateur de produits agricoles et forestiers', is: 150000, ir: { fixe: 100000, pct: 0 }, aConfirmer: true },
  { code: 'ARTISANAT', libelle: 'Artisanat', is: 50000, ir: { fixe: 500000, pct: 0.01 } },
  { code: 'PETIT_COMMERCE', libelle: 'Petit commerce, gargote', is: 50000, ir: { fixe: 1000000, pct: 0.01 } },
  { code: 'COMMERCE', libelle: 'Commerce (hors petit commerce)', is: 150000, ir: { fixe: 1000000, pct: 0.01 }, aConfirmer: true },
  { code: 'TOURISME_HOTELLERIE', libelle: 'Tourisme, hôtellerie', is: 100000, ir: { fixe: 500000, pct: 0.01 } },
  { code: 'MINES', libelle: 'Exploitation minière (hors petit exploitant)', is: 100000, ir: { fixe: 500000, pct: 0.01 } },
  { code: 'INDUSTRIE', libelle: 'Industrie, transformation', is: 150000, ir: { fixe: 500000, pct: 0.01 }, aConfirmer: true },
  { code: 'SERVICES', libelle: 'Prestataire de services', is: 100000, ir: { fixe: 1000000, pct: 0.01 } },
  { code: 'EDUCATION_SANTE', libelle: 'Éducation, santé', is: 150000, ir: { fixe: 200000, pct: 0 }, aConfirmer: true },
  { code: 'PROFESSION_LIBERALE', libelle: 'Profession libérale', is: 150000, ir: { fixe: 1000000, pct: 0.01 } },
  { code: 'ACTIVITES_MULTIPLES', libelle: 'Activités multiples', is: 150000, ir: { fixe: 1000000, pct: 0.01 } },
  { code: 'AUTRE', libelle: 'Autre activité', is: 150000, ir: { fixe: 1000000, pct: 0.01 } }
];

export const libelleSecteur = code => (SECTEURS_ACTIVITE.find(s => s.code === code) || {}).libelle || '';

const fmt = n => Number(n).toLocaleString('fr-FR');

// Phrase d'aide affichée sous la liste déroulante
export function aideSecteur(code) {
  const s = SECTEURS_ACTIVITE.find(x => x.code === code);
  if (!s) return 'Sert à calculer le minimum de perception de l\'impôt. Sans secteur, ce minimum n\'est pas appliqué.';
  const ir = s.ir.pct > 0 ? `${fmt(s.ir.fixe)} Ar + ${s.ir.pct * 100} % du chiffre d'affaires HT` : `${fmt(s.ir.fixe)} Ar`;
  return `Minimum de perception : ${fmt(s.is)} Ar (impôt synthétique) · ${ir} (impôt sur les revenus).`
    + (s.aConfirmer ? ' Le montant de l\'impôt synthétique pour ce secteur est à confirmer avec l\'expert-comptable.' : '');
}
