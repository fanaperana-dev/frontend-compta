import axios from 'axios';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL
});

// Ajouter le token automatiquement à chaque requête
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gérer les erreurs automatiquement
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('entreprise');
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
    localStorage.removeItem('token');
    localStorage.removeItem('entreprise');
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
  getAll: (entreprise_id, params) =>
    api.get(`/fournisseurs/${entreprise_id}`, { params }),

  getById: (id) =>
    api.get(`/fournisseurs/detail/${id}`),

  creer: (data) =>
    api.post('/fournisseurs', data),

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
export const stockService = {
  getArticles: (entreprise_id) => api.get(`/stocks/articles/${entreprise_id}`),
  creerArticle: (data) => api.post('/stocks/articles', data),
  modifierArticle: (id, data) => api.put(`/stocks/articles/${id}`, data),
  getMouvements: (entreprise_id, params) => api.get(`/stocks/mouvements/${entreprise_id}`, { params }),
  enregistrerMouvement: (data) => api.post('/stocks/mouvements', data),
  getEtat: (entreprise_id) => api.get(`/stocks/etat/${entreprise_id}`),
  getValorisation: (article_id) => api.get(`/stocks/valorisation-fifo/${article_id}`)
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
    api.post('/journal/operation', data)
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
    api.delete(`/comptabilite/elements-bilan/${id}`)
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
  modifierFichePaie: (id, data) => api.put(`/rh/fiches-paie/admin/${id}`, data)
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
export default api;