import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const styles = {
  bouton: {
    background: 'white', color: '#004d5a', border: '2px solid #004d5a',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
  },
  boutonVert: {
    background: 'white', color: '#2e7d32', border: '2px solid #2e7d32',
    padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
  },
  boutonRouge: {
    background: 'white', color: '#c62828', border: '2px solid #c62828',
    padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
  },
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  },
  filtre: {
    width: '100%', padding: '4px 6px', border: '1px solid #ccc',
    borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box'
  },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px' },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  },
  th: {
    padding: '8px', background: '#004d5a', color: 'white', fontSize: '12px',
    textAlign: 'left', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none'
  },
  td: { padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px', whiteSpace: 'nowrap' },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalContent: {
    background: 'white', borderRadius: '12px', padding: '30px',
    width: '95vw', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const moisListe = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet',
  'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const moisCourts = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
const STATUTS = {
  EN_ATTENTE: { label: 'En attente', couleur: '#e65100' },
  VALIDEE: { label: 'Validée', couleur: '#2e7d32' },
  REFUSEE: { label: 'Refusée', couleur: '#c62828' }
};

const aujourdhui = () => new Date().toISOString().split('T')[0];
const fmtNb = n => (Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const fmtDate = d => (d ? new Date(d).toLocaleDateString('fr-FR') : '');

// Jours ouvrables (lundi–samedi) entre deux dates incluses : valeur proposée, modifiable
function joursOuvrables(debut, fin) {
  if (!debut || !fin) return 0;
  const d = new Date(debut); const f = new Date(fin);
  if (f < d) return 0;
  let n = 0;
  for (const c = new Date(d); c <= f; c.setDate(c.getDate() + 1)) if (c.getDay() !== 0) n++;
  return n;
}

// Filtre d'une colonne : texte (contient) ou, pour les nombres, ">2", "<1", ">=0,5", "=0"
function correspond(valeur, saisie) {
  const t = String(saisie || '').trim().toLowerCase().replace(',', '.');
  if (!t) return true;
  const m = /^(>=|<=|>|<|=)\s*(-?\d+(?:\.\d+)?)$/.exec(t);
  if (m && typeof valeur === 'number') {
    const v = valeur; const x = Number(m[2]);
    return { '>': v > x, '<': v < x, '>=': v >= x, '<=': v <= x, '=': v === x }[m[1]];
  }
  return String(valeur).toLowerCase().replace(',', '.').includes(t);
}

function FormulaireDemande({ salaries, onSave, onCancel, entete, entrepriseId }) {
  const [form, setForm] = useState({
    salarie_id: '', date_debut: aujourdhui(), date_fin: aujourdhui(), nb_jours: 1, motif: '', statut: 'VALIDEE'
  });
  const [solde, setSolde] = useState(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!form.salarie_id || !form.date_debut) { setSolde(null); return undefined; }
    let actif = true;
    fetch(`${API_URL}/api/conges/solde/${entrepriseId}/${form.salarie_id}?date_debut=${form.date_debut}`,
      { headers: entete() })
      .then(r => r.json())
      .then(d => { if (actif && d.success) setSolde(d.data); })
      .catch(() => {});
    return () => { actif = false; };
  }, [form.salarie_id, form.date_debut]);

  function majDates(champ, valeur) {
    const f = { ...form, [champ]: valeur };
    if (champ === 'date_debut' && f.date_fin < valeur) f.date_fin = valeur;
    f.nb_jours = joursOuvrables(f.date_debut, f.date_fin);
    setForm(f);
  }

  const jours = Number(form.nb_jours) || 0;
  const reste = solde ? Math.round((solde.solde - jours) * 100) / 100 : null;

  async function soumettre(e) {
    e.preventDefault();
    if (!form.salarie_id) return toast.error('Choisis un salarié.');
    if (!(jours > 0)) return toast.error('Le nombre de jours doit être supérieur à 0.');
    if (reste !== null && reste < 0 && form.statut === 'VALIDEE' &&
      !window.confirm(`Le solde sera négatif (${fmtNb(reste)} j). Valider quand même ?`)) return;
    setEnCours(true);
    await onSave({ ...form, nb_jours: jours });
    setEnCours(false);
  }

  return (
    <div style={styles.modal}>
      <form style={styles.modalContent} onSubmit={soumettre}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>Demande de congé</h3>

        <label style={styles.label}>Salarié *</label>
        <select style={styles.input} value={form.salarie_id}
          onChange={e => setForm({ ...form, salarie_id: e.target.value })}>
          <option value="">— Choisir —</option>
          {salaries.map(s => (
            <option key={s.id} value={s.id}>{s.matricule} – {s.nom} {s.prenom || ''}{s.est_cadre ? ' (cadre)' : ''}</option>
          ))}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '14px' }}>
          <div>
            <label style={styles.label}>Du *</label>
            <input style={styles.input} type="date" value={form.date_debut}
              onChange={e => majDates('date_debut', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Au *</label>
            <input style={styles.input} type="date" value={form.date_fin} min={form.date_debut}
              onChange={e => majDates('date_fin', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Nb de jours *</label>
            <input style={styles.input} type="number" step="0.5" min="0.5" value={form.nb_jours}
              onChange={e => setForm({ ...form, nb_jours: e.target.value })} />
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#888' }}>
          Calculé en jours ouvrables (lundi–samedi), modifiable (ex. demi-journée : 0,5).
          Les jours sont rattachés au mois de la date de début.
        </span>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px',
          background: '#f4f9fa', borderRadius: '8px', padding: '14px', textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Solde congé{solde ? ` (fin ${solde.mois})` : ''}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#004d5a' }}>{solde ? `${fmtNb(solde.solde)} j` : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Jours demandés</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#004d5a' }}>{fmtNb(jours)} j</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Reste après déduction</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: reste !== null && reste < 0 ? '#c62828' : '#2e7d32' }}>
              {reste !== null ? `${fmtNb(reste)} j` : '—'}
            </div>
          </div>
        </div>

        <label style={{ ...styles.label, marginTop: '14px' }}>Motif (facultatif)</label>
        <input style={styles.input} value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} />

        <label style={{ ...styles.label, marginTop: '14px' }}>Décision</label>
        <div style={{ display: 'flex', gap: '18px', fontSize: '13px' }}>
          {Object.entries(STATUTS).map(([k, v]) => (
            <label key={k} style={{ cursor: 'pointer' }}>
              <input type="radio" name="statut" checked={form.statut === k}
                onChange={() => setForm({ ...form, statut: k })} /> {v.label}
            </label>
          ))}
        </div>
        {form.statut === 'VALIDEE' && (
          <p style={{ fontSize: '12px', color: '#2e7d32', margin: '8px 0 0' }}>
            Validée : ces jours seront repris automatiquement dans la fiche de paie du mois.
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
          <button type="button" style={styles.bouton} onClick={onCancel}>Annuler</button>
          <button type="submit" disabled={enCours}
            style={{ ...styles.bouton, background: '#004d5a', color: 'white' }}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OngletConges() {
  const { entreprise } = useAuth();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [tableau, setTableau] = useState({ lignes: [], mois_courant: '' });
  const [demandes, setDemandes] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtres, setFiltres] = useState({});
  const [tri, setTri] = useState({ col: 'matricule', sens: 1 });
  const [filtreStatut, setFiltreStatut] = useState('');

  const entete = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => { charger(); }, [annee]);

  async function charger() {
    try {
      const [rT, rD, rS] = await Promise.all([
        fetch(`${API_URL}/api/conges/tableau/${entreprise.id}?annee=${annee}`, { headers: entete() }),
        fetch(`${API_URL}/api/conges/demandes/${entreprise.id}`, { headers: entete() }),
        fetch(`${API_URL}/api/rh/salaries/${entreprise.id}`, { headers: entete() })
      ]);
      const [dT, dD, dS] = await Promise.all([rT.json(), rD.json(), rS.json()]);
      if (!dT.success) throw new Error(dT.message);
      setTableau(dT.data);
      setDemandes(dD.data || []);
      setSalaries((dS.data || []).filter(s => s.actif !== false && s.statut_emploi !== 'SORTI'));
    } catch (err) {
      toast.error(err.message || 'Erreur chargement des congés.');
    } finally {
      setLoading(false);
    }
  }

  async function creerDemande(form) {
    try {
      const res = await fetch(`${API_URL}/api/conges/demandes`, {
        method: 'POST', headers: entete(), body: JSON.stringify({ ...form, entreprise_id: entreprise.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      setModalForm(false);
      charger();
    } catch (err) {
      toast.error(err.message || 'Erreur enregistrement.');
    }
  }

  async function decider(demande, statut) {
    try {
      const res = await fetch(`${API_URL}/api/conges/demandes/${demande.id}/decision`, {
        method: 'PATCH', headers: entete(), body: JSON.stringify({ statut })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      charger();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function supprimer(demande) {
    if (!window.confirm('Supprimer cette demande ?')) return;
    try {
      const res = await fetch(`${API_URL}/api/conges/demandes/${demande.id}`, { method: 'DELETE', headers: entete() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      charger();
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Colonnes du tableau
  const colonnes = useMemo(() => ([
    { key: 'matricule', label: 'Matricule', val: l => l.matricule || '' },
    { key: 'nom', label: 'Nom', val: l => l.nom || '' },
    { key: 'prenom', label: 'Prénom', val: l => l.prenom || '' },
    { key: 'solde', label: `Solde fin ${(tableau.mois_courant || '').toLowerCase()}`, val: l => l.solde_fin_mois },
    ...moisListe.map((m, i) => ({ key: m, label: moisCourts[i], val: l => l.pris[m] || 0 }))
  ]), [tableau.mois_courant]);

  const lignes = useMemo(() => {
    const col = colonnes.find(c => c.key === tri.col) || colonnes[0];
    const r = recherche.trim().toLowerCase();
    return tableau.lignes
      .filter(l => !r || `${l.matricule} ${l.nom} ${l.prenom}`.toLowerCase().includes(r))
      .filter(l => colonnes.every(c => correspond(c.val(l), filtres[c.key])))
      .sort((a, b) => {
        const x = col.val(a); const y = col.val(b);
        return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'fr', { numeric: true })) * tri.sens;
      });
  }, [tableau.lignes, colonnes, recherche, filtres, tri]);

  const demandesFiltrees = demandes.filter(d => !filtreStatut || d.statut === filtreStatut);
  const nomSalarie = id => {
    const l = tableau.lignes.find(x => x.salarie_id === id);
    return l ? `${l.nom} ${l.prenom}` : '—';
  };

  if (loading) return <p style={{ padding: '20px' }}>Chargement…</p>;

  return (
    <div>
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
          <h3 style={{ color: '#004d5a', margin: 0, flex: 1 }}>Soldes et congés pris</h3>
          <input style={{ ...styles.input, width: '240px', padding: '7px 10px' }} placeholder="🔍 Rechercher (nom, prénom, matricule)"
            value={recherche} onChange={e => setRecherche(e.target.value)} />
          <select style={{ ...styles.input, width: '100px', padding: '7px' }} value={annee}
            onChange={e => setAnnee(Number(e.target.value))}>
            {[0, 1, 2, 3].map(i => { const a = new Date().getFullYear() - i; return <option key={a} value={a}>{a}</option>; })}
          </select>
          <button style={{ ...styles.bouton, background: '#004d5a', color: 'white' }} onClick={() => setModalForm(true)}>
            + Demande de congé
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {colonnes.map(c => (
                  <th key={c.key} style={styles.th}
                    onClick={() => setTri(t => ({ col: c.key, sens: t.col === c.key ? -t.sens : 1 }))}>
                    {c.label}{tri.col === c.key ? (tri.sens === 1 ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
              <tr>
                {colonnes.map(c => (
                  <th key={c.key} style={{ padding: '4px', background: '#e8f1f3' }}>
                    <input style={styles.filtre} placeholder={['solde', ...moisListe].includes(c.key) ? '>0' : 'filtrer'}
                      value={filtres[c.key] || ''} onChange={e => setFiltres({ ...filtres, [c.key]: e.target.value })} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 && (
                <tr><td style={{ ...styles.td, textAlign: 'center', color: '#888' }} colSpan={colonnes.length}>Aucun salarié.</td></tr>
              )}
              {lignes.map(l => (
                <tr key={l.salarie_id}>
                  <td style={styles.td}>{l.matricule}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{l.nom}</td>
                  <td style={styles.td}>{l.prenom}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: l.solde_fin_mois < 0 ? '#c62828' : '#004d5a' }}>
                    {fmtNb(l.solde_fin_mois)} j
                  </td>
                  {moisListe.map(m => (
                    <td key={m} style={{ ...styles.td, color: l.pris[m] ? '#222' : '#bbb' }}>{l.pris[m] ? fmtNb(l.pris[m]) : '–'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '11px', color: '#888', marginBottom: 0 }}>
          Solde = congés cumulés à la fin du mois en cours (2,5 j acquis par mois inclus). Filtres numériques : &gt;0, &lt;2, =0…
        </p>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ color: '#004d5a', margin: 0, flex: 1 }}>Demandes de congé</h3>
          <select style={{ ...styles.input, width: '160px', padding: '7px' }} value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Salarié', 'Du', 'Au', 'Jours', 'Solde avant', 'Reste', 'Motif', 'Statut', ''].map(h => (
                  <th key={h} style={{ ...styles.th, cursor: 'default' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demandesFiltrees.length === 0 && (
                <tr><td style={{ ...styles.td, textAlign: 'center', color: '#888' }} colSpan={9}>Aucune demande.</td></tr>
              )}
              {demandesFiltrees.map(d => (
                <tr key={d.id}>
                  <td style={styles.td}>{nomSalarie(d.salarie_id)}</td>
                  <td style={styles.td}>{fmtDate(d.date_debut)}</td>
                  <td style={styles.td}>{fmtDate(d.date_fin)}</td>
                  <td style={styles.td}>{fmtNb(d.nb_jours)}</td>
                  <td style={styles.td}>{fmtNb(d.solde_avant)}</td>
                  <td style={styles.td}>{fmtNb(d.solde_apres)}</td>
                  <td style={{ ...styles.td, whiteSpace: 'normal' }}>{d.motif || ''}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: STATUTS[d.statut]?.couleur }}>{STATUTS[d.statut]?.label}</td>
                  <td style={styles.td}>
                    {d.statut !== 'VALIDEE' && <button style={styles.boutonVert} onClick={() => decider(d, 'VALIDEE')}>Valider</button>}{' '}
                    {d.statut !== 'REFUSEE' && <button style={styles.boutonRouge} onClick={() => decider(d, 'REFUSEE')}>Refuser</button>}{' '}
                    {d.statut === 'VALIDEE' && <button style={styles.bouton} onClick={() => decider(d, 'EN_ATTENTE')}>Annuler</button>}
                    {d.statut !== 'VALIDEE' && <button style={styles.bouton} onClick={() => supprimer(d)}>🗑</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalForm && (
        <FormulaireDemande salaries={salaries} entete={entete} entrepriseId={entreprise.id}
          onSave={creerDemande} onCancel={() => setModalForm(false)} />
      )}
    </div>
  );
}
