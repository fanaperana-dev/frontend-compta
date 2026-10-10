import React from 'react';
import { useAuth } from '../context/AuthContext';
import { styles, fmt, useEtat, SelecteurAnnee, BandeauEtat } from './EtatsCommuns';

const th = { padding: '8px', textAlign: 'right' };

export default function GrandLivrePage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = React.useState(new Date().getFullYear());
  const [filtre, setFiltre] = React.useState('');
  const [ouverts, setOuverts] = React.useState({});
  const { etat, loading } = useEtat('grand-livre', entreprise.id, annee);
  const dispo = etat && etat.disponible;

  const comptes = (dispo ? etat.comptes : []).filter(c =>
    !filtre || c.numero.startsWith(filtre.replace(/\D/g, '')) && /^\d+$/.test(filtre.trim()) ||
    (filtre && c.libelle.toLowerCase().includes(filtre.toLowerCase())));
  const basculer = (n) => setOuverts(o => ({ ...o, [n]: !o[n] }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>📒 Grand Livre</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input style={{ ...styles.input, width: '220px' }} placeholder="Filtrer par compte ou libellé..."
            value={filtre} onChange={e => setFiltre(e.target.value)} />
          <SelecteurAnnee annee={annee} setAnnee={setAnnee} />
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>⏳ Chargement du grand livre...</div>}
      {!loading && <BandeauEtat etat={etat} annee={annee} />}

      {!loading && dispo && (comptes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>Aucune écriture pour l'exercice {annee}.</div>
      ) : comptes.map(c => {
        const ouvert = !!ouverts[c.numero];
        return (
          <div key={c.numero} style={{ ...styles.card, padding: '14px 20px', marginBottom: '12px' }}>
            <div onClick={() => basculer(c.numero)} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, color: '#004d5a', fontSize: '15px' }}>
                {ouvert ? '▾' : '▸'} Compte {c.numero}{c.libelle ? ` — ${c.libelle}` : ''}
              </h3>
              <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#666' }}>
                <span>Débit : <strong style={{ color: '#c62828' }}>{fmt(c.total_debit)} Ar</strong></span>
                <span>Crédit : <strong style={{ color: '#2e7d32' }}>{fmt(c.total_credit)} Ar</strong></span>
                <span>Solde : <strong style={{ color: c.solde_final >= 0 ? '#004d5a' : '#c62828' }}>{fmt(c.solde_final)} Ar</strong></span>
              </div>
            </div>

            {ouvert && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' }}>
                <thead>
                  <tr style={{ background: '#004d5a', color: 'white' }}>
                    <th style={{ ...th, textAlign: 'left' }}>Date</th>
                    <th style={{ ...th, textAlign: 'left' }}>Journal</th>
                    <th style={{ ...th, textAlign: 'left' }}>Libellé</th>
                    <th style={th}>Débit</th><th style={th}>Crédit</th><th style={th}>Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {Math.abs(c.ouverture.solde) >= 0.005 && (
                    <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', fontStyle: 'italic' }}>
                      <td style={{ padding: '8px' }}>01/01/{annee}</td><td style={{ padding: '8px' }}>—</td>
                      <td style={{ padding: '8px' }}>Solde d'ouverture</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{c.ouverture.debit > 0 ? fmt(c.ouverture.debit) : ''}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{c.ouverture.credit > 0 ? fmt(c.ouverture.credit) : ''}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{fmt(c.ouverture.solde)} Ar</td>
                    </tr>
                  )}
                  {c.lignes.map((l, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px' }}>{l.date ? new Date(l.date).toLocaleDateString('fr-FR') : ''}</td>
                      <td style={{ padding: '8px' }}>{l.journal}</td>
                      <td style={{ padding: '8px' }}>{l.libelle}{l.a_classer ? ' ⚠️ à classer' : ''}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#c62828' }}>{l.debit > 0 ? fmt(l.debit) : ''}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#2e7d32' }}>{l.credit > 0 ? fmt(l.credit) : ''}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: l.solde >= 0 ? '#004d5a' : '#c62828' }}>{fmt(l.solde)} Ar</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#e8f5e9', fontWeight: 'bold' }}>
                    <td colSpan={3} style={{ padding: '8px' }}>TOTAL</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#c62828' }}>{fmt(c.total_debit)} Ar</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#2e7d32' }}>{fmt(c.total_credit)} Ar</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#004d5a' }}>{fmt(c.solde_final)} Ar</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        );
      }))}
    </div>
  );
}