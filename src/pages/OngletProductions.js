import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productionService } from '../services/api';
import useSoumission from '../hooks/useSoumission';
import { styles, ar, qte } from './productionCommun';
import { normaliserDesignation } from '../utils/similitudeArticles';

export const STATUTS = {
  PLANIFIEE: { label: '📝 Planifiée', fond: '#e3f2fd', couleur: '#1565c0' },
  EN_COURS: { label: '⏳ En cours', fond: '#fff3e0', couleur: '#e65100' },
  VALIDEE: { label: '✅ Validée', fond: '#e8f5e9', couleur: '#2e7d32' },
  ANNULEE: { label: '🚫 Annulée', fond: '#f5f5f5', couleur: '#777' },
};

function Pastille({ statut }) {
  const s = STATUTS[statut] || { label: statut, fond: '#eee', couleur: '#555' };
  return <span style={{ background: s.fond, color: s.couleur, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', whiteSpace: 'nowrap' }}>{s.label}</span>;
}

const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const aujourdhui = () => new Date().toISOString().slice(0, 10);
// pourcentage à une décimale, virgule française (5,6)
const pct = (a, b) => (Number(b) > 0 ? (Math.round((Number(a) / Number(b)) * 1000) / 10).toLocaleString('fr-FR') : '0');

// L'onglet s'ouvre tout de suite (sinon le navigateur bloque la fenêtre), puis reçoit le PDF
export async function ouvrirFichePdf(entreprise_id, id) {
  const fenetre = window.open('', '_blank');
  try {
    const res = await productionService.pdfProduction(entreprise_id, id);
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    if (fenetre) fenetre.location.href = url;
  } catch (err) {
    if (fenetre) fenetre.close();
    toast.error('Fiche de production indisponible.');
  }
}

// Tableau des besoins pour une quantité (calcul ou production non validée)
function TableauBesoins({ lignes, estCalcul }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
      <thead>
        <tr style={{ background: '#eef5f6' }}>
          {['Matière', 'Quantité à utiliser', 'Stock disponible', 'Manque', ''].map(h => <th key={h} style={{ ...styles.th, fontSize: '11px', padding: '6px 8px' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {lignes.map(l => {
          const qRecette = estCalcul ? l.quantite_recette : (l.quantite_recette ?? l.quantite_theorique);
          const uRecette = estCalcul ? l.unite_recette : (l.unite_recette || l.unite);
          const besoin = estCalcul ? l.besoin : l.quantite_theorique;
          const autre = uRecette && String(uRecette).trim() !== String(l.unite).trim();
          return (
            <tr key={l.article_id} style={{ borderBottom: '1px solid #eee', background: l.suffisant ? 'white' : '#fff5f5' }}>
              <td style={{ padding: '6px 8px' }}>{l.designation}</td>
              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>
                {qte(qRecette)} {uRecette}
                {autre && <div style={{ fontWeight: 'normal', color: '#777', fontSize: '10px' }}>soit {qte(besoin)} {l.unite}</div>}
              </td>
              <td style={{ padding: '6px 8px' }}>
                {qte(l.disponible)} {l.unite}
                {Number(l.reserve ?? l.reserve_autres) > 0 && <div style={{ fontSize: '10px', color: '#6a1b9a' }}>{qte(l.reserve ?? l.reserve_autres)} réservé ailleurs</div>}
              </td>
              <td style={{ padding: '6px 8px', color: l.suffisant ? '#999' : '#c62828', fontWeight: l.suffisant ? 'normal' : 'bold' }}>
                {l.suffisant ? '—' : `${qte(l.manque)} ${l.unite}`}
              </td>
              <td style={{ padding: '6px 8px' }}>{l.suffisant ? '✅' : '⛔'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function BandeauDispo({ pret, manques }) {
  if (pret) return <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>✅ Tous les ingrédients sont disponibles : la production peut être lancée.</div>;
  return (
    <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
      ⛔ Production impossible pour l'instant. Il manque : {manques.map(m => `${qte(m.manque)} ${m.unite} de ${m.designation}`).join(', ')}.
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Nouvelle production : choix de la recette, quantité, calcul
// ---------------------------------------------------------------------------------------------
function NouvelleProduction({ entreprise, recettes, onFermer, onCree }) {
  const { enCours, soumettre } = useSoumission();
  const actives = recettes.filter(r => r.actif && r.produit_fini);
  const [form, setForm] = useState({ recette_id: actives.length === 1 ? actives[0].id : '', quantite: '', date_production: aujourdhui(), notes: '' });
  const [calcul, setCalcul] = useState(null);
  const [calculEnCours, setCalculEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const recette = actives.find(r => r.id === form.recette_id);
  const unite = recette?.produit_fini?.unite || '';
  const maj = (patch) => { setForm(f => ({ ...f, ...patch })); setCalcul(null); setErreur(''); };

  async function calculer() {
    setErreur('');
    if (!form.recette_id) return toast.error('Choisis la recette (le produit fini à fabriquer).');
    if (!(Number(form.quantite) > 0)) return toast.error('Indique la quantité à produire.');
    setCalculEnCours(true);
    try {
      const res = await productionService.calculRecette(entreprise.id, form.recette_id, Number(form.quantite));
      setCalcul(res.data.data);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Calcul impossible.');
    } finally {
      setCalculEnCours(false);
    }
  }

  async function enregistrer(imprimer) {
    try {
      const res = await productionService.creerProduction({ entreprise_id: entreprise.id, recette_id: form.recette_id, quantite: Number(form.quantite), date_production: form.date_production, notes: form.notes });
      toast.success(res.data.message || 'Production enregistrée.');
      const id = res.data.data.id;
      if (imprimer) ouvrirFichePdf(entreprise.id, id);
      onCree(id);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    }
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h2 style={{ marginTop: 0, color: '#004d5a' }}>🏭 Nouvelle production</h2>
        {actives.length === 0 ? (
          <div style={{ padding: '20px', color: '#e65100' }}>Crée d'abord une recette (onglet Recettes) : une production se fait toujours à partir d'une recette.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={styles.label}>Produit fini à fabriquer (recette) *</label>
                <select style={styles.input} value={form.recette_id} onChange={e => maj({ recette_id: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {actives.map(r => <option key={r.id} value={r.id}>{r.produit_fini.designation} — {r.code} {r.nom !== r.produit_fini.designation ? `(${r.nom})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Quantité à produire *</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input style={styles.input} type="number" min="0" step="any" value={form.quantite} placeholder="Ex. 180" onChange={e => maj({ quantite: e.target.value })} />
                  <span style={{ fontSize: '13px', color: '#555', whiteSpace: 'nowrap' }}>{unite}</span>
                </div>
              </div>
              <div>
                <label style={styles.label}>Date prévue</label>
                <input style={styles.input} type="date" value={form.date_production} onChange={e => maj({ date_production: e.target.value })} />
              </div>
            </div>
            {recette && <div style={{ fontSize: '11px', color: '#777', marginBottom: '10px' }}>La recette est écrite pour {qte(recette.quantite_reference)} {unite} ; les quantités seront ajustées à la quantité demandée.</div>}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Notes (facultatif)</label>
              <input style={styles.input} value={form.notes} placeholder="Ex. commande client, lot de décembre…" onChange={e => maj({ notes: e.target.value })} />
            </div>
            <button type="button" style={{ ...styles.boutonPrimaire, background: '#004d5a', color: 'white', padding: '8px 16px', marginBottom: '16px' }} disabled={calculEnCours} onClick={calculer}>
              {calculEnCours ? '⏳ Calcul…' : '🧮 Calculer les besoins'}
            </button>

            {calcul && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ marginBottom: '10px' }}><BandeauDispo pret={calcul.possible} manques={calcul.manques} /></div>
                <TableauBesoins lignes={calcul.lignes} estCalcul />
                {calcul.main_oeuvre.length > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#555' }}>
                    👷 Main-d'œuvre : {calcul.main_oeuvre.map(m => `${m.libelle} (${qte(m.nombre_personnes)} pers. × ${qte(m.heures)} h)`).join(' · ')}
                  </div>
                )}
                <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '12px', marginTop: '12px', fontSize: '13px', display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
                  <div>Matières : <strong>{ar(calcul.cout_matieres)}</strong></div>
                  <div>Main-d'œuvre : <strong>{ar(calcul.cout_main_oeuvre)}</strong></div>
                  <div>Total théorique : <strong>{ar(calcul.cout_total)}</strong></div>
                  <div style={{ color: '#2e7d32' }}>Par {unite || 'unité'} : <strong>{ar(calcul.cout_unitaire)}</strong> <span style={{ color: '#1565c0', fontSize: '12px' }}>(au dernier achat : {ar(calcul.cout_unitaire_recent)})</span></div>
                </div>
                <div style={{ fontSize: '11px', color: '#777', marginTop: '4px' }}>Coût théorique : le coût réel sera calculé à la validation, avec les quantités réellement utilisées et produites.</div>
              </div>
            )}
          </>
        )}
        {erreur && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{erreur}</div>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" style={styles.boutonSecondaire} onClick={onFermer}>Fermer</button>
          {calcul && (
            <>
              <button type="button" style={styles.boutonSecondaire} disabled={enCours} onClick={() => soumettre(() => enregistrer(true))}>🖨️ Enregistrer et imprimer la fiche</button>
              <button type="button" style={{ ...styles.boutonPrimaire, background: '#004d5a', color: 'white', padding: '8px 18px' }} disabled={enCours} onClick={() => soumettre(() => enregistrer(false))}>
                {enCours ? '⏳ Patientez...' : 'Enregistrer la production'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Détail d'une production : lancer, valider, annuler, imprimer
// ---------------------------------------------------------------------------------------------
function DetailProduction({ entreprise, id, onFermer, onChange }) {
  const { enCours, soumettre } = useSoumission();
  const [p, setP] = useState(null);
  const [mode, setMode] = useState(null);           // null | 'modifier' | 'valider'
  const [edition, setEdition] = useState({ quantite: '', date_production: '', notes: '' });
  const [validation, setValidation] = useState({ quantite_produite: '', date: aujourdhui(), lignes: {} });
  const [erreur, setErreur] = useState('');

  useEffect(() => { recharger(); }, [id]);

  async function recharger() {
    try {
      const res = await productionService.getProduction(entreprise.id, id);
      setP(res.data.data);
    } catch (err) {
      toast.error('Production introuvable.');
      onFermer();
    }
  }

  async function agir(fonction, succes) {
    setErreur('');
    try {
      const res = await fonction();
      setP(res.data.data);
      setMode(null);
      toast.success(res.data.message || succes);
      onChange();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur.');
    }
  }

  if (!p) return <div style={styles.modal}><div style={styles.modalContent}>Chargement…</div></div>;
  const unite = p.produit_fini?.unite || '';
  const validee = p.statut === 'VALIDEE';

  function ouvrirValidation() {
    setErreur('');
    setValidation({ quantite_produite: Number(p.quantite_demandee), date: aujourdhui(), lignes: Object.fromEntries(p.lignes.map(l => [l.article_id, Number(l.quantite_theorique)])) });
    setMode('valider');
  }

  function valider() {
    const produite = Number(validation.quantite_produite);
    if (!(produite > 0)) return setErreur('Indique la quantité réellement produite (supérieure à 0).');
    const lignes = p.lignes
      .filter(l => Number(validation.lignes[l.article_id]) !== Number(l.quantite_theorique))
      .map(l => ({ article_id: l.article_id, quantite_reelle: Number(validation.lignes[l.article_id]) }));
    const ecart = Number(p.quantite_demandee) - produite;
    const msg = `Valider ${p.numero} ?\n\n${qte(produite)} ${unite} produits sur ${qte(p.quantite_demandee)} demandés${ecart > 0 ? ` (perte : ${qte(ecart)})` : ''}.\nLes matières seront sorties du stock et le produit fini entrera en stock. Le coût sera figé.`;
    if (!window.confirm(msg)) return;
    return agir(() => productionService.validerProduction(id, { quantite_produite: produite, date: validation.date, lignes }), 'Production validée.');
  }

  const ecartLive = Number(p.quantite_demandee) - Number(validation.quantite_produite || 0);

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#004d5a' }}>🏭 {p.numero} <Pastille statut={p.statut} /></h2>
            <div style={{ fontSize: '13px', color: '#555', marginTop: '6px' }}>
              <strong>{p.produit_fini?.designation}</strong> — recette {p.recette?.code} · {qte(p.quantite_demandee)} {unite} demandés · prévue le {dateFr(p.date_production)}
            </div>
            {p.notes && <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>📝 {p.notes}</div>}
          </div>
          <button type="button" style={styles.boutonSecondaire} onClick={() => ouvrirFichePdf(entreprise.id, p.id)}>🖨️ Fiche PDF</button>
        </div>

        {(p.statut === 'PLANIFIEE' || p.statut === 'EN_COURS') && (
          <div style={{ marginBottom: '12px' }}>
            {p.statut === 'PLANIFIEE'
              ? <BandeauDispo pret={p.pret} manques={p.manques} />
              : <div style={{ background: '#fff3e0', color: '#e65100', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>⏳ Production lancée : les matières sont réservées (elles restent en stock jusqu'à la validation).</div>}
          </div>
        )}

        {/* Matières */}
        {!validee ? (
          <TableauBesoins lignes={p.lignes.map(l => ({ ...l, besoin: l.quantite_theorique }))} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#eef5f6' }}>
                {['Matière', 'Prévu', 'Réellement utilisé', 'Coût unitaire', 'Coût'].map(h => <th key={h} style={{ ...styles.th, fontSize: '11px', padding: '6px 8px' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {p.lignes.map(l => {
                const diff = Number(l.quantite_reelle) !== Number(l.quantite_theorique);
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '6px 8px' }}>{l.designation}</td>
                    <td style={{ padding: '6px 8px' }}>{qte(l.quantite_theorique)} {l.unite}</td>
                    <td style={{ padding: '6px 8px', fontWeight: diff ? 'bold' : 'normal', color: diff ? '#e65100' : 'inherit' }}>{qte(l.quantite_reelle)} {l.unite}</td>
                    <td style={{ padding: '6px 8px' }}>{ar(l.cout_unitaire)} / {l.unite}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{ar(l.cout)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {p.main_oeuvre.length > 0 && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#555' }}>
            👷 Main-d'œuvre : {p.main_oeuvre.map(m => `${m.libelle} — ${qte(m.nombre_personnes)} pers. × ${qte(m.heures)} h${validee ? ` (${ar(m.cout)})` : ''}`).join(' · ')}
          </div>
        )}

        {/* Résultat figé */}
        {validee && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { t: 'Demandé', v: `${qte(p.quantite_demandee)} ${unite}` },
                { t: 'Réellement produit', v: `${qte(p.quantite_produite)} ${unite}` },
                { t: Number(p.ecart_quantite) >= 0 ? 'Perte' : 'Surplus', v: `${qte(Math.abs(p.ecart_quantite))} ${unite}${Number(p.ecart_quantite) > 0 ? ` (${pct(p.ecart_quantite, p.quantite_demandee)} %)` : ''}`, c: Number(p.ecart_quantite) > 0 ? '#c62828' : '#2e7d32', sub: Number(p.valeur_perte) > 0 ? `valeur : ${ar(p.valeur_perte)}` : '' },
                { t: `Coût réel / ${unite || 'unité'}`, v: ar(p.cout_unitaire), c: '#2e7d32' },
              ].map(c => (
                <div key={c.t} style={{ background: '#f5f9fa', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#666' }}>{c.t}</div>
                  <div style={{ fontSize: '17px', fontWeight: 'bold', color: c.c || '#333' }}>{c.v}</div>
                  {c.sub && <div style={{ fontSize: '10px', color: '#888' }}>{c.sub}</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>
              Coût total {ar(p.cout_total)} = matières {ar(p.cout_matieres)} + main-d'œuvre {ar(p.cout_main_oeuvre)}, réparti sur les {qte(p.quantite_produite)} {unite} réellement produits : une perte renchérit chaque unité.
              Validée le {dateFr(p.date_validation)}. <strong>Ce coût est figé</strong> : il ne change plus quand les prix d'achat évoluent.
            </div>
          </div>
        )}

        {/* Formulaire de modification */}
        {mode === 'modifier' && (
          <div style={{ background: '#f5f9fa', borderRadius: '8px', padding: '14px', marginTop: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '12px' }}>
              <div><label style={styles.label}>Quantité ({unite})</label><input style={styles.input} type="number" min="0" step="any" value={edition.quantite} onChange={e => setEdition({ ...edition, quantite: e.target.value })} /></div>
              <div><label style={styles.label}>Date prévue</label><input style={styles.input} type="date" value={edition.date_production} onChange={e => setEdition({ ...edition, date_production: e.target.value })} /></div>
              <div><label style={styles.label}>Notes</label><input style={styles.input} value={edition.notes} onChange={e => setEdition({ ...edition, notes: e.target.value })} /></div>
            </div>
            <div style={{ fontSize: '11px', color: '#777', margin: '6px 0' }}>Le calcul est refait avec la recette actuelle.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" style={styles.boutonSecondaire} onClick={() => setMode(null)}>Annuler</button>
              <button type="button" style={{ ...styles.boutonPrimaire, background: '#004d5a', color: 'white' }} disabled={enCours}
                onClick={() => soumettre(() => agir(() => productionService.modifierProduction(p.id, { quantite: Number(edition.quantite), date_production: edition.date_production, notes: edition.notes }), 'Production modifiée.'))}>Enregistrer</button>
            </div>
          </div>
        )}

        {/* Formulaire de validation */}
        {mode === 'valider' && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '14px', marginTop: '14px' }}>
            <strong style={{ color: '#8a6d00' }}>✅ Valider la production : compare le prévu et le réel</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '12px 0' }}>
              <div>
                <label style={styles.label}>Quantité réellement produite ({unite}) *</label>
                <input style={styles.input} type="number" min="0" step="any" value={validation.quantite_produite} onChange={e => setValidation({ ...validation, quantite_produite: e.target.value })} />
                <div style={{ fontSize: '12px', marginTop: '4px', color: ecartLive > 0 ? '#c62828' : '#2e7d32' }}>
                  {ecartLive > 0 ? `Perte : ${qte(ecartLive)} ${unite} (${pct(ecartLive, p.quantite_demandee)} %)` : ecartLive < 0 ? `Surplus : ${qte(-ecartLive)} ${unite}` : 'Conforme à la quantité demandée'}
                </div>
              </div>
              <div>
                <label style={styles.label}>Date de production</label>
                <input style={styles.input} type="date" value={validation.date} onChange={e => setValidation({ ...validation, date: e.target.value })} />
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Matières réellement utilisées (change seulement si ça diffère du prévu)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead><tr>{['Matière', 'Prévu', 'Réellement utilisé'].map(h => <th key={h} style={{ ...styles.th, padding: '4px 6px', fontSize: '11px' }}>{h}</th>)}</tr></thead>
              <tbody>
                {p.lignes.map(l => (
                  <tr key={l.id}>
                    <td style={{ padding: '4px 6px' }}>{l.designation}</td>
                    <td style={{ padding: '4px 6px' }}>{qte(l.quantite_theorique)} {l.unite}</td>
                    <td style={{ padding: '4px 6px', width: '30%' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input style={styles.inputPetit} type="number" min="0" step="any" value={validation.lignes[l.article_id] ?? ''}
                          onChange={e => setValidation({ ...validation, lignes: { ...validation.lignes, [l.article_id]: e.target.value } })} />
                        <span style={{ color: '#666' }}>{l.unite}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: '11px', color: '#777', margin: '8px 0' }}>
              À la validation : les matières sortent du stock (au prix moyen du moment), le produit fini entre en stock au coût réel = (matières + main-d'œuvre) ÷ quantité produite.
              Si la quantité produite est trop souvent inférieure au prévu, pense à ajuster la recette.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" style={styles.boutonSecondaire} onClick={() => setMode(null)}>Annuler</button>
              <button type="button" style={{ ...styles.boutonPrimaire, background: '#2e7d32', color: 'white', border: '2px solid #2e7d32', padding: '8px 18px' }} disabled={enCours}
                onClick={() => soumettre(async () => valider())}>{enCours ? '⏳ Patientez...' : 'Valider la production'}</button>
            </div>
          </div>
        )}

        {erreur && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', fontSize: '13px', margin: '12px 0 0' }}>{erreur}</div>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '18px' }}>
          <button type="button" style={styles.boutonSecondaire} onClick={onFermer}>Fermer</button>
          {p.statut === 'PLANIFIEE' && mode !== 'modifier' && (
            <button type="button" style={styles.boutonSecondaire}
              onClick={() => { setErreur(''); setEdition({ quantite: Number(p.quantite_demandee), date_production: p.date_production, notes: p.notes || '' }); setMode('modifier'); }}>✏️ Modifier</button>
          )}
          {(p.statut === 'PLANIFIEE' || p.statut === 'EN_COURS') && (
            <button type="button" style={styles.boutonDanger} disabled={enCours}
              onClick={() => { if (window.confirm(`Annuler ${p.numero} ?${p.statut === 'EN_COURS' ? ' Les matières réservées seront libérées.' : ''}`)) soumettre(() => agir(() => productionService.annulerProduction(p.id), 'Production annulée.')); }}>🚫 Annuler la production</button>
          )}
          {p.statut === 'PLANIFIEE' && (
            <button type="button" disabled={enCours || !p.pret} title={p.pret ? '' : 'Il manque des matières'}
              style={{ ...styles.boutonPrimaire, background: p.pret ? '#004d5a' : '#ccc', color: 'white', border: 'none', padding: '8px 18px', cursor: p.pret ? 'pointer' : 'not-allowed' }}
              onClick={() => { if (window.confirm(`Lancer ${p.numero} ? Les matières seront réservées : plus personne ne pourra les sortir du stock.`)) soumettre(() => agir(() => productionService.lancerProduction(p.id), 'Production lancée.')); }}>🚀 Lancer la production</button>
          )}
          {p.statut === 'EN_COURS' && mode !== 'valider' && (
            <button type="button" style={{ ...styles.boutonPrimaire, background: '#2e7d32', color: 'white', border: 'none', padding: '8px 18px' }} onClick={ouvrirValidation}>✅ Valider la production</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Onglet Productions
// ---------------------------------------------------------------------------------------------
export default function OngletProductions({ entreprise, recettes }) {
  const [productions, setProductions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modal, setModal] = useState(null);          // null | { nouvelle: true } | { id }
  const [statut, setStatut] = useState('');
  const [recherche, setRecherche] = useState('');

  useEffect(() => { charger(); }, []);

  async function charger() {
    try {
      const res = await productionService.getProductions(entreprise.id);
      setProductions(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement des productions.');
    } finally {
      setChargement(false);
    }
  }

  const mots = normaliserDesignation(recherche).split(' ').filter(Boolean);
  const affichees = productions.filter(p => (!statut || p.statut === statut) &&
    mots.every(m => normaliserDesignation(`${p.numero} ${p.produit_fini?.designation || ''} ${p.recette?.nom || ''}`).includes(m)));

  if (chargement) return <div style={{ padding: '20px' }}>Chargement…</div>;

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <input style={{ ...styles.input, maxWidth: '260px' }} placeholder="Rechercher…" value={recherche} onChange={e => setRecherche(e.target.value)} />
        <select style={{ ...styles.input, maxWidth: '180px' }} value={statut} onChange={e => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button style={{ ...styles.boutonPrimaire, background: '#004d5a', color: 'white', padding: '9px 16px', fontSize: '13px' }} onClick={() => setModal({ nouvelle: true })}>+ Nouvelle production</button>
      </div>

      {affichees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          {productions.length === 0
            ? <>Aucune production pour le moment.<br />Choisis un produit fini, indique la quantité : l'outil calcule les matières nécessaires et vérifie le stock.</>
            : 'Aucune production ne correspond.'}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              {['N°', 'Date', 'Produit fini', 'Demandé', 'Statut', 'Produit', 'Perte', 'Coût réel / unité', ''].map(h => <th key={h} style={styles.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {affichees.map((p, i) => {
              const u = p.produit_fini?.unite || '';
              return (
                <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f0f0', opacity: p.statut === 'ANNULEE' ? 0.5 : 1 }}>
                  <td style={{ ...styles.td, fontWeight: 'bold', fontSize: '12px' }}>{p.numero}</td>
                  <td style={{ ...styles.td, fontSize: '12px' }}>{dateFr(p.date_production)}</td>
                  <td style={{ ...styles.td, fontSize: '12px' }}>{p.produit_fini?.designation || '—'}</td>
                  <td style={{ ...styles.td, fontSize: '12px' }}>{qte(p.quantite_demandee)} {u}</td>
                  <td style={styles.td}><Pastille statut={p.statut} /></td>
                  <td style={{ ...styles.td, fontSize: '12px', fontWeight: 'bold' }}>{p.statut === 'VALIDEE' ? `${qte(p.quantite_produite)} ${u}` : '—'}</td>
                  <td style={{ ...styles.td, fontSize: '12px', color: Number(p.ecart_quantite) > 0 ? '#c62828' : '#888' }}>
                    {p.statut === 'VALIDEE' ? (Number(p.ecart_quantite) > 0 ? `${qte(p.ecart_quantite)} (${pct(p.ecart_quantite, p.quantite_demandee)} %)` : '0') : '—'}
                  </td>
                  <td style={{ ...styles.td, fontSize: '13px', fontWeight: 'bold', color: '#2e7d32' }}>{p.statut === 'VALIDEE' ? ar(p.cout_unitaire) : '—'}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={styles.boutonSecondaire} title="Ouvrir" onClick={() => setModal({ id: p.id })}>👁️</button>
                      <button style={styles.boutonSecondaire} title="Fiche PDF" onClick={() => ouvrirFichePdf(entreprise.id, p.id)}>🖨️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {modal?.nouvelle && (
        <NouvelleProduction entreprise={entreprise} recettes={recettes} onFermer={() => setModal(null)}
          onCree={(id) => { setModal({ id }); charger(); }} />
      )}
      {modal?.id && (
        <DetailProduction entreprise={entreprise} id={modal.id} onFermer={() => setModal(null)} onChange={charger} />
      )}
    </div>
  );
}
