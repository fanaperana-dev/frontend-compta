import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ticketService } from '../../services/api';

const styles = {
  boutonPrimaire: {
    background: '#004d5a', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 'bold'
  },
  boutonSecondaire: {
    background: 'white', color: '#004d5a', border: '2px solid #004d5a',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalContent: {
    background: 'white', borderRadius: '12px', padding: '30px',
    width: '550px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
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

function labelCategorie(cat) {
  const c = {
    CORRECTION_DONNEE: '🔧 Correction de donnée',
    MODIFICATION_INFO: '✏️ Modification d\'information',
    QUESTION: '❓ Question',
    AUTRE: '📋 Autre'
  };
  return c[cat] || cat;
}

function ModalTraiterTicket({ ticket, onSave, onCancel }) {
  const [statut, setStatut] = useState(ticket.statut === 'OUVERT' ? 'EN_COURS' : ticket.statut);
  const [reponse, setReponse] = useState(ticket.reponse_admin || '');

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>🎫 {ticket.sujet}</h3>

        <div style={{ fontSize: '13px', color: '#333', marginBottom: '15px' }}>
          <div><strong>Entreprise :</strong> {ticket.nom_entreprise}</div>
          <div><strong>Email :</strong> {ticket.email_entreprise}</div>
          <div><strong>Catégorie :</strong> {labelCategorie(ticket.categorie)}</div>
          <div><strong>Date :</strong> {new Date(ticket.date_creation).toLocaleDateString('fr-FR')}</div>
        </div>

        <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' }}>
          {ticket.description}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Statut</label>
            <select style={styles.input} value={statut} onChange={e => setStatut(e.target.value)}>
              <option value="OUVERT">🟠 Ouvert</option>
              <option value="EN_COURS">🔵 En cours</option>
              <option value="TRAITE">✅ Traité</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Réponse (envoyée par mail au client)</label>
            <textarea style={{ ...styles.input, height: '100px', resize: 'vertical' }}
              value={reponse}
              onChange={e => setReponse(e.target.value)}
              placeholder="Votre réponse au client..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire} onClick={() => onSave(statut, reponse)}>
            Enregistrer et envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [ticketSelectionne, setTicketSelectionne] = useState(null);

  useEffect(() => { chargerTickets(); }, []);

  async function chargerTickets() {
    try {
      const res = await ticketService.getTous();
      setTickets(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement tickets.');
    } finally {
      setLoading(false);
    }
  }

  async function traiterTicket(statut, reponse_admin) {
    try {
      await ticketService.traiter(ticketSelectionne.id, { statut, reponse_admin });
      toast.success('Ticket mis à jour et réponse envoyée !');
      setTicketSelectionne(null);
      chargerTickets();
    } catch (err) {
      toast.error('Erreur traitement ticket.');
    }
  }

  const ticketsFiltres = tickets.filter(t =>
    filtreStatut === 'TOUS' || t.statut === filtreStatut
  );

  const compteurs = {
    OUVERT: tickets.filter(t => t.statut === 'OUVERT').length,
    EN_COURS: tickets.filter(t => t.statut === 'EN_COURS').length,
    TRAITE: tickets.filter(t => t.statut === 'TRAITE').length
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {ticketSelectionne && (
        <ModalTraiterTicket
          ticket={ticketSelectionne}
          onSave={traiterTicket}
          onCancel={() => setTicketSelectionne(null)}
        />
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>🎫 Tickets</h2>
        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
          {tickets.length} ticket(s) au total
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #e65100' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>🟠 Ouverts</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>{compteurs.OUVERT}</div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #1565c0' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>🔵 En cours</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>{compteurs.EN_COURS}</div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #2e7d32' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>✅ Traités</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{compteurs.TRAITE}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['TOUS', 'OUVERT', 'EN_COURS', 'TRAITE'].map(s => (
            <button key={s} onClick={() => setFiltreStatut(s)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                background: filtreStatut === s ? '#004d5a' : '#e0e0e0',
                color: filtreStatut === s ? 'white' : '#333'
              }}>
              {s === 'TOUS' ? 'Tous' : couleurStatutTicket(s).label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        {ticketsFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucun ticket trouvé.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Entreprise', 'Sujet', 'Catégorie', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '13px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ticketsFiltres.map((t, i) => {
                const statut = couleurStatutTicket(t.statut);
                return (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa',
                    borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                      {t.nom_entreprise}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{t.sujet}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      {labelCategorie(t.categorie)}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {new Date(t.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                        fontWeight: 'bold', background: statut.bg, color: statut.color }}>
                        {statut.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button style={styles.boutonSecondaire}
                        onClick={() => setTicketSelectionne(t)}>
                        {t.statut === 'TRAITE' ? '👁️ Voir' : '✏️ Traiter'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}