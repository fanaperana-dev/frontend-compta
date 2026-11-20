import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productionService } from '../services/api';
import { styles, ar, qte } from './productionCommun';

const dec = (n) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const nomMois = (m) => { const [a, mo] = String(m || '').split('-'); return MOIS[Number(mo) - 1] ? `${MOIS[Number(mo) - 1]} ${a}` : m; };

const ECHEANCES = {
  EN_RETARD: { label: 'En retard', couleur: '#c62828', fond: '#ffebee' },
  CETTE_SEMAINE: { label: 'Cette semaine', couleur: '#e65100', fond: '#fff3e0' },
  PLUS_TARD: { label: 'Plus tard', couleur: '#555', fond: '#f0f0f0' },
  SANS_DATE: { label: 'Sans date', couleur: '#555', fond: '#f0f0f0' },
};

function Carte({ titre, valeur, couleur = '#004d5a', sous, onClick }) {
  return (
    <div onClick={onClick} style={{ ...styles.card, marginBottom: 0, padding: '14px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: '12px', color: '#666' }}>{titre}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: couleur }}>{valeur}</div>
      {sous && <div style={{ fontSize: '11px', color: '#888' }}>{sous}</div>}
    </div>
  );
}

// Variation : une hausse de coût est « mauvaise » (rouge), une hausse de quantité est « bonne » (vert)
function Evo({ v, hausseBonne }) {
  if (v === null || v === undefined) return <span style={{ color: '#aaa' }}>—</span>;
  if (Number(v) === 0) return <span style={{ color: '#888' }}>= 0 %</span>;
  const hausse = Number(v) > 0;
  const bon = hausseBonne ? hausse : !hausse;
  return <span style={{ color: bon ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}>{hausse ? '▲ +' : '▼ '}{dec(v)} %</span>;
}

// Deux barres horizontales : mois précédent / mois en cours
function Comparaison({ titre, a, b, format, hausseBonne, evo }) {
  const max = Math.max(Number(a.valeur), Number(b.valeur), 1);
  const barre = (x, couleur) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
      <div style={{ width: '110px', fontSize: '11px', color: '#666' }}>{x.label}</div>
      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '3px', height: '12px' }}>
        <div style={{ width: `${(Number(x.valeur) / max) * 100}%`, background: couleur, height: '12px', borderRadius: '3px', minWidth: Number(x.valeur) > 0 ? '2px' : 0 }} />
      </div>
      <div style={{ width: '110px', fontSize: '12px', fontWeight: 'bold', textAlign: 'right' }}>{format(x.valeur)}</div>
    </div>
  );
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#004d5a' }}>{titre} <span style={{ fontWeight: 'normal', marginLeft: '6px' }}><Evo v={evo} hausseBonne={hausseBonne} /></span></div>
      {barre(a, '#b0bec5')}
      {barre(b, '#004d5a')}
    </div>
  );
}

export default function OngletTableauBord({ entreprise, onAller }) {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    try {
      const res = await productionService.getTableauBord(entreprise.id);
      setDonnees(res.data.data);
    } catch (err) {
      toast.error('Erreur chargement du tableau de bord production.');
    } finally {
      setChargement(false);
    }
  }

  if (chargement && !donnees) return <div style={{ padding: '20px' }}>Chargement…</div>;
  if (!donnees) return <div style={{ padding: '20px', color: '#888' }}>Tableau de bord indisponible.</div>;

  const { compteurs: c, alertes: al, planifiees, en_cours: enCours, mois, top_recettes: top, produits_sous_minimum: sousMin } = donnees;
  const m = mois.courant, p = mois.precedent;
  const rien = c.planifiees + c.en_cours + c.validees === 0;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <Carte titre="📝 Planifiées" valeur={c.planifiees} sous={al.en_retard > 0 ? `${al.en_retard} en retard` : 'aucune en retard'} couleur={al.en_retard > 0 ? '#c62828' : '#004d5a'} onClick={() => onAller && onAller('productions')} />
        <Carte titre="⚙️ En cours" valeur={c.en_cours} onClick={() => onAller && onAller('productions')} />
        <Carte titre={`✅ Validées en ${nomMois(m.mois)}`} valeur={m.productions} sous={`${c.validees} au total`} couleur="#2e7d32" />
        <Carte titre="⚠️ À surveiller" valeur={al.bloquees + al.sous_minimum} couleur={al.bloquees + al.sous_minimum > 0 ? '#e65100' : '#2e7d32'}
          sous={`${al.bloquees} bloquée${al.bloquees > 1 ? 's' : ''} faute de matière · ${al.sous_minimum} produit${al.sous_minimum > 1 ? 's' : ''} sous le minimum`} />
      </div>

      {rien && (
        <div style={{ ...styles.card, textAlign: 'center', color: '#888', padding: '30px' }}>
          Aucune production pour l'instant. Crée une recette (onglet Recettes) puis lance une production : ce tableau de bord se remplira tout seul.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#004d5a' }}>📝 Productions à lancer</h3>
          {planifiees.length === 0 ? <div style={{ color: '#888', fontSize: '13px' }}>Aucune production planifiée.</div> : planifiees.map(pl => {
            const e = ECHEANCES[pl.echeance] || ECHEANCES.SANS_DATE;
            return (
              <div key={pl.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span><strong>{pl.numero}</strong> · {pl.produit} · {qte(pl.quantite)} {pl.unite}</span>
                  <span style={{ background: e.fond, color: e.couleur, borderRadius: '10px', padding: '1px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>{e.label} · {dateFr(pl.date)}</span>
                </div>
                {pl.possible === false && (
                  <div style={{ fontSize: '11px', color: '#c62828', marginTop: '3px' }}>
                    Stock insuffisant aujourd'hui : {pl.manques.map(x => `${x.designation} (il manque ${qte(x.manque)} ${x.unite})`).join(', ')}
                  </div>
                )}
                {pl.possible === true && <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '3px' }}>✓ Matières disponibles</div>}
              </div>
            );
          })}
          <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>La disponibilité tient compte des quantités déjà réservées par les productions en cours.</div>
        </div>

        <div style={styles.card}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#004d5a' }}>⚙️ En cours</h3>
          {enCours.length === 0 ? <div style={{ color: '#888', fontSize: '13px' }}>Aucune production en cours.</div> : enCours.map(x => (
            <div key={x.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>{x.numero}</strong> · {x.produit} · {qte(x.quantite)} {x.unite}</span>
              <span style={{ color: '#666', fontSize: '12px' }}>lancée le {dateFr(x.date_lancement)}{x.jours > 0 ? ` (${x.jours} j)` : ''}</span>
            </div>
          ))}
          <h3 style={{ margin: '18px 0 10px', fontSize: '14px', color: '#004d5a' }}>📦 Produits fabriqués sous le minimum</h3>
          {sousMin.length === 0 ? <div style={{ color: '#2e7d32', fontSize: '13px' }}>Aucun produit fabriqué sous son stock minimum.</div> : sousMin.map(a => (
            <div key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{a.designation}</span>
              <span style={{ color: '#c62828' }}>{qte(a.stock)} / {qte(a.minimum)} {a.unite} — à produire : {qte(a.manque)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#004d5a' }}>📅 {nomMois(m.mois)} comparé à {nomMois(p.mois)}</h3>
        <div style={{ fontSize: '11px', color: '#888', margin: '-6px 0 12px' }}>Le mois en cours n'est pas terminé : il ne compte que les productions validées jusqu'à aujourd'hui, la comparaison est donc partielle.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <Comparaison titre="Quantité produite" hausseBonne evo={mois.evolution.quantite_pct} format={qte}
              a={{ label: nomMois(p.mois), valeur: p.quantite_produite }} b={{ label: nomMois(m.mois), valeur: m.quantite_produite }} />
            <Comparaison titre="Coût total engagé" evo={mois.evolution.cout_total_pct} format={ar}
              a={{ label: nomMois(p.mois), valeur: p.cout_total }} b={{ label: nomMois(m.mois), valeur: m.cout_total }} />
            <div style={{ fontSize: '12px', color: m.valeur_perte > 0 ? '#c62828' : '#888' }}>
              Pertes de {nomMois(m.mois)} : {m.perte_quantite > 0 ? `${qte(m.perte_quantite)} unité${m.perte_quantite > 1 ? 's' : ''} perdue${m.perte_quantite > 1 ? 's' : ''} (${ar(m.valeur_perte)})` : 'aucune'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#004d5a', marginBottom: '6px' }}>Recettes les plus coûteuses du mois</div>
            {top.length === 0 ? <div style={{ color: '#888', fontSize: '13px' }}>Aucune production validée ce mois-ci.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  {top.map(r => (
                    <tr key={r.recette_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '5px 4px' }}><strong>{r.produit}</strong><div style={{ color: '#888', fontSize: '10px' }}>{r.code} · {r.productions} lot{r.productions > 1 ? 's' : ''}</div></td>
                      <td style={{ padding: '5px 4px', textAlign: 'right' }}>{qte(r.quantite)} {r.unite}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 'bold' }}>{ar(r.cout)}<div style={{ color: '#2e7d32', fontSize: '10px', fontWeight: 'normal' }}>{ar(r.cout_unitaire)} / {r.unite}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button type="button" style={{ ...styles.boutonSecondaire, marginTop: '10px' }} onClick={() => onAller && onAller('suivi')}>📈 Voir le suivi des coûts</button>
          </div>
        </div>
      </div>
    </div>
  );
}
