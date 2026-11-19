/**
 * Détection des articles écrits de plusieurs façons (« bouteille », « Bouteilles », « boutteille »…).
 *
 *  - IDENTIQUE : même désignation après normalisation (casse, accents, ponctuation, pluriel) → refusé.
 *  - PROCHE    : très ressemblante (une faute de frappe, une lettre en trop…) → demande de confirmation.
 * Les nombres comptent : « bouteille 0,5 l » et « bouteille 1,5 l » sont deux articles différents.
 * Les mots courts (moins de 5 lettres) ne sont comparés qu'à l'identique, pour ne pas confondre « vis » et « vin ».
 */

const sansAccents = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

// minuscules, sans accents ni ponctuation, mots au singulier
export function normaliserDesignation(texte) {
  return sansAccents(texte).toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim()
    .split(' ').filter(Boolean)
    .map((m) => (/^\d+$/.test(m) || m.length <= 3 ? m : m.replace(/(?:s|x)$/, '')))
    .join(' ');
}

function distance(a, b) {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]; prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

const chiffres = (s) => (s.match(/\d+/g) || []).join(',');

export function comparer(a, b) {
  const na = normaliserDesignation(a), nb = normaliserDesignation(b);
  if (!na || !nb) return null;
  if (na === nb) return 'IDENTIQUE';
  if (chiffres(na) !== chiffres(nb)) return null;
  const lettresA = na.replace(/[^a-z]/g, ''), lettresB = nb.replace(/[^a-z]/g, '');
  const plusLong = Math.max(lettresA.length, lettresB.length);
  if (plusLong < 5) return null;
  // tolérance : 1 erreur jusqu'à 5 lettres, puis environ un tiers de la longueur
  const tolerance = Math.max(1, Math.floor(plusLong * 0.34));
  return distance(lettresA, lettresB) <= tolerance ? 'PROCHE' : null;
}

// Même règle que le back (services/similitudeArticles.js) : le back reste l'arbitre final.
/** @returns {Array<{article, type}>} IDENTIQUE en premier */
export function trouverSimilaires(designation, articles, { exclureId } = {}) {
  const out = [];
  for (const a of articles || []) {
    if (exclureId && String(a.id) === String(exclureId)) continue;
    const type = comparer(designation, a.designation);
    if (type) out.push({ article: a, type });
  }
  return out.sort((x, y) => (x.type === y.type ? 0 : x.type === 'IDENTIQUE' ? -1 : 1));
}

/** Écriture enregistrée : espaces nettoyés, première lettre en majuscule (le reste est laissé tel quel : sigles, unités…). */
export function nettoyerDesignation(texte) {
  const t = String(texte || '').replace(/\s+/g, ' ').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// ───────────── Familles d'articles (ex. « Contenants » : bouteille, bocal, sac en plastique…) ─────────────
// Une seule écriture par famille : « Contenant », « contenants » et « CONTENANTS » désignent la même famille.
export function nettoyerFamille(texte) {
  return String(texte || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

// Familles déjà utilisées (écriture la plus fréquente de chacune), triées : sert d'aide à l'écriture
export function listerFamilles(articles) {
  const parForme = new Map();
  for (const a of articles || []) {
    const f = nettoyerFamille(a && a.famille);
    if (!f) continue;
    const forme = normaliserDesignation(f);
    if (!parForme.has(forme)) parForme.set(forme, new Map());
    const e = parForme.get(forme);
    e.set(f, (e.get(f) || 0) + 1);
  }
  return [...parForme.values()]
    .map(e => [...e.entries()].sort((x, y) => y[1] - x[1])[0][0])
    .sort((x, y) => x.localeCompare(y, 'fr'));
}

// Famille déjà existante qui s'écrit comme la saisie (sinon null) : on propose de la reprendre
export function familleExistante(saisie, familles) {
  const forme = normaliserDesignation(nettoyerFamille(saisie));
  if (!forme) return null;
  return (familles || []).find(f => normaliserDesignation(f) === forme) || null;
}
