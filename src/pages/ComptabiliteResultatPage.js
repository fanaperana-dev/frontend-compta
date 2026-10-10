import React from 'react';
import { useAuth } from '../context/AuthContext';
import { styles, fmt, useEtat, SelecteurAnnee, BoutonCloture, BandeauEtat } from './EtatsCommuns';

export default function ComptabiliteResultatPage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = React.useState(new Date().getFullYear());
  const { etat, loading, recharger } = useEtat('compte-resultat', entreprise.id, annee);

  const dispo = etat && etat.disponible;
  const n1 = dispo && etat.n1 ? etat.n1 : null;   // N-1 : envoyé par le serveur au SuperAdmin seulement
  const n1Montants = n1 ? Object.fromEntries(n1.resultat.lignes.map(l => [l.code, l.montant])) : {};
  const net = dispo ? etat.resultat.resultatNet : 0;
  const total = (code) => { const l = dispo && etat.resultat.lignes.find(x => x.code === code); return l ? l.montant : 0; };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>📊 Compte de résultat</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <SelecteurAnnee annee={annee} setAnnee={setAnnee} />
          <BoutonCloture entrepriseId={entreprise.id} annee={annee} etat={etat} onDone={recharger} />
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>⏳ Chargement...</div>}
      {!loading && <BandeauEtat etat={etat} annee={annee} />}

      {!loading && dispo && (
        <>
          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>
              Compte de résultat par nature — Exercice {annee}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#004d5a', color: 'white' }}>
                  <th style={{ ...styles.th, textAlign: 'left' }}>Libellé</th>
                  <th style={styles.th}>Montant (Ar)</th>
                  {n1 && <th style={styles.th}>N-1</th>}
                </tr>
              </thead>
              <tbody>
                {etat.resultat.lignes.map(l => {
                  const final = l.code === 'X';
                  return (
                    <tr key={l.code} style={{
                      background: final ? '#004d5a' : l.total ? '#f5f5f5' : 'white',
                      borderBottom: '1px solid #e0e0e0'
                    }}>
                      <td style={{ padding: final ? '12px' : '8px 12px', paddingLeft: l.total ? undefined : '32px',
                        fontSize: final ? '14px' : '13px', fontWeight: l.total ? 'bold' : 'normal',
                        color: final ? 'white' : l.total ? '#004d5a' : '#333' }}>
                        {l.libelle}
                      </td>
                      <td style={{ padding: final ? '12px' : '8px 12px', textAlign: 'right',
                        fontSize: final ? '16px' : '13px', fontWeight: l.total ? 'bold' : 'normal',
                        color: final ? 'white' : l.montant < 0 ? '#c62828' : '#333' }}>
                        {fmt(l.montant)} Ar
                      </td>
                      {n1 && (
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: final ? 'white' : '#666' }}>
                          {fmt(n1Montants[l.code] || 0)} Ar
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
            {[
              { label: "Chiffre d'affaires", value: total('CA'), couleur: '#1565c0' },
              { label: 'Valeur ajoutée', value: total('III'), couleur: '#004d5a' },
              { label: 'Résultat avant impôts', value: total('VII'), couleur: total('VII') >= 0 ? '#2e7d32' : '#c62828' },
              { label: 'Résultat net', value: net, couleur: net >= 0 ? '#2e7d32' : '#c62828' }
            ].map(item => (
              <div key={item.label} style={{ ...styles.card, marginBottom: 0, borderLeft: `4px solid ${item.couleur}` }}>
                <div style={{ fontSize: '12px', color: '#666' }}>{item.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: item.couleur }}>{fmt(item.value)} Ar</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}