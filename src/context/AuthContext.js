import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [entreprise, setEntreprise] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    const tokenStocke = localStorage.getItem('token');
    const entrepriseStockee = localStorage.getItem('entreprise');
    const adminStocke = localStorage.getItem('isAdmin');

    if (tokenStocke && entrepriseStockee) {
      setToken(tokenStocke);
      setEntreprise(JSON.parse(entrepriseStockee));
      setIsAdmin(adminStocke === 'true');
    }

    setLoading(false);
  }, []);
  // Déconnexion automatique après 15 minutes d'inactivité
useEffect(() => {
  if (!token) return;

  let timer;

  function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      deconnexion();
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
}, [token]);
  // Connexion entreprise
  async function connexion(email, mot_de_passe) {
  try {
    const response = await authService.connexion(email, mot_de_passe);
    const { token, entreprise } = response.data;
    console.log('[LOGIN] entreprise reçue:', entreprise);
    

    localStorage.setItem('token', token);
    localStorage.setItem('entreprise', JSON.stringify(entreprise));
    localStorage.setItem('isAdmin', 'false');

    setToken(token);
    setEntreprise(entreprise);
    setIsAdmin(false);

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

  // Déconnexion
  function deconnexion() {
    localStorage.removeItem('token');
    localStorage.removeItem('entreprise');
    localStorage.removeItem('isAdmin');

    setToken(null);
    setEntreprise(null);
    setIsAdmin(false);
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

  return (
    <AuthContext.Provider value={{
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