import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { utilisateurService, cabinetService } from '../services/api';

// Affiché à la place de l'application tant que l'utilisateur n'a pas remplacé son mot de passe provisoire
export default function ChangementMotDePasse({ cabinet = false }) {
  const auth = useAuth();
  const { deconnexion } = auth;
  const utilisateur = cabinet ? auth.utilisateurCabinet : auth.utilisateur;
  const majUtilisateur = cabinet ? auth.majUtilisateurCabinet : auth.majUtilisateur;
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [enCours, setEnCours] = useState(false);
  const input = { width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' };

  async function valider(e) {
    e.preventDefault();
    if (enCours) return;
    if (nouveau.length < 8) return toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    if (nouveau !== confirmation) return toast.error('La confirmation ne correspond pas.');
    setEnCours(true);
    try {
      await (cabinet ? cabinetService : utilisateurService)[cabinet ? 'changerMotDePasse' : 'changerMonMotDePasse']({ ancien_mot_de_passe: ancien, nouveau_mot_de_passe: nouveau });
      toast.success('Mot de passe enregistré.');
      majUtilisateur({ doit_changer_mdp: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <form onSubmit={valider} style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '360px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>Choisissez votre mot de passe</h3>
        <p style={{ fontSize: '13px', color: '#666' }}>Bonjour {utilisateur?.nom}, remplacez le mot de passe provisoire reçu par mail par le vôtre.</p>
        <input style={input} type="password" placeholder="Mot de passe provisoire" value={ancien} onChange={(e) => setAncien(e.target.value)} autoComplete="current-password" required />
        <input style={input} type="password" placeholder="Nouveau mot de passe (8 caractères minimum)" value={nouveau} onChange={(e) => setNouveau(e.target.value)} autoComplete="new-password" required />
        <input style={input} type="password" placeholder="Confirmer le nouveau mot de passe" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" required />
        <button type="submit" disabled={enCours} style={{ width: '100%', background: '#004d5a', color: 'white', border: 'none', padding: '11px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={deconnexion} style={{ width: '100%', background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer', fontSize: '12px' }}>Se déconnecter</button>
      </form>
    </div>
  );
}
