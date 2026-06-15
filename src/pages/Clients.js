import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { clientService } from '../services/api';

const styles = {
  boutonPrimaire: {
    background: '#004d5a',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  boutonDanger: {
    background: '#c62828',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  boutonSecondaire: {
    background: 'white',
    color: '#004d5a',
    border: '2px solid #004d5a',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '13px'
  },
  card: {
    background: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '20px'
  }
};

// Formulaire client
function FormulaireClient({ client, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: client?.nom || '',
    societe: client?.societe || '',
    email: client?.email || '',
    telephone: client?.telephone || '',
    adresse: client?.adresse || '',
    ville: client?.ville || '',
    nif: client?.nif || '',
    stat: client?.stat || '',
    conditions_paiement: client?.conditions_paiement || '',
    delai_paiement: client?.delai_paiement || 30,
    montant_mensuel: client?.montant_mensuel || 0,
    actif: client?.actif || 'OUI'
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        width: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {client ? '✏️ Modifier client' : '➕ Nouveau client'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={styles.label}>Nom *</label>
            <input
              style={styles.input}
              name="nom"
              value={form.nom}
              onChange={handleChange}
              placeholder="Nom du client"
              required
            />
          </div>
          <div>
            <label style={styles.label}>Société</label>
            <input
              style={styles.input}
              name="societe"
              value={form.societe}
              onChange={handleChange}
              placeholder="Nom de la société"
            />
          </div>
          <div>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label style={styles.label}>Téléphone</label>
            <input
              style={styles.input}
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
              placeholder="034 00 000 00"
            />
          </div>
          <div>
            <label style={styles.label}>Adresse</label>
            <input
              style={styles.input}
              name="adresse"
              value={form.adresse}
              onChange={handleChange}
              placeholder="Adresse"
            />
          </div>
          <div>
            <label style={styles.label}>Ville</label>
            <input
              style={styles.input}
              name="ville"
              value={form.ville}
              onChange={handleChange}
              placeholder="Ville"
            />
          </div>
          <div>
            <label style={styles.label}>NIF</label>
            <input
              style={styles.input}
              name="nif"
              value={form.nif}
              onChange={handleChange}
              placeholder="NIF"
            />
          </div>
          <div>
            <label style={styles.label}>STAT</label>
            <input
              style={styles.input}
              name="stat"
              value={form.stat}
              onChange={handleChange}
              placeholder="STAT"
            />
          </div>
          <div>
            <label style={styles.label}>Délai paiement (jours)</label>
            <input
              style={styles.input}
              name="delai_paiement"
              type="number"
              value={form.delai_paiement}
              onChange={handleChange}
            />
          </div>
          <div>
            <label style={styles.label}>Montant mensuel (Ar)</label>
            <input
              style={styles.input}
              name="montant_mensuel"
              type="number"
              value={form.montant_mensuel}
              onChange={handleChange}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Conditions de paiement</label>
            <input
              style={styles.input}
              name="conditions_paiement"
              value={form.conditions_paiement}
              onChange={handleChange}
              placeholder="Ex: Virement bancaire, chèque..."
            />
          </div>
          <div>
            <label style={styles.label}>Statut</label>
            <select
              style={styles.input}
              name="actif"
              value={form.actif}
              onChange={handleChange}
            >
              <option value="OUI">Actif</option>
              <option value="NON">Inactif</option>
            </select>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          marginTop: '20px'
        }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>
            Annuler
          </button>
          <button
            style={styles.boutonPrimaire}
            onClick={() => onSave(form)}
          >
            {client ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Page principale Clients
export default function Clients() {
  const { entreprise } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreActif, setFiltreActif] = useState('TOUS');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [clientSelectionne, setClientSelectionne] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    chargerClients();
  }, []);

  async function chargerClients() {
    try {
      const response = await clientService.getAll(entreprise.id);
      setClients(response.data.data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des clients.');
    } finally {
      setLoading(false);
    }
  }

  async function sauvegarderClient(form) {
    try {
      if (clientSelectionne) {
        await clientService.modifier(clientSelectionne.id, form);
        toast.success('Client modifié avec succès !');
      } else {
        await clientService.creer({
          ...form,
          entreprise_id: entreprise.id
        });
        toast.success('Client créé avec succès !');
      }
      setFormulaireOuvert(false);
      setClientSelectionne(null);
      chargerClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    }
  }

  async function toggleActif(client) {
    try {
      const nouveauStatut = client.actif === 'OUI' ? 'NON' : 'OUI';
      await clientService.toggleActif(client.id, nouveauStatut);
      toast.success(`Client ${nouveauStatut === 'OUI' ? 'activé' : 'désactivé'}.`);
      chargerClients();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour.');
    }
  }

  // Filtrer les clients
  const clientsFiltres = clients.filter(c => {
    const matchRecherche =
      c.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.societe?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.email?.toLowerCase().includes(recherche.toLowerCase());

    const matchActif =
      filtreActif === 'TOUS' ||
      (filtreActif === 'ACTIF' && c.actif === 'OUI') ||
      (filtreActif === 'INACTIF' && c.actif === 'NON');

    return matchRecherche && matchActif;
  });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      Chargement...
    </div>
  );

  return (
    <div>
      {/* Formulaire modal */}
      {formulaireOuvert && (
        <FormulaireClient
          client={clientSelectionne}
          onSave={sauvegarderClient}
          onCancel={() => {
            setFormulaireOuvert(false);
            setClientSelectionne(null);
          }}
        />
      )}

      {/* En-tête */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>👥 Clients</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {clients.length} client(s) au total
          </p>
        </div>
        <button
          style={styles.boutonPrimaire}
          onClick={() => {
            setClientSelectionne(null);
            setFormulaireOuvert(true);
          }}
        >
          + Nouveau client
        </button>
      </div>

      {/* Filtres */}
      <div style={{ ...styles.card, display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div>
          <label style={{ ...styles.label, marginBottom: '6px' }}>
            Rechercher un client
          </label>
          <input
            style={{ ...styles.input, maxWidth: '300px' }}
            placeholder="Nom, téléphone, email, ID..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['TOUS', 'ACTIF', 'INACTIF'].map(f => (
            <button
              key={f}
              onClick={() => setFiltreActif(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                background: filtreActif === f ? '#004d5a' : '#e0e0e0',
                color: filtreActif === f ? 'white' : '#333',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={styles.card}>
        {clientsFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucun client trouvé.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Code', 'Nom', 'Société', 'Email', 'Téléphone', 'Délai', 'Montant mensuel', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '13px',
                    color: '#555',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientsFiltres.map((client, i) => (
                <tr
                  key={client.id}
                  style={{
                    background: i % 2 === 0 ? 'white' : '#fafafa',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <td style={{ padding: '12px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                    {client.code_client}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    {client.nom}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {client.societe || '—'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {client.email || '—'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {client.telephone || '—'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {client.delai_paiement} jours
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    {Number(client.montant_mensuel || 0).toLocaleString('fr-FR')} Ar
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: client.actif === 'OUI' ? '#e8f5e9' : '#ffebee',
                      color: client.actif === 'OUI' ? '#2e7d32' : '#c62828'
                    }}>
                      {client.actif === 'OUI' ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        style={styles.boutonSecondaire}
                        onClick={() => {
                          setClientSelectionne(client);
                          setFormulaireOuvert(true);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        style={{
                          ...styles.boutonSecondaire,
                          color: client.actif === 'OUI' ? '#2e7d32' : '#c62828',
                          borderColor: client.actif === 'OUI' ? '#2e7d32' : '#c62828'
                        }}
                        onClick={() => toggleActif(client)}
                      >
                        {client.actif === 'OUI' ? '🟢' : '🔴'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}