import React from 'react';
import { useAuth } from '../context/AuthContext';
import { styles, fmt, useEtat, SelecteurAnnee, BandeauEtat } from './EtatsCommuns';

const signe = (n) => `${n > 0 ? '+' : ''}${fmt(n)} Ar`;

export default function FluxTresoreriePage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = React.useState(new Date().getFullYear());
  const { etat, loading } = useEtat('flux', entreprise.id, annee);
  const dispo = etat && etat.disponible;
  const f = dispo ? etat.flux : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>💰 Tableau des flux de trésorerie</h2>
        <SelecteurAnnee annee={annee} setAnnee={setAnnee} />
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>⏳ Chargement...</div>}
      {!loading && <BandeauEtat etat={etat} annee={annee} />}

      {!loading && f && (
        <>
          {!f.controle.ok && (
            <div style={{ background: '#ffebee', border: '1px solid #c62828', borderRadius: '8px', padding: '12px',
              marginBottom: '20px', color: '#c62828', fontSize: '13px' }}>
              ⚠️ Le tableau ne retombe pas sur la trésorerie du bilan (écart de {fmt(Math.abs(f.controle.ecart))} Ar). Contactez le support.
            </div>
          )}

          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>
              Tableau des flux de trésorerie (méthode indirecte) — Exercice {annee}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#004d5a', color: 'white' }}>
                  <th style={{ ...styles.th, textAlign: 'left' }}>Libellé</th>
                  <th style={styles.th}>Montant (Ar)</th>
                </tr>
              </thead>
              <tbody>
                {f.lignes.map(l => (
                  <tr key={l.code} style={{
                    background: l.entete ? '#f5f5f5' : l.code === 'VAR' ? '#e8f5e9' : 'white',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <td style={{
                      padding: '8px 12px',
                      paddingLeft: l.entete || l.total ? '12px' : `${12 + (l.niveau || 1) * 20}px`,
                      fontSize: '13px', fontWeight: l.entete || l.total ? 'bold' : 'normal',
                      color: l.entete ? '#004d5a' : '#333', textDecoration: l.entete ? 'underline' : 'none'
                    }}>
                      {l.libelle}
                    </td>
                    <td style={{
                      padding: '8px 12px', textAlign: 'right', fontSize: '13px',
                      fontWeight: l.total ? 'bold' : 'normal',
                      color: l.montant === undefined ? '#333' : l.montant < 0 ? '#c62828' : l.montant > 0 ? '#2e7d32' : '#333'
                    }}>
                      {l.montant === undefined ? '' : signe(l.montant)}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '8px 12px', fontSize: '13px', color: '#1565c0', fontWeight: 'bold' }}>
                    Trésorerie d'ouverture (01/01/{annee})
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#1565c0', fontWeight: 'bold' }}>
                    {fmt(f.tresorerieOuverture)} Ar
                  </td>
                </tr>
                <tr style={{ background: '#004d5a' }}>
                  <td style={{ padding: '12px', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                    TRÉSORERIE DE CLÔTURE (31/12/{annee})
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                    {fmt(f.tresorerieCloture)} Ar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
            {[
              { label: 'Flux opérationnels (A)', value: f.A, couleur: '#004d5a' },
              { label: 'Flux investissement (B)', value: f.B, couleur: '#1565c0' },
              { label: 'Flux financement (C)', value: f.C, couleur: '#6a1b9a' },
              { label: 'Trésorerie de clôture', value: f.tresorerieCloture, couleur: f.tresorerieCloture >= 0 ? '#2e7d32' : '#c62828' }
            ].map(item => (
              <div key={item.label} style={{ ...styles.card, marginBottom: 0, borderLeft: `4px solid ${item.couleur}` }}>
                <div style={{ fontSize: '12px', color: '#666' }}>{item.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: item.couleur }}>{signe(item.value)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}