import React from 'react';
import { useAuth } from '../context/AuthContext';
import { styles, fmt, useEtat, SelecteurAnnee, BoutonCloture, BandeauEtat } from './EtatsCommuns';

const th = styles.th;

function Ligne({ label, valeurs, niveau = 0, gras = false, sousTitre = false, total = false, note = null }) {
  const fond = total ? '#004d5a' : sousTitre ? '#e8f5e9' : 'white';
  const coul = total ? 'white' : sousTitre ? '#004d5a' : '#333';
  return (
    <tr style={{ background: fond, borderBottom: '1px solid #e0e0e0' }}>
      <td style={{ padding: '8px 12px', paddingLeft: `${12 + niveau * 20}px`, fontSize: '13px',
        fontWeight: gras || sousTitre || total ? 'bold' : 'normal', color: coul }}>
        {label}
        {note && <span style={{ fontSize: '11px', color: total ? '#cfe' : '#888', marginLeft: '6px' }}>{note}</span>}
      </td>
      {(valeurs || []).map((v, i) => (
        <td key={i} style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px',
          fontWeight: gras || total ? 'bold' : 'normal',
          color: total ? 'white' : (typeof v === 'number' && v < 0 ? '#c62828' : coul) }}>
          {v === null || v === undefined ? '' : `${fmt(v)} Ar`}
        </td>
      ))}
    </tr>
  );
}

export default function BilanPage() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = React.useState(new Date().getFullYear());
  const { etat, loading, recharger } = useEtat('bilan', entreprise.id, annee);

  const dispo = etat && etat.disponible;
  const resultatNet = (dispo && etat.resultat && etat.resultat.resultatNet) || 0;
  const n1 = dispo && etat.n1 ? etat.n1 : null;           // colonne N-1 : réservée au SuperAdmin (le serveur ne l'envoie qu'à lui)
  const n1Actif = n1 ? Object.fromEntries(n1.actif.lignes.map(l => [l.code, l.net])) : {};
  const n1Passif = n1 ? Object.fromEntries(n1.passif.lignes.map(l => [l.code, l.montant])) : {};

  const ligneActif = (l) => (
    <Ligne key={l.code} label={l.libelle} niveau={1} note={l.regroupe ? '(regroupé)' : null}
      valeurs={[l.brut, l.amort ? -l.amort : 0, l.net, ...(n1 ? [n1Actif[l.code] || 0] : [])]} />
  );
  const sectionActif = (cle, titre, tot) => {
    const lignes = etat.actif.lignes.filter(l => l.section === cle);
    if (!lignes.length) return null;
    return (
      <React.Fragment key={cle}>
        <Ligne label={titre} sousTitre valeurs={[null, null, null, ...(n1 ? [null] : [])]} />
        {lignes.map(ligneActif)}
        <Ligne label={`Total ${titre.toLowerCase()}`} gras
          valeurs={[tot.brut, tot.amort ? -tot.amort : 0, tot.net, ...(n1 ? [null] : [])]} />
      </React.Fragment>
    );
  };
  const sectionPassif = (cle, titre, montantTotal) => {
    const lignes = etat.passif.lignes.filter(l => l.section === cle);
    if (!lignes.length) return null;
    return (
      <React.Fragment key={cle}>
        <Ligne label={titre} sousTitre valeurs={[null, ...(n1 ? [null] : [])]} />
        {lignes.map(l => (
          <React.Fragment key={l.code}>
            <Ligne label={l.libelle} niveau={1}
              valeurs={[l.montant, ...(n1 ? [n1Passif[l.code] || 0] : [])]} />
            {(l.detail || []).map((d, i) => (
              <Ligne key={i} label={d.libelle} niveau={2} valeurs={[d.montant, ...(n1 ? [null] : [])]} />
            ))}
          </React.Fragment>
        ))}
        <Ligne label={`Total ${titre.toLowerCase()}`} gras valeurs={[montantTotal, ...(n1 ? [null] : [])]} />
      </React.Fragment>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>⚖️ Bilan</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <SelecteurAnnee annee={annee} setAnnee={setAnnee} />
          <BoutonCloture entrepriseId={entreprise.id} annee={annee} etat={etat} onDone={recharger} />
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>⏳ Chargement du bilan...</div>}

      {!loading && <BandeauEtat etat={etat} annee={annee} setAnnee={setAnnee} />}

      {!loading && dispo && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>ACTIF</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#004d5a', color: 'white' }}>
                    <th style={{ ...th, textAlign: 'left' }}>Libellé</th>
                    <th style={th}>Brut</th>
                    <th style={th}>Amort. / prov.</th>
                    <th style={th}>Net</th>
                    {n1 && <th style={th}>Net N-1</th>}
                  </tr>
                </thead>
                <tbody>
                  {sectionActif('NON_COURANT', 'ACTIF NON COURANT', etat.actif.totaux.nonCourant)}
                  {sectionActif('COURANT', 'ACTIF COURANT', etat.actif.totaux.courant)}
                  <Ligne label="TOTAL ACTIF" total
                    valeurs={[etat.actif.totaux.total.brut, etat.actif.totaux.total.amort ? -etat.actif.totaux.total.amort : 0,
                      etat.actif.totaux.total.net, ...(n1 ? [n1.actif.totaux.total.net] : [])]} />
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>PASSIF</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#004d5a', color: 'white' }}>
                    <th style={{ ...th, textAlign: 'left' }}>Libellé</th>
                    <th style={th}>Montant</th>
                    {n1 && <th style={th}>N-1</th>}
                  </tr>
                </thead>
                <tbody>
                  {sectionPassif('CAPITAUX_PROPRES', 'CAPITAUX PROPRES', etat.passif.totaux.capitauxPropres)}
                  {sectionPassif('NON_COURANT', 'PASSIFS NON COURANTS', etat.passif.totaux.nonCourant)}
                  {sectionPassif('COURANT', 'PASSIFS COURANTS', etat.passif.totaux.courant)}
                  <Ligne label="TOTAL PASSIF" total
                    valeurs={[etat.passif.totaux.total, ...(n1 ? [n1.passif.totaux.total] : [])]} />
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            {[
              { label: 'Total Actif (net)', value: etat.actif.totaux.total.net, couleur: '#004d5a' },
              { label: 'Total Passif', value: etat.passif.totaux.total, couleur: '#1565c0' },
              { label: 'Résultat net', value: resultatNet,
                couleur: resultatNet >= 0 ? '#2e7d32' : '#c62828' }
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