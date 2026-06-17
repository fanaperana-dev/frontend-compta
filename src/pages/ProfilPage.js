import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { profilService, ticketService } from '../services/api';

const styles = {
  boutonPrimaire: {
    background: '#004d5a', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 'bold'
  },
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  },
  label: {
    display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px'
  },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px',
    maxWidth: '600px'
  }
};

function couleurStatutTicket(statut) {
  const c = {
    OUVERT: { bg: '#fff3e0', color: '#e65100', label: '🟠 Ouvert' },
    EN_COURS: { bg: '#e3f2fd', color: '#1565c0', label: '🔵 En cours' },
    TRAITE: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Traité' }
  };
  return c[statut] || { bg: '#f5f5f5', color: '#666', label: statut };
}

export default function ProfilPage() {
  const { entreprise } = useAuth();
  const [profil, setProfil] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envoiTicketEnCours, setEnvoiTicketEnCours] = useState(false);
  const [form, setForm] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmation_mot_de_passe: ''
  });
  const [formTicket, setFormTicket] = useState({
    sujet: '',
    description: '',
    categorie: 'AUTRE'
  });

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [profilRes, ticketsRes] = await Promise.all([
        profilService.getMonProfil(entreprise.id),
        ticketService.getAll(entreprise.id)
      ]);
      setProfil(profilRes.data.data);
      setTickets(ticketsRes.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement profil.');
    } finally {
      setLoading(false);
    }
  }

  async function changerMotDePasse() {
    if (!form.ancien_mot_de_passe || !form.nouveau_mot_de_passe) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    if (form.nouveau_mot_de_passe !== form.confirmation_mot_de_passe) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.nouveau_mot_de_passe.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      await profilService.changerMotDePasse(entreprise.id, {
        ancien_mot_de_passe: form.ancien_mot_de_passe,
        nouveau_mot_de_passe: form.nouveau_mot_de_passe
      });
      toast.success('Mot de passe modifié avec succès !');
      setForm({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmation_mot_de_passe: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur changement mot de passe.');
    }
  }

  async function envoyerTicket() {
  if (!formTicket.sujet || !formTicket.description) {
    toast.error('Veuillez remplir le sujet et la description.');
    return;
  }
  setEnvoiTicketEnCours(true);
  try {
    await ticketService.creer({
      entreprise_id: entreprise.id,
      ...formTicket
    });
    toast.success('Ticket envoyé ! Nous vous répondrons rapidement.');
    setFormTicket({ sujet: '', description: '', categorie: 'AUTRE' });
    chargerDonnees();
  } catch (err) {
    toast.error('Erreur envoi ticket.');
  } finally {
    setEnvoiTicketEnCours(false);
  }
}

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      <h2 style={{ color: '#004d5a', marginBottom: '20px' }}>👤 Mon profil</h2>

      <div style={styles.card}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>Informations</h3>
        <div style={{ fontSize: '13px', color: '#333', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div><strong>Entreprise :</strong> {profil?.nom}</div>
          <div><strong>Email :</strong> {profil?.email}</div>
          <div><strong>Téléphone :</strong> {profil?.telephone || '—'}</div>
          <div><strong>Adresse :</strong> {profil?.adresse || '—'} {profil?.ville || ''}</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
            ℹ️ Pour modifier ces informations, créez un ticket ci-dessous.
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>🔑 Changer mon mot de passe</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Mot de passe actuel</label>
            <input style={styles.input} type="password"
              value={form.ancien_mot_de_passe}
              onChange={e => setForm({ ...form, ancien_mot_de_passe: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Nouveau mot de passe</label>
            <input style={styles.input} type="password"
              value={form.nouveau_mot_de_passe}
              onChange={e => setForm({ ...form, nouveau_mot_de_passe: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Confirmer le nouveau mot de passe</label>
            <input style={styles.input} type="password"
              value={form.confirmation_mot_de_passe}
              onChange={e => setForm({ ...form, confirmation_mot_de_passe: e.target.value })} />
          </div>
          <button style={styles.boutonPrimaire} onClick={changerMotDePasse}>
            Modifier le mot de passe
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>🎫 Créer un ticket</h3>
        <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>
          Demande de correction de données, modification d'informations, ou toute autre question.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Catégorie</label>
            <select style={styles.input} value={formTicket.categorie}
              onChange={e => setFormTicket({ ...formTicket, categorie: e.target.value })}>
              <option value="CORRECTION_DONNEE">Correction de donnée</option>
              <option value="MODIFICATION_INFO">Modification d'information</option>
              <option value="QUESTION">Question</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Sujet *</label>
            <input style={styles.input} value={formTicket.sujet}
              onChange={e => setFormTicket({ ...formTicket, sujet: e.target.value })}
              placeholder="Ex : Corriger date de paiement facture FAC-012" />
          </div>
          <div>
            <label style={styles.label}>Description *</label>
            <textarea style={{ ...styles.input, height: '100px', resize: 'vertical' }}
              value={formTicket.description}
              onChange={e => setFormTicket({ ...formTicket, description: e.target.value })}
              placeholder="Décrivez votre demande en détail..." />
          </div>
          <button 
            style={{ ...styles.boutonPrimaire, opacity: envoiTicketEnCours ? 0.6 : 1 }}
            onClick={envoyerTicket}
            disabled={envoiTicketEnCours}
          >
            {envoiTicketEnCours ? '⏳ Envoi en cours...' : 'Envoyer le ticket'}
          </button>
          
        </div>
      </div>

      {tickets.length > 0 && (
        <div style={styles.card}>
          <h3 style={{ color: '#004d5a', marginTop: 0 }}>📋 Mes tickets ({tickets.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tickets.map(t => {
              const statut = couleurStatutTicket(t.statut);
              return (
                <div key={t.id} style={{
                  border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: '#004d5a' }}>{t.sujet}</strong>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                      fontWeight: 'bold', background: statut.bg, color: statut.color }}>
                      {statut.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>{t.description}</p>
                  {t.reponse_admin && (
                    <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '6px', fontSize: '12px', marginTop: '8px' }}>
                      <strong>Réponse :</strong> {t.reponse_admin}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                    {new Date(t.date_creation).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}