import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

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
    display: 'block', marginBottom: '5px', fontWeight: 'bold',
    color: '#333', fontSize: '13px'
  },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  }
};

const journaux = [
  { id: 'BANQUE', label: '🏦 Banque', description: 'Virement, Carte, Chèque' },
  { id: 'ESPECES', label: '💵 Espèces', description: 'Paiements en espèces' },
  { id: 'MVOLA', label: '📱 Mvola', description: 'Paiements Mvola' },
  { id: 'ORANGE', label: '🟠 Orange Money', description: 'Paiements Orange Money' },
  { id: 'AIRTEL', label: '🔴 Airtel Money', description: 'Paiements Airtel Money' },
  { id: 'ASSOCIE', label: '🤝 Associé', description: 'Opérations associé' }
];

function OngletJournal({ typeJournal }) {
  const { entreprise } = useAuth();
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => { chargerOperations(); }, [typeJournal]);

  async function chargerOperations() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type_journal: typeJournal,
        ...(dateDebut && { date_debut: dateDebut }),
        ...(dateFin && { date_fin: dateFin })
      });
      const res = await fetch(
        `http://localhost:5000/api/journal/${entreprise.id}?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      setOperations(data.data || []);
    } catch (err) {
      toast.error('Erreur chargement journal.');
    } finally {
      setLoading(false);
    }
  }

  async function synchroniser() {
    try {
      toast.info('Synchronisation en cours...');
      const res = await fetch(
        `http://localhost:5000/api/journal/synchroniser/${entreprise.id}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.nombre} opération(s) synchronisée(s) !`);
        chargerOperations();
      }
    } catch (err) {
      toast.error('Erreur synchronisation.');
    }
  }

  function exporterExcel() {
    const XLSX = require('xlsx');
    const donnees = operations.map(op => ({
      'N°': op.numero_ligne,
      'Date': op.date_operation
        ? new Date(op.date_operation).toLocaleDateString('fr-FR')
        : '',
      'Compte': op.numero_compte || '',
      'Libellé': op.libelle || '',
      'Débit (Ar)': op.debit || 0,
      'Crédit (Ar)': op.credit || 0,
      'Solde (Ar)': op.solde_cumul || 0,
      'N° Facture': op.numero_facture || '',
      'Source': op.source || ''
    }));

    // Ligne totaux
    donnees.push({
      'N°': '',
      'Date': '',
      'Compte': '',
      'Libellé': 'TOTAL',
      'Débit (Ar)': operations.reduce((s, op) => s + Number(op.debit || 0), 0),
      'Crédit (Ar)': operations.reduce((s, op) => s + Number(op.credit || 0), 0),
      'Solde (Ar)': operations.length > 0
        ? Number(operations[operations.length - 1].solde_cumul)
        : 0,
      'N° Facture': '',
      'Source': ''
    });

    const ws = XLSX.utils.json_to_sheet(donnees);
    ws['!cols'] = [
      { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 35 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Journal ${typeJournal}`);
    XLSX.writeFile(wb, `Journal_${typeJournal}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
    toast.success('Export Excel téléchargé !');
  }

  // Totaux
  const totalDebit = operations.reduce((s, op) => s + Number(op.debit || 0), 0);
  const totalCredit = operations.reduce((s, op) => s + Number(op.credit || 0), 0);
  const soldeFinal = operations.length > 0
    ? Number(operations[operations.length - 1].solde_cumul)
    : 0;

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {/* Filtres */}
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={styles.label}>Date début</label>
            <input style={{ ...styles.input, width: '160px' }} type="date"
              value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Date fin</label>
            <input style={{ ...styles.input, width: '160px' }} type="date"
              value={dateFin} onChange={e => setDateFin(e.target.value)} />
          </div>
          <button style={styles.boutonPrimaire} onClick={chargerOperations}>
            🔍 Filtrer
          </button>
          <button style={{ ...styles.boutonSecondaire, color: '#e65100', borderColor: '#e65100' }}
            onClick={synchroniser}>
            🔄 Synchroniser
          </button>
          <button style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
            onClick={exporterExcel}>
            📊 Excel
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div style={{ ...styles.card, textAlign: 'center', marginBottom: 0 }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Débit</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c62828' }}>
            {totalDebit.toLocaleString('fr-FR')} Ar
          </div>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', marginBottom: 0 }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Crédit</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
            {totalCredit.toLocaleString('fr-FR')} Ar
          </div>
        </div>
        <div style={{ ...styles.card, textAlign: 'center', marginBottom: 0 }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Solde</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold',
            color: soldeFinal >= 0 ? '#2e7d32' : '#c62828' }}>
            {soldeFinal.toLocaleString('fr-FR')} Ar
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div style={styles.card}>
        {operations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucune opération trouvée.
            <br />
            <button style={{ ...styles.boutonSecondaire, marginTop: '10px' }}
              onClick={synchroniser}>
              🔄 Synchroniser maintenant
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#004d5a', color: 'white' }}>
                {['Date', 'Compte', 'Libellé', 'Débit (Ar)', 'Crédit (Ar)', 'Solde (Ar)', 'N° Facture'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: h.includes('Ar') ? 'right' : 'left', fontSize: '12px' }}>
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
                  
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    {op.date_operation
                      ? new Date(op.date_operation).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', fontWeight: 'bold', color: '#004d5a' }}>
                    {op.numero_compte || '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>
                    {op.libelle || '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right', color: '#c62828' }}>
                    {Number(op.debit || 0) > 0
                      ? Number(op.debit).toLocaleString('fr-FR')
                      : '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right', color: '#2e7d32' }}>
                    {Number(op.credit || 0) > 0
                      ? Number(op.credit).toLocaleString('fr-FR')
                      : '—'}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right',
                    fontWeight: 'bold',
                    color: Number(op.solde_cumul) >= 0 ? '#2e7d32' : '#c62828' }}>
                    {Number(op.solde_cumul || 0).toLocaleString('fr-FR')}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
                    {op.numero_facture || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#004d5a', color: 'white' }}>
                <td colSpan={4} style={{ padding: '10px', fontWeight: 'bold' }}>TOTAL</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                  {totalDebit.toLocaleString('fr-FR')}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                  {totalCredit.toLocaleString('fr-FR')}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                  {soldeFinal.toLocaleString('fr-FR')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [ongletActif, setOngletActif] = useState('BANQUE');

  return (
    <div>
      {/* Onglets */}
      <div style={{
        display: 'flex', gap: '0', marginBottom: '20px',
        borderBottom: '2px solid #e0e0e0', overflowX: 'auto'
      }}>
        {journaux.map(j => (
          <button key={j.id} onClick={() => setOngletActif(j.id)}
            style={{
              padding: '12px 20px', border: 'none', whiteSpace: 'nowrap',
              borderBottom: ongletActif === j.id ? '3px solid #004d5a' : '3px solid transparent',
              background: 'transparent',
              color: ongletActif === j.id ? '#004d5a' : '#666',
              fontWeight: ongletActif === j.id ? 'bold' : 'normal',
              fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
            }}>
            {j.label}
          </button>
        ))}
      </div>

      <OngletJournal key={ongletActif} typeJournal={ongletActif} />
    </div>
  );
}