import React, { useState } from 'react';
import {
  arrondi2, natureLigne, ligneVide, blocVide, paiementVide, majLigne, totalLignes, totalPaiements,
  aUneChargeSansStock, problemes, construirePayload, articleExact, dureeLigne
} from '../utils/factureIntelligente';
import { TYPES_BIEN, devinerTypeBien } from '../utils/dureesAmortissement';

const fr = (n) => Number(n || 0).toLocaleString('fr-FR');
const aujourdhui = () => new Date().toISOString().split('T')[0];

/**
 * Nouvelle facture fournisseur « intelligente » : un montant global, plusieurs catégories, plusieurs lignes
 * (libellé, quantité, montant TTC) et plusieurs paiements (mode, date, montant).
 *
 * Props :
 *  - fournisseurs, articles, categories ({ catégorie: [sous-catégories] }), modesPaiement, tva ({assujettie, taux}), styles
 *  - onSave(payload, fichierScan, justificatifs) → promesse { ok, code?, message?, libelle? }
 *  - onCancel()
 */
export default function FormulaireFactureIntelligente({ fournisseurs, articles, categories, modesPaiement, tva, entreprise_id, styles, onSave, onCancel }) {
  const [enCours, setEnCours] = useState(false);
  const [form, setForm] = useState({
    fournisseur_id: '', fournisseur: '', date_facture: aujourdhui(), date_echeance: '', commentaire: '',
    montant: '', montant_tva: '', blocs: [blocVide()], paiements: []
  });
  const [tvaManuelle, setTvaManuelle] = useState(false);
  const [fichierScan, setFichierScan] = useState(null);
  const [justificatifs, setJustificatifs] = useState([]);
  const [retour, setRetour] = useState(null);   // { message, libelle, proche } : refus du serveur à afficher en haut
  const assujettie = !!tva?.assujettie;
  const taux = Number(tva?.taux) || 20;

  const montant = Number(form.montant) || 0;
  const total = totalLignes(form.blocs);
  const reste = arrondi2(montant - total);
  const paye = totalPaiements(form.paiements);
  const aPayer = arrondi2(montant - paye);
  const liste = problemes(form, assujettie);

  const maj = (patch) => setForm((f) => ({ ...f, ...patch }));
  function changerMontant(v) {
    const patch = { montant: v };
    if (assujettie && !tvaManuelle) patch.montant_tva = v === '' ? '' : arrondi2(Number(v) * taux / (100 + taux));
    maj(patch);
  }
  function changerFournisseur(id) {
    const f = fournisseurs.find((x) => x.id === id);
    if (!f) return maj({ fournisseur_id: '', fournisseur: '' });
    const ech = new Date(form.date_facture); ech.setDate(ech.getDate() + (f.delai_paiement || 30));
    maj({ fournisseur_id: id, fournisseur: f.nom, date_echeance: ech.toISOString().split('T')[0] });
  }
  const majBloc = (i, patch) => setForm((f) => ({ ...f, blocs: f.blocs.map((b, k) => (k === i ? { ...b, ...patch } : b)) }));
  const majLigneBloc = (i, j, champ, valeur) => setForm((f) => ({
    ...f, blocs: f.blocs.map((b, k) => (k !== i ? b : { ...b, lignes: b.lignes.map((l, m) => (m === j ? majLigne(l, champ, valeur) : l)) }))
  }));
  const majPaiement = (i, patch) => setForm((f) => ({ ...f, paiements: f.paiements.map((p, k) => (k === i ? { ...p, ...patch } : p)) }));

  async function enregistrer(confirmerLibelle) {
    setEnCours(true);
    setRetour(null);
    let f = form;
    if (confirmerLibelle) {
      // l'utilisateur a confirmé que cet article proche est bien un article différent
      f = { ...form, blocs: form.blocs.map((b) => ({ ...b, lignes: b.lignes.map((l) => (String(l.libelle).trim() === confirmerLibelle ? { ...l, confirmer_similaire: true } : l)) })) };
      setForm(f);
    }
    const res = await onSave(construirePayload(f, entreprise_id, articles, assujettie), fichierScan, justificatifs);
    setEnCours(false);
    if (res && !res.ok) setRetour({ message: res.message, libelle: res.libelle, proche: res.code === 'ARTICLE_PROCHE' });
  }

  const th = { textAlign: 'left', fontSize: '11px', color: '#666', padding: '2px 4px' };
  const petit = { ...styles.input, padding: '7px', fontSize: '13px' };

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '900px', maxWidth: '96vw' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>➕ Nouvelle facture fournisseur</h3>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '-8px' }}>
          Saisis le montant global, puis détaille la facture par catégorie. Les montants des lignes sont <strong>TTC</strong>, comme le montant global.
          Le stock et les immobilisations sont créés automatiquement.
        </p>

        {retour && (
          <div style={{ background: '#ffebee', border: '1px solid #c62828', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '13px', color: '#b71c1c' }}>
            {retour.message}
            {retour.proche && retour.libelle && (
              <div style={{ marginTop: '8px' }}>
                <button style={styles.boutonSecondaire} disabled={enCours} onClick={() => enregistrer(retour.libelle)}>
                  Ce sont des articles différents : continuer
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={styles.label}>Fournisseur *</label>
            <select style={styles.input} value={form.fournisseur_id} onChange={(e) => changerFournisseur(e.target.value)}>
              <option value="">Sélectionner un fournisseur</option>
              {fournisseurs.filter((f) => f.actif).map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Date facture *</label>
            <input style={styles.input} type="date" value={form.date_facture} onChange={(e) => maj({ date_facture: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Date échéance</label>
            <input style={styles.input} type="date" value={form.date_echeance} onChange={(e) => maj({ date_echeance: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Montant global TTC (Ar) *</label>
            <input style={styles.input} type="number" min="0" value={form.montant} onChange={(e) => changerMontant(e.target.value)} />
          </div>
          {assujettie && (
            <div>
              <label style={styles.label}>dont TVA déductible (Ar)</label>
              <input style={styles.input} type="number" min="0" value={form.montant_tva}
                onChange={(e) => { setTvaManuelle(true); maj({ montant_tva: e.target.value }); }} />
              <div style={{ fontSize: '11px', color: '#666' }}>Présaisie à {taux} % ; à mettre à 0 si le fournisseur n'est pas assujetti.</div>
            </div>
          )}
          <div style={{ gridColumn: assujettie ? 'auto' : 'span 2' }}>
            <label style={styles.label}>Descriptif</label>
            <input style={styles.input} value={form.commentaire} onChange={(e) => maj({ commentaire: e.target.value })} placeholder="Facultatif" />
          </div>
        </div>

        {/* ─── Blocs catégorie / lignes ─── */}
        {form.blocs.map((b, i) => {
          const n = natureLigne(b.categorie, b.sous_categorie);
          const sous = categories[b.categorie] || [];
          const totalBloc = arrondi2(b.lignes.reduce((s, l) => s + (Number(l.montant) || 0), 0));
          return (
            <div key={i} style={{ border: '2px solid #e0e0e0', borderRadius: '10px', padding: '12px', marginTop: '14px', background: '#fafcfc' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={styles.label}>Catégorie {i + 1}</label>
                  <select style={styles.input} value={b.categorie} onChange={(e) => majBloc(i, { categorie: e.target.value, sous_categorie: '' })}>
                    <option value="">Sélectionner une catégorie</option>
                    {Object.keys(categories).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {sous.length > 0 && (
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={styles.label}>Sous-catégorie</label>
                    <select style={styles.input} value={b.sous_categorie} onChange={(e) => majBloc(i, { sous_categorie: e.target.value })}>
                      <option value="">Sélectionner</option>
                      {sous.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {form.blocs.length > 1 && (
                  <button type="button" style={styles.boutonDanger} onClick={() => setForm((f) => ({ ...f, blocs: f.blocs.filter((_, k) => k !== i) }))}>Retirer</button>
                )}
              </div>
              {n.nature === 'STOCK' && !n.aPreciser && <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '6px' }}>📦 Ces lignes entrent automatiquement en stock (compte {n.compteStock}).</div>}
              {n.aPreciser && <div style={{ fontSize: '11px', color: '#c62828', marginTop: '6px' }}>Choisis une sous-catégorie de stock précise.</div>}
              {n.nature === 'IMMO' && <div style={{ fontSize: '11px', color: '#1565c0', marginTop: '6px' }}>🏢 Une fiche d'immobilisation est créée automatiquement pour chaque ligne (durée d'amortissement modifiable).</div>}

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                <thead>
                  <tr>
                    <th style={th}>Libellé</th><th style={{ ...th, width: '80px' }}>Quantité</th>
                    <th style={{ ...th, width: '110px' }}>Prix unitaire</th><th style={{ ...th, width: '120px' }}>Montant TTC</th>
                    {n.nature === 'STOCK' && <th style={{ ...th, width: '190px' }}>Article en stock</th>}
                    {n.nature === 'IMMO' && <th style={{ ...th, width: '200px' }}>Type de bien · durée (ans)</th>}
                    <th style={{ width: '30px' }} />
                  </tr>
                </thead>
                <tbody>
                  {b.lignes.map((l, j) => {
                    const exact = n.nature === 'STOCK' ? articleExact(l.libelle, articles) : null;
                    return (
                      <tr key={j}>
                        <td style={{ padding: '3px' }}><input style={petit} value={l.libelle} onChange={(e) => majLigneBloc(i, j, 'libelle', e.target.value)} placeholder="ex. Balais" /></td>
                        <td style={{ padding: '3px' }}><input style={petit} type="number" min="0" value={l.quantite} onChange={(e) => majLigneBloc(i, j, 'quantite', e.target.value)} /></td>
                        <td style={{ padding: '3px' }}><input style={petit} type="number" min="0" value={l.prix_unitaire} onChange={(e) => majLigneBloc(i, j, 'prix_unitaire', e.target.value)} /></td>
                        <td style={{ padding: '3px' }}><input style={petit} type="number" min="0" value={l.montant} onChange={(e) => majLigneBloc(i, j, 'montant', e.target.value)} /></td>
                        {n.nature === 'STOCK' && (
                          <td style={{ padding: '3px' }}>
                            <select style={petit} value={l.article_id || (exact ? exact.id : '')} onChange={(e) => majLigneBloc(i, j, 'article_id', e.target.value)}>
                              <option value="">➕ Nouvel article</option>
                              {(articles || []).filter((a) => a.actif !== false).map((a) => <option key={a.id} value={a.id}>{a.designation}</option>)}
                            </select>
                            {!l.article_id && !exact && (
                              <input style={{ ...petit, marginTop: '3px' }} value={l.unite} onChange={(e) => majLigneBloc(i, j, 'unite', e.target.value)} placeholder="Unité (pièce, kg, L…)" />
                            )}
                          </td>
                        )}
                        {n.nature === 'IMMO' && (
                          <td style={{ padding: '3px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <select style={petit} value={l.type_bien || devinerTypeBien(l.libelle)}
                                onChange={(e) => majLigneBloc(i, j, 'type_bien', e.target.value)}>
                                <option value="">Autre bien</option>
                                {TYPES_BIEN.map((t) => <option key={t.cle} value={t.cle}>{t.libelle}</option>)}
                              </select>
                              <input style={{ ...petit, width: '60px' }} type="number" min="1" value={l.duree_ans}
                                placeholder={String(dureeLigne({ ...l, duree_ans: '' }, n.compte))} onChange={(e) => majLigneBloc(i, j, 'duree_ans', e.target.value)} />
                            </div>
                          </td>
                        )}
                        <td style={{ padding: '3px' }}>
                          {b.lignes.length > 1 && (
                            <button type="button" title="Retirer la ligne" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontSize: '16px' }}
                              onClick={() => majBloc(i, { lignes: b.lignes.filter((_, m) => m !== j) })}>✕</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <button type="button" style={styles.boutonSecondaire} onClick={() => majBloc(i, { lignes: [...b.lignes, ligneVide()] })}>+ Ajouter une ligne</button>
                <span style={{ fontSize: '13px' }}>Total de cette catégorie : <strong>{fr(totalBloc)} Ar</strong></span>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: '10px' }}>
          <button type="button" style={styles.boutonSecondaire} onClick={() => setForm((f) => ({ ...f, blocs: [...f.blocs, blocVide()] }))}>+ Ajouter une autre catégorie</button>
        </div>

        {/* ─── Contrôle du montant ─── */}
        {montant > 0 && (
          <div style={{ background: reste < -0.01 ? '#ffebee' : reste > 0.01 ? '#fff3e0' : '#e8f5e9', borderRadius: '8px', padding: '10px', marginTop: '12px', fontSize: '13px' }}>
            Montant de la facture : <strong>{fr(montant)} Ar</strong> · Total des lignes : <strong>{fr(total)} Ar</strong> ·{' '}
            {reste < -0.01 ? <strong style={{ color: '#c62828' }}>dépassement de {fr(-reste)} Ar</strong>
              : reste > 0.01 ? <strong style={{ color: '#e65100' }}>reste {fr(reste)} Ar à détailler</strong>
                : <strong style={{ color: '#2e7d32' }}>✔ tout est détaillé</strong>}
            {reste > 0.01 && aUneChargeSansStock(form.blocs) && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Si tu ne détailles pas ce reste, il sera rangé sous « Reste non détaillé » dans la première catégorie de charge.
              </div>
            )}
          </div>
        )}

        {/* ─── Paiements ─── */}
        <div style={{ marginTop: '16px' }}>
          <label style={styles.label}>💰 Paiements (plusieurs modes possibles : chaque paiement va dans son journal)</label>
          {form.paiements.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 30px', gap: '8px', marginBottom: '6px' }}>
              <select style={petit} value={p.mode} onChange={(e) => majPaiement(i, { mode: e.target.value })}>
                <option value="">Mode de paiement</option>
                {modesPaiement.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input style={petit} type="date" value={p.date} onChange={(e) => majPaiement(i, { date: e.target.value })} />
              <input style={petit} type="number" min="0" placeholder="Montant (Ar)" value={p.montant} onChange={(e) => majPaiement(i, { montant: e.target.value })} />
              <button type="button" title="Retirer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontSize: '16px' }}
                onClick={() => setForm((f) => ({ ...f, paiements: f.paiements.filter((_, k) => k !== i) }))}>✕</button>
            </div>
          ))}
          <button type="button" style={styles.boutonSecondaire}
            onClick={() => setForm((f) => ({ ...f, paiements: [...f.paiements, paiementVide(f.date_facture)] }))}>+ Ajouter un paiement</button>
          {montant > 0 && (
            <div style={{ fontSize: '13px', marginTop: '8px' }}>
              Payé : <strong>{fr(paye)} Ar</strong> · Reste à payer au fournisseur :{' '}
              <strong style={{ color: aPayer > 0 ? '#c62828' : '#2e7d32' }}>{fr(aPayer)} Ar</strong>
            </div>
          )}
        </div>

        {/* ─── Pièces jointes ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
          <div>
            <label style={styles.label}>📄 Scan de la facture</label>
            <input style={styles.input} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFichierScan(e.target.files[0])} />
          </div>
          <div>
            <label style={styles.label}>📎 Justificatifs de paiement</label>
            <input style={styles.input} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple
              onChange={(e) => { setJustificatifs((prev) => [...prev, ...Array.from(e.target.files)]); e.target.value = ''; }} />
            {justificatifs.map((f, k) => (
              <div key={k} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                <span>📄 {f.name}</span>
                <button type="button" style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}
                  onClick={() => setJustificatifs((prev) => prev.filter((_, m) => m !== k))}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {liste.length > 0 && (
          <ul style={{ fontSize: '12px', color: '#c62828', margin: '14px 0 0', paddingLeft: '18px' }}>
            {liste.slice(0, 6).map((m, k) => <li key={k}>{m}</li>)}
            {liste.length > 6 && <li>… et {liste.length - 6} autre(s)</li>}
          </ul>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel} disabled={enCours}>Annuler</button>
          <button style={{ ...styles.boutonPrimaire, opacity: enCours || liste.length ? 0.5 : 1 }}
            disabled={enCours || liste.length > 0} onClick={() => enregistrer()}>
            {enCours ? '⏳ Enregistrement...' : 'Créer la facture'}
          </button>
        </div>
      </div>
    </div>
  );
}
