import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { fournisseurListeService } from '../services/api';

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
  boutonSecondaire: {
    background: 'white',
    color: '#004d5a',
    border: '2px solid #004d5a',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  boutonDanger: {
    background: 'white',
    color: '#c62828',
    border: '2px solid #c62828',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
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
  },
  modal: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    width: '650px',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

// Formulaire fournisseur
function FormulaireFournisseur({ fournisseur, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: fournisseur?.nom || '',
    adresse: fournisseur?.adresse || '',
    ville: fournisseur?.ville || '',
    nif: fournisseur?.nif || '',
    stat: fournisseur?.stat || '',
    rcs: fournisseur?.rcs || '',
    telephone: fournisseur?.telephone || '',
    email: fournisseur?.email || '',
    conditions_paiement: fournisseur?.conditions_paiement || '',
    delai_paiement: fournisseur?.delai_paiement || 30
  });

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {fournisseur ? '✏️ Modifier fournisseur' : '➕ Nouveau fournisseur'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Nom *</label>
            <input
              style={styles.input}
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Nom du fournisseur"
            />
          </div>
          <div>
            <label style={styles.label}>Téléphone</label>
            <input
              style={styles.input}
              value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              placeholder="034 00 000 00"
            />
          </div>
          <div>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@fournisseur.com"
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Adresse</label>
            <input
              style={styles.input}
              value={form.adresse}
              onChange={e => setForm({ ...form, adresse: e.target.value })}
              placeholder="Adresse"
            />
          </div>
          <div>
            <label style={styles.label}>Ville</label>
            <input
              style={styles.input}
              value={form.ville}
              onChange={e => setForm({ ...form, ville: e.target.value })}
              placeholder="Ville"
            />
          </div>
          <div>
            <label style={styles.label}>NIF</label>
            <input
              style={styles.input}
              value={form.nif}
              onChange={e => setForm({ ...form, nif: e.target.value })}
              placeholder="NIF"
            />
          </div>
          <div>
            <label style={styles.label}>STAT</label>
            <input
              style={styles.input}
              value={form.stat}
              onChange={e => setForm({ ...form, stat: e.target.value })}
              placeholder="STAT"
            />
          </div>
          <div>
            <label style={styles.label}>RCS</label>
            <input
              style={styles.input}
              value={form.rcs}
              onChange={e => setForm({ ...form, rcs: e.target.value })}
              placeholder="RCS"
            />
          </div>
          <div>
            <label style={styles.label}>Conditions de paiement</label>
            <input
              style={styles.input}
              value={form.conditions_paiement}
              onChange={e => setForm({ ...form, conditions_paiement: e.target.value })}
              placeholder="Ex: Virement, chèque..."
            />
          </div>
          <div>
            <label style={styles.label}>Délai paiement (jours)</label>
            <input
              style={styles.input}
              type="number"
              value={form.delai_paiement}
              onChange={e => setForm({ ...form, delai_paiement: Number(e.target.value) })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={styles.boutonPrimaire}
            onClick={() => onSave(form)}
          >
            {fournisseur ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal documents
function ModalDocuments({ fournisseur, onClose, onUpload, onSupprimer }) {
  const [fichier, setFichier] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!fichier) return;
    setUploading(true);
    await onUpload(fournisseur.id, fichier);
    setFichier(null);
    setUploading(false);
  }

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '500px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          📁 Documents — {fournisseur.nom}
        </h3>

        {/* Upload nouveau document */}
        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>Ajouter un document (PDF ou image)</label>
          <input
            style={styles.input}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setFichier(e.target.files[0])}
          />
          {fichier && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>{fichier.name}</span>
              <button
                style={styles.boutonPrimaire}
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Upload...' : '📤 Uploader'}
              </button>
            </div>
          )}
        </div>

        {/* Liste documents existants */}
        <div>
          <label style={styles.label}>Documents existants</label>
          {(!fournisseur.documents_url || fournisseur.documents_url.length === 0) ? (
            <p style={{ color: '#666', fontSize: '13px' }}>Aucun document.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fournisseur.documents_url.map((doc, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#f5f5f5',
                  borderRadius: '6px'
                }}>
                  <span style={{ fontSize: '13px' }}>📄 {doc.nom}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...styles.boutonSecondaire, textDecoration: 'none', padding: '4px 8px' }}
                    >
                      👁️
                    </a>
                    <button
                      style={{ ...styles.boutonDanger, padding: '4px 8px' }}
                      onClick={() => onSupprimer(fournisseur.id, doc.url)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// Page principale Liste Fournisseurs
export default function ListeFournisseurs() {
  const { entreprise } = useAuth();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [modalOuvert, setModalOuvert] = useState(null);
  const [fournisseurSelectionne, setFournisseurSelectionne] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerFournisseurs(); }, []);

  async function chargerFournisseurs() {
    try {
      const res = await fournisseurListeService.getAll(entreprise.id);
      setFournisseurs(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement fournisseurs.');
    } finally {
      setLoading(false);
    }
  }

  async function sauvegarderFournisseur(form) {
    try {
      if (fournisseurSelectionne) {
        await fournisseurListeService.modifier(fournisseurSelectionne.id, form);
        toast.success('Fournisseur modifié !');
      } else {
        await fournisseurListeService.creer({ ...form, entreprise_id: entreprise.id });
        toast.success('Fournisseur créé !');
      }
      setModalOuvert(null);
      setFournisseurSelectionne(null);
      chargerFournisseurs();
    } catch (err) {
      toast.error('Erreur sauvegarde.');
    }
  }

  async function toggleActif(fournisseur) {
    try {
      await fournisseurListeService.toggleActif(fournisseur.id, !fournisseur.actif);
      toast.success(`Fournisseur ${!fournisseur.actif ? 'activé' : 'désactivé'}.`);
      chargerFournisseurs();
    } catch (err) {
      toast.error('Erreur mise à jour.');
    }
  }

  async function uploadDocument(id, fichier) {
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(fichier);
      });

      await fournisseurListeService.uploadDocument(id, {
        fichier_base64: base64,
        nom_fichier: fichier.name,
        type_mime: fichier.type
      });

      toast.success('Document uploadé !');
      chargerFournisseurs();
    } catch (err) {
      toast.error('Erreur upload.');
    }
  }

  async function supprimerDocument(id, url) {
    try {
      await fournisseurListeService.supprimerDocument(id, url);
      toast.success('Document supprimé.');
      chargerFournisseurs();
    } catch (err) {
      toast.error('Erreur suppression.');
    }
  }

  const fournisseursFiltres = fournisseurs.filter(f =>
    f.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    f.email?.toLowerCase().includes(recherche.toLowerCase()) ||
    f.telephone?.includes(recherche)
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {/* Modals */}
      {modalOuvert === 'formulaire' && (
        <FormulaireFournisseur
          fournisseur={fournisseurSelectionne}
          onSave={sauvegarderFournisseur}
          onCancel={() => { setModalOuvert(null); setFournisseurSelectionne(null); }}
        />
      )}
      {modalOuvert === 'documents' && fournisseurSelectionne && (
        <ModalDocuments
          fournisseur={fournisseurSelectionne}
          onClose={() => { setModalOuvert(null); setFournisseurSelectionne(null); }}
          onUpload={uploadDocument}
          onSupprimer={supprimerDocument}
        />
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>🏭 Fournisseurs</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {fournisseurs.length} fournisseur(s) au total
          </p>
        </div>
        <button
          style={styles.boutonPrimaire}
          onClick={() => { setFournisseurSelectionne(null); setModalOuvert('formulaire'); }}
        >
          + Nouveau fournisseur
        </button>
      </div>

      {/* Filtre */}
      <div style={styles.card}>
        <div>
          <label style={styles.label}>Rechercher un fournisseur</label>
          <input
            style={{ ...styles.input, maxWidth: '350px' }}
            placeholder="Nom, email, téléphone..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau */}
      <div style={styles.card}>
        {fournisseursFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucun fournisseur trouvé.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Code', 'Nom', 'Téléphone', 'Email', 'NIF', 'STAT', 'RCS', 'Délai', 'Docs', 'Statut', 'Actions'].map(h => (
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
              {fournisseursFiltres.map((f, i) => (
                <tr key={f.id} style={{
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                    {f.code_fournisseur}
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{f.nom}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{f.telephone || '—'}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{f.email || '—'}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{f.nif || '—'}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{f.stat || '—'}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{f.rcs || '—'}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{f.delai_paiement} jours</td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>
                    <span style={{
                      background: f.documents_url?.length > 0 ? '#e8f5e9' : '#f5f5f5',
                      color: f.documents_url?.length > 0 ? '#2e7d32' : '#666',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {f.documents_url?.length || 0} doc(s)
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: f.actif ? '#e8f5e9' : '#ffebee',
                      color: f.actif ? '#2e7d32' : '#c62828'
                    }}>
                      {f.actif ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                        onClick={() => { setFournisseurSelectionne(f); setModalOuvert('formulaire'); }}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                        onClick={() => { setFournisseurSelectionne(f); setModalOuvert('documents'); }}
                        title="Documents"
                      >
                        📁
                      </button>
                      <button
                        style={{
                          ...styles.boutonSecondaire,
                          padding: '4px 8px',
                          color: f.actif ? '#2e7d32' : '#c62828',
                          borderColor: f.actif ? '#2e7d32' : '#c62828'
                        }}
                        onClick={() => toggleActif(f)}
                        title={f.actif ? 'Désactiver' : 'Activer'}
                      >
                        {f.actif ? '🟢' : '🔴'}
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