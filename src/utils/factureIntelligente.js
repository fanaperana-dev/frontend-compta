// Facture fournisseur « intelligente » : une facture, plusieurs catégories, plusieurs lignes, plusieurs paiements.
// Partie pure (sans écran) : mêmes règles que le back (services/ventilationFournisseur.js).
import { groupesStock, comptesStock } from './comptesStock';

export const arrondi2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
const codeDe = (texte) => String(texte || '').split(' - ')[0].trim();

// Durée d'amortissement proposée (en années) selon le compte ; modifiable ligne par ligne
export const DUREES_PAR_DEFAUT = { '203': 3, '204': 3, '205': 5, '207': 10, '208': 5, '212': 10, '213': 20, '215': 10, '218': 5 };
export const dureeParDefaut = (compte) => DUREES_PAR_DEFAUT[String(compte)] || 5;

/**
 * Nature d'une ligne selon sa catégorie / sous-catégorie.
 * @returns {{nature:'STOCK'|'IMMO'|'CHARGE'|'', compteStock?:string, aPreciser?:boolean, compte?:string}}
 */
export function natureLigne(categorie, sousCategorie) {
  const cat = codeDe(categorie), so = codeDe(sousCategorie);
  if (!cat) return { nature: '' };
  if (cat === '60') {
    if (so === '601') return { nature: 'STOCK', compteStock: '31', compte: so };
    if (so === '602') return { nature: 'STOCK', compteStock: '322', compte: so };
    return { nature: 'CHARGE', compte: so };
  }
  const groupe = groupesStock.find((g) => g.code === cat);
  if (groupe) {
    if (comptesStock.some((c) => c.code === so && c.groupe === groupe.code)) return { nature: 'STOCK', compteStock: so, compte: so };
    if (groupe.comptes.length) return { nature: 'STOCK', compteStock: '', aPreciser: true, compte: so };
    return { nature: 'STOCK', compteStock: groupe.code, compte: groupe.code };
  }
  if (cat === '20' || cat === '21') return { nature: 'IMMO', compte: so };
  return { nature: 'CHARGE', compte: so };
}

export const ligneVide = () => ({ libelle: '', quantite: 1, prix_unitaire: '', montant: '', article_id: '', unite: 'pièce', famille: '', duree_ans: '', confirmer_similaire: false });
export const blocVide = () => ({ categorie: '', sous_categorie: '', lignes: [ligneVide()] });
export const paiementVide = (date = '') => ({ montant: '', date, mode: '' });

// Quantité × prix unitaire ↔ montant de la ligne (TTC)
export function majLigne(ligne, champ, valeur) {
  const l = { ...ligne, [champ]: valeur };
  const q = Number(l.quantite) || 0;
  if (champ === 'prix_unitaire') l.montant = valeur === '' ? '' : arrondi2(q * Number(valeur));
  else if (champ === 'quantite') { if (l.prix_unitaire !== '' && l.prix_unitaire != null) l.montant = arrondi2(q * Number(l.prix_unitaire)); }
  else if (champ === 'montant') l.prix_unitaire = valeur === '' || !(q > 0) ? '' : arrondi2(Number(valeur) / q);
  return l;
}

export const totalLignes = (blocs) =>
  arrondi2(blocs.reduce((s, b) => s + b.lignes.reduce((t, l) => t + (Number(l.montant) || 0), 0), 0));
export const totalPaiements = (paiements) => arrondi2(paiements.reduce((s, p) => s + (Number(p.montant) || 0), 0));

/** Y a-t-il une catégorie « charge » pour recevoir le reste non détaillé ? */
export const aUneChargeSansStock = (blocs) =>
  blocs.some((b) => natureLigne(b.categorie, b.sous_categorie).nature === 'CHARGE');

/** Contrôles affichés en direct. Renvoie la liste des problèmes qui bloquent l'enregistrement. */
export function problemes(form, assujettie) {
  const out = [];
  const montant = Number(form.montant) || 0;
  if (!form.fournisseur) out.push('Choisis le fournisseur.');
  if (!(montant > 0)) out.push('Saisis le montant global de la facture.');
  const total = totalLignes(form.blocs), reste = arrondi2(montant - total);
  if (reste < -0.01) out.push(`Le total des lignes (${total.toLocaleString('fr-FR')} Ar) dépasse le montant de la facture (${montant.toLocaleString('fr-FR')} Ar).`);
  form.blocs.forEach((b, i) => {
    const n = natureLigne(b.categorie, b.sous_categorie);
    const nom = `Bloc ${i + 1}`;
    if (!b.categorie) out.push(`${nom} : choisis la catégorie.`);
    else if (!b.sous_categorie && (n.nature === 'CHARGE' || n.nature === 'IMMO')) out.push(`${nom} : choisis la sous-catégorie.`);
    if (n.aPreciser) out.push(`${nom} : choisis une sous-catégorie de stock précise.`);
    b.lignes.forEach((l, j) => {
      const nl = `${nom}, ligne ${j + 1}`;
      if (!String(l.libelle).trim()) out.push(`${nl} : saisis le libellé.`);
      if (!(Number(l.quantite) > 0)) out.push(`${nl} : la quantité doit être supérieure à 0.`);
      if (!(Number(l.montant) > 0)) out.push(`${nl} : saisis le montant.`);
    });
  });
  if (reste > 0.01 && !aUneChargeSansStock(form.blocs)) {
    out.push(`Il reste ${reste.toLocaleString('fr-FR')} Ar non affectés : ajoute une ligne de charge (frais de transport, autre achat…) pour les ranger.`);
  }
  const paye = totalPaiements(form.paiements);
  if (paye > montant + 0.01) out.push(`Le total des paiements (${paye.toLocaleString('fr-FR')} Ar) dépasse le montant de la facture.`);
  form.paiements.forEach((p, i) => {
    if (!(Number(p.montant) > 0)) return;
    if (!p.mode) out.push(`Paiement ${i + 1} : choisis le mode de paiement.`);
    if (!p.date) out.push(`Paiement ${i + 1} : choisis la date.`);
  });
  return out;
}

/** Article déjà en stock portant exactement ce libellé (sans tenir compte des majuscules/accents) */
const norm = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
export const articleExact = (libelle, articles) => (articles || []).find((a) => a.actif !== false && norm(a.designation) === norm(libelle)) || null;

/** Corps de la requête POST /fournisseurs/intelligente */
export function construirePayload(form, entreprise_id, articles, assujettie) {
  return {
    entreprise_id,
    fournisseur_id: form.fournisseur_id || null,
    fournisseur: form.fournisseur,
    date_facture: form.date_facture,
    date_echeance: form.date_echeance || null,
    commentaire: form.commentaire || '',
    montant: Number(form.montant),
    ...(assujettie ? { montant_tva: Number(form.montant_tva) || 0 } : {}),
    paiements: form.paiements.filter((p) => Number(p.montant) > 0)
      .map((p) => ({ montant: Number(p.montant), date: p.date, mode: p.mode })),
    blocs: form.blocs.map((b) => {
      const n = natureLigne(b.categorie, b.sous_categorie);
      return {
        categorie: b.categorie, sous_categorie: b.sous_categorie,
        lignes: b.lignes.map((l) => {
          const ligne = { libelle: String(l.libelle).trim(), quantite: Number(l.quantite), montant: Number(l.montant) };
          if (n.nature === 'STOCK') {
            const existant = l.article_id ? { id: l.article_id } : articleExact(l.libelle, articles);
            if (existant) ligne.article_id = existant.id;
            else ligne.nouvel_article = { designation: ligne.libelle, unite: l.unite || 'pièce', famille: l.famille || '', confirmer_similaire: !!l.confirmer_similaire };
          }
          if (n.nature === 'IMMO') ligne.duree_ans = Number(l.duree_ans) || dureeParDefaut(n.compte);
          return ligne;
        })
      };
    })
  };
}
