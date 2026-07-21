import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { comptabiliteService } from '../services/api';

const styles = {
  boutonSecondaire: {
    background: 'white', color: '#004d5a', border: '2px solid #004d5a',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
  },
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  }
};

export default function GrandLivrePage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [grandLivre, setGrandLivre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compteFiltre, setCompteFiltre] = useState('');

  useEffect(() => { charger(); }, [annee]);

  async function charger() {
    setLoading(true);
    try {
      const res = await comptabiliteService.getGrandLivre(entreprise.id, annee);
      setGrandLivre(res.data);
    } catch (err) {
      toast.error('Erreur chargement grand livre.');
    } finally {
      setLoading(false);
    }
  }

  const comptesFiltres = grandLivre?.comptes?.filter(c =>
    !compteFiltre ||
    c.numero.includes(compteFiltre) ||
    c.libelle.toLowerCase().includes(compteFiltre.toLowerCase())
  ) || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>📒 Grand Livre</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            style={{ ...styles.input, width: '200px' }}
            placeholder="Filtrer par compte..."
            value={compteFiltre}
            onChange={e => setCompteFiltre(e.target.value)}
          />
          <select style={{ ...styles.input, width: '120px' }}
            value={annee} onChange={e => setAnnee(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button style={styles.boutonSecondaire}
            onClick={() => toast.info('Export PDF en cours de développement')}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          ⏳ Chargement du grand livre...
        </div>
      ) : grandLivre && (
        <>
          {comptesFiltres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
              Aucune écriture pour l'exercice {annee}.
            </div>
          ) : (
            comptesFiltres.map(compte => (
              <div key={compte.numero} style={styles.card}>
                {/* En-tête compte */}
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#004d5a', fontSize: '15px' }}>
                    Compte {compte.numero} — {compte.libelle}
                  </h3>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#666' }}>
                    <span>Total débit : <strong style={{ color: '#c62828' }}>
                      {Number(compte.total_debit).toLocaleString('fr-FR')} Ar
                    </strong></span>
                    <span>Total crédit : <strong style={{ color: '#2e7d32' }}>
                      {Number(compte.total_credit).toLocaleString('fr-FR')} Ar
                    </strong></span>
                    <span>Solde : <strong style={{
                      color: compte.solde_final >= 0 ? '#004d5a' : '#c62828'
                    }}>
                      {Number(compte.solde_final).toLocaleString('fr-FR')} Ar
                    </strong></span>
                  </div>
                </div>

                {/* Tableau des écritures */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#004d5a', color: 'white' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Libellé</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Débit</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Crédit</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compte.lignes.map((ligne, i) => (
                      <tr key={i} style={{
                        background: i % 2 === 0 ? 'white' : '#fafafa',
                        borderBottom: '1px solid #e0e0e0'
                      }}>
                        <td style={{ padding: '8px' }}>
                          {ligne.date ? new Date(ligne.date).toLocaleDateString('fr-FR') : ''}
                        </td>
                        <td style={{ padding: '8px' }}>{ligne.libelle}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#c62828' }}>
                          {ligne.debit > 0 ? Number(ligne.debit).toLocaleString('fr-FR') : ''}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#2e7d32' }}>
                          {ligne.credit > 0 ? Number(ligne.credit).toLocaleString('fr-FR') : ''}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold',
                          color: ligne.solde >= 0 ? '#004d5a' : '#c62828' }}>
                          {Number(ligne.solde).toLocaleString('fr-FR')} Ar
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#e8f5e9', fontWeight: 'bold' }}>
                      <td colSpan={2} style={{ padding: '8px' }}>TOTAL</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#c62828' }}>
                        {Number(compte.total_debit).toLocaleString('fr-FR')} Ar
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#2e7d32' }}>
                        {Number(compte.total_credit).toLocaleString('fr-FR')} Ar
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#004d5a' }}>
                        {Number(compte.solde_final).toLocaleString('fr-FR')} Ar
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}