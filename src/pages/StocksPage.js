import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { stockService } from '../services/api';
import useSoumission from '../hooks/useSoumission';
import { trouverSimilaires, nettoyerDesignation } from '../utils/similitudeArticles';
import { groupesStock, compteStockArticle, groupeDeCompte, groupeStock, libelleCompte, texteCompte } from '../utils/comptesStock';

const styles = {
  boutonPrimaire: {
    background: 'white', color: '#004d5a', border: '2px solid #004d5a',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 'normal'
  },
  boutonSecondaire: {
    background: 'white', color: '#004d5a', border: '2px solid #004d5a',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
  },
  boutonDanger: {
    background: 'white', color: '#c62828', border: '2px solid #c62828',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
  },
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  },
  label: {
    display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px'
  },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalContent: {
    background: 'white', borderRadius: '12px', padding: '30px',
    width: '650px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const unites = ['pièce', 'kg', 'g', 'litre', 'ml', 'm', 'cm', 'boîte', 'carton', 'lot'];
const typesMouvement = [
  { key: 'ENTREE_ACHAT', label: '📦 Entrée achat fournisseur', couleur: '#2e7d32' },
  { key: 'ENTREE_FABRICATION', label: '🏭 Entrée fabrication interne', couleur: '#1565c0' },
  { key: 'SORTIE_VENTE', label: '🛒 Sortie vente client', couleur: '#e65100' },
  { key: 'SORTIE_USAGE', label: '🔧 Sortie usage interne', couleur: '#6a1b9a' }
];

// Formulaire article
function FormulaireArticle({ article, articles = [], onSave, onCancel, onVoirArticle }) {
  const [form, setForm] = useState({
    reference: article?.reference || '',
    designation: article?.designation || '',
    compte_stock: article ? compteStockArticle(article) : '',
    unite: article?.unite || 'pièce',
    prix_achat_ht: article?.prix_achat_ht || 0,
    taux_tva: article?.taux_tva || 0,
    remise_pourcent: article?.remise_pourcent || 0,
    methode_valorisation: article?.methode_valorisation || 'CMUP',
    stock_initial: article?.stock_initial || 0,
    stock_minimum: article?.stock_minimum || 0,
    actif: article?.actif !== undefined ? article.actif : true
  });
  const [enCours, setEnCours] = useState(false);
  const [confirmeDifferent, setConfirmeDifferent] = useState(false);

  // Aide à l'écriture : les articles qui ressemblent à ce qui est tapé (hors l'article en cours de modification)
  const similaires = form.designation.trim().length >= 3
    ? trouverSimilaires(form.designation, articles, { exclureId: article?.id })
    : [];
  const identique = similaires.find(x => x.type === 'IDENTIQUE');
  const proches = similaires.filter(x => x.type === 'PROCHE');
  const bloque = !!identique || (proches.length > 0 && !confirmeDifferent);
  const prix_ttc = (Number(form.prix_achat_ht) * (1 + Number(form.taux_tva) / 100)).toFixed(2);
  const prix_net = (Number(prix_ttc) * (1 - Number(form.remise_pourcent) / 100)).toFixed(2);

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {article ? '✏️ Modifier article' : '➕ Nouvel article'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={styles.label}>Référence *</label>
            <input style={styles.input} value={form.reference}
              onChange={e => setForm({ ...form, reference: e.target.value })}
              disabled={!!article} />
          </div>
          <div>
            <label style={styles.label}>Désignation *</label>
            <input style={styles.input} value={form.designation} list="designations-existantes"
              placeholder="Commence à écrire : les articles existants sont proposés"
              onChange={e => { setForm({ ...form, designation: e.target.value }); setConfirmeDifferent(false); }} />
            <datalist id="designations-existantes">
              {articles.filter(a => a.id !== article?.id).map(a => <option key={a.id} value={a.designation} />)}
            </datalist>
            {identique && (
              <div style={{ marginTop: '6px', padding: '8px 10px', borderRadius: '6px', background: '#ffebee', color: '#c62828', fontSize: '12px' }}>
                ⛔ Cet article existe déjà : <b>{identique.article.designation}</b> (réf. {identique.article.reference})
                {identique.article.actif === false && ' — désactivé'}.
                {onVoirArticle && (
                  <> <button type="button" style={{ ...styles.boutonSecondaire, padding: '2px 8px', fontSize: '11px', marginLeft: '6px' }}
                    onClick={() => onVoirArticle(identique.article)}>Voir cet article</button></>
                )}
              </div>
            )}
            {!identique && proches.length > 0 && (
              <div style={{ marginTop: '6px', padding: '8px 10px', borderRadius: '6px', background: '#fff8e1', color: '#8d6e00', fontSize: '12px' }}>
                ⚠️ Un article très proche existe déjà :{' '}
                {proches.map((x, i) => (
                  <span key={x.article.id}>{i > 0 && ', '}<b>{x.article.designation}</b> (réf. {x.article.reference})</span>
                ))}.
                <label style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={confirmeDifferent} onChange={e => setConfirmeDifferent(e.target.checked)} />
                  C'est bien un article différent
                </label>
              </div>
            )}
          </div>
          <div>
            <label style={styles.label}>Compte de stock *</label>
            <select style={styles.input} value={form.compte_stock}
              onChange={e => setForm({ ...form, compte_stock: e.target.value })}>
              <option value="">— Choisir le compte —</option>
              {groupesStock.map(g => g.comptes.length ? (
                <optgroup key={g.code} label={`${g.code} - ${g.libelle}`}>
                  {g.comptes.map(c => <option key={c.code} value={c.code}>{c.code} - {c.libelle}</option>)}
                </optgroup>
              ) : (
                <option key={g.code} value={g.code}>{g.code} - {g.libelle}</option>
              ))}
            </select>
            {form.compte_stock && (
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                Variation de stock en fin d'exercice : compte {groupeStock(form.compte_stock)?.contrepartie}
              </div>
            )}
          </div>
          <div>
            <label style={styles.label}>Unité</label>
            <select style={styles.input} value={form.unite}
              onChange={e => setForm({ ...form, unite: e.target.value })}>
              {unites.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Prix achat HT (Ar)</label>
            <input style={styles.input} type="number" value={form.prix_achat_ht}
              onChange={e => setForm({ ...form, prix_achat_ht: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Taux TVA (%)</label>
            <select style={styles.input} value={form.taux_tva}
              onChange={e => setForm({ ...form, taux_tva: e.target.value })}>
              <option value={0}>0% (Non assujetti)</option>
              <option value={20}>20%</option>
              <option value={5}>5%</option>
              <option value={10}>10%</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Remise (%)</label>
            <input style={styles.input} type="number" value={form.remise_pourcent}
              onChange={e => setForm({ ...form, remise_pourcent: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Méthode valorisation</label>
            <select style={styles.input} value={form.methode_valorisation}
              onChange={e => setForm({ ...form, methode_valorisation: e.target.value })}>
              <option value="CMUP">CMUP</option>
              <option value="FIFO">FIFO</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2', background: '#e3f2fd', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
              <span><strong>Prix TTC :</strong> {Number(prix_ttc).toLocaleString('fr-FR')} Ar</span>
              <span><strong>Prix net (après remise) :</strong> {Number(prix_net).toLocaleString('fr-FR')} Ar</span>
            </div>
          </div>

          {!article && (
            <div>
              <label style={styles.label}>Stock initial</label>
              <input style={styles.input} type="number" value={form.stock_initial}
                onChange={e => setForm({ ...form, stock_initial: e.target.value })} />
            </div>
          )}
          <div>
            <label style={styles.label}>Stock minimum (alerte)</label>
            <input style={styles.input} type="number" value={form.stock_minimum}
              onChange={e => setForm({ ...form, stock_minimum: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours || bloque}
            onClick={async () => {
              if (!form.compte_stock) { toast.error('Choisis le compte de stock de l\'article.'); return; }
              setEnCours(true);
              const ok = await onSave({
                ...form,
                designation: nettoyerDesignation(form.designation),
                confirmer_similaire: confirmeDifferent
              });
              setEnCours(false);
              if (ok !== false) onCancel();   // en cas de refus du serveur, le formulaire reste ouvert
            }}>
            {enCours ? '⏳...' : article ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Formulaire mouvement
function FormulaireMouvement({ articles, onSave, onCancel }) {
  const { enCours: envoiEnCours, soumettre } = useSoumission();
  const [form, setForm] = useState({
    article_id: '',
    type_mouvement: 'ENTREE_ACHAT',
    quantite: 1,
    prix_unitaire_ht: 0,
    taux_tva: 0,
    remise_pourcent: 0,
    reference_document: '',
    date_mouvement: new Date().toISOString().split('T')[0],
    description: ''
  });

  const articleSelectionne = articles.find(a => a.id === form.article_id);

  useEffect(() => {
    if (articleSelectionne) {
      setForm(f => ({
        ...f,
        prix_unitaire_ht: articleSelectionne.prix_achat_ht,
        taux_tva: articleSelectionne.taux_tva,
        remise_pourcent: articleSelectionne.remise_pourcent
      }));
    }
  }, [form.article_id]);

  const pu_ttc = Number(form.prix_unitaire_ht) * (1 + Number(form.taux_tva) / 100);
  const pu_net = pu_ttc * (1 - Number(form.remise_pourcent) / 100);
  const montant_total = pu_net * Number(form.quantite);

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>📦 Enregistrer un mouvement</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Article *</label>
            <select style={styles.input} value={form.article_id}
              onChange={e => setForm({ ...form, article_id: e.target.value })}>
              <option value="">Sélectionner un article</option>
              {articles.map(a => (
                <option key={a.id} value={a.id}>
                  {a.reference} — {a.designation} (Stock: {a.stock_actuel} {a.unite})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Type de mouvement *</label>
            <select style={styles.input} value={form.type_mouvement}
              onChange={e => setForm({ ...form, type_mouvement: e.target.value })}>
              {typesMouvement.map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={styles.label}>Quantité *</label>
              <input style={styles.input} type="number" value={form.quantite}
                onChange={e => setForm({ ...form, quantite: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Date</label>
              <input style={styles.input} type="date" value={form.date_mouvement}
                onChange={e => setForm({ ...form, date_mouvement: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Prix unitaire HT (Ar)</label>
              <input style={styles.input} type="number" value={form.prix_unitaire_ht}
                onChange={e => setForm({ ...form, prix_unitaire_ht: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>TVA (%)</label>
              <select style={styles.input} value={form.taux_tva}
                onChange={e => setForm({ ...form, taux_tva: e.target.value })}>
                <option value={0}>0%</option>
                <option value={20}>20%</option>
                <option value={5}>5%</option>
                <option value={10}>10%</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Remise (%)</label>
              <input style={styles.input} type="number" value={form.remise_pourcent}
                onChange={e => setForm({ ...form, remise_pourcent: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Réf. document</label>
              <input style={styles.input} value={form.reference_document}
                onChange={e => setForm({ ...form, reference_document: e.target.value })}
                placeholder="N° facture, bon de livraison..." />
            </div>
          </div>
          <div>
            <label style={styles.label}>Description</label>
            <input style={styles.input} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
            <strong>Montant total TTC : {montant_total.toLocaleString('fr-FR')} Ar</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={{ ...styles.boutonPrimaire, opacity: envoiEnCours ? 0.6 : 1 }} onClick={() => soumettre(() => onSave(form))} disabled={envoiEnCours}>
            {envoiEnCours ? '⏳ Patientez...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Entrée en stock à partir d'une facture fournisseur (ouverte juste après l'enregistrement de la facture).
// initial : { numero_facture, fournisseur, fournisseur_id, date, montant_ht, taux_tva, designation, compte_stock }
// onSave(payload) → { ok: true } ou { ok: false, code, message } ; le formulaire reste ouvert tant que ça échoue.
export function FormulaireEntreeStock({ initial, articles = [], bandeau, onSave, onCancel }) {
  const actifs = articles.filter(a => a.actif !== false);
  const ligneVide = (extra = {}) => ({
    article_id: '', designation: '', compte_stock: initial?.compte_stock || '', unite: 'pièce', reference: '',
    quantite: 1, prix_unitaire_ht: 0, confirmer_similaire: false, ...extra
  });
  const [lignes, setLignes] = useState(() => {
    // Ligne de départ : le montant HT de la facture ; si l'article existe déjà, il est sélectionné d'office
    const designation = initial?.designation || '';
    const existant = designation
      ? trouverSimilaires(designation, actifs).find(x => x.type === 'IDENTIQUE')
      : null;
    return [ligneVide({
      article_id: existant ? existant.article.id : '',
      designation: existant ? '' : designation,
      prix_unitaire_ht: Number(initial?.montant_ht) || 0
    })];
  });
  const [enCours, setEnCours] = useState(false);
  const [retour, setRetour] = useState(null);          // dernier refus du serveur
  const [forcerNouvelle, setForcerNouvelle] = useState(false);

  const maj = (i, champs) => setLignes(ls => ls.map((l, k) => (k === i ? { ...l, ...champs } : l)));
  const retirer = i => setLignes(ls => ls.filter((_, k) => k !== i));

  // Analyse de chaque ligne : doublons du nouvel article avec les articles existants et avec les autres nouvelles lignes
  const analyses = lignes.map((l, i) => {
    if (l.article_id) return { sim: [], identique: null, proches: [] };
    const autres = lignes.filter((x, k) => k !== i && !x.article_id && x.designation.trim())
      .map((x, k) => ({ id: `nl-${k}`, reference: 'cette entrée', designation: x.designation }));
    const sim = l.designation.trim().length >= 3 ? trouverSimilaires(l.designation, [...articles, ...autres]) : [];
    return { sim, identique: sim.find(x => x.type === 'IDENTIQUE'), proches: sim.filter(x => x.type === 'PROCHE') };
  });

  const ligneValide = (l, a) => {
    if (!(Number(l.quantite) > 0) || !(Number(l.prix_unitaire_ht) >= 0) || l.prix_unitaire_ht === '') return false;
    if (l.article_id) return true;
    if (!l.designation.trim() || !l.compte_stock) return false;
    if (a.identique) return false;
    return a.proches.length === 0 || l.confirmer_similaire;
  };
  const toutValide = lignes.length > 0 && lignes.every((l, i) => ligneValide(l, analyses[i]));
  const totalLignes = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix_unitaire_ht) || 0), 0);
  const montantFacture = Number(initial?.montant_ht) || 0;
  const ecart = Math.round((totalLignes - montantFacture) * 100) / 100;
  const fmt = n => Number(n || 0).toLocaleString('fr-FR');
  const prochaineRef = (rang) => {
    const refs = [...articles.map(a => a.reference), ...lignes.slice(0, rang).map(l => l.reference)];
    let max = 0;
    refs.forEach(r => { const m = String(r || '').match(/^ART-(\d+)$/i); if (m) max = Math.max(max, Number(m[1])); });
    return `ART-${String(max + 1 + lignes.slice(0, rang).filter(l => !l.article_id && !l.reference).length).padStart(3, '0')}`;
  };

  async function enregistrer(confirmerNouvelle) {
    setEnCours(true);
    setRetour(null);
    const res = await onSave({
      fournisseur_id: initial?.fournisseur_id || null,
      reference_document: initial?.numero_facture || '',
      date_mouvement: initial?.date || '',
      confirmer_nouvelle_entree: !!confirmerNouvelle,
      lignes: lignes.map(l => ({
        quantite: Number(l.quantite),
        prix_unitaire_ht: Number(l.prix_unitaire_ht),
        taux_tva: Number(initial?.taux_tva) || 0,
        ...(l.article_id
          ? { article_id: l.article_id }
          : { nouvel_article: {
              designation: l.designation, compte_stock: l.compte_stock, unite: l.unite,
              reference: l.reference, confirmer_similaire: l.confirmer_similaire
            } })
      }))
    });
    setEnCours(false);
    if (res && res.ok === false) setRetour(res);
  }

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '880px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>📦 Entrée en stock — facture {initial?.numero_facture}</h3>
        {bandeau && (
          <div style={{ background: '#e0f2f1', color: '#004d5a', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
            {bandeau}
          </div>
        )}

        {lignes.map((l, i) => {
          const a = analyses[i];
          return (
            <div key={i} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                <div>
                  <label style={styles.label}>Article *</label>
                  <select style={styles.input} value={l.article_id}
                    onChange={e => maj(i, { article_id: e.target.value, confirmer_similaire: false })}>
                    <option value="">➕ Nouvel article</option>
                    {actifs.map(x => <option key={x.id} value={x.id}>{x.reference} — {x.designation}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Quantité *</label>
                  <input style={styles.input} type="number" min="0" step="any" value={l.quantite}
                    onChange={e => maj(i, { quantite: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Prix unitaire HT *</label>
                  <input style={styles.input} type="number" min="0" step="any" value={l.prix_unitaire_ht}
                    onChange={e => maj(i, { prix_unitaire_ht: e.target.value })} />
                </div>
                <div style={{ paddingBottom: '8px' }}>
                  {lignes.length > 1 && (
                    <button type="button" style={styles.boutonSecondaire} onClick={() => retirer(i)} title="Retirer cette ligne">🗑️</button>
                  )}
                </div>
              </div>

              {!l.article_id && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <label style={styles.label}>Désignation du nouvel article *</label>
                    <input style={styles.input} value={l.designation} list={`designations-entree-${i}`}
                      placeholder="Les articles existants sont proposés"
                      onChange={e => maj(i, { designation: e.target.value, confirmer_similaire: false })} />
                    <datalist id={`designations-entree-${i}`}>
                      {articles.map(x => <option key={x.id} value={x.designation} />)}
                    </datalist>
                  </div>
                  <div>
                    <label style={styles.label}>Compte de stock *</label>
                    <select style={styles.input} value={l.compte_stock} onChange={e => maj(i, { compte_stock: e.target.value })}>
                      <option value="">— Choisir le compte —</option>
                      {groupesStock.map(g => g.comptes.length ? (
                        <optgroup key={g.code} label={`${g.code} - ${g.libelle}`}>
                          {g.comptes.map(c => <option key={c.code} value={c.code}>{c.code} - {c.libelle}</option>)}
                        </optgroup>
                      ) : (
                        <option key={g.code} value={g.code}>{g.code} - {g.libelle}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Unité</label>
                    <select style={styles.input} value={l.unite} onChange={e => maj(i, { unite: e.target.value })}>
                      {unites.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Référence</label>
                    <input style={styles.input} value={l.reference} placeholder={prochaineRef(i)}
                      onChange={e => maj(i, { reference: e.target.value })} />
                  </div>
                </div>
              )}

              {!l.article_id && a.identique && (
                <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', background: '#ffebee', color: '#c62828', fontSize: '12px' }}>
                  ⛔ Cet article existe déjà : <b>{a.identique.article.designation}</b> (réf. {a.identique.article.reference}).
                  {a.identique.article.actif !== false && a.identique.article.id && !String(a.identique.article.id).startsWith('nl-') && (
                    <button type="button" style={{ ...styles.boutonSecondaire, padding: '2px 8px', fontSize: '11px', marginLeft: '8px' }}
                      onClick={() => maj(i, { article_id: a.identique.article.id, designation: '' })}>Utiliser cet article</button>
                  )}
                  {a.identique.article.actif === false && ' Il est désactivé : réactive-le depuis le catalogue.'}
                </div>
              )}
              {!l.article_id && !a.identique && a.proches.length > 0 && (
                <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', background: '#fff8e1', color: '#8d6e00', fontSize: '12px' }}>
                  ⚠️ Un article très proche existe déjà : {a.proches.map((x, k) => (
                    <span key={x.article.id}>{k > 0 && ', '}<b>{x.article.designation}</b></span>
                  ))}.
                  <label style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={l.confirmer_similaire} onChange={e => maj(i, { confirmer_similaire: e.target.checked })} />
                    C'est bien un article différent
                  </label>
                </div>
              )}
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#555', marginTop: '8px' }}>
                Montant de la ligne : <b>{fmt((Number(l.quantite) || 0) * (Number(l.prix_unitaire_ht) || 0))} Ar HT</b>
              </div>
            </div>
          );
        })}

        <button type="button" style={styles.boutonSecondaire} onClick={() => setLignes(ls => [...ls, ligneVide()])}>
          ➕ Ajouter une ligne
        </button>

        <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '6px', fontSize: '13px',
          background: Math.abs(ecart) < 0.01 ? '#e8f5e9' : '#fff8e1', color: Math.abs(ecart) < 0.01 ? '#2e7d32' : '#8d6e00' }}>
          Facture : <b>{fmt(montantFacture)} Ar HT</b> · Lignes : <b>{fmt(totalLignes)} Ar HT</b>
          {Math.abs(ecart) >= 0.01 && <> · Écart : <b>{ecart > 0 ? '+' : ''}{fmt(ecart)} Ar</b> (tout n'est pas forcément du stock : frais, services…)</>}
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>
            Le stock est valorisé hors TVA : la TVA déductible reste comptabilisée à part.
          </div>
        </div>

        {retour && (
          <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '6px', background: '#ffebee', color: '#c62828', fontSize: '13px' }}>
            {retour.message}
            {retour.code === 'ENTREE_DEJA_FAITE' && (
              <div style={{ marginTop: '8px' }}>
                <button type="button" style={styles.boutonSecondaire}
                  onClick={() => { setForcerNouvelle(true); enregistrer(true); }}>Enregistrer quand même</button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Plus tard</button>
          <button style={{ ...styles.boutonPrimaire, opacity: enCours || !toutValide ? 0.5 : 1 }}
            disabled={enCours || !toutValide}
            onClick={() => enregistrer(forcerNouvelle)}>
            {enCours ? '⏳...' : 'Entrer en stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StocksPage() {
  const { entreprise } = useAuth();
  const [onglet, setOnglet] = useState('etat');
  const [articles, setArticles] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [etat, setEtat] = useState({ data: [], valeur_totale: 0, alertes: [] });
  const [loading, setLoading] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(null);
  const [articleSelectionne, setArticleSelectionne] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [filtreArticle, setFiltreArticle] = useState('');
  const [filtreCompte, setFiltreCompte] = useState('');

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [articlesRes, mouvementsRes, etatRes] = await Promise.all([
        stockService.getArticles(entreprise.id),
        stockService.getMouvements(entreprise.id),
        stockService.getEtat(entreprise.id)
      ]);
      setArticles(articlesRes.data.data || []);
      setMouvements(mouvementsRes.data.data || []);
      setEtat(etatRes.data);
    } catch (err) {
      toast.error('Erreur chargement stocks.');
    } finally {
      setLoading(false);
    }
  }

  async function creerArticle(form) {
    try {
      await stockService.creerArticle({ ...form, entreprise_id: entreprise.id });
      toast.success('Article créé !');
      chargerDonnees();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création.');
      return false;
    }
  }

  async function modifierArticle(form) {
    try {
      await stockService.modifierArticle(articleSelectionne.id, form);
      toast.success('Article modifié !');
      setModalOuvert(null);
      setArticleSelectionne(null);
      chargerDonnees();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur modification.');
      return false;
    }
  }

  // Depuis l'alerte « cet article existe déjà » : on ferme le formulaire et on montre l'article dans le catalogue
  function voirArticle(a) {
    setModalOuvert(null);
    setArticleSelectionne(null);
    setOnglet('articles');
    setRecherche(a.designation);
  }

  async function enregistrerMouvement(form) {
    try {
      await stockService.enregistrerMouvement({ ...form, entreprise_id: entreprise.id });
      toast.success('Mouvement enregistré !');
      setModalOuvert(null);
      chargerDonnees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur mouvement.');
    }
  }

  const articlesFiltres = articles.filter(a =>
    !recherche ||
    a.reference?.toLowerCase().includes(recherche.toLowerCase()) ||
    a.designation?.toLowerCase().includes(recherche.toLowerCase())
  );

  const mouvementsFiltres = mouvements.filter(m =>
    !filtreArticle || m.article_id === filtreArticle
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modalOuvert === 'creer' && (
        <FormulaireArticle articles={articles} onSave={creerArticle} onVoirArticle={voirArticle}
          onCancel={() => setModalOuvert(null)} />
      )}
      {modalOuvert === 'modifier' && articleSelectionne && (
        <FormulaireArticle
          article={articleSelectionne}
          articles={articles}
          onSave={modifierArticle}
          onVoirArticle={voirArticle}
          onCancel={() => { setModalOuvert(null); setArticleSelectionne(null); }}
        />
      )}
      {modalOuvert === 'mouvement' && (
        <FormulaireMouvement
          articles={articles}
          onSave={enregistrerMouvement}
          onCancel={() => setModalOuvert(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>📦 Stocks</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.boutonSecondaire} onClick={() => setModalOuvert('mouvement')}>
            + Mouvement
          </button>
          <button style={styles.boutonPrimaire} onClick={() => setModalOuvert('creer')}>
            + Nouvel article
          </button>
        </div>
      </div>

      {/* Indicateurs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #004d5a' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>📦 Articles actifs</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#004d5a' }}>{articles.filter(a => a.actif).length}</div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #2e7d32' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>💰 Valeur totale stock</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>
            {Number(etat.valeur_totale || 0).toLocaleString('fr-FR')} Ar
          </div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, borderLeft: '4px solid #c62828' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>⚠️ Alertes stock</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c62828' }}>
            {etat.alertes?.length || 0}
          </div>
        </div>
      </div>

      {/* Alertes */}
      {etat.alertes?.length > 0 && (
        <div style={{ background: '#ffebee', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
          <strong style={{ color: '#c62828' }}>⚠️ Articles sous le stock minimum :</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {etat.alertes.map(a => (
              <span key={a.id} style={{ background: '#ffcdd2', color: '#c62828',
                padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                {a.designation} ({a.stock_actuel}/{a.stock_minimum} {a.unite})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        {[
          { key: 'etat', label: '📊 État du stock' },
          { key: 'articles', label: '📋 Catalogue articles' },
          { key: 'mouvements', label: '🔄 Historique mouvements' }
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            style={{
              padding: '10px 16px', border: 'none', cursor: 'pointer',
              borderBottom: onglet === o.key ? '3px solid #004d5a' : '3px solid transparent',
              background: 'transparent', color: onglet === o.key ? '#004d5a' : '#666',
              fontWeight: onglet === o.key ? 'bold' : 'normal', fontSize: '13px'
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Onglet État du stock : regroupé par compte de la classe 3, avec sous-totaux */}
      {onglet === 'etat' && (
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <label style={{ ...styles.label, margin: 0 }}>Compte</label>
            <select style={{ ...styles.input, maxWidth: '320px' }} value={filtreCompte}
              onChange={e => setFiltreCompte(e.target.value)}>
              <option value="">Tous les comptes</option>
              {(etat.par_compte || []).map(g => (
                <option key={g.groupe} value={g.groupe}>{g.groupe} - {g.libelle}</option>
              ))}
            </select>
            {(etat.data || []).some(a => a.compte_a_confirmer) && (
              <span style={{ fontSize: '12px', color: '#c62828' }}>
                ⚠️ Des articles n'ont pas de compte : ils sont comptés en 37 par défaut (modifie l'article pour choisir).
              </span>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Réf.', 'Désignation', 'Compte', 'Unité', 'Stock actuel',
                  'Stock min.', 'CMUP', 'Valeur stock', 'Méthode'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left', fontSize: '12px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(etat.par_compte || [])
                .filter(g => !filtreCompte || g.groupe === filtreCompte)
                .map(g => {
                  const lignes = (etat.data || []).filter(a => groupeDeCompte(a.compte_stock) === g.groupe);
                  return (
                    <React.Fragment key={g.groupe}>
                      <tr style={{ background: '#e0f2f1' }}>
                        <td colSpan={9} style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                          {g.groupe} - {g.libelle}
                          <span style={{ fontWeight: 'normal', color: '#555', marginLeft: '10px', fontSize: '12px' }}>
                            {g.nb_articles} article(s) · variation en fin d'exercice : compte {g.contrepartie}
                          </span>
                        </td>
                      </tr>
                      {lignes.map((a, i) => {
                        const cmup = a.stock_actuel > 0
                          ? (a.valeur_stock / a.stock_actuel).toFixed(2)
                          : a.prix_achat_net;
                        const sousMin = a.stock_actuel <= a.stock_minimum;
                        return (
                          <tr key={a.id} style={{ background: sousMin ? '#ffebee' : i % 2 === 0 ? 'white' : '#fafafa',
                            borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '10px', fontSize: '12px', fontWeight: 'bold' }}>{a.reference}</td>
                            <td style={{ padding: '10px', fontSize: '13px' }}>{a.designation}</td>
                            <td style={{ padding: '10px', fontSize: '12px', color: a.compte_a_confirmer ? '#c62828' : '#666' }}
                              title={a.compte_a_confirmer ? 'Compte à choisir : compté en 37 par défaut' : texteCompte(a.compte_stock)}>
                              {a.compte_stock}{a.compte_a_confirmer && ' ⚠️'}
                            </td>
                            <td style={{ padding: '10px', fontSize: '12px' }}>{a.unite}</td>
                            <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold',
                              color: sousMin ? '#c62828' : '#2e7d32' }}>
                              {Number(a.stock_actuel).toLocaleString('fr-FR')}
                              {sousMin && ' ⚠️'}
                            </td>
                            <td style={{ padding: '10px', fontSize: '12px' }}>{a.stock_minimum}</td>
                            <td style={{ padding: '10px', fontSize: '12px' }}>
                              {Number(cmup).toLocaleString('fr-FR')} Ar
                            </td>
                            <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                              {Number(a.valeur_stock).toLocaleString('fr-FR')} Ar
                            </td>
                            <td style={{ padding: '10px', fontSize: '12px' }}>
                              <span style={{ padding: '3px 8px', borderRadius: '12px',
                                background: a.methode_valorisation === 'FIFO' ? '#e3f2fd' : '#e8f5e9',
                                color: a.methode_valorisation === 'FIFO' ? '#1565c0' : '#2e7d32',
                                fontSize: '11px' }}>
                                {a.methode_valorisation}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderBottom: '2px solid #b2dfdb' }}>
                        <td colSpan={7} style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                          Sous-total {g.groupe}
                        </td>
                        <td colSpan={2} style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                          {Number(g.valeur).toLocaleString('fr-FR')} Ar
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              {!filtreCompte && (etat.par_compte || []).length > 0 && (
                <tr style={{ background: '#f5f5f5' }}>
                  <td colSpan={7} style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold' }}>Total du stock</td>
                  <td colSpan={2} style={{ padding: '10px', fontSize: '14px', fontWeight: 'bold', color: '#2e7d32' }}>
                    {Number(etat.valeur_totale || 0).toLocaleString('fr-FR')} Ar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Onglet Catalogue */}
      {onglet === 'articles' && (
        <div style={styles.card}>
          <input style={{ ...styles.input, maxWidth: '300px', marginBottom: '15px' }}
            placeholder="Rechercher..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Réf.', 'Désignation', 'Compte de stock', 'Prix HT', 'TVA', 'Remise',
                  'Prix net', 'Stock', 'Méthode', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left', fontSize: '12px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articlesFiltres.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa',
                  borderBottom: '1px solid #f0f0f0', opacity: a.actif ? 1 : 0.5 }}>
                  <td style={{ padding: '10px', fontSize: '12px', fontWeight: 'bold' }}>{a.reference}</td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{a.designation}</td>
                  <td style={{ padding: '10px', fontSize: '12px', color: compteStockArticle(a) ? '#666' : '#c62828' }}
                    title={compteStockArticle(a) ? libelleCompte(compteStockArticle(a)) : 'Compte à choisir : compté en 37 par défaut'}>
                    {compteStockArticle(a) ? `${compteStockArticle(a)} - ${libelleCompte(compteStockArticle(a))}` : '⚠️ À choisir'}
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>{Number(a.prix_achat_ht).toLocaleString('fr-FR')} Ar</td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>{a.taux_tva}%</td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>{a.remise_pourcent}%</td>
                  <td style={{ padding: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                    {Number(a.prix_achat_net).toLocaleString('fr-FR')} Ar
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>
                    {a.stock_actuel} {a.unite}
                  </td>
                  <td style={{ padding: '10px', fontSize: '11px' }}>{a.methode_valorisation}</td>
                  <td style={{ padding: '10px' }}>
                    <button style={styles.boutonSecondaire}
                      onClick={() => { setArticleSelectionne(a); setModalOuvert('modifier'); }}>
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Onglet Mouvements */}
      {onglet === 'mouvements' && (
        <div style={styles.card}>
          <div style={{ marginBottom: '15px' }}>
            <label style={styles.label}>Filtrer par article</label>
            <select style={{ ...styles.input, maxWidth: '300px' }}
              value={filtreArticle}
              onChange={e => setFiltreArticle(e.target.value)}>
              <option value="">Tous les articles</option>
              {articles.map(a => (
                <option key={a.id} value={a.id}>{a.reference} — {a.designation}</option>
              ))}
            </select>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Date', 'Article', 'Type', 'Quantité', 'Prix unit. TTC',
                  'Montant TTC', 'Réf. doc.', 'Description'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left', fontSize: '12px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mouvementsFiltres.map((m, i) => {
                const type = typesMouvement.find(t => t.key === m.type_mouvement);
                const estEntree = ['ENTREE_ACHAT', 'ENTREE_FABRICATION'].includes(m.type_mouvement);
                return (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa',
                    borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      {new Date(m.date_mouvement).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      {m.articles?.reference} — {m.articles?.designation}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px',
                        background: type ? type.couleur + '20' : '#f5f5f5',
                        color: type?.couleur || '#333' }}>
                        {type?.label || m.type_mouvement}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold',
                      color: estEntree ? '#2e7d32' : '#c62828' }}>
                      {estEntree ? '+' : '-'}{Number(m.quantite).toLocaleString('fr-FR')} {m.articles?.unite}
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      {Number(m.prix_unitaire_ttc).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                      {Number(m.montant_total_ttc).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      {m.reference_document || '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      {m.description || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}