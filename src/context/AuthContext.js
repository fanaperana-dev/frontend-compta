import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [entreprise, setEntreprise] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cabinet, setCabinet] = useState(null); // { id, nom } si la personne s'est connectée via un cabinet
  const [utilisateurCabinet, setUtilisateurCabinet] = useState(null);
  const [utilisateur, setUtilisateur] = useState(null); // null = compte principal de l'entreprise (tous les onglets)

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    const tokenStocke = localStorage.getItem('token');
    const entrepriseStockee = localStorage.getItem('entreprise');
    const adminStocke = localStorage.getItem('isAdmin');

    try {
      const c = localStorage.getItem('cabinet');
      if (c && localStorage.getItem('token_cabinet')) {
        setCabinet(JSON.parse(c));
        const uc = localStorage.getItem('utilisateur_cabinet');
        setUtilisateurCabinet(uc ? JSON.parse(uc) : null);
      }
    } catch (e) { setCabinet(null); }

    if (tokenStocke && entrepriseStockee) {
      setToken(tokenStocke);
      setEntreprise(JSON.parse(entrepriseStockee));
      setIsAdmin(adminStocke === 'true');
      try {
        const u = localStorage.getItem('utilisateur');
        setUtilisateur(u ? JSON.parse(u) : null);
      } catch (e) { setUtilisateur(null); }
    }

    setLoading(false);
  }, []);
  // Déconnexion automatique après 15 minutes d'inactivité
useEffect(() => {
  if (!token && !cabinet) return;

  let timer;

  function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('entreprise');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('utilisateur');
      ['token_cabinet', 'cabinet', 'utilisateur_cabinet'].forEach((k) => localStorage.removeItem(k));
      setToken(null);
      setEntreprise(null);
      setIsAdmin(false);
      setUtilisateur(null);
      setCabinet(null);
      setUtilisateurCabinet(null);
      alert('Vous avez été déconnecté automatiquement après 15 minutes d\'inactivité.');
    }, 15 * 60 * 1000); // 15 minutes
  }

  // Écouter les événements d'activité
  const evenements = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  evenements.forEach(evt => window.addEventListener(evt, resetTimer));

  // Démarrer le timer
  resetTimer();

  // Nettoyer
  return () => {
    clearTimeout(timer);
    evenements.forEach(evt => window.removeEventListener(evt, resetTimer));
  };
}, [token, cabinet]);
  // Connexion entreprise
  async function connexion(email, mot_de_passe) {
  try {
    const response = await authService.connexion(email, mot_de_passe);
    const { token, entreprise, utilisateur: util } = response.data;

    // Connexion d'une personne d'un cabinet : on garde son jeton à part et on l'envoie vers sa liste d'entreprises
    if (response.data.role === 'cabinet') {
      ['token', 'entreprise', 'utilisateur', 'isAdmin'].forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('token_cabinet', token);
      localStorage.setItem('cabinet', JSON.stringify(response.data.cabinet));
      localStorage.setItem('utilisateur_cabinet', JSON.stringify(util));
      setToken(null); setEntreprise(null); setIsAdmin(false); setUtilisateur(null);
      setCabinet(response.data.cabinet);
      setUtilisateurCabinet(util);
      return { success: true, cabinet: true };
    }

    ['token_cabinet', 'cabinet', 'utilisateur_cabinet'].forEach((k) => localStorage.removeItem(k));
    setCabinet(null); setUtilisateurCabinet(null);
    localStorage.setItem('token', token);
    localStorage.setItem('entreprise', JSON.stringify(entreprise));
    localStorage.setItem('isAdmin', 'false');
    if (util) localStorage.setItem('utilisateur', JSON.stringify(util));
    else localStorage.removeItem('utilisateur');

    setToken(token);
    setEntreprise(entreprise);
    setIsAdmin(false);
    setUtilisateur(util || null);

    return { success: true };
  } catch (err) {
    // Message spécial si suspendu
    if (err.response?.data?.suspendu) {
      return {
        success: false,
        suspendu: true,
        message: err.response.data.message
      };
    }
    return {
      success: false,
      message: err.response?.data?.message || 'Erreur de connexion.'
    };
  }
}
  // Connexion super admin
  async function connexionAdmin(email, mot_de_passe) {
    try {
      const response = await authService.adminConnexion(email, mot_de_passe);
      const { token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('isAdmin', 'true');
      localStorage.removeItem('entreprise');

      setToken(token);
      setIsAdmin(true);
      setEntreprise(null);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Accès refusé.'
      };
    }
  }

  // Ouvrir une entreprise depuis la liste du cabinet : on reçoit un jeton d'entreprise normal
  function ouvrirEntreprise(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('entreprise', JSON.stringify(data.entreprise));
    localStorage.setItem('isAdmin', 'false');
    localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
    setToken(data.token);
    setEntreprise(data.entreprise);
    setIsAdmin(false);
    setUtilisateur(data.utilisateur);
  }

  // Retour à la liste des entreprises du cabinet, sans se reconnecter
  function changerEntreprise() {
    ['token', 'entreprise', 'isAdmin', 'utilisateur'].forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setEntreprise(null);
    setIsAdmin(false);
    setUtilisateur(null);
  }

  function majUtilisateurCabinet(champs) {
    const u = { ...utilisateurCabinet, ...champs };
    localStorage.setItem('utilisateur_cabinet', JSON.stringify(u));
    setUtilisateurCabinet(u);
  }

  // Déconnexion
  function deconnexion() {
    localStorage.removeItem('token');
    localStorage.removeItem('entreprise');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('utilisateur');
    ['token_cabinet', 'cabinet', 'utilisateur_cabinet'].forEach((k) => localStorage.removeItem(k));
    setCabinet(null);
    setUtilisateurCabinet(null);

    setToken(null);
    setEntreprise(null);
    setIsAdmin(false);
    setUtilisateur(null);
  }

  // Vérifier si un module est actif
  function moduleActif(module) {
  if (isAdmin) return true;
  if (!entreprise) return false;
  // Chercher dans modules_actifs directement ou via forfaits
  const modules = entreprise.modules_actifs || 
                  entreprise.forfaits?.modules_actifs || 
                  [];
  return modules.includes(module);
}

  // Onglet visible ? Le compte principal voit tout ; un utilisateur ne voit que les onglets cochés pour lui
  // (liste choisie par le propriétaire de l'entreprise, différente d'une entreprise à l'autre).
  function ongletAutorise(path) {
    if (isAdmin || !utilisateur) return true;
    return (utilisateur.onglets || []).includes(path);
  }

  // Mise à jour de l'utilisateur connecté (ex. après le choix de son mot de passe)
  function majUtilisateur(champs) {
    const u = { ...utilisateur, ...champs };
    localStorage.setItem('utilisateur', JSON.stringify(u));
    setUtilisateur(u);
  }

  return (
    <AuthContext.Provider value={{
      cabinet,
      utilisateurCabinet,
      majUtilisateurCabinet,
      ouvrirEntreprise,
      changerEntreprise,
      utilisateur,
      majUtilisateur,
      ongletAutorise,
      entreprise,
      token,
      loading,
      isAdmin,
      connexion,
      connexionAdmin,
      deconnexion,
      moduleActif
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}