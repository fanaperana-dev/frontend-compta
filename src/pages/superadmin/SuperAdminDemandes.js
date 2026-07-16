import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const styles = {
  boutonPrimaire: {
    background: '#004d5a', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
  },
  boutonSucces: {
    background: '#2e7d32', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
  },
  boutonDanger: {
    background: '#c62828', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
  },
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'
  },
  label: {
    display: 'block', marginBottom: '5px',
    fontWeight: 'bold', color: '#333', fontSize: '13px'
  },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalContent: {
    background: 'white', borderRadius: '12px', padding: '30px',
    width: '700px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

function couleurStatut(statut) {
  const c = {
    EN_ATTENTE: { bg: '#fff3e0', color: '#e65100', label: '🟠 En attente' },
    VALIDEE: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Validée' },
    REFUSEE: { bg: '#ffebee', color: '#c62828', label: '❌ Refusée' }
  };
  return c[statut] || { bg: '#f5f5f5', color: '#666', label: statut };
}

export default function SuperAdminDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('EN_ATTENTE');
  const [demandeSelectionnee, setDemandeSelectionnee] = useState(null);
  const [noteAdmin, setNoteAdmin] = useState('');
  const [enCours, setEnCours] = useState(false);

  useEffect(() => { chargerDemandes(); }, [filtreStatut]);

  async function chargerDemandes() {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/inscription/admin?statut=${filtreStatut}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDemandes(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement demandes.');
    } finally {
      setLoading(false);
    }
  }

  async function valider() {
    setEnCours(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/inscription/admin/${demandeSelectionnee.id}/valider`,
        { note_admin: noteAdmin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Compte créé et identifiants envoyés !');
      setDemandeSelectionnee(null);
      chargerDemandes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur validation.');
    } finally {
      setEnCours(false);
    }
  }

  async function refuser() {
    if (!noteAdmin) {
      toast.error('Veuillez indiquer un motif de refus.');
      return;
    }
    setEnCours(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/inscription/admin/${demandeSelectionnee.id}/refuser`,
        { note_admin: noteAdmin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Demande refusée.');
      setDemandeSelectionnee(null);
      chargerDemandes();
    } catch (err) {
      toast.error('Erreur refus.');
    } finally {
      setEnCours(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {demandeSelectionnee && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>
              📋 Demande — {demandeSelectionnee.nom}
            </h3>

            {/* Infos entreprise */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '10px', fontSize: '13px', marginBottom: '20px' }}>
              <div><strong>Email :</strong> {demandeSelectionnee.email}</div>
              <div><strong>Téléphone :</strong> {demandeSelectionnee.telephone}</div>
              <div><strong>Statut juridique :</strong> {demandeSelectionnee.statut_juridique}</div>
              <div><strong>Ville :</strong> {demandeSelectionnee.ville}</div>
              <div><strong>NIF :</strong> {demandeSelectionnee.nif || '—'}</div>
              <div><strong>STAT :</strong> {demandeSelectionnee.stat || '—'}</div>
              <div><strong>Forfait :</strong> {demandeSelectionnee.forfait_souhaite}</div>
              <div><strong>Activité :</strong> {demandeSelectionnee.activite}</div>
              <div><strong>Préfixe factures :</strong> {demandeSelectionnee.prefixe_facture}</div>
              <div><strong>Organisme santé :</strong> {demandeSelectionnee.nom_organisme_sante}</div>
            </div>

            {/* Aperçu couleurs */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>Couleur primaire :</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%',
                  background: demandeSelectionnee.couleur_primaire }} />
                <span style={{ fontSize: '12px' }}>{demandeSelectionnee.couleur_primaire}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>Couleur secondaire :</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%',
                  background: demandeSelectionnee.couleur_secondaire }} />
                <span style={{ fontSize: '12px' }}>{demandeSelectionnee.couleur_secondaire}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>Police :</span>
                <span style={{ fontFamily: demandeSelectionnee.police_ecriture, fontSize: '14px' }}>
                  {demandeSelectionnee.police_ecriture}
                </span>
              </div>
            </div>

            {/* Fichiers */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              {demandeSelectionnee.logo_url && (
                <div>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 5px 0' }}>Logo :</p>
                  <img src={demandeSelectionnee.logo_url} alt="logo"
                    style={{ height: '50px', objectFit: 'contain' }} />
                </div>
              )}
              {demandeSelectionnee.signature_facture_url && (
                <div>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 5px 0' }}>Signature facture :</p>
                  <img src={demandeSelectionnee.signature_facture_url} alt="signature"
                    style={{ height: '50px', objectFit: 'contain' }} />
                </div>
              )}
              {demandeSelectionnee.signature_rh_url && (
                <div>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 5px 0' }}>Signature RH :</p>
                  <img src={demandeSelectionnee.signature_rh_url} alt="signature rh"
                    style={{ height: '50px', objectFit: 'contain' }} />
                </div>
              )}
            </div>

            {/* Note admin */}
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Note / Motif (obligatoire pour refus)</label>
              <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                value={noteAdmin}
                onChange={e => setNoteAdmin(e.target.value)}
                placeholder="Note interne ou motif de refus..." />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={styles.boutonPrimaire}
                onClick={() => { setDemandeSelectionnee(null); setNoteAdmin(''); }}>
                Fermer
              </button>
              <button style={{ ...styles.boutonDanger, opacity: enCours ? 0.6 : 1 }}
                disabled={enCours} onClick={refuser}>
                {enCours ? '⏳...' : '❌ Refuser'}
              </button>
              <button style={{ ...styles.boutonSucces, opacity: enCours ? 0.6 : 1 }}
                disabled={enCours} onClick={valider}>
                {enCours ? '⏳ Création...' : '✅ Valider et créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>📋 Demandes d'inscription</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['EN_ATTENTE', 'VALIDEE', 'REFUSEE'].map(s => {
            const st = couleurStatut(s);
            return (
              <button key={s}
                onClick={() => setFiltreStatut(s)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                  border: '2px solid',
                  borderColor: filtreStatut === s ? st.color : '#e0e0e0',
                  background: filtreStatut === s ? st.bg : 'white',
                  color: filtreStatut === s ? st.color : '#666',
                  fontSize: '12px', fontWeight: 'bold'
                }}>
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {demandes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          Aucune demande {filtreStatut === 'EN_ATTENTE' ? 'en attente' :
            filtreStatut === 'VALIDEE' ? 'validée' : 'refusée'}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {demandes.map(d => {
            const st = couleurStatut(d.statut);
            return (
              <div key={d.id} style={{ background: 'white', borderRadius: '10px',
                padding: '15px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '15px', color: '#004d5a' }}>{d.nom}</strong>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                      fontWeight: 'bold', background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {d.email} • {d.telephone} • {d.ville} • Forfait : {d.forfait_souhaite}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>
                    {new Date(d.date_creation).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(d.date_creation).toLocaleTimeString('fr-FR')}
                  </div>
                </div>
                <button style={styles.boutonPrimaire}
                  onClick={() => { setDemandeSelectionnee(d); setNoteAdmin(''); }}>
                  👁️ Voir
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}