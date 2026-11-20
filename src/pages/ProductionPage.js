import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { stockService, productionService } from '../services/api';
import useSoumission from '../hooks/useSoumission';
import { trouverSimilaires, nettoyerDesignation, nettoyerFamille, listerFamilles, familleExistante, normaliserDesignation } from '../utils/similitudeArticles';
import { groupeDeCompte, libelleCompte } from '../utils/comptesStock';
import { unitesProposees, convertir, unitesCompatibles } from '../utils/unitesProduction';
import { apercuCout } from '../utils/coutRecette';
import { styles, ar, qte } from './productionCommun';
import OngletProductions from './OngletProductions';
import OngletSuivi from './OngletSuivi';
import OngletTableauBord from './OngletTableauBord';

// Comptes proposés pour un produit fabriqué (même règle que le serveur)
const COMPTES_PRODUIT = [
  { code: '355', libelle: 'Produits finis' },
  { code: '351', libelle: 'Produits intermédiaires' },
  { code: '331', libelle: 'Produits en cours' },
  { code: '335', libelle: 'Travaux en cours' },
];
const estProduitFabricable = (a) => a.actif !== false && ['33', '35'].includes(groupeDeCompte(a.compte_stock));

// Autres recettes qui utilisent la même matière (ex. le lait : beurre, fromage, yaourt)
const recettesUtilisant = (recettes, article_id, sauf) => (recettes || [])
  .filter(r => r.actif && (!sauf || r.id !== sauf) && (r.ingredients || []).some(l => String(l.article_id) === String(article_id)))
  .map(r => r.nom);
const motsDe = (t) => normaliserDesignation(t).split(' ').filter(Boolean);

// Champ de sélection d'article avec recherche (désignation, référence ou famille) : on choisit toujours un article du stock
function ChoixArticle({ articles, valeur, onChange, placeholder }) {
  const [texte, setTexte] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const choisi = articles.find(a => String(a.id) === String(valeur));
  if (choisi) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 9px', background: '#e0f2f1', borderRadius: '6px', fontSize: '13px' }}>
        <span style={{ flex: 1 }}><strong>{choisi.designation}</strong> <span style={{ color: '#666', fontSize: '11px' }}>({choisi.reference})</span></span>
        <button type="button" title="Changer d'article" onClick={() => { onChange(''); setTexte(''); }}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#004d5a', fontSize: '13px' }}>✕</button>
      </div>
    );
  }
  const mots = motsDe(texte);
  const trouves = articles.filter(a => {
    const meule = normaliserDesignation(`${a.designation} ${a.reference} ${a.famille || ''}`);
    return mots.every(m => meule.includes(m));
  }).slice(0, 8);
  return (
    <div style={{ position: 'relative' }}>
      <input style={styles.inputPetit} value={texte} placeholder={placeholder || 'Chercher un article du stock…'}
        onChange={e => { setTexte(e.target.value); setOuvert(true); }}
        onFocus={() => setOuvert(true)} onBlur={() => setTimeout(() => setOuvert(false), 150)} />
      {ouvert && (
        <div style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, top: '100%', background: 'white', border: '1px solid #ccc', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '220px', overflowY: 'auto' }}>
          {trouves.length === 0 && (
            <div style={{ padding: '10px', fontSize: '12px', color: '#888' }}>
              Aucun article. S'il n'existe pas encore, crée-le d'abord dans Stocks › Catalogue articles.
            </div>
          )}
          {trouves.map(a => (
            <div key={a.id} onMouseDown={() => { onChange(String(a.id)); setTexte(''); setOuvert(false); }}
              style={{ padding: '8px 10px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
              <strong>{a.designation}</strong> <span style={{ color: '#888' }}>({a.reference})</span>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {a.famille ? `${a.famille} · ` : ''}{libelleCompte(a.compte_stock) || 'compte à choisir'} · stock {qte(a.stock_actuel)} {a.unite}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChampFamille({ valeur, onChange, articles }) {
  const familles = listerFamilles(articles);
  const existante = familleExistante(valeur, familles);
  const differe = existante && existante !== nettoyerFamille(valeur);
  return (
    <div>
      <label style={styles.label}>Famille (facultatif)</label>
      <input style={styles.input} value={valeur} list="familles-production" placeholder="Ex. Confitures"
        onChange={e => onChange(e.target.value)} />
      <datalist id="familles-production">{familles.map(f => <option key={f} value={f} />)}</datalist>
      {differe && <div style={{ marginTop: '4px', fontSize: '11px', color: '#1565c0' }}>La famille « {existante} » existe déjà : elle sera utilisée.</div>}
    </div>
  );
}

const ligneVide = () => ({ article_id: '', quantite: '', unite: '' });
const moVide = () => ({ libelle: '', nombre_personnes: 1, heures: '', taux_horaire: '' });

function FormulaireRecette({ recette, recettes, articles, assujettie, onSave, onCancel }) {
  const { enCours, soumettre } = useSoumission();
  const edition = !!recette;
  const [form, setForm] = useState({
    nom: recette?.nom || '',
    mode: 'existant',
    produit_fini_id: recette ? String(recette.produit_fini_id) : '',
    nouveau: { designation: '', unite: 'pot', compte_stock: '355', famille: '', prix_vente_defaut: '', confirmer_similaire: false },
    quantite_reference: recette ? Number(recette.quantite_reference) : '',
    unite_reference: '',          // unité choisie pour la quantité de référence ('' = celle du produit fini)
    notes: recette?.notes || '',
    ingredients: recette ? recette.ingredients.map(l => ({ article_id: String(l.article_id), quantite: Number(l.quantite), unite: l.unite })) : [ligneVide()],
    main_oeuvre: recette ? recette.main_oeuvre.map(m => ({ libelle: m.libelle, nombre_personnes: Number(m.nombre_personnes), heures: Number(m.heures), taux_horaire: Number(m.taux_horaire) })) : [],
  });
  const [erreurServeur, setErreurServeur] = useState('');
  const maj = (patch) => setForm(f => ({ ...f, ...patch }));
  const majNouveau = (patch) => setForm(f => ({ ...f, nouveau: { ...f.nouveau, ...patch } }));

  const parId = useMemo(() => new Map(articles.map(a => [String(a.id), a])), [articles]);
  const produitsPossibles = articles.filter(estProduitFabricable);
  const produit = form.mode === 'existant' ? parId.get(form.produit_fini_id) : null;
  const uniteProduit = form.mode === 'existant' ? (produit?.unite || '') : (form.nouveau.unite || '');
  const idsUtilises = new Set(form.ingredients.map(l => l.article_id).filter(Boolean));
  const candidats = (idCourant) => articles.filter(a => a.actif !== false && String(a.id) !== String(form.produit_fini_id)
    && (String(a.id) === String(idCourant) || !idsUtilises.has(String(a.id))));
  // Unité de la quantité de référence : celle du produit fini, ou une unité de la même famille (ex. produit en litre → ml, cl, l).
  // On convertit dans l'unité du produit avant d'enregistrer : le stock et les coûts restent dans l'unité de l'article.
  const optionsUnite = uniteProduit ? unitesProposees(uniteProduit) : [];
  const uniteRef = form.unite_reference && unitesCompatibles(form.unite_reference, uniteProduit) ? form.unite_reference : uniteProduit;
  const quantiteRefProduit = (() => {
    const q = Number(form.quantite_reference);
    if (!(q > 0) || !uniteProduit || uniteRef === uniteProduit) return q;
    const c = convertir(q, uniteRef, uniteProduit);
    return c == null ? q : Math.round(c * 1e6) / 1e6;
  })();
  const apercu = apercuCout({ ...form, quantite_reference: quantiteRefProduit }, parId, assujettie);

  // Doublon du nouveau produit (même règle que le catalogue) : identique = bloqué, proche = confirmation
  const similaires = form.mode === 'nouveau' ? trouverSimilaires(nettoyerDesignation(form.nouveau.designation), articles) : [];
  const identique = similaires.find(x => x.type === 'IDENTIQUE');
  const proches = similaires.filter(x => x.type === 'PROCHE');

  const majLigne = (i, patch) => maj({ ingredients: form.ingredients.map((l, k) => k === i ? { ...l, ...patch } : l) });
  const choisirArticle = (i, id) => {
    const a = parId.get(String(id));
    majLigne(i, { article_id: id, unite: a ? a.unite : '' });
  };
  const majMo = (i, patch) => maj({ main_oeuvre: form.main_oeuvre.map((m, k) => k === i ? { ...m, ...patch } : m) });

  async function valider() {
    setErreurServeur('');
    if (!(Number(form.quantite_reference) > 0)) return toast.error('Indique la quantité de référence (ex. 10 pots).');
    if (form.mode === 'existant' && !form.produit_fini_id) return toast.error('Choisis le produit fini, ou crée-le.');
    if (form.mode === 'nouveau') {
      if (nettoyerDesignation(form.nouveau.designation).length < 2) return toast.error('Indique la désignation du produit fini.');
      if (identique) return toast.error(`« ${identique.article.designation} » existe déjà : sélectionne-le comme produit fini.`);
      if (proches.length && !form.nouveau.confirmer_similaire) return toast.error('Un article très proche existe déjà : confirme qu\'il s\'agit d\'un article différent, ou sélectionne-le.');
    }
    const lignes = form.ingredients.filter(l => l.article_id || l.quantite);
    if (!lignes.length) return toast.error('Ajoute au moins un ingrédient.');
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i], a = parId.get(String(l.article_id));
      if (!a) return toast.error(`Ingrédient ${i + 1} : choisis un article du stock.`);
      if (!(Number(l.quantite) > 0)) return toast.error(`Ingrédient ${i + 1} (${a.designation}) : indique la quantité.`);
      if (!unitesCompatibles(l.unite || a.unite, a.unite)) return toast.error(`« ${a.designation} » est tenu en ${a.unite} : choisis une unité compatible.`);
    }
    const mo = form.main_oeuvre.filter(m => m.libelle || m.heures || m.taux_horaire);
    for (let i = 0; i < mo.length; i++) {
      if (!String(mo[i].libelle).trim()) return toast.error(`Main-d'œuvre ${i + 1} : indique le poste (ex. Cuisson).`);
      if (!(Number(mo[i].nombre_personnes) > 0) || !(Number(mo[i].heures) > 0)) return toast.error(`Main-d'œuvre ${i + 1} : personnes et heures doivent être supérieures à 0.`);
    }
    const payload = {
      nom: form.nom, notes: form.notes, quantite_reference: quantiteRefProduit,
      ...(form.mode === 'existant'
        ? { produit_fini_id: form.produit_fini_id }
        : { nouveau_produit: { ...form.nouveau, designation: nettoyerDesignation(form.nouveau.designation), prix_vente_defaut: Number(form.nouveau.prix_vente_defaut) || 0 } }),
      ingredients: lignes.map(l => ({ article_id: l.article_id, quantite: Number(l.quantite), unite: l.unite || parId.get(String(l.article_id)).unite })),
      main_oeuvre: mo.map(m => ({ libelle: m.libelle, nombre_personnes: Number(m.nombre_personnes), heures: Number(m.heures), taux_horaire: Number(m.taux_horaire) || 0 })),
    };
    try {
      await onSave(payload);
    } catch (err) {
      const d = err.response?.data;
      setErreurServeur(d?.message || 'Erreur lors de l\'enregistrement.');
    }
  }

  const sansPrix = apercu.lignes.some(l => l && l.source === 'SANS_PRIX');
  const cellule = { padding: '6px 4px', verticalAlign: 'top' };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h2 style={{ marginTop: 0, color: '#004d5a' }}>{edition ? `✏️ Modifier la recette ${recette.code}` : '📖 Nouvelle recette'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={styles.label}>Nom de la recette</label>
            <input style={styles.input} value={form.nom} placeholder="Par défaut : le nom du produit fini" onChange={e => maj({ nom: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Quantité de référence *</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input style={styles.input} type="number" min="0" step="any" value={form.quantite_reference}
                placeholder="Ex. 10" onChange={e => maj({ quantite_reference: e.target.value })} />
              {form.mode === 'nouveau' ? (
                <>
                  <input style={{ ...styles.input, width: '110px' }} value={form.nouveau.unite} list="unites-produit" placeholder="Unité" title="Unité du produit fini"
                    onChange={e => majNouveau({ unite: e.target.value })} />
                  <datalist id="unites-produit">{['pot', 'pièce', 'kg', 'g', 'litre', 'ml', 'boîte', 'sachet', 'bouteille', 'carton'].map(u => <option key={u} value={u} />)}</datalist>
                </>
              ) : optionsUnite.length > 1 ? (
                <select style={{ ...styles.input, width: '110px' }} value={uniteRef} onChange={e => maj({ unite_reference: e.target.value })}>
                  {optionsUnite.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: '13px', color: '#555', whiteSpace: 'nowrap' }}>{uniteProduit || '← choisis d\'abord le produit fini'}</span>
              )}
            </div>
            {uniteRef !== uniteProduit && quantiteRefProduit > 0 && (
              <div style={{ fontSize: '11px', color: '#1565c0', marginTop: '3px' }}>= {qte(quantiteRefProduit)} {uniteProduit} (unité du produit en stock)</div>
            )}
            <div style={{ fontSize: '11px', color: '#777', marginTop: '3px' }}>
              Les quantités ci-dessous sont celles qu'il faut pour fabriquer cette quantité. L'outil les ajustera à la quantité demandée à chaque production.
            </div>
          </div>
        </div>

        {/* Produit fini */}
        <div style={{ background: '#f5f9fa', border: '1px solid #d6e6ea', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
            <strong style={{ fontSize: '13px', color: '#004d5a' }}>🏭 Produit fini</strong>
            {[{ k: 'existant', l: 'Article existant' }, { k: 'nouveau', l: 'Nouveau produit' }].map(o => (
              <button key={o.k} type="button" onClick={() => maj({ mode: o.k })}
                style={{ ...styles.boutonSecondaire, background: form.mode === o.k ? '#004d5a' : 'white', color: form.mode === o.k ? 'white' : '#004d5a' }}>{o.l}</button>
            ))}
          </div>
          {form.mode === 'existant' ? (
            <>
              <ChoixArticle articles={produitsPossibles} valeur={form.produit_fini_id} placeholder="Chercher le produit fini (produits finis, intermédiaires, en cours)…"
                onChange={id => maj({ produit_fini_id: id })} />
              {produitsPossibles.length === 0 && (
                <div style={{ fontSize: '12px', color: '#e65100', marginTop: '6px' }}>
                  Aucun article n'est classé en « Produits finis » (355) ou « Produits intermédiaires » (351). Utilise « Nouveau produit », ou change le compte de stock de l'article dans Stocks.
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1 / 3' }}>
                <label style={styles.label}>Désignation *</label>
                <input style={styles.input} value={form.nouveau.designation} placeholder="Ex. Confiture d'ananas 100 ml"
                  onChange={e => majNouveau({ designation: e.target.value, confirmer_similaire: false })} />
              </div>
              <div style={{ gridColumn: '1 / 3' }}>
                <label style={styles.label}>Compte de stock</label>
                <select style={styles.input} value={form.nouveau.compte_stock} onChange={e => majNouveau({ compte_stock: e.target.value })}>
                  {COMPTES_PRODUIT.map(c => <option key={c.code} value={c.code}>{c.code} - {c.libelle}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Prix de vente</label>
                <input style={styles.input} type="number" min="0" step="any" value={form.nouveau.prix_vente_defaut} onChange={e => majNouveau({ prix_vente_defaut: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / 4' }}>
                <ChampFamille valeur={form.nouveau.famille} articles={articles} onChange={v => majNouveau({ famille: v })} />
              </div>
              {identique && (
                <div style={{ gridColumn: '1 / 4', background: '#ffebee', color: '#c62828', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}>
                  « {identique.article.designation} » (réf. {identique.article.reference}) existe déjà. Passe en « Article existant » et sélectionne-le.
                </div>
              )}
              {!identique && proches.length > 0 && (
                <div style={{ gridColumn: '1 / 4', background: '#fff8e1', color: '#8a6d00', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}>
                  Article très proche déjà en stock : {proches.map(x => `« ${x.article.designation} » (${x.article.reference})`).join(', ')}.
                  <label style={{ display: 'block', marginTop: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.nouveau.confirmer_similaire} onChange={e => majNouveau({ confirmer_similaire: e.target.checked })} /> C'est bien un article différent
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ingrédients */}
        <h3 style={{ margin: '0 0 8px', color: '#004d5a', fontSize: '15px' }}>🧂 Ingrédients (pour {form.quantite_reference ? qte(form.quantite_reference) : '…'} {uniteRef})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
          <thead>
            <tr>{['Article du stock', 'Quantité', 'Unité', 'Coût estimé', ''].map(h => <th key={h} style={{ ...styles.th, padding: '6px 4px' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {form.ingredients.map((l, i) => {
              const a = parId.get(String(l.article_id));
              const ap = apercu.lignes[i];
              const conv = a && Number(l.quantite) > 0 && l.unite && a.unite && l.unite !== a.unite ? convertir(l.quantite, l.unite, a.unite) : null;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ ...cellule, width: '38%' }}>
                    <ChoixArticle articles={candidats(l.article_id)} valeur={l.article_id} onChange={id => choisirArticle(i, id)} />
                    {a && <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Stock : {qte(a.stock_actuel)} {a.unite}</div>}
                    {a && recettesUtilisant(recettes, a.id, recette?.id).length > 0 && (
                      <div style={{ fontSize: '10px', color: '#6a1b9a', marginTop: '2px' }}>
                        Aussi utilisé dans : {recettesUtilisant(recettes, a.id, recette?.id).join(', ')} (le stock est partagé)
                      </div>
                    )}
                  </td>
                  <td style={{ ...cellule, width: '16%' }}>
                    <input style={styles.inputPetit} type="number" min="0" step="any" value={l.quantite} onChange={e => majLigne(i, { quantite: e.target.value })} />
                  </td>
                  <td style={{ ...cellule, width: '14%' }}>
                    {a ? (
                      <select style={styles.inputPetit} value={l.unite || a.unite} onChange={e => majLigne(i, { unite: e.target.value })}>
                        {unitesProposees(a.unite).map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    ) : <span style={{ color: '#aaa', fontSize: '12px' }}>—</span>}
                    {conv != null && <div style={{ fontSize: '10px', color: '#1565c0', marginTop: '2px' }}>= {qte(conv)} {a.unite}</div>}
                  </td>
                  <td style={{ ...cellule, width: '22%', fontSize: '12px' }}>
                    {ap ? (ap.source === 'INCOMPATIBLE' ? <span style={{ color: '#c62828' }}>unité incompatible</span> : (
                      <>
                        {ar(ap.cout)}
                        <div style={{ fontSize: '10px', color: ap.source === 'SANS_PRIX' ? '#c62828' : '#888' }}>
                          {ap.source === 'CMUP' ? 'coût moyen du stock' : ap.source === 'DERNIER_PRIX' ? 'dernier prix d\'achat' : '⚠️ aucun prix connu'}
                        </div>
                      </>
                    )) : '—'}
                  </td>
                  <td style={{ ...cellule, textAlign: 'right' }}>
                    <button type="button" style={styles.boutonDanger} title="Retirer"
                      onClick={() => maj({ ingredients: form.ingredients.length > 1 ? form.ingredients.filter((_, k) => k !== i) : [ligneVide()] })}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button type="button" style={{ ...styles.boutonSecondaire, marginBottom: '18px' }} onClick={() => maj({ ingredients: [...form.ingredients, ligneVide()] })}>+ Ajouter un ingrédient</button>

        {/* Main-d'œuvre */}
        <h3 style={{ margin: '0 0 8px', color: '#004d5a', fontSize: '15px' }}>👷 Main-d'œuvre (facultatif)</h3>
        {form.main_oeuvre.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
            <thead>
              <tr>{['Poste', 'Personnes', 'Heures par personne', 'Taux horaire (Ar/h)', 'Coût', ''].map(h => <th key={h} style={{ ...styles.th, padding: '6px 4px' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {form.main_oeuvre.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ ...cellule, width: '30%' }}><input style={styles.inputPetit} value={m.libelle} placeholder="Ex. Cuisson" onChange={e => majMo(i, { libelle: e.target.value })} /></td>
                  <td style={{ ...cellule, width: '14%' }}><input style={styles.inputPetit} type="number" min="0" step="any" value={m.nombre_personnes} onChange={e => majMo(i, { nombre_personnes: e.target.value })} /></td>
                  <td style={{ ...cellule, width: '16%' }}><input style={styles.inputPetit} type="number" min="0" step="any" value={m.heures} onChange={e => majMo(i, { heures: e.target.value })} /></td>
                  <td style={{ ...cellule, width: '18%' }}><input style={styles.inputPetit} type="number" min="0" step="any" value={m.taux_horaire} onChange={e => majMo(i, { taux_horaire: e.target.value })} /></td>
                  <td style={{ ...cellule, width: '14%', fontSize: '12px' }}>{ar(apercu.mo[i])}</td>
                  <td style={{ ...cellule, textAlign: 'right' }}>
                    <button type="button" style={styles.boutonDanger} onClick={() => maj({ main_oeuvre: form.main_oeuvre.filter((_, k) => k !== i) })}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button type="button" style={{ ...styles.boutonSecondaire, marginBottom: '18px' }} onClick={() => maj({ main_oeuvre: [...form.main_oeuvre, moVide()] })}>+ Ajouter un poste de main-d'œuvre</button>

        <div style={{ marginBottom: '14px' }}>
          <label style={styles.label}>Notes (facultatif)</label>
          <input style={styles.input} value={form.notes} placeholder="Ex. cuisson 45 min à feu doux" onChange={e => maj({ notes: e.target.value })} />
        </div>

        {/* Aperçu du coût */}
        <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
            <div>Matières : <strong>{ar(apercu.matieres)}</strong></div>
            <div>Main-d'œuvre : <strong>{ar(apercu.mainOeuvre)}</strong></div>
            <div>Total pour {form.quantite_reference ? qte(form.quantite_reference) : '…'} {uniteRef} : <strong>{ar(apercu.total)}</strong></div>
            <div style={{ color: '#2e7d32', fontSize: '15px' }}>Coût par {uniteProduit || 'unité'} : <strong>{ar(apercu.unitaire)}</strong></div>
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
            Coût théorique : chaque ingrédient est valorisé au prix moyen de ce qu'il y a en stock (le prix d'une matière varie dans l'année). Estimation, recalculée à l'enregistrement.
            {sansPrix && <span style={{ color: '#c62828' }}> ⚠️ Un ingrédient n'a encore aucun prix : le coût est sous-estimé.</span>}
          </div>
        </div>

        {erreurServeur && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{erreurServeur}</div>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button type="button" style={{ ...styles.boutonPrimaire, background: '#004d5a', color: 'white', padding: '8px 18px', opacity: enCours ? 0.6 : 1 }}
            disabled={enCours} onClick={() => soumettre(valider)}>
            {enCours ? '⏳ Patientez...' : (edition ? 'Enregistrer' : 'Créer la recette')}
          </button>
        </div>
      </div>
    </div>
  );
}

const sourceTexte = { CMUP: 'coût moyen', DERNIER_PRIX: 'dernier prix', SANS_PRIX: '⚠️ sans prix' };

function DetailRecette({ r, recettes }) {
  const c = r.cout;
  if (!c) return <div style={{ padding: '12px', color: '#c62828', fontSize: '13px' }}>⚠️ {r.probleme}</div>;
  return (
    <div style={{ padding: '10px 16px 16px', background: '#fafcfc' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#eef5f6' }}>
            {['Ingrédient', 'Quantité (recette)', 'Dans l\'unité du stock', 'Prix moyen du stock', 'Coût', 'Dernier achat', 'Coût', 'Stock actuel'].map(h => <th key={h} style={{ ...styles.th, fontSize: '11px', padding: '6px 8px' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {c.lignes.map(l => (
            <tr key={l.article_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '6px 8px' }}>{l.designation} <span style={{ color: '#999' }}>({l.reference})</span>
                {recettesUtilisant(recettes, l.article_id, r.id).length > 0 && (
                  <div style={{ fontSize: '10px', color: '#6a1b9a' }}>aussi dans : {recettesUtilisant(recettes, l.article_id, r.id).join(', ')}</div>
                )}
              </td>
              <td style={{ padding: '6px 8px' }}>{qte(l.quantite_recette)} {l.unite_recette}</td>
              <td style={{ padding: '6px 8px' }}>{qte(l.besoin)} {l.unite}</td>
              <td style={{ padding: '6px 8px' }}>{ar(l.cout_unitaire)} / {l.unite} <span style={{ color: l.source_cout === 'SANS_PRIX' ? '#c62828' : '#999', fontSize: '10px' }}>({sourceTexte[l.source_cout]})</span></td>
              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{ar(l.cout)}</td>
              <td style={{ padding: '6px 8px' }}>
                {ar(l.cout_unitaire_recent)} / {l.unite}
                <div style={{ fontSize: '10px', color: '#999' }}>{l.date_dernier_achat ? `acheté le ${new Date(l.date_dernier_achat).toLocaleDateString('fr-FR')}` : 'aucun achat : prix moyen'}</div>
              </td>
              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{ar(l.cout_recent)}</td>
              <td style={{ padding: '6px 8px' }}>{qte(l.stock_actuel)} {l.unite}</td>
            </tr>
          ))}
          {c.main_oeuvre.map((m, i) => (
            <tr key={'mo' + i} style={{ borderBottom: '1px solid #eee', color: '#555' }}>
              <td style={{ padding: '6px 8px' }}>👷 {m.libelle}</td>
              <td style={{ padding: '6px 8px' }}>{qte(m.nombre_personnes)} pers. × {qte(m.heures)} h</td>
              <td style={{ padding: '6px 8px' }}>—</td>
              <td style={{ padding: '6px 8px' }}>{ar(m.taux_horaire)} / h</td>
              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{ar(m.cout)}</td>
              <td style={{ padding: '6px 8px' }}>—</td>
              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{ar(m.cout)}</td>
              <td style={{ padding: '6px 8px' }}>—</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <span>Total au prix moyen : <strong>{ar(c.cout_total)}</strong> → <strong>{ar(c.cout_unitaire)}</strong> / {r.produit_fini?.unite || 'unité'}</span>
        <span>Total au dernier achat : <strong>{ar(c.cout_total_recent)}</strong> → <strong>{ar(c.cout_unitaire_recent)}</strong> / {r.produit_fini?.unite || 'unité'}</span>
      </div>
      {r.notes && <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>📝 {r.notes}</div>}
    </div>
  );
}

export default function ProductionPage() {
  const { entreprise } = useAuth();
  const [onglet, setOnglet] = useState('tableau');
  const [recettes, setRecettes] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);          // null | { recette }  (recette null = création)
  const [ouvertes, setOuvertes] = useState({});
  const [recherche, setRecherche] = useState('');
  const [voirInactives, setVoirInactives] = useState(false);

  useEffect(() => { charger(); }, []);

  async function charger() {
    try {
      const [rec, art] = await Promise.all([productionService.getRecettes(entreprise.id), stockService.getArticles(entreprise.id)]);
      setRecettes(rec.data.data || []);
      setArticles(art.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement du module Production.');
    } finally {
      setLoading(false);
    }
  }

  async function enregistrer(payload) {
    // lève l'erreur : le formulaire l'affiche et reste ouvert
    if (modal.recette) await productionService.modifierRecette(modal.recette.id, payload);
    else await productionService.creerRecette({ ...payload, entreprise_id: entreprise.id });
    toast.success(modal.recette ? 'Recette modifiée.' : 'Recette créée.');
    setModal(null);
    await charger();
  }

  async function basculer(r) {
    try {
      await productionService.etatRecette(r.id, !r.actif);
      toast.success(r.actif ? 'Recette désactivée.' : 'Recette réactivée.');
      await charger();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  }

  const mots = motsDe(recherche);
  const affichees = recettes.filter(r => (voirInactives || r.actif) &&
    mots.every(m => normaliserDesignation(`${r.code} ${r.nom} ${r.produit_fini?.designation || ''}`).includes(m)));
  const nbInactives = recettes.filter(r => !r.actif).length;

  if (loading) return <div style={{ padding: '30px' }}>Chargement...</div>;

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#004d5a' }}>🏭 Production</h1>
        {onglet === 'recettes' && (
          <button style={{ ...styles.boutonPrimaire, background: '#004d5a', color: 'white', padding: '9px 16px', fontSize: '13px' }}
            onClick={() => setModal({ recette: null })}>+ Nouvelle recette</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        {[{ key: 'tableau', label: '📊 Tableau de bord' }, { key: 'recettes', label: '📖 Recettes' }, { key: 'productions', label: '🏭 Productions' }, { key: 'suivi', label: '📈 Suivi des coûts' }].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            style={{ padding: '10px 16px', border: 'none', cursor: 'pointer', borderBottom: onglet === o.key ? '3px solid #004d5a' : '3px solid transparent',
              background: 'transparent', color: onglet === o.key ? '#004d5a' : '#666', fontWeight: onglet === o.key ? 'bold' : 'normal', fontSize: '13px' }}>{o.label}</button>
        ))}
      </div>

      {onglet === 'recettes' && (
        <div style={styles.card}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
            <input style={{ ...styles.input, maxWidth: '300px' }} placeholder="Rechercher une recette…" value={recherche} onChange={e => setRecherche(e.target.value)} />
            {nbInactives > 0 && (
              <label style={{ fontSize: '12px', color: '#555', cursor: 'pointer' }}>
                <input type="checkbox" checked={voirInactives} onChange={e => setVoirInactives(e.target.checked)} /> Voir les recettes désactivées ({nbInactives})
              </label>
            )}
          </div>

          <details style={{ background: '#f3f8ff', border: '1px solid #cfe0f5', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#333' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#1565c0' }}>ℹ️ Comment lire les deux coûts ?</summary>
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: 1.6 }}>
              <li><strong>Prix moyen du stock</strong> : chaque matière est valorisée au prix moyen de ce qu'il y a actuellement en stock. C'est le coût retenu quand une production sort ses matières du stock.</li>
              <li><strong>Dernier achat</strong> : chaque matière est valorisée au prix payé lors de sa dernière entrée en stock. C'est ce que coûterait de refaire la même production avec les prix du moment : utile pour fixer le prix de vente quand les prix montent ou baissent.</li>
              <li>Ces deux coûts changent quand tu enregistres de nouveaux achats. <strong>Une production déjà réalisée garde son coût</strong> : il est figé le jour où elle est validée et ne bouge plus ensuite.</li>
              <li>Une même matière peut servir dans plusieurs recettes (le lait dans le beurre, le fromage, le yaourt) : le prix est le même pour toutes, le stock est partagé, et une production lancée réserve ses matières pour qu'une autre ne les prenne pas.</li>
            </ul>
          </details>

          {affichees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              {recettes.length === 0
                ? <>Aucune recette pour le moment.<br />Une recette décrit les ingrédients et la main-d'œuvre qu'il faut pour fabriquer une quantité de produit fini.</>
                : 'Aucune recette ne correspond.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['', 'Code', 'Recette', 'Produit fini', 'Pour', 'Matières', 'Main-d\'œuvre', 'Coût total', 'Coût / unité (prix moyen)', 'Coût / unité (dernier achat)', 'Prix de vente', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {affichees.map((r, i) => {
                  const c = r.cout, u = r.produit_fini?.unite || '';
                  const pv = Number(r.produit_fini?.prix_vente_defaut || 0);
                  const marge = c && pv > 0 && c.cout_unitaire > 0 ? Math.round((pv - c.cout_unitaire) / pv * 100) : null;
                  return (
                    <React.Fragment key={r.id}>
                      <tr style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f0f0', opacity: r.actif ? 1 : 0.5 }}>
                        <td style={styles.td}>
                          <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px' }} title="Voir le détail"
                            onClick={() => setOuvertes(o => ({ ...o, [r.id]: !o[r.id] }))}>{ouvertes[r.id] ? '▼' : '▶'}</button>
                        </td>
                        <td style={{ ...styles.td, fontWeight: 'bold', fontSize: '12px' }}>{r.code}</td>
                        <td style={styles.td}>{r.nom}{!r.actif && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#999' }}>(désactivée)</span>}</td>
                        <td style={{ ...styles.td, fontSize: '12px' }}>{r.produit_fini?.designation || '—'}</td>
                        <td style={{ ...styles.td, fontSize: '12px' }}>{qte(r.quantite_reference)} {u}</td>
                        <td style={{ ...styles.td, fontSize: '12px' }}>{c ? ar(c.cout_matieres) : '—'}</td>
                        <td style={{ ...styles.td, fontSize: '12px' }}>{c ? ar(c.cout_main_oeuvre) : '—'}</td>
                        <td style={{ ...styles.td, fontSize: '12px', fontWeight: 'bold' }}>
                          {c ? ar(c.cout_total) : <span title={r.probleme} style={{ color: '#c62828' }}>⚠️ à corriger</span>}
                        </td>
                        <td style={{ ...styles.td, fontSize: '13px', fontWeight: 'bold', color: '#2e7d32' }}>
                          {c ? <>{ar(c.cout_unitaire)}{c.sans_prix.length > 0 && <span title={`Aucun prix connu pour : ${c.sans_prix.join(', ')}`} style={{ color: '#c62828', marginLeft: '4px' }}>⚠️</span>}</> : '—'}
                        </td>
                        <td style={{ ...styles.td, fontSize: '13px', fontWeight: 'bold', color: '#1565c0' }}>
                          {c ? ar(c.cout_unitaire_recent) : '—'}
                        </td>
                        <td style={{ ...styles.td, fontSize: '12px' }}>
                          {pv > 0 ? <>{ar(pv)}{marge != null && <div style={{ fontSize: '10px', color: marge >= 0 ? '#2e7d32' : '#c62828' }} title="Écart entre le prix de vente enregistré sur l'article et le coût théorique">marge ≈ {marge} %</div>}</> : '—'}
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button style={styles.boutonSecondaire} title="Modifier" onClick={() => setModal({ recette: r })}>✏️</button>
                            <button style={r.actif ? styles.boutonDanger : styles.boutonSecondaire} title={r.actif ? 'Désactiver' : 'Réactiver'} onClick={() => basculer(r)}>{r.actif ? '🚫' : '↩️'}</button>
                          </div>
                        </td>
                      </tr>
                      {ouvertes[r.id] && <tr><td colSpan={12} style={{ padding: 0 }}><DetailRecette r={r} recettes={recettes} /></td></tr>}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {onglet === 'productions' && <OngletProductions entreprise={entreprise} recettes={recettes} />}
      {onglet === 'suivi' && <OngletSuivi entreprise={entreprise} recettes={recettes} />}
      {onglet === 'tableau' && <OngletTableauBord entreprise={entreprise} onAller={setOnglet} />}

      {modal && (
        <FormulaireRecette recette={modal.recette} recettes={recettes} articles={articles} assujettie={!!entreprise.assujettie_tva}
          onSave={enregistrer} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}
