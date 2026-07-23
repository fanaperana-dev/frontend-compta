import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { comptabiliteService } from '../services/api';

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
    width: '500px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};
const comptesContrepartie = [
    { key: '51', label: '51 - Banque' },
    { key: '521', label: '52 - MVola' },
    { key: '522', label: '52 - Orange Money' },
    { key: '523', label: '52 - Airtel Money' },
    { key: '53', label: '53 - Caisse' },
    { key: '21', label: '21 - Immobilisations corporelles' },
    { key: '20', label: '20 - Immobilisations incorporelles' },
    { key: 'autre', label: 'Autre (préciser dans libellé)' }
  ];
function ModalOperation({ onSave, onCancel }) {
  const [form, setForm] = useState({
    nom_associe: '',
    type: 'AVANCE',
    montant: 0,
    libelle: '',
    compte_contrepartie: '53',
    date_operation: new Date().toISOString().split('T')[0]
  });
  const [enCours, setEnCours] = useState(false);
  

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          ➕ Enregistrer une opération
        </h3>
        <div style={{ background: '#e3f2fd', borderRadius: '8px',
          padding: '12px', marginBottom: '15px', fontSize: '12px', color: '#1565c0' }}>
          <strong>Avance</strong> : L'associé avance de l'argent à l'entreprise<br/>
          <strong>Remboursement</strong> : L'entreprise rembourse l'associé
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Nom de l'associé *</label>
            <input style={styles.input} value={form.nom_associe}
              onChange={e => setForm({ ...form, nom_associe: e.target.value })}
              placeholder="Ex: Jean Rakoto" />
          </div>
          <div>
            <label style={styles.label}>Type *</label>
            <select style={styles.input} value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="AVANCE">Avance de l'associé → entreprise</option>
              <option value="REMBOURSEMENT">Remboursement entreprise → associé</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>
              {form.type === 'AVANCE' 
                ? 'Compte débité (destination de l\'argent) *'
                : 'Compte crédité (source du remboursement) *'}
            </label>
            <select style={styles.input} value={form.compte_contrepartie}
                onChange={e => setForm({ ...form, compte_contrepartie: e.target.value })}>
                {comptesContrepartie
                  .filter(c => form.type === 'REMBOURSEMENT' 
                    ? ['51', '521', '522', '523', '524', '53', 'autre'].includes(c.key)
                    : true)
                  .map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
               ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Montant (Ar) *</label>
            <input style={styles.input} type="number" value={form.montant}
              onChange={e => setForm({ ...form, montant: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Libellé</label>
            <input style={styles.input} value={form.libelle}
              onChange={e => setForm({ ...form, libelle: e.target.value })}
              placeholder="Ex: Achat véhicule Toyota, Remboursement partiel..." />
          </div>
          <div>
            <label style={styles.label}>Date *</label>
            <input style={styles.input} type="date" value={form.date_operation}
              onChange={e => setForm({ ...form, date_operation: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours}
            onClick={async () => {
              setEnCours(true);
              await onSave(form);
              setEnCours(false);
            }}>
            {enCours ? '⏳ Enregistrement...' : '✅ Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompteCourantAssociesPage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [operations, setOperations] = useState([]);
  const [soldes, setSoldes] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalOuvert, setModalOuvert] = useState(false);

  useEffect(() => { charger(); }, [annee]);

  async function charger() {
    setLoading(true);
    try {
      const res = await comptabiliteService.getCompteCourant(entreprise.id, annee);
      setOperations(res.data.data || []);
      setSoldes(res.data.soldes || {});
    } catch (err) {
      toast.error('Erreur chargement compte courant.');
    } finally {
      setLoading(false);
    }
  }

  async function ajouterOperation(form) {
    try {
      await comptabiliteService.ajouterCompteCourant({
        ...form, entreprise_id: entreprise.id
      });
      toast.success('Opération enregistrée !');
      setModalOuvert(false);
      charger();
    } catch (err) {
      toast.error('Erreur enregistrement.');
    }
  }

  async function supprimerOperation(id) {
    if (!window.confirm('Supprimer cette opération ?')) return;
    try {
      await comptabiliteService.supprimerCompteCourant(id);
      toast.success('Opération supprimée.');
      charger();
    } catch (err) {
      toast.error('Erreur suppression.');
    }
  }

  // Calculer solde total dû aux associés
  const totalDu = Object.values(soldes).reduce((s, v) => s + v, 0);

  return (
    <div>
      {modalOuvert && (
        <ModalOperation
          onSave={ajouterOperation}
          onCancel={() => setModalOuvert(false)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>👥 Compte courant associés</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select style={{ ...styles.input, width: '120px' }}
            value={annee} onChange={e => setAnnee(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button style={styles.boutonPrimaire} onClick={() => setModalOuvert(true)}>
            + Nouvelle opération
          </button>
        </div>
      </div>

      {/* Soldes par associé */}
      {Object.keys(soldes).length > 0 && (
        <div style={{ display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(Object.keys(soldes).length + 1, 4)}, 1fr)`,
          gap: '15px', marginBottom: '20px' }}>
          {Object.entries(soldes).map(([nom, solde]) => (
            <div key={nom} style={{ ...styles.card, marginBottom: 0,
              borderLeft: '4px solid #004d5a' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>👤 {nom}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold',
                color: solde > 0 ? '#c62828' : '#2e7d32' }}>
                {Number(solde).toLocaleString('fr-FR')} Ar
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {solde > 0 ? 'Dû à l\'associé' : 'Crédit associé'}
              </div>
            </div>
          ))}
          <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #c62828' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>💰 Total dû aux associés</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c62828' }}>
              {Number(totalDu).toLocaleString('fr-FR')} Ar
            </div>
          </div>
        </div>
      )}

      {/* Liste opérations */}
      <div style={styles.card}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          Historique des opérations {annee}
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
            ⏳ Chargement...
          </div>
        ) : operations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
            Aucune opération pour {annee}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Date', 'Associé', 'Type','Contrepartie',  'Libellé', 'Montant', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left',
                    fontSize: '12px', color: '#555', borderBottom: '2px solid #e0e0e0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operations.map((op, i) => (
                <tr key={op.id} style={{
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <td style={{ padding: '10px', fontSize: '13px' }}>
                    {new Date(op.date_operation).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                    {op.nom_associe}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px',
                      fontSize: '11px', fontWeight: 'bold',
                      background: op.type === 'AVANCE' ? '#ffebee' : '#e8f5e9',
                      color: op.type === 'AVANCE' ? '#c62828' : '#2e7d32' }}>
                      {op.type === 'AVANCE' ? '📥 Avance' : '📤 Remboursement'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                    {comptesContrepartie.find(c => c.key === op.compte_contrepartie)?.label || op.compte_contrepartie || '—'}
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                    {op.libelle || '—'}
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold',
                    color: op.type === 'AVANCE' ? '#c62828' : '#2e7d32' }}>
                    {op.type === 'AVANCE' ? '+' : '-'}
                    {Number(op.montant).toLocaleString('fr-FR')} Ar
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button style={styles.boutonDanger}
                      onClick={() => supprimerOperation(op.id)}>
                      🗑️
                    </button>
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