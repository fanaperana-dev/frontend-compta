/**
 * Aperçu du coût d'une recette pendant la saisie (le serveur recalcule et reste la référence).
 * Chaque ingrédient est valorisé au coût moyen (CMUP) de l'article ; sans stock, au dernier prix d'achat.
 */
import { convertir } from './unitesProduction';

const arrondir2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

export function coutUnitaireArticle(a, assujettie) {
  const stock = Number(a.stock_actuel), valeur = Number(a.valeur_stock);
  if (stock > 0 && valeur > 0) return { cout: valeur / stock, source: 'CMUP' };
  const tva = assujettie ? 0 : (Number(a.taux_tva) || 0);
  const dernier = (Number(a.prix_achat_ht) || 0) * (1 + tva / 100) * (1 - (Number(a.remise_pourcent) || 0) / 100);
  if (dernier > 0) return { cout: dernier, source: 'DERNIER_PRIX' };
  return { cout: 0, source: 'SANS_PRIX' };
}

/** @returns {{lignes, matieres, mainOeuvre, total, unitaire}} — lignes[i] : { cout, source, enStock } (null si ligne incomplète) */
export function apercuCout(form, articlesParId, assujettie) {
  const lignes = (form.ingredients || []).map((l) => {
    const a = articlesParId.get(String(l.article_id));
    const q = Number(l.quantite);
    if (!a || !(q > 0)) return null;
    const enStock = convertir(q, l.unite || a.unite, a.unite);
    if (enStock == null) return { cout: 0, source: 'INCOMPATIBLE', enStock: null };
    const { cout, source } = coutUnitaireArticle(a, assujettie);
    return { cout: arrondir2(enStock * cout), source, enStock };
  });
  const matieres = arrondir2(lignes.reduce((s, l) => s + (l ? l.cout : 0), 0));
  const mo = (form.main_oeuvre || []).map((m) => arrondir2((Number(m.nombre_personnes) || 0) * (Number(m.heures) || 0) * (Number(m.taux_horaire) || 0)));
  const mainOeuvre = arrondir2(mo.reduce((s, c) => s + c, 0));
  const total = arrondir2(matieres + mainOeuvre);
  const ref = Number(form.quantite_reference);
  return { lignes, mo, matieres, mainOeuvre, total, unitaire: ref > 0 ? arrondir2(total / ref) : 0 };
}
