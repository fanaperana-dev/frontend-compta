import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { abonnementService } from '../../services/api';

const styles = {
  card: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px' },
  bouton: { background: 'white', color: '#004d5a', border: '2px solid #004d5a', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  boutonPlein: { background: '#004d5a', color: 'white', border: '2px solid #004d5a', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  th: { padding: '8px', background: '#004d5a', color: 'white', fontSize: '12px', textAlign: 'left', whiteSpace: 'nowrap' },
  td: { padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px' }
};

const fmt = n => Math.round(Number(n) || 0).toLocaleString('fr-FR');
const moisCourant = () => new Date().toISOString().slice(0, 7);
const moisPrecedent = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); };

export default function SuperAdminAbonnements() {
  const [entreprises, setEntreprises] = useState([]);
  const [config, setConfig] = useState({ entreprise_facturation_id: '', tickets_inclus: 5, prix_ticket_supplementaire: 5000 });
  const [periode, setPeriode] = useState(moisPrecedent());
  const [apercu, setApercu] = useState(null);
  const [choisies, setChoisies] = useState({});
  const [enCours, setEnCours] = useState(false);
  const [resultats, setResultats] = useState(null);

  useEffect(() => {
    abonnementService.getConfig().then(res => {
      const { config: c, entreprises: e } = res.data.data;
      setEntreprises(e || []);
      setConfig({ entreprise_facturation_id: c.entreprise_facturation_id || '', tickets_inclus: c.tickets_inclus, prix_ticket_supplementaire: Number(c.prix_ticket_supplementaire) });
    }).catch(() => toast.error('Erreur chargement des réglages.'));
  }, []);

  async function enregistrerConfig() {
    try {
      const res = await abonnementService.saveConfig({ ...config, entreprise_facturation_id: config.entreprise_facturation_id || null });
      toast.success(res.data.message);
      setApercu(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur enregistrement.');
    }
  }

  async function calculer() {
    setEnCours(true); setResultats(null);
    try {
      const res = await abonnementService.apercu(periode);
      const d = res.data.data;
      setApercu(d);
      setChoisies(Object.fromEntries(d.lignes.map(l => [l.entreprise_id, l.statut === 'A_FACTURER'])));
    } catch (err) {
      setApercu(null);
      toast.error(err.response?.data?.message || 'Erreur de calcul.');
    } finally {
      setEnCours(false);
    }
  }

  const selection = (apercu?.lignes || []).filter(l => choisies[l.entreprise_id] && l.statut === 'A_FACTURER');
  const totalSelection = selection.reduce((s, l) => s + l.total, 0);

  async function creer() {
    if (selection.length === 0) return;
    if (!window.confirm(`Créer ${selection.length} facture(s) pour ${apercu.libelle}, total ${fmt(totalSelection)} Ar ?`)) return;
    setEnCours(true);
    try {
      const res = await abonnementService.generer({ periode, entreprise_ids: selection.map(l => l.entreprise_id) });
      toast.success(res.data.message);
      setResultats(res.data.resultats);
      await calculer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de création.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1100px' }}>
      <h2 style={{ color: '#004d5a', marginTop: 0 }}>💳 Facturation des abonnements</h2>

      <div style={styles.card}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>Réglages</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={styles.label}>Compte de facturation (celui qui émet les factures)</label>
            <select style={styles.input} value={config.entreprise_facturation_id}
              onChange={e => setConfig({ ...config, entreprise_facturation_id: e.target.value })}>
              <option value="">— Choisir —</option>
              {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Tickets inclus / mois</label>
            <input style={styles.input} type="number" min="0" step="1" value={config.tickets_inclus}
              onChange={e => setConfig({ ...config, tickets_inclus: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Prix du ticket en plus (Ar)</label>
            <input style={styles.input} type="number" min="0" value={config.prix_ticket_supplementaire}
              onChange={e => setConfig({ ...config, prix_ticket_supplementaire: Number(e.target.value) })} />
          </div>
          <button style={styles.bouton} onClick={enregistrerConfig}>Enregistrer</button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div>
            <label style={styles.label}>Mois à facturer</label>
            <input style={{ ...styles.input, width: '180px' }} type="month" value={periode} max={moisCourant()}
              onChange={e => { setPeriode(e.target.value); setApercu(null); }} />
          </div>
          <button style={styles.boutonPlein} disabled={enCours || !periode} onClick={calculer}>
            {enCours ? 'Calcul…' : 'Préparer les factures du mois'}
          </button>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Rien n'est créé tant que tu n'as pas cliqué sur « Créer ». Les tickets sont comptés sur le mois civil.
          </span>
        </div>

        {apercu && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['', 'Entreprise', 'Forfait', 'Forfait net (Ar)', 'Tickets', 'Tickets en plus (Ar)', 'Total (Ar)', 'État'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {apercu.lignes.length === 0 && (
                    <tr><td style={{ ...styles.td, textAlign: 'center', color: '#888' }} colSpan={8}>Aucune entreprise active.</td></tr>
                  )}
                  {apercu.lignes.map(l => (
                    <tr key={l.entreprise_id} style={{ opacity: l.statut === 'A_FACTURER' ? 1 : 0.55 }}>
                      <td style={styles.td}>
                        <input type="checkbox" disabled={l.statut !== 'A_FACTURER'} checked={!!choisies[l.entreprise_id]}
                          onChange={e => setChoisies({ ...choisies, [l.entreprise_id]: e.target.checked })} />
                      </td>
                      <td style={{ ...styles.td, fontWeight: 'bold' }}>{l.nom}</td>
                      <td style={styles.td}>{l.forfait || '—'}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(l.montant_forfait)}</td>
                      <td style={{ ...styles.td, textAlign: 'center', color: l.tickets_supplementaires > 0 ? '#c62828' : '#222', fontWeight: l.tickets_supplementaires > 0 ? 'bold' : 'normal' }}>
                        {l.tickets} / {l.tickets_inclus}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{l.tickets_supplementaires > 0 ? `${l.tickets_supplementaires} × ${fmt(apercu.prix_ticket_supplementaire)} = ${fmt(l.montant_tickets)}` : '—'}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>{fmt(l.total)}</td>
                      <td style={{ ...styles.td, fontSize: '12px', color: l.statut === 'A_FACTURER' ? '#2e7d32' : '#888' }}>
                        {l.statut === 'A_FACTURER' ? 'À facturer' : l.raison}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <strong style={{ color: '#004d5a' }}>{selection.length} facture(s) sélectionnée(s) — {fmt(totalSelection)} Ar</strong>
              <button style={{ ...styles.boutonPlein, opacity: selection.length === 0 || enCours ? 0.5 : 1 }} disabled={selection.length === 0 || enCours} onClick={creer}>
                Créer les factures
              </button>
            </div>
          </>
        )}

        {resultats && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f1f8e9', borderRadius: '8px', fontSize: '13px' }}>
            {resultats.creees.map(r => <div key={r.numero}>✅ {r.numero} — {r.client} : {fmt(r.montant)} Ar</div>)}
            {resultats.ignorees.map((r, i) => <div key={i}>⏭ {r.client} : {r.raison}</div>)}
            {resultats.erreurs.map((r, i) => <div key={i} style={{ color: '#c62828' }}>❌ {r.client} : {r.erreur}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
