import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { entrepriseService } from '../../services/api';

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

const tousLesModules = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'clients', label: '👥 Clients' },
  { key: 'factures', label: '🧾 Factures clients' },
  { key: 'fournisseurs', label: '🏭 Fournisseurs' },
  { key: 'paiements', label: '💰 Paiements (Tiers)' },
  { key: 'rh', label: '👤 Ressources Humaines' },
  { key: 'journal', label: '📒 Journal' }
];

function FormulaireForfait({ forfait, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: forfait?.nom || '',
    description: forfait?.description || '',
    prix: forfait?.prix || 0,
    modules_actifs: forfait?.modules_actifs || [],
    actif: forfait?.actif !== undefined ? forfait.actif : true
  });

  function toggleModule(key) {
    setForm(prev => ({
      ...prev,
      modules_actifs: prev.modules_actifs.includes(key)
        ? prev.modules_actifs.filter(m => m !== key)
        : [...prev.modules_actifs, key]
    }));
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {forfait ? '✏️ Modifier forfait' : '➕ Nouveau forfait'}
        </h3>

        {forfait && (
          <div style={{
            background: '#fff3e0', borderRadius: '8px', padding: '10px',
            marginBottom: '15px', fontSize: '12px', color: '#e65100'
          }}>
            ⚠️ Toute modification ici s'appliquera immédiatement à toutes
            les entreprises ayant souscrit à ce forfait.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Nom du forfait *</label>
            <input style={styles.input} value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Description</label>
            <textarea style={{ ...styles.input, height: '60px', resize: 'vertical' }}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Prix (Ar/mois) *</label>
            <input style={styles.input} type="number" value={form.prix}
              onChange={e => setForm({ ...form, prix: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Modules inclus</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {tousLesModules.map(m => (
                <label key={m.key} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', borderRadius: '8px',
                  background: form.modules_actifs.includes(m.key) ? '#e3f2fd' : '#f5f5f5',
                  cursor: 'pointer', fontSize: '13px'
                }}>
                  <input type="checkbox"
                    checked={form.modules_actifs.includes(m.key)}
                    onChange={() => toggleModule(m.key)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          {forfait && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <input type="checkbox" checked={form.actif}
                onChange={e => setForm({ ...form, actif: e.target.checked })} />
              Forfait actif (proposable aux nouvelles entreprises)
            </label>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire} onClick={() => onSave(form)}>
            {forfait ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminForfaits() {
  const [forfaits, setForfaits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(null);
  const [forfaitSelectionne, setForfaitSelectionne] = useState(null);

  useEffect(() => { chargerForfaits(); }, []);

  async function chargerForfaits() {
    try {
      const res = await entrepriseService.getForfaits();
      setForfaits(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement forfaits.');
    } finally {
      setLoading(false);
    }
  }

  async function creerForfait(form) {
    try {
      await entrepriseService.creerForfait(form);
      toast.success('Forfait créé !');
      setModalOuvert(null);
      chargerForfaits();
    } catch (err) {
      toast.error('Erreur création forfait.');
    }
  }

  async function modifierForfait(form) {
    try {
      await entrepriseService.modifierForfait(forfaitSelectionne.id, form);
      toast.success('Forfait modifié ! Les changements sont appliqués à toutes les entreprises concernées.');
      setModalOuvert(null);
      setForfaitSelectionne(null);
      chargerForfaits();
    } catch (err) {
      toast.error('Erreur modification forfait.');
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modalOuvert === 'creer' && (
        <FormulaireForfait onSave={creerForfait} onCancel={() => setModalOuvert(null)} />
      )}
      {modalOuvert === 'modifier' && forfaitSelectionne && (
        <FormulaireForfait
          forfait={forfaitSelectionne}
          onSave={modifierForfait}
          onCancel={() => { setModalOuvert(null); setForfaitSelectionne(null); }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>📦 Forfaits</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {forfaits.length} forfait(s) disponible(s)
          </p>
        </div>
        <button style={styles.boutonPrimaire} onClick={() => setModalOuvert('creer')}>
          + Nouveau forfait
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {forfaits.map(f => (
          <div key={f.id} style={{ ...styles.card, opacity: f.actif === false ? 0.6 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ color: '#004d5a', margin: 0 }}>{f.nom}</h3>
              {f.actif === false && (
                <span style={{ fontSize: '11px', background: '#ffebee', color: '#c62828',
                  padding: '4px 8px', borderRadius: '12px' }}>Inactif</span>
              )}
            </div>
            <p style={{ color: '#666', fontSize: '13px', margin: '8px 0' }}>{f.description}</p>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#2e7d32', margin: '10px 0' }}>
              {Number(f.prix).toLocaleString('fr-FR')} Ar<span style={{ fontSize: '13px', color: '#666' }}>/mois</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' }}>
              {(f.modules_actifs || []).map(m => {
                const moduleInfo = tousLesModules.find(tm => tm.key === m);
                return (
                  <span key={m} style={{
                    fontSize: '11px', background: '#e3f2fd', color: '#1565c0',
                    padding: '4px 10px', borderRadius: '12px'
                  }}>
                    {moduleInfo?.label || m}
                  </span>
                );
              })}
            </div>
            <button style={styles.boutonSecondaire}
              onClick={() => { setForfaitSelectionne(f); setModalOuvert('modifier'); }}>
              ✏️ Modifier
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}