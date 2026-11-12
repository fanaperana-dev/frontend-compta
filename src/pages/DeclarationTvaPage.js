import React from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { styles, fmt, useEtat, SelecteurAnnee } from './EtatsCommuns';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MODES = ['Banque', 'Espèces', 'MVola', 'Orange Money', 'Airtel Money'];
const th = { padding: '8px 10px', textAlign: 'right', fontSize: '12px' };
const td = { padding: '8px 10px', textAlign: 'right', fontSize: '13px', borderBottom: '1px solid #f0f0f0' };
const aujourdhui = () => new Date().toLocaleDateString('en-CA');
const jj = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T00:00:00').toLocaleDateString('fr-FR') : '—');
const dernierJour = (annee, mois) => `${annee}-${String(mois).padStart(2, '0')}-${String(new Date(annee, mois, 0).getDate()).padStart(2, '0')}`;

const vide = () => ({
  ca_ht: 0,
  collectee: { marchandises: 0, services: 0, regularisation: 0, total: 0 },
  deductible: { immobilisations: 0, marchandises: 0, services: 0, regularisation: 0, total: 0 },
});

// Additionne des mois pour obtenir la période choisie
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
  const [moisDebut, setMoisDebut] = React.useState(1);
  const [moisFin, setMoisFin] = React.useState(new Date().getMonth() + 1);
  const [dateDecl, setDateDecl] = React.useState(aujourdhui());
  const [commentaire, setCommentaire] = React.useState('');
  const [declarations, setDeclarations] = React.useState([]);
  const [paiement, setPaiement] = React.useState(null); // { id, date, mode }
  const [enCours, setEnCours] = React.useState(false);
  const { etat, loading } = useEtat('tva', entreprise.id, annee);

  const chargerDeclarations = React.useCallback(async () => {
    try {
      const res = await api.get(`/comptabilite/etats/tva-declarations/${entreprise.id}`);
      setDeclarations(res.data.declarations || []);
    } catch (e) { toast.error('Erreur chargement des déclarations.'); }
  }, [entreprise.id]);
  React.useEffect(() => { chargerDeclarations(); }, [chargerDeclarations]);

  const debut = Math.min(moisDebut, moisFin);
  const fin = Math.max(moisDebut, moisFin);
  const mois = (etat && etat.mois) || [];
  const lignesPeriode = mois.slice(debut - 1, fin).map((l, i) => ({ nom: MOIS[debut - 1 + i], ...cumuler([l]) }));
  const total = { nom: debut === fin ? `${MOIS[debut - 1]} ${annee}` : `${MOIS[debut - 1]} à ${MOIS[fin - 1]} ${annee}`, ...cumuler(mois.slice(debut - 1, fin)) };
  const aucuneDonnee = !loading && etat && total.collectee.total === 0 && total.deductible.total === 0;

  async function appelle(fn, succes) {
    setEnCours(true);
    try { await fn(); toast.success(succes); await chargerDeclarations(); setTimeout(chargerDeclarations, 8000); }
    catch (e) { toast.error((e.response && e.response.data && e.response.data.message) || 'Erreur.'); }
    finally { setEnCours(false); }
  }
  const declarer = () => appelle(() => api.post('/comptabilite/etats/tva-declarations', {
    entreprise_id: entreprise.id, periode_debut: `${annee}-${String(debut).padStart(2, '0')}-01`, periode_fin: dernierJour(annee, fin),
    date_declaration: dateDecl, commentaire,
  }), 'Déclaration enregistrée. Les écritures de TVA apparaissent au grand livre dans quelques instants.');
  const payer = () => appelle(() => api.patch(`/comptabilite/etats/tva-declarations/${paiement.id}/paiement`, { date_paiement: paiement.date, mode_paiement: paiement.mode }), 'Paiement enregistré.')
    .then(() => setPaiement(null));
  const annulerPaiement = (d) => appelle(() => api.patch(`/comptabilite/etats/tva-declarations/${d.id}/paiement`, { date_paiement: null }), 'Paiement retiré.');
  const supprimer = (d) => {
    if (!window.confirm(`Supprimer la déclaration du ${jj(d.periode_debut)} au ${jj(d.periode_fin)} ? Les écritures de règlement seront retirées du grand livre.`)) return;
    appelle(() => api.delete(`/comptabilite/etats/tva-declarations/${d.id}`), 'Déclaration supprimée.');
  };

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

  const select = { ...styles.input, width: '140px' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>🧾 Déclaration de TVA</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>Du mois de</span>
          <select style={select} value={moisDebut} onChange={e => setMoisDebut(Number(e.target.value))}>
            {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <span style={{ fontSize: '13px', color: '#666' }}>au mois de</span>
          <select style={select} value={moisFin} onChange={e => setMoisFin(Number(e.target.value))}>
            {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
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
        Choisissez un, deux, trois mois (ou plus). Chiffre d'affaires et achats sont <strong>hors taxe (HT)</strong> ; la TVA est suivie sur ses propres comptes (4456 déductible, 4457 collectée), puis soldée à la déclaration. Aide au calcul (TVA comptée à la date de facture) : à faire valider par votre expert-comptable.
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
              {lignesPeriode.length > 1 && lignesPeriode.map(p => ligne(p, false))}
              {ligne(total, true)}
            </tbody>
          </table>
          {aucuneDonnee && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '13px' }}>Aucune TVA enregistrée sur cette période.</div>
          )}
        </div>
      )}

      {entreprise.assujettie_tva && (
        <div style={{ ...styles.card, display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666' }}>Date de la déclaration</label>
            <input type="date" style={{ ...styles.input, width: '170px' }} value={dateDecl} onChange={e => setDateDecl(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Commentaire (facultatif)</label>
            <input style={styles.input} value={commentaire} onChange={e => setCommentaire(e.target.value)} />
          </div>
          <button disabled={enCours} onClick={declarer}
            style={{ ...styles.boutonPrimaire, background: '#004d5a', color: 'white', padding: '10px 18px', fontSize: '14px' }}>
            Enregistrer la déclaration de {total.nom}
          </button>
        </div>
      )}

      <h3 style={{ color: '#004d5a' }}>Déclarations enregistrées</h3>
      <div style={{ ...styles.card, overflowX: 'auto', padding: '10px' }}>
        {declarations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '13px' }}>Aucune déclaration enregistrée.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#004d5a', color: 'white' }}>
                <th style={{ ...th, textAlign: 'left' }}>Période</th><th style={th}>Déclarée le</th><th style={th}>TVA collectée</th>
                <th style={th}>TVA déductible</th><th style={th}>TVA à payer</th><th style={th}>Crédit de TVA</th>
                <th style={{ ...th, textAlign: 'left' }}>Paiement</th><th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {declarations.map(d => (
                <tr key={d.id}>
                  <td style={{ ...td, textAlign: 'left' }}>{jj(d.periode_debut)} → {jj(d.periode_fin)}</td>
                  <td style={td}>{jj(d.date_declaration)}</td>
                  {d.calcule ? (<>
                    <td style={td}>{fmt(d.tva_collectee)}</td><td style={td}>{fmt(d.tva_deductible)}</td>
                    <td style={{ ...td, fontWeight: 'bold', color: d.a_payer > 0 ? '#c62828' : '#2e7d32' }}>{fmt(d.a_payer)}</td>
                    <td style={td}>{d.credit_genere > 0 ? `+${fmt(d.credit_genere)}` : d.credit_utilise > 0 ? `−${fmt(d.credit_utilise)} utilisé` : '—'}</td>
                  </>) : (
                    <td style={{ ...td, color: '#888', fontStyle: 'italic' }} colSpan={4}>Calcul en cours… actualisez dans un instant</td>
                  )}
                  <td style={{ ...td, textAlign: 'left' }}>
                    {d.date_paiement ? `✅ Payée le ${jj(d.date_paiement)}${d.mode_paiement ? ` (${d.mode_paiement})` : ''}` : (d.calcule && d.a_payer === 0 ? 'Rien à payer' : 'À payer')}
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    {!d.date_paiement && d.a_payer > 0 && (
                      <button style={styles.boutonPrimaire} disabled={enCours}
                        onClick={() => setPaiement({ id: d.id, date: aujourdhui(), mode: 'Banque' })}>Enregistrer le paiement</button>
                    )}
                    {d.date_paiement && <button style={styles.boutonPrimaire} disabled={enCours} onClick={() => annulerPaiement(d)}>Retirer le paiement</button>}
                    {' '}<button style={{ ...styles.boutonPrimaire, color: '#c62828', borderColor: '#c62828' }} disabled={enCours} onClick={() => supprimer(d)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {paiement && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', padding: '15px 10px 5px', borderTop: '1px solid #e0e0e0', marginTop: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666' }}>Date du paiement à l'État</label>
              <input type="date" style={{ ...styles.input, width: '170px' }} value={paiement.date} onChange={e => setPaiement({ ...paiement, date: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666' }}>Mode de paiement</label>
              <select style={{ ...styles.input, width: '170px' }} value={paiement.mode} onChange={e => setPaiement({ ...paiement, mode: e.target.value })}>
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button disabled={enCours} onClick={payer} style={{ ...styles.boutonPrimaire, background: '#004d5a', color: 'white', padding: '10px 18px', fontSize: '14px' }}>Valider le paiement</button>
            <button disabled={enCours} onClick={() => setPaiement(null)} style={styles.boutonPrimaire}>Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
}
