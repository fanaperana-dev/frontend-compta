import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { tiersListeService } from '../services/api';

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
  boutonDanger: {
    background: 'white', color: '#c62828', border: '2px solid #c62828',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
  },
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  },
  label: {
    display: 'block', marginBottom: '5px', fontWeight: 'bold',
    color: '#333', fontSize: '13px'
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
    width: '650px', maxHeight: '85vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

function FormulaireTiers({ tiers, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: tiers?.nom || '',
    adresse: tiers?.adresse || '',
    ville: tiers?.ville || '',
    nif: tiers?.nif || '',
    stat: tiers?.stat || '',
    rcs: tiers?.rcs || '',
    telephone: tiers?.telephone || '',
    email: tiers?.email || '',
    conditions_paiement: tiers?.conditions_paiement || '',
    delai_paiement: tiers?.delai_paiement || 30
  });

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {tiers ? '✏️ Modifier tiers' : '➕ Nouveau tiers'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Nom *</label>
            <input style={styles.input} value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Nom du tiers" />
          </div>
          <div>
            <label style={styles.label}>Téléphone</label>
            <input style={styles.input} value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              placeholder="034 00 000 00" />
          </div>
          <div>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@tiers.com" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Adresse</label>
            <input style={styles.input} value={form.adresse}
              onChange={e => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Ville</label>
            <input style={styles.input} value={form.ville}
              onChange={e => setForm({ ...form, ville: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>NIF</label>
            <input style={styles.input} value={form.nif}
              onChange={e => setForm({ ...form, nif: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>STAT</label>
            <input style={styles.input} value={form.stat}
              onChange={e => setForm({ ...form, stat: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>RCS</label>
            <input style={styles.input} value={form.rcs}
              onChange={e => setForm({ ...form, rcs: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Conditions de paiement</label>
            <input style={styles.input} value={form.conditions_paiement}
              onChange={e => setForm({ ...form, conditions_paiement: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Délai paiement (jours)</label>
            <input style={styles.input} type="number" value={form.delai_paiement}
              onChange={e => setForm({ ...form, delai_paiement: Number(e.target.value) })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire} onClick={() => onSave(form)}>
            {tiers ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalDocuments({ tiers, onClose, onUpload, onSupprimer }) {
  const [fichier, setFichier] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!fichier) return;
    setUploading(true);
    await onUpload(tiers.id, fichier);
    setFichier(null);
    setUploading(false);
  }

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '500px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>📁 Documents — {tiers.nom}</h3>
        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>Ajouter un document</label>
          <input style={styles.input} type="file" accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setFichier(e.target.files[0])} />
          {fichier && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>{fichier.name}</span>
              <button style={styles.boutonPrimaire} onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Upload...' : '📤 Uploader'}
              </button>
            </div>
          )}
        </div>
        <div>
          <label style={styles.label}>Documents existants</label>
          {(!tiers.documents_url || tiers.documents_url.length === 0) ? (
            <p style={{ color: '#666', fontSize: '13px' }}>Aucun document.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tiers.documents_url.map((doc, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: '#f5f5f5', borderRadius: '6px'
                }}>
                  <span style={{ fontSize: '13px' }}>📄 {doc.nom}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a href={doc.url} target="_blank" rel="noreferrer"
                      style={{ ...styles.boutonSecondaire, textDecoration: 'none', padding: '4px 8px' }}>
                      👁️
                    </a>
                    <button style={{ ...styles.boutonDanger, padding: '4px 8px' }}
                      onClick={() => onSupprimer(tiers.id, doc.url)}>🗑️</button>
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

export default function ListeTiers() {
  const { entreprise } = useAuth();
  const [tiersList, setTiersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [modalOuvert, setModalOuvert] = useState(null);
  const [tiersSelectionne, setTiersSelectionne] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerTiers(); }, []);

  async function chargerTiers() {
    try {
      const res = await tiersListeService.getAll(entreprise.id);
      setTiersList(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement tiers.');
    } finally {
      setLoading(false);
    }
  }

  async function sauvegarderTiers(form) {
    try {
      if (tiersSelectionne) {
        await tiersListeService.modifier(tiersSelectionne.id, form);
        toast.success('Tiers modifié !');
      } else {
        await tiersListeService.creer({ ...form, entreprise_id: entreprise.id });
        toast.success('Tiers créé !');
      }
      setModalOuvert(null);
      setTiersSelectionne(null);
      chargerTiers();
    } catch (err) {
      toast.error('Erreur sauvegarde.');
    }
  }

  async function toggleActif(t) {
    try {
      await tiersListeService.toggleActif(t.id, !t.actif);
      toast.success(`Tiers ${!t.actif ? 'activé' : 'désactivé'}.`);
      chargerTiers();
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
      await tiersListeService.uploadDocument(id, {
        fichier_base64: base64, nom_fichier: fichier.name, type_mime: fichier.type
      });
      toast.success('Document uploadé !');
      chargerTiers();
    } catch (err) {
      toast.error('Erreur upload.');
    }
  }

  async function supprimerDocument(id, url) {
    try {
      await tiersListeService.supprimerDocument(id, url);
      toast.success('Document supprimé.');
      chargerTiers();
    } catch (err) {
      toast.error('Erreur suppression.');
    }
  }

  const tiersFiltres = tiersList.filter(t =>
    t.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    t.email?.toLowerCase().includes(recherche.toLowerCase()) ||
    t.telephone?.includes(recherche)
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modalOuvert === 'formulaire' && (
        <FormulaireTiers
          tiers={tiersSelectionne}
          onSave={sauvegarderTiers}
          onCancel={() => { setModalOuvert(null); setTiersSelectionne(null); }}
        />
      )}
      {modalOuvert === 'documents' && tiersSelectionne && (
        <ModalDocuments
          tiers={tiersSelectionne}
          onClose={() => { setModalOuvert(null); setTiersSelectionne(null); }}
          onUpload={uploadDocument}
          onSupprimer={supprimerDocument}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>🏢 Tiers</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {tiersList.length} tiers au total
          </p>
        </div>
        <button style={styles.boutonPrimaire}
          onClick={() => { setTiersSelectionne(null); setModalOuvert('formulaire'); }}>
          + Nouveau tiers
        </button>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>Rechercher</label>
        <input style={{ ...styles.input, maxWidth: '350px' }}
          placeholder="Nom, email, téléphone..."
          value={recherche} onChange={e => setRecherche(e.target.value)} />
      </div>

      <div style={styles.card}>
        {tiersFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Aucun tiers trouvé.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Code', 'Nom', 'Téléphone', 'Email', 'NIF', 'Délai', 'Docs', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiersFiltres.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>{t.code_tiers}</td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{t.nom}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{t.telephone || '—'}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{t.email || '—'}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{t.nif || '—'}</td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>{t.delai_paiement} jours</td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>
                    <span style={{
                      background: t.documents_url?.length > 0 ? '#e8f5e9' : '#f5f5f5',
                      color: t.documents_url?.length > 0 ? '#2e7d32' : '#666',
                      padding: '3px 8px', borderRadius: '12px', fontSize: '12px'
                    }}>
                      {t.documents_url?.length || 0} doc(s)
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                      background: t.actif ? '#e8f5e9' : '#ffebee',
                      color: t.actif ? '#2e7d32' : '#c62828'
                    }}>
                      {t.actif ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                        onClick={() => { setTiersSelectionne(t); setModalOuvert('formulaire'); }} title="Modifier">✏️</button>
                      <button style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                        onClick={() => { setTiersSelectionne(t); setModalOuvert('documents'); }} title="Documents">📁</button>
                      <button style={{
                        ...styles.boutonSecondaire, padding: '4px 8px',
                        color: t.actif ? '#2e7d32' : '#c62828',
                        borderColor: t.actif ? '#2e7d32' : '#c62828'
                      }} onClick={() => toggleActif(t)} title={t.actif ? 'Désactiver' : 'Activer'}>
                        {t.actif ? '🟢' : '🔴'}
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