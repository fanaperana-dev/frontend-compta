// Catégories comptables proposées pour classer une facture (catégorie → sous-catégories)
export const categoriesEtSousCategories = {
  '70 - Ventes de produits fabriqués, marchandises, prestations': [
    '701 - Ventes de produits finis',
    '702 - Ventes de produits intermédiaires',
    '703 - Ventes de produits résiduels',
    '704 - Vente de travaux',
    '705 - Vente d\'études',
    '706 - Vente de prestations de service',
    '707 - Ventes de marchandises',
    '708 - Produits des activités annexes',
    '709 - Rabais, remises et ristournes accordés'
  ],
  '71 - Production stockée (ou déstockage)': [
    '713 - Variation de stocks d\'en-cours',
    '714 - Variation de stocks de produits'
  ],
  '72 - Production immobilisée': [
    '721 - Production immobilisée d\'actif incorporel',
    '722 - Production immobilisée d\'actif corporel'
  ],
  '74 - Subventions d\'exploitation': [
    '741 - Subvention d\'équilibre',
    '748 - Autres subventions d\'exploitation'
  ],
  '75 - Autres produits opérationnels': [
    '751 - Redevances pour concessions, brevets, licences, logiciels',
    '752 - Plus-values sur cessions d\'actifs non courants',
    '753 - Jetons de présence et rémunérations d\'administrateurs',
    '754 - Quotes-parts de subventions d\'investissement virées au résultat',
    '755 - Quote-part de résultat sur opérations faites en commun',
    '756 - Libéralités perçues, rentrées sur créances amorties',
    '757 - Produits exceptionnels sur opérations de gestion',
    '758 - Autres produits de gestion courante'
  ],
  '76 - Produits financiers': [
    '761 - Produits de participations',
    '762 - Produits des autres immobilisations financières',
    '763 - Revenus des autres créances',
    '764 - Revenus et plus-values des valeurs mobilières de placement',
    '766 - Gains de change',
    '767 - Produits nets sur cessions de valeurs mobilières de placement',
    '768 - Autres produits financiers'
  ],
  '77 - Eléments extraordinaires (produits)': [],
  '78 - Reprises sur provisions et pertes de valeur': [
    '781 - Reprise d\'exploitation - actifs non courants',
    '785 - Reprise d\'exploitation - actifs courants',
    '786 - Reprises financières'
  ]
};
