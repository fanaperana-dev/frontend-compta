import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productionService } from '../services/api';
import { styles, ar, qte } from './productionCommun';

const dec = (n) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

// Variation en % avec flèche : une hausse de coût est en rouge, une baisse en vert
function Variation({ v, inverse }) {
  if (v === null || v === undefined) return <span style={{ color: '#aaa' }}>—</span>;
  if (Number(v) === 0) return <span style={{ color: '#888' }}>= 0 %</span>;
  const hausse = Number(v) > 0;
  const mauvais = inverse ? !hausse : hausse;
  return <span style={{ color: mauvais ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}>{hausse ? '▲' : '▼'} {hausse ? '+' : ''}{dec(v)} %</span>;
}

// Évolution du coût unitaire d'un lot à l'autre : coût réel (plein) et coût calculé avant la production (pointillé)
function GraphiqueCout({ historique }) {
  const L = 560, H = 150, m = { g: 56, d: 16, h: 14, b: 26 };
  const reels = historique.map(h => Number(h.cout_unitaire_reel));
  const theos = historique.map(h => Number(h.cout_unitaire_theorique));
  const tous = [...reels, ...theos].filter(v => v > 0);
  if (!tous.length) return null;
  let min = Math.min(...tous), max = Math.max(...tous);
  if (min === max) { min = min * 0.9; max = max * 1.1; }
  const x = (i) => (historique.length === 1 ? (L - m.g - m.d) / 2 + m.g : m.g + (i * (L - m.g - m.d)) / (historique.length - 1));
  const y = (v) => m.h + ((max - v) / (max - min)) * (H - m.h - m.b);
  const ligne = (vals) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${L} ${H}`} style={{ width: '100%', maxWidth: '560px', height: 'auto' }} role="img" aria-label="Évolution du coût unitaire">
      {[min, (min + max) / 2, max].map((v, i) => (
        <g key={i}>
          <line x1={m.g} x2={L - m.d} y1={y(v)} y2={y(v)} stroke="#eee" />
          <text x={m.g - 6} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#888">{Math.round(v).toLocaleString('fr-FR')}</text>
        </g>
      ))}
      {historique.length > 1 && <path d={ligne(theos)} fill="none" stroke="#9e9e9e" strokeWidth="1.5" strokeDasharray="4 3" />}
      {historique.length > 1 && <path d={ligne(reels)} fill="none" stroke="#2e7d32" strokeWidth="2" />}
      {reels.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#2e7d32" />)}
      {historique.map((h, i) => (
        <text key={h.id} x={x(i)} y={H - 8} fontSize="9" textAnchor="middle" fill="#666">{h.numero.replace('PROD-', '#')}</text>
      ))}
    </svg>
  );
}

function DetailRecette({ r }) {
  const u = r.produit_fini?.unite || 'unité';
  return (
    <div style={{ padding: '14px 18px 18px', background: '#fafcfc' }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 520px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#004d5a', marginBottom: '4px' }}>
            Évolution du coût par {u} <span style={{ fontWeight: 'normal', color: '#777' }}>— <span style={{ color: '#2e7d32' }}>●</span> coût réel · <span style={{ color: '#9e9e9e' }}>- - -</span> coût calculé avant la production</span>
          </div>
          <GraphiqueCout historique={r.historique} />
        </div>
        <div style={{ flex: '1 1 260px', fontSize: '12px', color: '#555', lineHeight: 1.7 }}>
          <div>Coût actuel de la recette (prix moyen du stock) : <strong>{r.cout_actuel_prix_moyen != null ? ar(r.cout_actuel_prix_moyen) : '—'}</strong> / {u}</div>
          <div>Coût actuel (au dernier achat) : <strong>{r.cout_actuel_dernier_achat != null ? ar(r.cout_actuel_dernier_achat) : '—'}</strong> / {u}</div>
          <div>Plus bas / plus haut coût réel : <strong>{ar(r.cout_unitaire_min)}</strong> / <strong>{ar(r.cout_unitaire_max)}</strong></div>
          {r.variation_totale_pct !== null && <div>Depuis le premier lot : <Variation v={r.variation_totale_pct} /></div>}
          {r.prix_vente > 0 && (
            <div>Prix de vente enregistré : <strong>{ar(r.prix_vente)}</strong>
              {r.cout_unitaire_dernier >= r.prix_vente
                ? <span style={{ color: '#c62828' }}> ⚠️ le dernier lot coûte autant ou plus que ce prix</span>
                : <span style={{ color: '#2e7d32' }}> · marge indicative sur le dernier lot : {dec(((r.prix_vente - r.cout_unitaire_dernier) / r.prix_vente) * 100)} %</span>}
            </div>
          )}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '14px' }}>
        <thead>
          <tr style={{ background: '#eef5f6' }}>
            {['Lot', 'Date', 'Demandé', 'Produit', 'Perte', 'Coût calculé / unité', 'Coût réel / unité', 'Écart', 'Coût total'].map(h => <th key={h} style={{ ...styles.th, fontSize: '11px', padding: '6px 8px' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {[...r.historique].reverse().map(h => (
            <tr key={h.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{h.numero}</td>
              <td style={{ padding: '6px 8px' }}>{dateFr(h.date)}</td>
              <td style={{ padding: '6px 8px' }}>{qte(h.quantite_demandee)} {u}</td>
              <td style={{ padding: '6px 8px' }}>{qte(h.quantite_produite)} {u}</td>
              <td style={{ padding: '6px 8px', color: h.ecart_quantite > 0 ? '#c62828' : '#888' }}>{h.ecart_quantite > 0 ? `${qte(h.ecart_quantite)} (${dec(h.perte_pct)} %)` : '—'}</td>
              <td style={{ padding: '6px 8px' }}>{ar(h.cout_unitaire_theorique)}</td>
              <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#2e7d32' }}>{ar(h.cout_unitaire_reel)}</td>
              <td style={{ padding: '6px 8px' }}><Variation v={h.ecart_cout_pct} /></td>
              <td style={{ padding: '6px 8px' }}>{ar(h.cout_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#004d5a', margin: '16px 0 4px' }}>Matières : prévu et réellement utilisé</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#eef5f6' }}>
            {['Matière', 'Prévu', 'Réellement utilisé', 'Écart', 'Coût de l\'écart', 'Coût total'].map(h => <th key={h} style={{ ...styles.th, fontSize: '11px', padding: '6px 8px' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {r.matieres.map(mt => (
            <tr key={mt.article_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '6px 8px' }}>{mt.designation}</td>
              <td style={{ padding: '6px 8px' }}>{qte(mt.prevu)} {mt.unite}</td>
              <td style={{ padding: '6px 8px' }}>{qte(mt.reel)} {mt.unite}</td>
              <td style={{ padding: '6px 8px' }}>{mt.ecart === 0 ? <span style={{ color: '#888' }}>—</span> : <Variation v={mt.ecart_pct} />}</td>
              <td style={{ padding: '6px 8px', color: mt.cout_ecart > 0 ? '#c62828' : mt.cout_ecart < 0 ? '#2e7d32' : '#888' }}>{mt.cout_ecart === 0 ? '—' : `${mt.cout_ecart > 0 ? '+' : ''}${ar(mt.cout_ecart)}`}</td>
              <td style={{ padding: '6px 8px' }}>{ar(mt.cout)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: '11px', color: '#777', marginTop: '6px' }}>
        Une matière utilisée en plus que prévu coûte de l'argent ; si l'écart revient à chaque lot, c'est souvent que la recette est à ajuster.
      </div>
    </div>
  );
}

export default function OngletSuivi({ entreprise, recettes }) {
  const [filtre, setFiltre] = useState({ recette_id: '', debut: '', fin: '' });
  const [suivi, setSuivi] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [ouvertes, setOuvertes] = useState({});

  useEffect(() => { charger(); }, [filtre.recette_id, filtre.debut, filtre.fin]);

  async function charger() {
    setChargement(true);
    try {
      const params = {};
      if (filtre.recette_id) params.recette_id = filtre.recette_id;
      if (filtre.debut) params.debut = filtre.debut;
      if (filtre.fin) params.fin = filtre.fin;
      const res = await productionService.getSuivi(entreprise.id, params);
      setSuivi(res.data.data);
    } catch (err) {
      toast.error('Erreur chargement du suivi des coûts.');
    } finally {
      setChargement(false);
    }
  }

  const t = suivi?.totaux;
  const cartes = t ? [
    { titre: 'Productions validées', v: t.productions, c: '#004d5a' },
    { titre: 'Quantité produite', v: qte(t.quantite_produite), c: '#004d5a' },
    { titre: 'Valeur des pertes', v: ar(t.valeur_perte), c: t.valeur_perte > 0 ? '#c62828' : '#2e7d32', sub: t.quantite_demandee > 0 ? `${dec(Math.max(0, ((t.quantite_demandee - t.quantite_produite) / t.quantite_demandee) * 100))} % des quantités demandées` : '' },
    { titre: 'Coût total engagé', v: ar(t.cout_total), c: '#004d5a' },
  ] : [];

  return (
    <div>
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '240px' }}>
            <label style={styles.label}>Recette</label>
            <select style={styles.input} value={filtre.recette_id} onChange={e => setFiltre({ ...filtre, recette_id: e.target.value })}>
              <option value="">Toutes les recettes</option>
              {recettes.map(r => <option key={r.id} value={r.id}>{r.nom} ({r.code})</option>)}
            </select>
          </div>
          <div><label style={styles.label}>Du</label><input style={styles.input} type="date" value={filtre.debut} onChange={e => setFiltre({ ...filtre, debut: e.target.value })} /></div>
          <div><label style={styles.label}>Au</label><input style={styles.input} type="date" value={filtre.fin} onChange={e => setFiltre({ ...filtre, fin: e.target.value })} /></div>
          {(filtre.recette_id || filtre.debut || filtre.fin) && <button type="button" style={styles.boutonSecondaire} onClick={() => setFiltre({ recette_id: '', debut: '', fin: '' })}>Effacer les filtres</button>}
        </div>
        <div style={{ fontSize: '11px', color: '#777', marginTop: '10px' }}>
          Calculé à partir des productions <strong>validées</strong>, à leur date de production. Leurs coûts sont figés : ils ne changent pas quand les prix d'achat évoluent.
          Le coût moyen est pondéré (total des coûts ÷ total produit).
        </div>
      </div>

      {chargement && !suivi ? <div style={{ padding: '20px' }}>Chargement…</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {cartes.map(c => (
              <div key={c.titre} style={{ ...styles.card, marginBottom: 0, padding: '14px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>{c.titre}</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: c.c }}>{c.v}</div>
                {c.sub && <div style={{ fontSize: '10px', color: '#888' }}>{c.sub}</div>}
              </div>
            ))}
          </div>

          <div style={styles.card}>
            {!suivi || suivi.recettes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                Aucune production validée sur cette période.<br />Le suivi se remplit à mesure que tu valides tes productions (onglet Productions).
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    {['', 'Recette', 'Lots', 'Produit', 'Perte', 'Coût réel moyen / unité', 'Dernier lot', 'Calculé → réel', 'Coût actuel (prix moyen)', 'Coût actuel (dernier achat)'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {suivi.recettes.map((r, i) => {
                    const u = r.produit_fini?.unite || '';
                    return (
                      <React.Fragment key={r.recette_id}>
                        <tr style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                          <td style={styles.td}>
                            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px' }} title="Voir le détail"
                              onClick={() => setOuvertes(o => ({ ...o, [r.recette_id]: !o[r.recette_id] }))}>{ouvertes[r.recette_id] ? '▼' : '▶'}</button>
                          </td>
                          <td style={{ ...styles.td, fontSize: '13px' }}>
                            <strong>{r.produit_fini?.designation || r.nom}</strong>
                            <div style={{ fontSize: '11px', color: '#888' }}>{r.code} · {r.nom}</div>
                          </td>
                          <td style={{ ...styles.td, fontSize: '12px' }}>{r.nb_productions}</td>
                          <td style={{ ...styles.td, fontSize: '12px' }}>{qte(r.quantite_produite)} {u}</td>
                          <td style={{ ...styles.td, fontSize: '12px', color: r.perte_quantite > 0 ? '#c62828' : '#888' }}>
                            {r.perte_quantite > 0 ? <>{qte(r.perte_quantite)} ({dec(r.perte_pct)} %)<div style={{ fontSize: '10px' }}>{ar(r.valeur_perte)}</div></> : '—'}
                          </td>
                          <td style={{ ...styles.td, fontSize: '13px', fontWeight: 'bold', color: '#2e7d32' }}>{ar(r.cout_unitaire_moyen)}</td>
                          <td style={{ ...styles.td, fontSize: '12px' }}>{ar(r.cout_unitaire_dernier)}<div style={{ fontSize: '11px' }}><Variation v={r.variation_dernier_pct} /></div></td>
                          <td style={{ ...styles.td, fontSize: '12px' }}>{ar(r.cout_unitaire_theorique_moyen)} → {ar(r.cout_unitaire_moyen)}<div style={{ fontSize: '11px' }}><Variation v={r.ecart_theorique_pct} /></div></td>
                          <td style={{ ...styles.td, fontSize: '12px' }}>{r.cout_actuel_prix_moyen != null ? ar(r.cout_actuel_prix_moyen) : '—'}</td>
                          <td style={{ ...styles.td, fontSize: '12px', color: '#1565c0' }}>{r.cout_actuel_dernier_achat != null ? ar(r.cout_actuel_dernier_achat) : '—'}</td>
                        </tr>
                        {ouvertes[r.recette_id] && <tr><td colSpan={10} style={{ padding: 0 }}><DetailRecette r={r} /></td></tr>}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
