// Comptes de la classe 3 proposés pour classer un article (mêmes codes que le back : services/stockComptes.js).
// `contrepartie` = compte de variation de stock utilisé par la comptabilité pour le groupe.
export const groupesStock = [
  { code: '31', libelle: 'Matières premières et fournitures', contrepartie: '603', comptes: [] },
  { code: '32', libelle: 'Autres approvisionnements', contrepartie: '603', comptes: [
    { code: '321', libelle: 'Matières consommables' },
    { code: '322', libelle: 'Fournitures consommables' },
    { code: '326', libelle: 'Emballages' } ] },
  { code: '33', libelle: 'En cours de production de biens', contrepartie: '713', comptes: [
    { code: '331', libelle: 'Produits en cours' },
    { code: '335', libelle: 'Travaux en cours' } ] },
  { code: '34', libelle: 'En cours de production de services', contrepartie: '713', comptes: [
    { code: '341', libelle: 'Études en cours' },
    { code: '345', libelle: 'Prestations de service en cours' } ] },
  { code: '35', libelle: 'Stocks de produits', contrepartie: '714', comptes: [
    { code: '351', libelle: 'Produits intermédiaires' },
    { code: '355', libelle: 'Produits finis' },
    { code: '358', libelle: 'Produits résiduels ou matières de récupération' } ] },
  { code: '37', libelle: 'Stocks de marchandises', contrepartie: '603', comptes: [] },
  { code: '38', libelle: "Stocks à l'extérieur", contrepartie: '603', comptes: [] }
];

// Liste à plat : { code, libelle, groupe }
export const comptesStock = groupesStock.flatMap(g =>
  g.comptes.length
    ? g.comptes.map(c => ({ ...c, groupe: g.code }))
    : [{ code: g.code, libelle: g.libelle, groupe: g.code }]);

const depuisCategorie = {
  'matière première': '31',
  'fourniture': '322',
  'produit fini': '355',
  'marchandise': '37'
};

// Compte d'un article : celui saisi, sinon déduit de l'ancienne catégorie, sinon '' (à choisir)
export function compteStockArticle(article) {
  const saisi = String(article?.compte_stock || '').trim();
  if (comptesStock.some(c => c.code === saisi)) return saisi;
  return depuisCategorie[String(article?.categorie || '').trim().toLowerCase()] || '';
}

export const groupeDeCompte = code => String(code || '').slice(0, 2);
export const libelleCompte = code => (comptesStock.find(c => c.code === code) || {}).libelle || '';
export const texteCompte = code => (code ? `${code} - ${libelleCompte(code)}` : 'À choisir');
export const groupeStock = code => groupesStock.find(g => g.code === groupeDeCompte(code));
