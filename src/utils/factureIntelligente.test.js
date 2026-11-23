import { natureLigne, majLigne, totalLignes, problemes, construirePayload, blocVide, articleExact } from './factureIntelligente';

const base = (over = {}) => ({
  fournisseur: 'Ravo', fournisseur_id: 'f1', date_facture: '2026-11-20', date_echeance: '', commentaire: '', montant: 1000, montant_tva: 0,
  paiements: [], blocs: [{ categorie: '60 - Achats consommés', sous_categorie: '606 - Achats non stockés de matières et fournitures', lignes: [{ libelle: 'Savons', quantite: 40, montant: 600, prix_unitaire: 15 }] }], ...over
});

test('nature des lignes', () => {
  expect(natureLigne('60 - Achats consommés', '601 - Achats stockés - Matières premières').nature).toBe('STOCK');
  expect(natureLigne('60 - Achats consommés', '606 - Achats non stockés').nature).toBe('CHARGE');
  expect(natureLigne('37 - Stocks de marchandises', '').compteStock).toBe('37');
  expect(natureLigne('32 - Autres approvisionnements', '')).toMatchObject({ nature: 'STOCK', aPreciser: true });
  expect(natureLigne('21 - Immobilisations corporelles', '218 - Autres').nature).toBe('IMMO');
});

test('quantité, prix unitaire et montant se recalculent', () => {
  let l = { quantite: 10, prix_unitaire: '', montant: '' };
  l = majLigne(l, 'montant', 100000);
  expect(l.prix_unitaire).toBe(10000);
  l = majLigne(l, 'quantite', 20);
  expect(l.montant).toBe(200000);
  l = majLigne(l, 'prix_unitaire', 40000);
  expect(l.montant).toBe(800000);
});

test('contrôle du total des lignes', () => {
  expect(problemes(base(), false)).toEqual([]);
  const f = base({ montant: 500 });
  expect(problemes(f, false).join()).toMatch(/dépasse le montant/);
  expect(totalLignes(f.blocs)).toBe(600);
});

test('le reste exige une ligne de charge', () => {
  const f = base({ blocs: [{ categorie: '37 - Stocks de marchandises', sous_categorie: '', lignes: [{ libelle: 'Balais', quantite: 1, montant: 100 }] }] });
  expect(problemes(f, false).join()).toMatch(/non affectés/);
});

test('paiements : total plafonné, mode et date obligatoires', () => {
  expect(problemes(base({ paiements: [{ montant: 1200, date: '2026-11-20', mode: 'Espèces' }] }), false).join()).toMatch(/paiements/);
  expect(problemes(base({ paiements: [{ montant: 100, date: '2026-11-20', mode: '' }] }), false).join()).toMatch(/mode de paiement/);
});

test('payload : stock existant, nouvel article, immobilisation', () => {
  const f = base({ blocs: [
    { categorie: '37 - Stocks de marchandises', sous_categorie: '', lignes: [{ libelle: 'balais ', quantite: 10, montant: 400 }, { libelle: 'Brosses', quantite: 20, montant: 100, unite: 'pièce' }] },
    { categorie: '21 - Immobilisations corporelles', sous_categorie: '218 - Autres immobilisations corporelles', lignes: [{ libelle: 'Chaise', quantite: 2, montant: 300 }] }
  ] });
  const p = construirePayload(f, 'E', [{ id: 'A1', designation: 'Balais', actif: true }], false);
  expect(p.blocs[0].lignes[0].article_id).toBe('A1');
  expect(p.blocs[0].lignes[1].nouvel_article.designation).toBe('Brosses');
  expect(p.blocs[1].lignes[0].duree_ans).toBe(5);
  expect(articleExact('BALAIS', [{ id: 'A1', designation: 'Balais' }]).id).toBe('A1');
  expect(blocVide().lignes).toHaveLength(1);
});
