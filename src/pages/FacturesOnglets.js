// Onglets « Proforma » (devis) et « Avoirs » (remboursement d'un trop-perçu) de la page Factures.
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { proformaService, avoirService, clientService, entrepriseService, pdfLienService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useSoumission from '../hooks/useSoumission';
import { categoriesEtSousCategories } from '../utils/categoriesComptables';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MODES_REMBOURSEMENT = ['Virement bancaire', 'Chèque', 'Espèces', 'Airtel money', 'Orange money', 'Mvola', 'Autre'];

const fr = n => (Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const dateFr = d => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const aujourdhui = () => new Date().toISOString().split('T')[0];
const message = (err, defaut) => err.response?.data?.message || defaut;

const trierClients = (clients) => [...(clients || [])].sort((a, b) =>
  String(a.nom || '').localeCompare(String(b.nom || ''), 'fr', { sensitivity: 'base', numeric: true }));

const S = {
  bouton: { background: 'white', color: '#004d5a', border: '2px solid #004d5a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  petit: { background: 'white', border: '1px solid #bbb', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' },
  input: { width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px' },
  card: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', borderRadius: '12px', padding: '30px', width: '700px', maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  th: { padding: '10px', fontSize: '12px', textAlign: 'left', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' },
  td: { padding: '10px', fontSize: '13px', borderBottom: '1px solid #f0f0f0' }
};

const STATUTS_PROFORMA = {
  EN_ATTENTE: { bg: '#e3f2fd', color: '#1565c0', label: '⏳ En attente' },
  VALIDEE: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Validée' },
  ANNULEE: { bg: '#fafafa', color: '#9e9e9e', label: '❌ Annulée' },
  EXPIREE: { bg: '#fff3e0', color: '#e65100', label: '⌛ Expirée' }
};

function Pastille({ statut }) {
  const c = STATUTS_PROFORMA[statut] || { bg: '#f5f5f5', color: '#616161', label: statut };
  return <span style={{ background: c.bg, color: c.color, padding: '3px 8px', borderRadius: '10px', fontSize: '12px', whiteSpace: 'nowrap' }}>{c.label}</span>;
}

// Ouvre le PDF dans un nouvel onglet (la fenêtre est ouverte tout de suite pour ne pas être bloquée par le navigateur).
// Le serveur fournit un lien temporaire dont le nom de fichier est le numéro du document (PRF-0001.pdf, AVR-0001.pdf).
async function ouvrirPdf(type, id) {
  const fenetre = window.open('', '_blank');
  try {
    const res = await pdfLienService.creer(type, id);
    const url = pdfLienService.adresse(res.data.url);
    if (fenetre) fenetre.location.href = url; else window.open(url, '_blank');
  } catch (err) {
    if (fenetre) fenetre.close();
    toast.error('PDF indisponible pour le moment.');
  }
}

function Fenetre({ titre, children, large }) {
  return (
    <div style={S.modal}>
      <div style={{ ...S.modalContent, width: large ? '800px' : '520px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>{titre}</h3>
        {children}
      </div>
    </div>
  );
}

function BoutonsFormulaire({ onCancel, enCours, libelle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
      <button type="button" style={S.bouton} onClick={onCancel} disabled={enCours}>Annuler</button>
      <button type="submit" disabled={enCours}
        style={{ ...S.bouton, background: '#004d5a', color: 'white', opacity: enCours ? 0.6 : 1 }}>
        {enCours ? '⏳ Patientez...' : libelle}
      </button>
    </div>
  );
}

// ───────────────────────────── PROFORMA ─────────────────────────────

function FormulaireProforma({ clients, tva, initial, onSave, onCancel }) {
  const { enCours, soumettre } = useSoumission();
  const [form, setForm] = useState(() => initial ? {
    client_id: initial.client_id, mois: initial.mois || '', motif: initial.motif || '',
    date_proforma: String(initial.date_proforma).slice(0, 10), date_fin_validite: String(initial.date_fin_validite).slice(0, 10),
    note: initial.note || '',
    lignes: (initial.lignes_proforma || []).map(l => ({ description: l.description, quantite: l.quantite, prix_unitaire: l.prix_unitaire, remise_pourcent: l.remise_pourcent || 0 }))
  } : {
    client_id: '', mois: MOIS[new Date().getMonth()], motif: '', date_proforma: aujourdhui(), date_fin_validite: '', note: '',
    lignes: [{ description: '', quantite: 1, prix_unitaire: 0, remise_pourcent: 0 }]
  });

  const totalLigne = l => {
    const brut = Number(l.quantite) * Number(l.prix_unitaire);
    return brut - brut * (Number(l.remise_pourcent) || 0) / 100;
  };
  const ht = form.lignes.reduce((s, l) => s + totalLigne(l), 0);
  const montantTva = tva?.assujettie ? Math.round(ht * (Number(tva.taux) || 0)) / 100 : 0;

  function majLigne(i, champ, valeur) {
    setForm({ ...form, lignes: form.lignes.map((l, k) => (k === i ? { ...l, [champ]: valeur } : l)) });
  }

  function envoyer(e) {
    e.preventDefault();
    if (!form.client_id) return toast.error('Choisissez un client.');
    if (!form.date_fin_validite) return toast.error('La date de fin de la proposition est obligatoire.');
    if (form.date_fin_validite < form.date_proforma) return toast.error('La date de fin ne peut pas précéder la date du proforma.');
    if (form.lignes.some(l => !String(l.description).trim() || !(Number(l.quantite) > 0))) {
      return toast.error('Chaque ligne doit avoir un intitulé et une quantité.');
    }
    soumettre(() => onSave(form));
  }

  return (
    <Fenetre large titre={initial ? `✏️ Modifier le proforma ${initial.numero_proforma}` : '📄 Nouveau proforma'}>
      <form onSubmit={envoyer}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={S.label}>Client *</label>
            <select style={S.input} value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Sélectionner un client</option>
              {trierClients(clients).map(c => (
                <option key={c.id} value={c.id}>{c.nom}{c.societe ? ` (${c.societe})` : ''}{c.actif === 'NON' ? ' — inactif' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={S.label}>Mois</label>
            <select style={S.input} value={form.mois} onChange={e => setForm({ ...form, mois: e.target.value })}>
              <option value="">—</option>
              {MOIS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Date du proforma</label>
            <input type="date" style={S.input} value={form.date_proforma} onChange={e => setForm({ ...form, date_proforma: e.target.value })} />
          </div>
          <div>
            <label style={S.label}>Proposition valable jusqu'au *</label>
            <input type="date" style={S.input} min={form.date_proforma} value={form.date_fin_validite}
              onChange={e => setForm({ ...form, date_fin_validite: e.target.value })} />
          </div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={S.label}>Motif / objet</label>
          <input style={S.input} value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Ex. : Création du site vitrine" />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
          <thead>
            <tr>{['Intitulé', 'Quantité', 'Tarif', 'Remise %', 'Total', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {form.lignes.map((l, i) => (
              <tr key={i}>
                <td style={{ padding: '4px' }}><input style={S.input} value={l.description} onChange={e => majLigne(i, 'description', e.target.value)} /></td>
                <td style={{ padding: '4px', width: '80px' }}><input type="number" min="0" step="any" style={S.input} value={l.quantite} onChange={e => majLigne(i, 'quantite', e.target.value)} /></td>
                <td style={{ padding: '4px', width: '120px' }}><input type="number" min="0" step="any" style={S.input} value={l.prix_unitaire} onChange={e => majLigne(i, 'prix_unitaire', e.target.value)} /></td>
                <td style={{ padding: '4px', width: '80px' }}><input type="number" min="0" max="100" step="any" style={S.input} value={l.remise_pourcent} onChange={e => majLigne(i, 'remise_pourcent', e.target.value)} /></td>
                <td style={{ padding: '4px', width: '110px', textAlign: 'right', fontWeight: 'bold' }}>{fr(totalLigne(l))}</td>
                <td style={{ padding: '4px' }}>
                  {form.lignes.length > 1 && (
                    <button type="button" style={{ ...S.petit, color: '#c62828' }} onClick={() => setForm({ ...form, lignes: form.lignes.filter((_, k) => k !== i) })}>✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" style={S.bouton}
          onClick={() => setForm({ ...form, lignes: [...form.lignes, { description: '', quantite: 1, prix_unitaire: 0, remise_pourcent: 0 }] })}>
          + Ajouter une ligne
        </button>

        <div style={{ textAlign: 'right', marginTop: '15px', color: '#004d5a' }}>
          {tva?.assujettie ? (
            <>
              <div>Total HT : {fr(ht)} Ar</div>
              <div>TVA ({tva.taux} %) : {fr(montantTva)} Ar</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', borderTop: '2px solid #004d5a', paddingTop: '4px', marginTop: '4px' }}>TOTAL TTC : {fr(ht + montantTva)} Ar</div>
              <div style={{ fontSize: '11px', color: '#888' }}>Les prix saisis sont hors taxes (HT).</div>
            </>
          ) : (
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>MONTANT : {fr(ht)} Ar</div>
          )}
        </div>

        <div style={{ marginTop: '15px' }}>
          <label style={S.label}>Note (affichée sur le PDF)</label>
          <textarea style={{ ...S.input, minHeight: '60px' }} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
        </div>
        <BoutonsFormulaire onCancel={onCancel} enCours={enCours} libelle={initial ? 'Enregistrer' : 'Créer le proforma'} />
      </form>
    </Fenetre>
  );
}

function FormulaireAnnulation({ proforma, onSave, onCancel }) {
  const { enCours, soumettre } = useSoumission();
  const [motif, setMotif] = useState('Sans suite');
  return (
    <Fenetre titre={`❌ Annuler le proforma ${proforma.numero_proforma}`}>
      <form onSubmit={e => { e.preventDefault(); soumettre(() => onSave(motif)); }}>
        <p style={{ color: '#666', fontSize: '14px' }}>Le proforma sera conservé avec la mention « ANNULÉ » mais ne pourra plus être validé.</p>
        <label style={S.label}>Motif</label>
        <input style={S.input} value={motif} onChange={e => setMotif(e.target.value)} />
        <BoutonsFormulaire onCancel={onCancel} enCours={enCours} libelle="Annuler le proforma" />
      </form>
    </Fenetre>
  );
}

// Validation = transformation immédiate en facture : on choisit ici la catégorie comptable de cette facture.
function FormulaireCategorisation({ proforma, onSave, onCancel }) {
  const { enCours, soumettre } = useSoumission();
  const [categorie, setCategorie] = useState('');
  const [sousCategorie, setSousCategorie] = useState('');
  const [confirme, setConfirme] = useState(false);
  const expire = proforma.statut === 'EXPIREE';
  const sousCategories = categoriesEtSousCategories[categorie] || [];

  function envoyer(e) {
    e.preventDefault();
    if (!categorie) return toast.error('Choisissez la catégorie comptable.');
    if (expire && !confirme) return toast.error('Confirmez la validation du proforma expiré.');
    soumettre(() => onSave({ categorie, sous_categorie: sousCategorie || undefined, confirmer_expire: expire ? true : undefined }));
  }

  return (
    <Fenetre titre={`✅ Valider le proforma ${proforma.numero_proforma}`}>
      <form onSubmit={envoyer}>
        <p style={{ color: '#444', fontSize: '14px', marginTop: 0 }}>
          Le proforma de <strong>{proforma.nom_client}</strong> ({fr(proforma.montant_total)} Ar) devient immédiatement une facture.
          Choisissez où la classer dans la comptabilité.
        </p>
        {expire && (
          <div style={{ background: '#fff3e0', border: '1px solid #e65100', borderRadius: '8px', padding: '10px', marginBottom: '15px', fontSize: '13px' }}>
            ⌛ Cette proposition a expiré le {dateFr(proforma.date_fin_validite)}.
            <label style={{ display: 'block', marginTop: '6px' }}>
              <input type="checkbox" checked={confirme} onChange={e => setConfirme(e.target.checked)} /> Je confirme la validation malgré l'expiration
            </label>
          </div>
        )}
        <div style={{ marginBottom: '15px' }}>
          <label style={S.label}>Catégorie *</label>
          <select style={S.input} value={categorie} onChange={e => { setCategorie(e.target.value); setSousCategorie(''); }}>
            <option value="">Sélectionner une catégorie</option>
            {Object.keys(categoriesEtSousCategories).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {sousCategories.length > 0 && (
          <div>
            <label style={S.label}>Sous-catégorie</label>
            <select style={S.input} value={sousCategorie} onChange={e => setSousCategorie(e.target.value)}>
              <option value="">Sélectionner une sous-catégorie</option>
              {sousCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
          </div>
        )}
        <BoutonsFormulaire onCancel={onCancel} enCours={enCours} libelle="Valider et créer la facture" />
      </form>
    </Fenetre>
  );
}

export function ProformasOnglet({ entreprise, clients, tva, noteDefaut, onFactureCreee }) {
  const [proformas, setProformas] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState('TOUS');
  const [recherche, setRecherche] = useState('');
  const [modal, setModal] = useState(null); // { type: 'form' | 'annuler' | 'valider', proforma }
  const [envoiId, setEnvoiId] = useState(null); // ligne dont le mail est en cours d'envoi

  async function charger() {
    try {
      const res = await proformaService.getAll(entreprise.id);
      setProformas(res.data.data || []);
    } catch (err) {
      toast.error(message(err, 'Erreur lors du chargement des proformas.'));
    } finally {
      setChargement(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, []);

  const affiches = useMemo(() => proformas.filter(p =>
    (filtre === 'TOUS' || p.statut === filtre) &&
    (!recherche || `${p.numero_proforma} ${p.nom_client} ${p.motif || ''}`.toLowerCase().includes(recherche.toLowerCase()))
  ), [proformas, filtre, recherche]);

  async function enregistrer(form) {
    try {
      const donnees = { ...form, entreprise_id: entreprise.id };
      const res = modal.proforma ? await proformaService.modifier(modal.proforma.id, donnees) : await proformaService.creer(donnees);
      toast.success(res.data.message);
      setModal(null);
      charger();
    } catch (err) { toast.error(message(err, 'Erreur enregistrement proforma.')); }
  }

  async function annuler(motif) {
    try {
      const res = await proformaService.annuler(modal.proforma.id, motif);
      toast.success(res.data.message);
      setModal(null);
      charger();
    } catch (err) { toast.error(message(err, 'Erreur annulation proforma.')); }
  }

  async function valider(choix) {
    try {
      const res = await proformaService.valider(modal.proforma.id, choix);
      toast.success(res.data.message);
      setModal(null);
      charger();
      if (onFactureCreee) onFactureCreee(res.data.data?.facture);
    } catch (err) { toast.error(message(err, 'Erreur validation proforma.')); }
  }

  async function envoyer(p) {
    if (envoiId) return;
    setEnvoiId(p.id);
    try {
      const res = await proformaService.envoyer(p.id);
      toast.success(res.data.message);
    } catch (err) { toast.error(message(err, 'Envoi impossible.')); }
    finally { setEnvoiId(null); }
  }

  if (chargement) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modal?.type === 'form' && (
        <FormulaireProforma clients={clients} tva={tva} initial={modal.proforma} noteDefaut={noteDefaut}
          onSave={enregistrer} onCancel={() => setModal(null)} />
      )}
      {modal?.type === 'annuler' && <FormulaireAnnulation proforma={modal.proforma} onSave={annuler} onCancel={() => setModal(null)} />}
      {modal?.type === 'valider' && <FormulaireCategorisation proforma={modal.proforma} onSave={valider} onCancel={() => setModal(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>📄 Proforma</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>{proformas.length} proforma(s) au total</p>
        </div>
        <button style={{ ...S.bouton, borderColor: '#004d5a' }} onClick={() => setModal({ type: 'form' })}>+ Nouveau proforma</button>
      </div>

      <div style={{ ...S.card, display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={S.label}>Rechercher</label>
          <input style={{ ...S.input, width: '250px' }} placeholder="N° proforma, client, motif..." value={recherche} onChange={e => setRecherche(e.target.value)} />
        </div>
        <div>
          <label style={S.label}>Statut</label>
          <select style={{ ...S.input, width: '180px' }} value={filtre} onChange={e => setFiltre(e.target.value)}>
            <option value="TOUS">Tous</option>
            {Object.keys(STATUTS_PROFORMA).map(s => <option key={s} value={s}>{STATUTS_PROFORMA[s].label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['N°', 'Client', 'Date', "Valable jusqu'au", 'Mois', 'Motif', 'Montant', 'Statut', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {affiches.length === 0 && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: '#888' }}>Aucun proforma.</td></tr>}
            {affiches.map(p => {
              const ouvert = p.statut === 'EN_ATTENTE' || p.statut === 'EXPIREE';
              return (
                <tr key={p.id}>
                  <td style={{ ...S.td, fontWeight: 'bold' }}>{p.numero_proforma}</td>
                  <td style={S.td}>{p.nom_client}</td>
                  <td style={S.td}>{dateFr(p.date_proforma)}</td>
                  <td style={S.td}>{dateFr(p.date_fin_validite)}</td>
                  <td style={S.td}>{p.mois || '—'}</td>
                  <td style={S.td}>{p.motif || '—'}</td>
                  <td style={{ ...S.td, textAlign: 'right', whiteSpace: 'nowrap' }}>{fr(p.montant_total)} Ar</td>
                  <td style={S.td}><Pastille statut={p.statut} /></td>
                  <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                    <button style={S.petit} title="Visualiser le proforma" onClick={() => ouvrirPdf('PROFORMA', p.id)}>👁️</button>
                    <button disabled={!!envoiId} title={envoiId === p.id ? 'Envoi en cours...' : 'Envoyer par e-mail'} onClick={() => envoyer(p)}
                      style={{ ...S.petit, ...(envoiId ? { opacity: 0.4, cursor: 'not-allowed', background: '#eee' } : {}) }}>{envoiId === p.id ? '⏳' : '📧'}</button>
                    {ouvert && <button style={S.petit} title="Modifier" onClick={() => setModal({ type: 'form', proforma: p })}>✏️</button>}
                    {ouvert && <button style={{ ...S.petit, color: '#2e7d32', borderColor: '#2e7d32' }} title="Valider (devient une facture)" onClick={() => setModal({ type: 'valider', proforma: p })}>✅ Valider</button>}
                    {ouvert && <button style={{ ...S.petit, color: '#c62828', borderColor: '#c62828' }} title="Annuler (sans suite)" onClick={() => setModal({ type: 'annuler', proforma: p })}>❌</button>}
                    {p.statut === 'ANNULEE' && p.motif_annulation && <span style={{ fontSize: '12px', color: '#888' }}>{p.motif_annulation}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────── AVOIRS ─────────────────────────────

function FormulaireAvoir({ clients, entreprise_id, clientInitial, onSave, onCancel }) {
  const { enCours, soumettre } = useSoumission();
  const [form, setForm] = useState({
    client_id: clientInitial || '', facture_id: '', montant: '', mois: MOIS[new Date().getMonth()],
    motif: '', mode_paiement: '', date_avoir: aujourdhui()
  });
  const [credit, setCredit] = useState(0);
  const [factures, setFactures] = useState([]);

  async function chargerClient(client_id, formCourant) {
    if (!client_id) { setCredit(0); setFactures([]); return; }
    try {
      const res = await avoirService.facturesClient(entreprise_id, client_id);
      const liste = res.data.data || [];
      setCredit(Number(res.data.credit) || 0);
      setFactures(liste);
      setForm({ ...formCourant, client_id, facture_id: liste[0]?.id || '', montant: res.data.credit > 0 ? String(res.data.credit) : '' });
    } catch (err) {
      toast.error(message(err, 'Impossible de lire le crédit du client.'));
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (clientInitial) chargerClient(clientInitial, form); }, []);

  function envoyer(e) {
    e.preventDefault();
    const montant = Number(form.montant);
    if (!form.client_id) return toast.error('Choisissez un client.');
    if (!(montant > 0)) return toast.error('Le montant doit être supérieur à 0.');
    if (montant > credit + 0.005) return toast.error(`Le montant dépasse le crédit disponible (${fr(credit)} Ar).`);
    if (!form.mode_paiement) return toast.error('Choisissez le moyen de remboursement.');
    if (!form.motif.trim()) return toast.error('Indiquez le motif.');
    soumettre(() => onSave({ ...form, montant, facture_id: form.facture_id || undefined }));
  }

  return (
    <Fenetre titre="↩️ Nouvel avoir (remboursement)">
      <form onSubmit={envoyer}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ gridColumn: '1 / 3' }}>
            <label style={S.label}>Client *</label>
            <select style={S.input} value={form.client_id} onChange={e => chargerClient(e.target.value, form)}>
              <option value="">Sélectionner un client</option>
              {trierClients(clients).map(c => <option key={c.id} value={c.id}>{c.nom}{c.societe ? ` (${c.societe})` : ''}</option>)}
            </select>
            {form.client_id && (
              <div style={{ fontSize: '13px', marginTop: '6px', color: credit > 0 ? '#2e7d32' : '#c62828' }}>
                {credit > 0 ? `Crédit disponible : ${fr(credit)} Ar` : 'Ce client n\'a aucun trop-perçu à rembourser.'}
              </div>
            )}
          </div>
          <div>
            <label style={S.label}>Facture associée</label>
            <select style={S.input} value={form.facture_id} onChange={e => setForm({ ...form, facture_id: e.target.value })}>
              <option value="">— Aucune —</option>
              {factures.map(f => <option key={f.id} value={f.id}>{f.numero_facture} (trop-perçu {fr(f.trop_percu)} Ar)</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Montant remboursé (Ar) *</label>
            <input type="number" min="0" step="any" max={credit || undefined} style={S.input} value={form.montant}
              onChange={e => setForm({ ...form, montant: e.target.value })} />
          </div>
          <div>
            <label style={S.label}>Mois</label>
            <select style={S.input} value={form.mois} onChange={e => setForm({ ...form, mois: e.target.value })}>
              <option value="">—</option>
              {MOIS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Moyen de paiement *</label>
            <select style={S.input} value={form.mode_paiement} onChange={e => setForm({ ...form, mode_paiement: e.target.value })}>
              <option value="">Sélectionner</option>
              {MODES_REMBOURSEMENT.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Date</label>
            <input type="date" style={S.input} value={form.date_avoir} onChange={e => setForm({ ...form, date_avoir: e.target.value })} />
          </div>
          <div>
            <label style={S.label}>Motif *</label>
            <input style={S.input} value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Ex. : Remboursement du trop-perçu" />
          </div>
        </div>
        <BoutonsFormulaire onCancel={onCancel} enCours={enCours} libelle="Créer l'avoir" />
      </form>
    </Fenetre>
  );
}

export function AvoirsOnglet({ entreprise, clients }) {
  const [credits, setCredits] = useState([]);
  const [avoirs, setAvoirs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modal, setModal] = useState(null); // { clientInitial }
  const [envoiId, setEnvoiId] = useState(null); // ligne dont le mail est en cours d'envoi

  async function charger() {
    try {
      const [c, a] = await Promise.all([avoirService.credits(entreprise.id), avoirService.getAll(entreprise.id)]);
      setCredits(c.data.data || []);
      setAvoirs(a.data.data || []);
    } catch (err) {
      toast.error(message(err, 'Erreur lors du chargement des avoirs.'));
    } finally {
      setChargement(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, []);

  async function creer(form) {
    try {
      const res = await avoirService.creer({ ...form, entreprise_id: entreprise.id });
      toast.success(res.data.message);
      setModal(null);
      charger();
    } catch (err) { toast.error(message(err, 'Erreur création avoir.')); }
  }

  async function envoyer(a) {
    if (envoiId) return;
    setEnvoiId(a.id);
    try {
      const res = await avoirService.envoyer(a.id);
      toast.success(res.data.message);
    } catch (err) { toast.error(message(err, 'Envoi impossible.')); }
    finally { setEnvoiId(null); }
  }

  if (chargement) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modal && (
        <FormulaireAvoir clients={clients} entreprise_id={entreprise.id} clientInitial={modal.clientInitial}
          onSave={creer} onCancel={() => setModal(null)} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>↩️ Avoirs</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            Un avoir rembourse tout ou partie du trop-perçu d'un client. Sans remboursement, le crédit reste déduit de ses prochaines factures.
          </p>
        </div>
        <button style={S.bouton} onClick={() => setModal({})}>+ Nouvel avoir</button>
      </div>

      <h3 style={{ color: '#004d5a', fontSize: '15px' }}>Clients ayant un trop-perçu</h3>
      <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Client', 'Trop-perçu', 'Date', 'Facture associée', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {credits.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: '#888' }}>Aucun client n'a de trop-perçu.</td></tr>}
            {credits.map(c => (
              <tr key={c.client_id}>
                <td style={{ ...S.td, fontWeight: 'bold' }}>{c.nom_client}</td>
                <td style={{ ...S.td, color: '#2e7d32', whiteSpace: 'nowrap' }}>{fr(c.credit)} Ar</td>
                <td style={S.td}>{dateFr(c.date)}</td>
                <td style={S.td}>{c.numero_facture || '—'}</td>
                <td style={S.td}><button style={S.petit} onClick={() => setModal({ clientInitial: c.client_id })}>↩️ Rembourser</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ color: '#004d5a', fontSize: '15px' }}>Avoirs émis</h3>
      <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['N°', 'Date', 'Client', 'Facture associée', 'Motif', 'Moyen', 'Montant', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {avoirs.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: '#888' }}>Aucun avoir émis.</td></tr>}
            {avoirs.map(a => (
              <tr key={a.id}>
                <td style={{ ...S.td, fontWeight: 'bold' }}>{a.numero_avoir}</td>
                <td style={S.td}>{dateFr(a.date_avoir)}</td>
                <td style={S.td}>{a.nom_client}</td>
                <td style={S.td}>{a.numero_facture || '—'}</td>
                <td style={S.td}>{a.motif}</td>
                <td style={S.td}>{a.mode_paiement}</td>
                <td style={{ ...S.td, textAlign: 'right', whiteSpace: 'nowrap' }}>{fr(a.montant)} Ar</td>
                <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                  <button style={S.petit} title="Visualiser l'avoir" onClick={() => ouvrirPdf('AVOIR', a.id)}>👁️</button>
                  <button disabled={!!envoiId} title={envoiId === a.id ? 'Envoi en cours...' : 'Envoyer par e-mail'} onClick={() => envoyer(a)}
                      style={{ ...S.petit, ...(envoiId ? { opacity: 0.4, cursor: 'not-allowed', background: '#eee' } : {}) }}>{envoiId === a.id ? '⏳' : '📧'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────── Pages autonomes (onglets de la page Clients : « Proforma » et « Avoirs ») ─────────────

// Charge les clients (classés de A à Z) et le régime de TVA de l'entreprise connectée.
function useDonneesEntreprise() {
  const { entreprise } = useAuth();
  const [clients, setClients] = useState([]);
  const [tva, setTva] = useState({ assujettie: false, taux: 20 });
  const [pret, setPret] = useState(false);
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const [c, e] = await Promise.all([clientService.getAll(entreprise.id), entrepriseService.getDetail(entreprise.id)]);
        if (!actif) return;
        setClients(trierClients(c.data.data || []));
        setTva({ assujettie: e.data?.assujettie_tva === true, taux: Number(e.data?.taux_tva) || 20 });
      } catch (err) {
        toast.error('Erreur lors du chargement des clients.');
      } finally {
        if (actif) setPret(true);
      }
    })();
    return () => { actif = false; };
  }, [entreprise.id]);
  return { entreprise, clients, tva, pret };
}

export function ProformasPage() {
  const { entreprise, clients, tva, pret } = useDonneesEntreprise();
  if (!pret) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;
  return <ProformasOnglet entreprise={entreprise} clients={clients} tva={tva} />;
}

export function AvoirsPage() {
  const { entreprise, clients, pret } = useDonneesEntreprise();
  if (!pret) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;
  return <AvoirsOnglet entreprise={entreprise} clients={clients} />;
}
