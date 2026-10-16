import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api, { entrepriseService } from '../../services/api';
import { styles, fmt } from '../EtatsCommuns';

// ───────── Saisie comptable (SuperAdmin) : balance d'ouverture, journal importé, mode d'exercice, calcul ─────────

const fmtN = (n) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });

/** Nombre saisi comme dans Excel : « 1 234 567,89 », « 1.234.567,89 », « 1,234,567.89 »… */
function lireMontant(v) {
  if (v === undefined || v === null) return 0;
  let t = String(v).replace(/[\s  ]/g, '');
  if (t === '') return 0;
  if (t.includes(',') && t.includes('.')) {
    t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else {
    t = t.replace(',', '.');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/** Date jj/mm/aaaa, jj-mm-aaaa, jj.mm.aaaa ou aaaa-mm-jj → aaaa-mm-jj (sinon null). */
function lireDate(v) {
  const t = String(v || '').trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const a = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${a}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

/** Texte collé depuis Excel (tabulations) ou CSV (; ou ,) → tableau de lignes de cellules. */
function lireTableau(texte) {
  const lignes = String(texte || '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lignes.length) return [];
  const sep = lignes.some((l) => l.includes('\t')) ? '\t' : lignes.some((l) => l.includes(';')) ? ';' : ',';
  return lignes.map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, '')));
}

const sansAccent = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Repère les colonnes par leur en-tête ; sinon utilise l'ordre par défaut. */
function colonnes(tableau, noms, parDefaut) {
  const idx = {};
  const entete = tableau[0] ? tableau[0].map(sansAccent) : [];
  let aEntete = false;
  Object.entries(noms).forEach(([cle, variantes]) => {
    const i = entete.findIndex((c) => variantes.some((v) => c === v || c.startsWith(v)));
    if (i >= 0) { idx[cle] = i; aEntete = true; }
  });
  if (!aEntete) return { idx: parDefaut, debut: 0 };
  Object.entries(parDefaut).forEach(([cle, i]) => { if (idx[cle] === undefined) idx[cle] = i; });
  return { idx, debut: 1 };
}

const ANNEES = (() => { const c = new Date().getFullYear(); return [c - 4, c - 3, c - 2, c - 1, c, c + 1]; })();

export default function SaisieComptableAdmin() {
  const [entreprises, setEntreprises] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear() - 1);
  const [saisie, setSaisie] = useState(null);
  const [onglet, setOnglet] = useState('ouverture');
  const [texteOuverture, setTexteOuverture] = useState('');
  const [texteJournal, setTexteJournal] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [retour, setRetour] = useState(null);

  useEffect(() => {
    entrepriseService.getAll()
      .then((res) => setEntreprises((res.data && res.data.data) || []))
      .catch(() => toast.error('Impossible de charger les entreprises.'));
  }, []);

  const recharger = useCallback(() => {
    if (!entrepriseId) { setSaisie(null); return; }
    api.get(`/comptabilite/etats/saisie/${entrepriseId}`)
      .then((res) => setSaisie(res.data))
      .catch(() => toast.error('Impossible de charger l\'état de la saisie.'));
  }, [entrepriseId]);
  useEffect(() => { recharger(); setRetour(null); }, [recharger]);

  const exercice = saisie && saisie.exercices.find((x) => x.annee === annee);
  const mode = (exercice && exercice.mode) || 'PLATEFORME';
  const clos = exercice && exercice.statut === 'CLOS';

  // ───────── aperçu : balance d'ouverture ─────────
  const tabO = lireTableau(texteOuverture);
  const colO = colonnes(tabO, { compte: ['compte', 'n compte', 'numero'], debit: ['debit', 'solde debiteur'], credit: ['credit', 'solde crediteur'], immo: ['immo', 'immobilisation'] },
    { compte: 0, debit: 1, credit: 2, immo: 3 });
  const lignesO = tabO.slice(colO.debut).map((c) => ({
    compte: String(c[colO.idx.compte] || '').replace(/[\s.]/g, ''),
    debit: lireMontant(c[colO.idx.debit]), credit: lireMontant(c[colO.idx.credit]),
    immo_compte: String(c[colO.idx.immo] || '').replace(/[\s.]/g, ''),
  })).filter((l) => l.compte !== '' || l.debit || l.credit);
  const erreursO = lignesO.map((l, i) => (!/^\d{2,}$/.test(l.compte) ? `ligne ${i + 1} : compte « ${l.compte} » invalide` : (Number.isNaN(l.debit) || Number.isNaN(l.credit)) ? `ligne ${i + 1} : montant illisible` : null)).filter(Boolean);
  const totO = lignesO.reduce((s, l) => ({ d: s.d + (l.debit || 0), c: s.c + (l.credit || 0) }), { d: 0, c: 0 });

  // ───────── aperçu : journal ─────────
  const tabJ = lireTableau(texteJournal);
  const colJ = colonnes(tabJ, {
    date: ['date'], piece: ['piece', 'n piece', 'numero piece', 'ref'], compte: ['compte', 'n compte'],
    libelle: ['libelle', 'designation', 'description'], debit: ['debit'], credit: ['credit'], journal: ['journal', 'code journal'],
  }, { date: 0, piece: 1, compte: 2, libelle: 3, debit: 4, credit: 5, journal: 6 });
  const lignesJ = tabJ.slice(colJ.debut).map((c) => ({
    brute: c[colJ.idx.date], date: lireDate(c[colJ.idx.date]), piece: c[colJ.idx.piece] || '',
    compte: String(c[colJ.idx.compte] || '').replace(/[\s.]/g, ''), libelle: c[colJ.idx.libelle] || '',
    debit: lireMontant(c[colJ.idx.debit]), credit: lireMontant(c[colJ.idx.credit]), journal: c[colJ.idx.journal] || '',
  })).filter((l) => l.compte !== '' || l.debit || l.credit);
  const erreursJ = lignesJ.map((l, i) => {
    if (!l.date) return `ligne ${i + 1} : date illisible « ${l.brute} »`;
    if (Number(l.date.slice(0, 4)) !== annee) return `ligne ${i + 1} : date ${l.date} hors de ${annee}`;
    if (!/^\d{2,}$/.test(l.compte)) return `ligne ${i + 1} : compte « ${l.compte} » invalide`;
    if (Number.isNaN(l.debit) || Number.isNaN(l.credit)) return `ligne ${i + 1} : montant illisible`;
    return null;
  }).filter(Boolean);
  const totJ = lignesJ.reduce((s, l) => ({ d: s.d + (l.debit || 0), c: s.c + (l.credit || 0) }), { d: 0, c: 0 });

  async function appeler(fn, succes) {
    setEnCours(true); setRetour(null);
    try {
      const res = await fn();
      if (succes) toast.success(typeof succes === 'function' ? succes(res.data) : succes);
      setRetour(res.data);
      recharger();
      return res.data;
    } catch (err) {
      const d = err.response && err.response.data;
      toast.error((d && d.message) || 'Erreur.');
      setRetour(d || { message: err.message });
      return null;
    } finally {
      setEnCours(false);
    }
  }

  const enregistrerOuverture = () => {
    if (!window.confirm(`Enregistrer la balance d'ouverture ${annee} (${lignesO.length} lignes) ? Elle remplace la balance saisie précédemment.`)) return;
    appeler(() => api.post('/comptabilite/etats/ouverture', {
      entreprise_id: entrepriseId, annee,
      lignes: lignesO.map((l) => ({ compte: l.compte, debit: l.debit || 0, credit: l.credit || 0, immo_compte: l.immo_compte || '' })),
    }), 'Balance d\'ouverture enregistrée.');
  };
  const importerJournal = () => {
    if (!window.confirm(`Importer ${lignesJ.length} lignes dans l'exercice ${annee} ?\n\nL'exercice passera en « mode journal » : ses états seront calculés sur ce journal, et plus sur les factures saisies dans la plateforme.`)) return;
    appeler(() => api.post('/comptabilite/etats/journal-import', {
      entreprise_id: entrepriseId, annee,
      lignes: lignesJ.map((l) => ({ date: l.date, piece: l.piece, compte: l.compte, libelle: l.libelle, debit: l.debit || 0, credit: l.credit || 0, journal: l.journal })),
    }), (d) => `${d.nb_lignes} lignes importées.`);
  };
  const changerMode = (nouveau) => {
    const msg = nouveau === 'PLATEFORME'
      ? `Repasser l'exercice ${annee} en mode plateforme ?\n\nLe journal importé de ${annee} sera SUPPRIMÉ (les états reviendront aux factures de la plateforme).`
      : `Passer l'exercice ${annee} en mode journal ?\n\nLes écritures issues des factures de la plateforme seront retirées de ${annee} jusqu'à l'import du journal.`;
    if (!window.confirm(msg)) return;
    appeler(() => api.post('/comptabilite/etats/mode', { entreprise_id: entrepriseId, annee, mode: nouveau }), 'Mode modifié.');
  };
  const recalculer = () => appeler(() => api.post('/comptabilite/etats/calcul', { entreprise_id: entrepriseId }), 'Calcul terminé.');
  const rouvrir = () => {
    if (!window.confirm(`Rouvrir l'exercice ${annee} ? L'ouverture de ${annee + 1} calculée à la clôture sera supprimée.`)) return;
    appeler(() => api.post('/comptabilite/etats/rouvrir', { entreprise_id: entrepriseId, annee }), 'Exercice rouvert.');
  };
  const supprimerOuverture = () => {
    if (!window.confirm(`Supprimer la balance d'ouverture saisie à la main pour ${annee} ?`)) return;
    appeler(() => api.delete(`/comptabilite/etats/ouverture/${entrepriseId}/${annee}`), 'Balance d\'ouverture supprimée.');
  };

  const onglets = [['ouverture', "Balance d'ouverture"], ['journal', 'Journal importé'], ['calcul', 'Calcul']];
  const ouvertureAnnee = saisie && saisie.ouvertures.find((o) => o.exercice === annee);
  const journalAnnee = saisie && saisie.journaux.find((j) => j.exercice === annee);

  return (
    <div>
      <h2 style={{ margin: '0 0 20px 0', color: '#004d5a' }}>🧾 Saisie comptable (SuperAdmin)</h2>

      <div style={{ ...styles.card, display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 280px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Entreprise</label>
          <select style={styles.input} value={entrepriseId} onChange={(e) => setEntrepriseId(e.target.value)}>
            <option value="">— choisir —</option>
            {entreprises.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
          </select>
        </div>
        <div style={{ width: '120px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Exercice</label>
          <select style={styles.input} value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>
            {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {exercice && (
          <div style={{ fontSize: '13px', color: '#555', paddingBottom: '10px' }}>
            {clos ? '🔒 clôturé' : 'ouvert'} — {mode === 'JOURNAL' ? 'saisi d\'après un journal importé' : 'saisi dans la plateforme'}
          </div>
        )}
      </div>

      {!entrepriseId && <div style={{ ...styles.card, color: '#666' }}>Choisis une entreprise pour commencer.</div>}

      {entrepriseId && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
            {onglets.map(([cle, titre]) => (
              <button key={cle} onClick={() => setOnglet(cle)}
                style={{ ...styles.boutonPrimaire, background: onglet === cle ? '#004d5a' : 'white', color: onglet === cle ? 'white' : '#004d5a', border: '2px solid #004d5a' }}>
                {titre}
              </button>
            ))}
          </div>

          {onglet === 'ouverture' && (
            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>Balance d'ouverture {annee}</h3>
              <p style={{ fontSize: '13px', color: '#555' }}>
                Soldes au 31/12/{annee - 1} (= au 01/01/{annee}), à utiliser pour la <strong>première année</strong> de l'entreprise sur la plateforme.
                Les années suivantes reprennent automatiquement les soldes à la clôture de l'exercice précédent.
                Copie les colonnes depuis Excel : <strong>Compte · Débit · Crédit</strong> (4ᵉ colonne facultative : compte de l'immobilisation pour les amortissements 28x/29x, ex. 213).
                Le total des débits doit être égal au total des crédits.
              </p>
              {ouvertureAnnee && (
                <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '10px', fontSize: '13px', marginBottom: '10px' }}>
                  Une balance d'ouverture existe pour {annee} ({ouvertureAnnee.origine === 'CLOTURE' ? 'calculée à la clôture' : 'saisie à la main'}) :
                  {' '}{ouvertureAnnee.nb_lignes} lignes, débit {fmtN(ouvertureAnnee.debit)} / crédit {fmtN(ouvertureAnnee.credit)}.
                  {ouvertureAnnee.origine === 'MANUEL' && (
                    <button style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={supprimerOuverture} disabled={enCours}>supprimer</button>
                  )}
                </div>
              )}
              <textarea style={{ ...styles.input, height: '180px', fontFamily: 'monospace', fontSize: '12px' }}
                placeholder={'Compte\tDébit\tCrédit\n512\t1 000 000\t\n101\t\t1 000 000'}
                value={texteOuverture} onChange={(e) => setTexteOuverture(e.target.value)} />
              {lignesO.length > 0 && (
                <div style={{ fontSize: '13px', margin: '10px 0' }}>
                  {lignesO.length} lignes — débit <strong>{fmtN(totO.d)}</strong> / crédit <strong>{fmtN(totO.c)}</strong>
                  {Math.abs(totO.d - totO.c) < 0.01
                    ? <span style={{ color: '#2e7d32' }}> ✓ équilibrée</span>
                    : <span style={{ color: '#c62828' }}> ✗ écart {fmtN(totO.d - totO.c)}</span>}
                  {erreursO.length > 0 && <div style={{ color: '#c62828' }}>{erreursO.slice(0, 5).join(' · ')}</div>}
                </div>
              )}
              <button style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
                disabled={enCours || clos || !lignesO.length || erreursO.length > 0 || Math.abs(totO.d - totO.c) >= 0.01}
                onClick={enregistrerOuverture}>
                Enregistrer la balance d'ouverture {annee}
              </button>
            </div>
          )}

          {onglet === 'journal' && (
            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>Journal comptable {annee}</h3>
              <p style={{ fontSize: '13px', color: '#555' }}>
                Pour une entreprise qui veut ses états financiers à partir de <strong>son propre journal</strong> (et non de factures saisies ici).
                Copie depuis Excel : <strong>Date · Pièce · Compte · Libellé · Débit · Crédit</strong> (7ᵉ colonne facultative : code journal).
                Une ligne d'en-tête est reconnue automatiquement. Un import <strong>remplace</strong> le précédent pour cet exercice.
                L'exercice passe en « mode journal » : ses états ne tiennent plus compte des factures de la plateforme (pas de double comptage).
              </p>
              <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '10px', fontSize: '13px', marginBottom: '10px', color: '#e65100' }}>
                Mode actuel de {annee} : <strong>{mode === 'JOURNAL' ? 'journal importé' : 'plateforme'}</strong>
                {journalAnnee && ` — ${journalAnnee.nb_lignes} lignes importées (débit ${fmtN(journalAnnee.debit)} / crédit ${fmtN(journalAnnee.credit)})`}
                {mode === 'JOURNAL' && !clos && (
                  <button style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => changerMode('PLATEFORME')} disabled={enCours}>repasser en mode plateforme</button>
                )}
              </div>
              <textarea style={{ ...styles.input, height: '220px', fontFamily: 'monospace', fontSize: '12px' }}
                placeholder={'Date\tPièce\tCompte\tLibellé\tDébit\tCrédit\n01/02/' + annee + '\tV1\t411\tVente client\t600 000\t\n01/02/' + annee + '\tV1\t707\tVente client\t\t600 000'}
                value={texteJournal} onChange={(e) => setTexteJournal(e.target.value)} />
              {lignesJ.length > 0 && (
                <div style={{ fontSize: '13px', margin: '10px 0' }}>
                  {lignesJ.length} lignes — débit <strong>{fmtN(totJ.d)}</strong> / crédit <strong>{fmtN(totJ.c)}</strong>
                  {Math.abs(totJ.d - totJ.c) < 0.01
                    ? <span style={{ color: '#2e7d32' }}> ✓ équilibré</span>
                    : <span style={{ color: '#c62828' }}> ✗ écart {fmtN(totJ.d - totJ.c)}</span>}
                  {erreursJ.length > 0 && (
                    <div style={{ color: '#c62828', marginTop: '4px' }}>
                      {erreursJ.length} problème(s) : {erreursJ.slice(0, 5).join(' · ')}{erreursJ.length > 5 ? ' …' : ''}
                    </div>
                  )}
                </div>
              )}
              <button style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
                disabled={enCours || clos || !lignesJ.length || erreursJ.length > 0 || Math.abs(totJ.d - totJ.c) >= 0.01}
                onClick={importerJournal}>
                Importer le journal {annee}
              </button>
            </div>
          )}

          {onglet === 'calcul' && (
            <div style={styles.card}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>Calcul des états</h3>
              <p style={{ fontSize: '13px', color: '#555' }}>
                Le calcul tourne automatiquement chaque nuit. Utilise ce bouton après une saisie pour voir le résultat tout de suite.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }} disabled={enCours} onClick={recalculer}>
                  {enCours ? '⏳ Calcul…' : '🔄 Recalculer maintenant'}
                </button>
                {clos && (
                  <button style={{ ...styles.boutonPrimaire, background: '#c62828' }} disabled={enCours} onClick={rouvrir}>
                    🔓 Rouvrir l'exercice {annee}
                  </button>
                )}
              </div>
            </div>
          )}

          {retour && (
            <div style={{ ...styles.card, fontSize: '13px' }}>
              <strong>Résultat</strong>
              {retour.message && <div style={{ color: retour.success === false ? '#c62828' : '#333', marginTop: '6px' }}>{retour.message}</div>}
              {retour.statut && (
                <div style={{ marginTop: '6px' }}>
                  Calcul : <strong>{retour.statut}</strong> — {retour.inserees} insérées, {retour.modifiees} modifiées, {retour.supprimees} supprimées.
                  {retour.equilibre && <> Équilibre débit/crédit : {retour.equilibre.equilibre ? '✓' : `✗ (${fmt(retour.equilibre.ecart)})`}.</>}
                  {typeof retour.ecart_bilan === 'number' && <> Écart Actif − Passif : <strong>{fmt(retour.ecart_bilan)} Ar</strong>.</>}
                  {retour.a_classer > 0 && <> {retour.a_classer} ligne(s) à classer.</>}
                </div>
              )}
              {(retour.erreurs || []).length > 0 && <ul style={{ margin: '6px 0 0 0', color: '#c62828' }}>{retour.erreurs.map((e, i) => <li key={i}>{e}</li>)}</ul>}
              {(retour.alertes || []).length > 0 && (
                <ul style={{ margin: '6px 0 0 0', color: '#8d6e00', maxHeight: '220px', overflow: 'auto' }}>
                  {retour.alertes.slice(0, 40).map((a, i) => <li key={i}>{typeof a === 'string' ? a : `${a.niveau} ${a.type} — ${a.message}`}</li>)}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}