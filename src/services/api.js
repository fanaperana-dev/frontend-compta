import axios from 'axios';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL
});

// Ajouter le token automatiquement à chaque requête
api.interceptors.request.use(config => {
  // Les routes de l'espace cabinet (liste d'entreprises) utilisent le jeton du cabinet, pas celui d'une entreprise ouverte
  const estRouteCabinet = /^\/cabinet(\/|$)/.test(config.url || '');
  const token = estRouteCabinet
    ? (localStorage.getItem('token_cabinet') || localStorage.getItem('token'))
    : localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gérer les erreurs automatiquement
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403 && error.response?.data?.acces_cabinet_retire) {
      // Le cabinet n'a plus accès à l'entreprise ouverte : retour à la liste des entreprises
      localStorage.removeItem('token');
      localStorage.removeItem('entreprise');
      localStorage.removeItem('utilisateur');
      window.location.href = '/cabinet';
    } else if (error.response?.status === 401) {
      ['token', 'entreprise', 'utilisateur', 'token_cabinet', 'cabinet', 'utilisateur_cabinet'].forEach((k) => localStorage.removeItem(k));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authService = {
  connexion: (email, mot_de_passe) =>
    api.post('/auth/connexion', { email, mot_de_passe }),

  inscription: (data) =>
    api.post('/auth/inscription', data),

  adminConnexion: (email, mot_de_passe) =>
    api.post('/auth/admin/connexion', { email, mot_de_passe }),

  deconnexion: () => {
    ['token', 'entreprise', 'utilisateur', 'token_cabinet', 'cabinet', 'utilisateur_cabinet'].forEach((k) => localStorage.removeItem(k));
    window.location.href = '/login';
  }
};

// CLIENTS
export const clientService = {
  getAll: (entreprise_id) =>
    api.get(`/clients/${entreprise_id}`),

  getById: (id) =>
    api.get(`/clients/detail/${id}`),

  creer: (data) =>
    api.post('/clients', data),

  modifier: (id, data) =>
    api.put(`/clients/${id}`, data),

  toggleActif: (id, actif) =>
    api.patch(`/clients/${id}/actif`, { actif })
};

// FACTURES
export const factureService = {
  getAll: (entreprise_id, params) =>
    api.get(`/factures/${entreprise_id}`, { params }),

  getById: (id) =>
    api.get(`/factures/detail/${id}`),

  creer: (data) =>
    api.post('/factures', data),

  creerMasse: (data) =>
    api.post('/factures/masse', data),

  modifier: (id, data) =>
    api.put(`/factures/${id}`, data),

  annuler: (id, motif) =>
    api.patch(`/factures/${id}/annuler`, { motif })
};

// Lien temporaire d'ouverture d'un PDF (le fichier s'enregistre alors sous son numéro : FAC-001.pdf, PRF-0001.pdf, AVR-0001.pdf)
export const pdfLienService = {
  creer: (type, id) => api.post('/pdf-liens', { type, id }),
  adresse: (url) => `${API_URL.replace(/\/api$/, '')}${url}`
};

// PROFORMAS (devis)
export const proformaService = {
  getAll: (entreprise_id) => api.get(`/proformas/${entreprise_id}`),
  creer: (data) => api.post('/proformas', data),
  modifier: (id, data) => api.put(`/proformas/${id}`, data),
  annuler: (id, motif) => api.patch(`/proformas/${id}/annuler`, { motif }),
  valider: (id, data) => api.post(`/proformas/${id}/valider`, data),
  envoyer: (id) => api.post(`/proformas/${id}/envoyer`),
  pdf: (id) => api.get(`/proformas/${id}/pdf`, { responseType: 'blob' })
};

// AVOIRS (remboursement d'un trop-perçu)
export const avoirService = {
  getAll: (entreprise_id) => api.get(`/avoirs/${entreprise_id}`),
  credits: (entreprise_id) => api.get(`/avoirs/credits/${entreprise_id}`),
  facturesClient: (entreprise_id, client_id) => api.get(`/avoirs/factures/${entreprise_id}/${client_id}`),
  creer: (data) => api.post('/avoirs', data),
  envoyer: (id) => api.post(`/avoirs/${id}/envoyer`),
  pdf: (id) => api.get(`/avoirs/${id}/pdf`, { responseType: 'blob' })
};

// PAIEMENTS
export const paiementService = {
  getAll: (entreprise_id, params) =>
    api.get(`/paiements/${entreprise_id}`, { params }),

  enregistrer: (data) =>
    api.post('/paiements', data),

  getCredit: (entreprise_id, client_id) =>
    api.get(`/paiements/credit/${entreprise_id}/${client_id}`)
};

// FOURNISSEURS
export const fournisseurService = {
  // Facture non conforme : reste en comptabilité mais hors calcul de l'impôt
  marquerNonConforme: (id, non_conforme) =>
    api.patch(`/fournisseurs/${id}/non-conforme`, { non_conforme }),

  getAll: (entreprise_id, params) =>
    api.get(`/fournisseurs/${entreprise_id}`, { params }),

  getById: (id) =>
    api.get(`/fournisseurs/detail/${id}`),

  creer: (data) =>
    api.post('/fournisseurs', data),

  // Facture intelligente : plusieurs catégories, lignes et paiements ; stock et immobilisations automatiques
  creerIntelligente: (data) =>
    api.post('/fournisseurs/intelligente', data),

  modifier: (id, data) =>
    api.put(`/fournisseurs/${id}`, data),

  changerStatut: (id, statut) =>
    api.patch(`/fournisseurs/${id}/statut`, { statut }),
  enregistrerPaiement: (id, data) =>
    api.patch(`/fournisseurs/${id}/paiement`, data)
};
// FOURNISSEURS LISTE
export const fournisseurListeService = {
  getAll: (entreprise_id) =>
    api.get(`/fournisseurs/liste/${entreprise_id}`),

  creer: (data) =>
    api.post('/fournisseurs/liste', data),

  modifier: (id, data) =>
    api.put(`/fournisseurs/liste/${id}`, data),

  toggleActif: (id, actif) =>
    api.patch(`/fournisseurs/liste/${id}/actif`, { actif }),

  uploadDocument: (id, data) =>
    api.post(`/fournisseurs/liste/${id}/document`, data),

  supprimerDocument: (id, url) =>
    api.delete(`/fournisseurs/liste/${id}/document`, { data: { url } })
};

export const tiersListeService = {
  getAll: (entreprise_id) => api.get(`/tiers/liste/${entreprise_id}`),
  creer: (data) => api.post('/tiers/liste', data),
  modifier: (id, data) => api.put(`/tiers/liste/${id}`, data),
  toggleActif: (id, actif) => api.patch(`/tiers/liste/${id}/actif`, { actif }),
  uploadDocument: (id, data) => api.post(`/tiers/liste/${id}/document`, data),
  supprimerDocument: (id, url) => api.delete(`/tiers/liste/${id}/document`, { data: { url } })
};

export const tiersService = {
  getAll: (entreprise_id, params) => api.get(`/tiers/${entreprise_id}`, { params }),
  creer: (data) => api.post('/tiers', data),
  modifier: (id, data) => api.put(`/tiers/${id}`, data),
  changerStatut: (id, statut) => api.patch(`/tiers/${id}/statut`, { statut }),
  enregistrerPaiement: (id, data) =>
  api.patch(`/tiers/${id}/paiement`, data)
};
//stocks
export const productionService = {
  getRecettes: (entreprise_id) => api.get(`/production/recettes/${entreprise_id}`),
  creerRecette: (data) => api.post('/production/recettes', data),
  modifierRecette: (id, data) => api.put(`/production/recettes/${id}`, data),
  etatRecette: (id, actif) => api.put(`/production/recettes/${id}/etat`, { actif }),
  calculRecette: (entreprise_id, id, quantite) => api.get(`/production/recettes/${entreprise_id}/${id}/calcul`, { params: { quantite } }),
  getTableauBord: (entreprise_id) => api.get(`/production/tableau-de-bord/${entreprise_id}`),
  getSuivi: (entreprise_id, params) => api.get(`/production/suivi/${entreprise_id}`, { params }),
  getProductions: (entreprise_id) => api.get(`/production/productions/${entreprise_id}`),
  getProduction: (entreprise_id, id) => api.get(`/production/productions/${entreprise_id}/${id}`),
  creerProduction: (data) => api.post('/production/productions', data),
  modifierProduction: (id, data) => api.put(`/production/productions/${id}`, data),
  lancerProduction: (id) => api.post(`/production/productions/${id}/lancer`),
  validerProduction: (id, data) => api.post(`/production/productions/${id}/valider`, data),
  annulerProduction: (id) => api.post(`/production/productions/${id}/annuler`),
  pdfProduction: (entreprise_id, id) => api.get(`/production/productions/${entreprise_id}/${id}/pdf`, { responseType: 'blob' }),
};

export const stockService = {
  getArticles: (entreprise_id) => api.get(`/stocks/articles/${entreprise_id}`),
  creerArticle: (data) => api.post('/stocks/articles', data),
  modifierArticle: (id, data) => api.put(`/stocks/articles/${id}`, data),
  getMouvements: (entreprise_id, params) => api.get(`/stocks/mouvements/${entreprise_id}`, { params }),
  enregistrerMouvement: (data) => api.post('/stocks/mouvements', data),
  getBonsSortie: (entreprise_id) => api.get(`/stocks/bons-sortie/${entreprise_id}`),
  getMotifsBonSortie: () => api.get('/stocks/bons-sortie/motifs'),
  creerBonSortie: (data) => api.post('/stocks/bons-sortie', data),
  annulerBonSortie: (entreprise_id, numero) => api.patch(`/stocks/bons-sortie/${entreprise_id}/${numero}/annuler`),
  pdfBonSortie: (entreprise_id, numero) => api.get(`/stocks/bons-sortie/${entreprise_id}/${numero}/pdf`, { responseType: 'blob' }),
  getInventaires: (entreprise_id) => api.get(`/stocks/inventaires/${entreprise_id}`),
  getInventaire: (entreprise_id, id) => api.get(`/stocks/inventaires/${entreprise_id}/${id}`),
  creerInventaire: (data) => api.post('/stocks/inventaires', data),
  enregistrerComptages: (entreprise_id, id, comptages) => api.put(`/stocks/inventaires/${entreprise_id}/${id}/comptages`, { comptages }),
  actualiserInventaire: (entreprise_id, id) => api.post(`/stocks/inventaires/${entreprise_id}/${id}/actualiser`),
  validerInventaire: (entreprise_id, id) => api.post(`/stocks/inventaires/${entreprise_id}/${id}/valider`),
  annulerInventaire: (entreprise_id, id) => api.patch(`/stocks/inventaires/${entreprise_id}/${id}/annuler`),
  getEtat: (entreprise_id) => api.get(`/stocks/etat/${entreprise_id}`),
  getValorisation: (article_id) => api.get(`/stocks/valorisation-fifo/${article_id}`),
  entreeAchat: (data) => api.post('/stocks/entrees-achat', data)
};
export const immobilisationService = {
  getAll: (entreprise_id) => api.get(`/immobilisations/${entreprise_id}`),
  creer: (data) => api.post('/immobilisations', data),
  modifier: (id, data) => api.put(`/immobilisations/${id}`, data),
  modifierDotation: (immobilisation_id, annee, data) => 
    api.patch(`/immobilisations/${immobilisation_id}/dotation/${annee}`, data),
  getTableau: (entreprise_id, annee) => api.get(`/immobilisations/${entreprise_id}/tableau/${annee}`),
  sortie: (id, data) => api.patch(`/immobilisations/${id}/sortie`, data)
};
// JOURNAL
export const journalService = {
  get: (entreprise_id, params) =>
    api.get(`/journal/${entreprise_id}`, { params }),

  ajouterOperation: (data) =>
    api.post('/journal/operation', data),
  getSoldesOuverture: (entreprise_id, annee) =>
    api.get(`/journal/soldes-ouverture/${entreprise_id}/${annee}`),
  saveSoldeOuverture: (data) =>
    api.post('/journal/soldes-ouverture', data)
};

// DASHBOARD
export const dashboardService = {
  get: (entreprise_id, params) =>
    api.get(`/dashboard/${entreprise_id}`, { params }),

  getAdmin: () =>
    api.get('/dashboard/admin/global')
};

// RH
export const rhService = {
  getSalaries: (entreprise_id) =>
    api.get(`/rh/salaries/${entreprise_id}`),

  getSalarieById: (id) =>
    api.get(`/rh/salaries/detail/${id}`),

  creerSalarie: (data) =>
    api.post('/rh/salaries', data),

  modifierSalarie: (id, data) =>
    api.put(`/rh/salaries/${id}`, data),

  // Historique d'un salarié (informatif, sans effet sur la paie)
  getHistorique: (entreprise_id, salarie_id) =>
    api.get(`/rh/historique/${entreprise_id}/${salarie_id}`),
  ajouterHistorique: (entreprise_id, salarie_id, data) =>
    api.post(`/rh/historique/${entreprise_id}/${salarie_id}`, data),
  modifierHistorique: (entreprise_id, id, data) =>
    api.put(`/rh/historique/${entreprise_id}/ligne/${id}`, data),
  supprimerHistorique: (entreprise_id, id) =>
    api.delete(`/rh/historique/${entreprise_id}/ligne/${id}`),

  getFichesPaie: (entreprise_id, params) =>
    api.get(`/rh/fiches-paie/${entreprise_id}`, { params }),

  creerFichePaie: (data) =>
    api.post('/rh/fiches-paie', data),

  validerFichePaie: (id) =>
    api.patch(`/rh/fiches-paie/${id}/valider`),

  getCharges: (entreprise_id, params) =>
    api.get(`/rh/charges/${entreprise_id}`, { params })
};

export const entrepriseService = {
  getAll: () => api.get('/entreprises'),
  getDetail: (id) => api.get(`/entreprises/detail/${id}`),
  creer: (data) => api.post('/entreprises', data),
  modifier: (id, data) => api.put(`/entreprises/${id}`, data),
  changerStatut: (id, statut, motif) => api.patch(`/entreprises/${id}/statut`, { statut, motif_suspension: motif }),
  resetMdp: (id) => api.post(`/entreprises/${id}/reset-mdp`),
  getForfaits: () => api.get('/entreprises/forfaits/liste'),
  creerForfait: (data) => api.post('/entreprises/forfaits', data),
  modifierForfait: (id, data) => api.put(`/entreprises/forfaits/${id}`, data),
  uploadImage: (id, data) => api.post(`/entreprises/${id}/upload-image`, data)
};


export const comptabiliteService = {
  getCompteResultat: (entreprise_id, annee) =>
    api.get(`/comptabilite/compte-resultat/${entreprise_id}/${annee}`),
  getBilan: (entreprise_id, annee) =>
    api.get(`/comptabilite/bilan/${entreprise_id}/${annee}`),
  ajouterAutreOperation: (data) =>
    api.post('/comptabilite/autres-operations', data),
  getAutresOperations: (entreprise_id, annee) =>
    api.get(`/comptabilite/autres-operations/${entreprise_id}/${annee}`),
  supprimerAutreOperation: (id) =>
    api.delete(`/comptabilite/autres-operations/${id}`),
  ajouterElementBilan: (data) =>
    api.post('/comptabilite/elements-bilan', data),
  getElementsBilan: (entreprise_id, annee) =>
    api.get(`/comptabilite/elements-bilan/${entreprise_id}/${annee}`),
  supprimerElementBilan: (id) =>
    api.delete(`/comptabilite/elements-bilan/${id}`),
  getGrandLivre: (entreprise_id, annee) =>
    api.get(`/comptabilite/grand-livre/${entreprise_id}/${annee}`),
  getFonctionsComptables: (entreprise_id) =>
    api.get(`/comptabilite/fonctions-comptables/${entreprise_id}`),
  ajouterFonctionComptable: (data) =>
    api.post('/comptabilite/fonctions-comptables', data),
  supprimerFonctionComptable: (id) =>
    api.delete(`/comptabilite/fonctions-comptables/${id}`),
  getCompteResultatFonction: (entreprise_id, annee) =>
    api.get(`/comptabilite/compte-resultat-fonction/${entreprise_id}/${annee}`),
  getCompteCourant: (entreprise_id, annee) =>
    api.get(`/comptabilite/compte-courant/${entreprise_id}`, { params: { annee } }),
  ajouterCompteCourant: (data) =>
    api.post('/comptabilite/compte-courant', data),
  supprimerCompteCourant: (id) =>
    api.delete(`/comptabilite/compte-courant/${id}`),
  getFluxTresorerie: (entreprise_id, annee) =>
    api.get(`/comptabilite/flux-tresorerie/${entreprise_id}/${annee}`),
  saveTresorerieOuverture: (data) =>
    api.post('/comptabilite/tresorerie-ouverture', data),
  exportPDFCompteResultat: (entreprise_id, annee) =>
    api.get(`/comptabilite/compte-resultat/${entreprise_id}/${annee}/pdf`),
  exportPDFBilan: (entreprise_id, annee) =>
    api.get(`/comptabilite/bilan/${entreprise_id}/${annee}/pdf`),
  exportPDFGrandLivre: (entreprise_id, annee) =>
    api.get(`/comptabilite/grand-livre/${entreprise_id}/${annee}/pdf`),
  exportPDFFluxTresorerie: (entreprise_id, annee) =>
    api.get(`/comptabilite/flux-tresorerie/${entreprise_id}/${annee}/pdf`),
  exportPDFCompteResultatFonction: (entreprise_id, annee) =>
    api.get(`/comptabilite/compte-resultat-fonction/${entreprise_id}/${annee}/pdf`),
};

// MAILS
export const mailService = {
  envoyerFacture: (data) =>
    api.post('/mails/facture', data),

  envoyerFacturesMasse: (entreprise_id) =>
    api.post('/mails/factures-masse', { entreprise_id }),

  envoyerRelance: (data) =>
    api.post('/mails/relance', data),

  envoyerConfirmationPaiement: (data) =>
    api.post('/mails/confirmation-paiement', data)
};

// TICKETS
export const ticketService = {
  getAll: (entreprise_id) => api.get(`/tickets/${entreprise_id}`),
  getTous: () => api.get('/tickets/admin/tous'),
  creer: (data) => api.post('/tickets', data),
  traiter: (id, data) => api.patch(`/tickets/${id}/traiter`, data)
};
export const abonnementService = {
  getConfig: () => api.get('/facturation-abonnements/config'),
  saveConfig: (data) => api.put('/facturation-abonnements/config', data),
  apercu: (periode) => api.get('/facturation-abonnements/apercu', { params: { periode } }),
  generer: (data) => api.post('/facturation-abonnements/generer', data)
};
export const correctionService = {
  // Factures clients
  getFacturesClients: (entreprise_id) => api.get(`/factures/${entreprise_id}`),
  modifierFactureClient: (id, data) => api.put(`/factures/admin/${id}`, data),

  // Encaissements clients
  getEncaissements: (entreprise_id) => api.get(`/paiements/${entreprise_id}`),
  modifierEncaissement: (id, data) => api.put(`/paiements/admin/${id}`, data),

  // Factures fournisseurs
  getFacturesFournisseurs: (entreprise_id) => api.get(`/fournisseurs/${entreprise_id}`),
  modifierFactureFournisseur: (id, data) => api.put(`/fournisseurs/admin/${id}`, data),
  // Factures tiers
  getFacturesTiers: (entreprise_id) => api.get(`/tiers/${entreprise_id}`),
  modifierFactureTiers: (id, data) => api.put(`/tiers/admin/${id}`, data),
  // Fiches de paie
  getFichesPaie: (entreprise_id) => api.get(`/rh/fiches-paie/${entreprise_id}`),
  modifierFichePaie: (id, data) => api.put(`/rh/fiches-paie/admin/${id}`, data),
  getArticles: (entreprise_id) => api.get(`/import/articles/${entreprise_id}`),
  modifierArticle: (id, data) => api.put(`/import/articles/${id}`, data),
  getImmobilisations: (entreprise_id) => api.get(`/import/immobilisations/${entreprise_id}`),
  modifierImmobilisation: (id, data) => api.put(`/import/immobilisations/${id}`, data),
};

// AUTOMATISATIONS
export const automatisationService = {
  global: (entreprise_id) =>
    api.post(`/automatisations/global/${entreprise_id}`)
};

export const profilService = {
  getMonProfil: (id) => api.get(`/entreprises/mon-profil/${id}`),
  modifierMonProfil: (id, data) => api.put(`/entreprises/mon-profil/${id}`, data),
  changerMotDePasse: (id, data) => api.patch(`/entreprises/mon-profil/${id}/mot-de-passe`, data),
  getConfigMail: (id) => api.get(`/entreprises/mon-profil/${id}/config-mail`),
  sauvegarderConfigMail: (id, data) => api.post(`/entreprises/mon-profil/${id}/config-mail`, data),
  testerConfigMail: (id, data) => api.post(`/entreprises/mon-profil/${id}/config-mail/tester`, data)
};
export const utilisateurService = {
  // super-admin : gestion des utilisateurs d'une entreprise
  lister: (entrepriseId) => api.get(`/entreprises/${entrepriseId}/utilisateurs`),
  creer: (entrepriseId, data) => api.post(`/entreprises/${entrepriseId}/utilisateurs`, data),
  modifier: (entrepriseId, id, data) => api.put(`/entreprises/${entrepriseId}/utilisateurs/${id}`, data),
  resetMdp: (entrepriseId, id) => api.post(`/entreprises/${entrepriseId}/utilisateurs/${id}/reset-mdp`),
  supprimer: (entrepriseId, id) => api.delete(`/entreprises/${entrepriseId}/utilisateurs/${id}`),
  // utilisateur connecté : choisir son mot de passe après le provisoire
  changerMonMotDePasse: (data) => api.post('/utilisateurs/moi/mot-de-passe', data)
};
// Espace cabinet : une personne d'un cabinet liste ses entreprises, en ouvre une, choisit son mot de passe
export const cabinetService = {
  entreprises: () => api.get('/cabinet/entreprises'),
  ouvrir: (entrepriseId) => api.post(`/cabinet/ouvrir/${entrepriseId}`),
  changerMotDePasse: (data) => api.post('/cabinet/mot-de-passe', data)
};

// Super-admin : cabinets, leurs personnes et leurs entreprises
export const cabinetAdminService = {
  lister: () => api.get('/cabinets'),
  creer: (data) => api.post('/cabinets', data),
  detail: (id) => api.get(`/cabinets/${id}`),
  modifier: (id, data) => api.put(`/cabinets/${id}`, data),
  supprimer: (id) => api.delete(`/cabinets/${id}`),
  fixerEntreprises: (id, entreprise_ids) => api.put(`/cabinets/${id}/entreprises`, { entreprise_ids }),
  creerUtilisateur: (id, data) => api.post(`/cabinets/${id}/utilisateurs`, data),
  modifierUtilisateur: (id, uid, data) => api.put(`/cabinets/${id}/utilisateurs/${uid}`, data),
  resetMdp: (id, uid) => api.post(`/cabinets/${id}/utilisateurs/${uid}/reset-mdp`),
  supprimerUtilisateur: (id, uid) => api.delete(`/cabinets/${id}/utilisateurs/${uid}`)
};

export default api;