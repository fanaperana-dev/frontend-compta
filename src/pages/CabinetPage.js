import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { cabinetService } from '../services/api';
import { menuItems } from '../components/Navigation';
import ChangementMotDePasse from './ChangementMotDePasse';
import ArivotekIcon from '../components/ArivotekIcon';

// Point d'entrée d'une personne d'un cabinet : la liste de ses entreprises. Un clic ouvre l'entreprise ;
// l'outil fonctionne ensuite comme pour l'entreprise elle-même (avec les onglets cochés pour cette personne).
export default function CabinetPage() {
  const { cabinet, utilisateurCabinet, ouvrirEntreprise, deconnexion } = useAuth();
  const navigate = useNavigate();
  const [entreprises, setEntreprises] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [ouverture, setOuverture] = useState(null);

  useEffect(() => {
    if (!cabinet || utilisateurCabinet?.doit_changer_mdp) return;
    cabinetService.entreprises()
      .then((r) => setEntreprises(r.data.data || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Erreur de chargement.'))
      .finally(() => setChargement(false));
  }, [cabinet, utilisateurCabinet]);

  if (!cabinet) return <Navigate to="/login" replace />;
  if (utilisateurCabinet?.doit_changer_mdp) return <ChangementMotDePasse cabinet />;

  async function ouvrir(e) {
    if (ouverture) return;
    setOuverture(e.id);
    try {
      const r = await cabinetService.ouvrir(e.id);
      ouvrirEntreprise(r.data);
      // Première page autorisée pour cette personne
      const onglets = r.data.utilisateur?.onglets || [];
      const premier = menuItems.find((m) => !m.proprietaire && onglets.includes(m.path));
      navigate(premier ? premier.path : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible d\'ouvrir cette entreprise.');
      setOuverture(null);
    }
  }

  const filtre = entreprises.filter((e) => e.nom.toLowerCase().includes(recherche.trim().toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f5', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#004d5a', color: 'white', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ArivotekIcon height={36} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>🏛️ {cabinet.nom}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>{utilisateurCabinet?.nom}{utilisateurCabinet?.poste ? ` — ${utilisateurCabinet.poste}` : ''}</div>
          </div>
        </div>
        <button onClick={deconnexion} style={{ background: 'white', color: '#004d5a', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>Déconnexion</button>
      </div>

      <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 16px' }}>
        <h2 style={{ color: '#004d5a', marginTop: 0 }}>Vos entreprises</h2>
        <input
          value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher une entreprise…"
          style={{ width: '100%', padding: '11px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '16px' }}
        />
        {chargement ? <p style={{ color: '#666' }}>Chargement…</p>
          : filtre.length === 0 ? (
            <p style={{ color: '#666' }}>{entreprises.length === 0 ? 'Aucune entreprise ne vous est encore attribuée. Contactez votre administrateur.' : 'Aucune entreprise ne correspond à la recherche.'}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {filtre.map((e) => {
                const suspendue = e.statut === 'SUSPENDU';
                return (
                  <button
                    key={e.id} onClick={() => ouvrir(e)} disabled={suspendue || !!ouverture}
                    style={{ textAlign: 'left', background: 'white', border: '2px solid #e0e0e0', borderRadius: '10px', padding: '16px', cursor: suspendue ? 'not-allowed' : 'pointer', opacity: suspendue ? 0.55 : 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#004d5a', fontSize: '15px' }}>{e.nom}</div>
                    <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{e.ville || e.email || ''}</div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: suspendue ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}>
                      {ouverture === e.id ? 'Ouverture…' : suspendue ? 'Suspendue' : 'Ouvrir →'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
