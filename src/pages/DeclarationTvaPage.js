import React from 'react';
import { useAuth } from '../context/AuthContext';
import { styles, fmt, useEtat, SelecteurAnnee } from './EtatsCommuns';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const th = { padding: '8px 10px', textAlign: 'right', fontSize: '12px' };
const td = { padding: '8px 10px', textAlign: 'right', fontSize: '13px', borderBottom: '1px solid #f0f0f0' };

const vide = () => ({
  ca_ht: 0,
  collectee: { marchandises: 0, services: 0, regularisation: 0, total: 0 },
  deductible: { immobilisations: 0, marchandises: 0, services: 0, regularisation: 0, total: 0 },
});

// Additionne des mois pour obtenir une période (un mois ou un trimestre)
function cumuler(lignes) {
  const p = vide();
  for (const l of lignes) {
    p.ca_ht += l.ca_ht;
    for (const k of Object.keys(p.collectee)) p.collectee[k] += l.collectee[k];
    for (const k of Object.keys(p.deductible)) p.deductible[k] += l.deductible[k];
  }
  p.net = p.collectee.total - p.deductible.total;
  return p;
}

export default function DeclarationTvaPage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = React.useState(new Date().getFullYear());
  const [periodicite, setPeriodicite] = React.useState('MENSUELLE');
  const { etat, loading } = useEtat('tva', entreprise.id, annee);

  const mois = (etat && etat.mois) || [];
  const periodes = periodicite === 'MENSUELLE'
    ? mois.map((l, i) => ({ nom: MOIS[i], ...cumuler([l]) }))
    : [0, 1, 2, 3].map(t => ({ nom: `${t + 1}${t === 0 ? 'er' : 'e'} trimestre`, ...cumuler(mois.slice(t * 3, t * 3 + 3)) }));
  const total = { nom: `Total ${annee}`, ...cumuler(mois) };
  const aucuneDonnee = !loading && etat && total.collectee.total === 0 && total.deductible.total === 0;

  const ligne = (p, gras) => (
    <tr key={p.nom} style={{ background: gras ? '#e0f2f1' : 'white', fontWeight: gras ? 'bold' : 'normal' }}>
      <td style={{ ...td, textAlign: 'left' }}>{p.nom}</td>
      <td style={td}>{fmt(p.ca_ht)}</td>
      <td style={td}>{fmt(p.collectee.marchandises)}</td>
      <td style={td}>{fmt(p.collectee.services)}</td>
      <td style={td}>{fmt(p.collectee.regularisation)}</td>
      <td style={{ ...td, fontWeight: 'bold' }}>{fmt(p.collectee.total)}</td>
      <td style={td}>{fmt(p.deductible.immobilisations)}</td>
      <td style={td}>{fmt(p.deductible.marchandises)}</td>
      <td style={td}>{fmt(p.deductible.services)}</td>
      <td style={td}>{fmt(p.deductible.regularisation)}</td>
      <td style={{ ...td, fontWeight: 'bold' }}>{fmt(p.deductible.total)}</td>
      <td style={{ ...td, fontWeight: 'bold', color: p.net > 0 ? '#c62828' : '#2e7d32' }}>
        {p.net > 0.004 ? `${fmt(p.net)} à payer` : p.net < -0.004 ? `${fmt(-p.net)} crédit` : '0'}
      </td>
    </tr>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>🧾 Déclaration de TVA</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select style={{ ...styles.input, width: '160px' }} value={periodicite} onChange={e => setPeriodicite(e.target.value)}>
            <option value="MENSUELLE">Par mois</option>
            <option value="TRIMESTRIELLE">Par trimestre</option>
          </select>
          <SelecteurAnnee annee={annee} setAnnee={setAnnee} />
        </div>
      </div>

      {!entreprise.assujettie_tva && (
        <div style={{ background: '#fff3e0', border: '1px solid #e65100', borderRadius: '8px', padding: '12px 15px', marginBottom: '15px', color: '#e65100', fontSize: '13px' }}>
          Votre entreprise n'est pas indiquée comme assujettie à la TVA : les montants ci-dessous resteront à zéro.
        </div>
      )}

      <div style={{ background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '8px', padding: '12px 15px', marginBottom: '20px', color: '#1565c0', fontSize: '13px' }}>
        Aide au calcul à partir de vos factures clients et fournisseurs (TVA comptée à la date de facture). À faire valider par votre expert-comptable avant toute déclaration officielle.
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>⏳ Chargement...</div>}

      {!loading && etat && (
        <div style={{ ...styles.card, overflowX: 'auto', padding: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: '#004d5a', color: 'white' }}>
                <th style={{ ...th, textAlign: 'left' }} rowSpan={2}>Période</th>
                <th style={th} rowSpan={2}>Chiffre d'affaires HT</th>
                <th style={{ ...th, textAlign: 'center' }} colSpan={4}>TVA collectée</th>
                <th style={{ ...th, textAlign: 'center' }} colSpan={5}>TVA déductible</th>
                <th style={th} rowSpan={2}>TVA nette</th>
              </tr>
              <tr style={{ background: '#00697a', color: 'white' }}>
                <th style={th}>Marchandises</th><th style={th}>Services</th><th style={th}>Régul.</th><th style={th}>Total</th>
                <th style={th}>Immobilisations</th><th style={th}>Marchandises</th><th style={th}>Services</th><th style={th}>Régul.</th><th style={th}>Total</th>
              </tr>
            </thead>
            <tbody>
              {periodes.map(p => ligne(p, false))}
              {ligne(total, true)}
            </tbody>
          </table>
          {aucuneDonnee && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '13px' }}>
              Aucune TVA enregistrée pour {annee}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
