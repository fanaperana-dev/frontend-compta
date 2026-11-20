/**
 * Unités d'une recette (même règles que le serveur : services/unitesProduction.js).
 * On convertit seulement au sein d'une famille : masse (mg, g, kg, t) ou volume (ml, cl, dl, l).
 * Toute autre unité (pièce, pot, sac…) ne se compare qu'à elle-même.
 */
const sansAccents = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

const CONNUES = {
  mg: ['masse', 0.001], g: ['masse', 1], gr: ['masse', 1], gramme: ['masse', 1], kg: ['masse', 1000], kilo: ['masse', 1000], kilogramme: ['masse', 1000], t: ['masse', 1e6], tonne: ['masse', 1e6],
  ml: ['volume', 1], cl: ['volume', 10], dl: ['volume', 100], l: ['volume', 1000], litre: ['volume', 1000],
};

export function formeUnite(unite) {
  let f = sansAccents(unite).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (CONNUES[f]) return f;
  return f.replace(/(?:s|x)$/, '');
}

function infoUnite(unite) {
  const f = formeUnite(unite);
  const c = CONNUES[f];
  return c ? { forme: f, famille: c[0], facteur: c[1] } : { forme: f, famille: null, facteur: 1 };
}

export function unitesCompatibles(a, b) {
  const x = infoUnite(a), y = infoUnite(b);
  if (!x.forme || !y.forme) return false;
  if (x.famille && y.famille) return x.famille === y.famille;
  if (x.famille || y.famille) return false;
  return x.forme === y.forme;
}

/** Convertit de l'unité `de` vers `vers` ; null si incompatibles. */
export function convertir(quantite, de, vers) {
  if (!unitesCompatibles(de, vers)) return null;
  const x = infoUnite(de), y = infoUnite(vers);
  if (!x.famille) return Number(quantite);
  return Number(quantite) * x.facteur / y.facteur;
}

/** Unités proposées pour un article : la sienne d'abord, puis celles de sa famille (g/kg, ml/l). */
export function unitesProposees(uniteArticle) {
  const u = String(uniteArticle || '').trim() || 'pièce';
  const { famille } = infoUnite(u);
  const autres = famille === 'masse' ? ['g', 'kg'] : famille === 'volume' ? ['ml', 'l'] : [];
  return [u, ...autres.filter((x) => infoUnite(x).facteur !== infoUnite(u).facteur)];
}
