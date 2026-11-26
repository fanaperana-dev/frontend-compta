import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { repartirParMois } from '../../utils/repartitionConges';
import { joursCalendaires, nomPieceJointe } from '../../utils/absencesJustifiees';
const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const styles = {
  bouton: { background: 'white', color: '#004d5a', border: '2px solid #004d5a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  boutonRouge: { background: 'white', color: '#c62828', border: '2px solid #c62828', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  input: { width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px' },
  card: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' },
  th: { padding: '8px', background: '#004d5a', color: 'white', fontSize: '12px', textAlign: 'left', whiteSpace: 'nowrap' },
  td: { padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px', whiteSpace: 'nowrap' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', borderRadius: '12px', padding: '30px', width: '95vw', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }
};

const aujourdhui = () => new Date().toISOString().split('T')[0];
const fmtNb = n => (Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const fmtDate = d => (d ? new Date(d).toLocaleDateString('fr-FR') : '');
const TAILLE_MAX = 10 * 1024 * 1024;

const lireFichier = fichier => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror = () => reject(new Error('Lecture du fichier impossible.'));
  r.readAsDataURL(fichier);
});

function Formulaire({ salaries, initiale, onSave, onCancel }) {
  const [form, setForm] = useState(initiale
    ? { salarie_id: initiale.salarie_id, date_debut: String(initiale.date_debut).slice(0, 10), date_fin: String(initiale.date_fin).slice(0, 10), nb_jours: initiale.nb_jours, motif: initiale.motif || '' }
    : { salarie_id: '', date_debut: aujourdhui(), date_fin: aujourdhui(), nb_jours: 1, motif: '' });
  const [fichier, setFichier] = useState(null);
  const [enCours, setEnCours] = useState(false);

  function majDates(champ, valeur) {
    const f = { ...form, [champ]: valeur };
    if (champ === 'date_debut' && f.date_fin < valeur) f.date_fin = valeur;
    f.nb_jours = joursCalendaires(f.date_debut, f.date_fin);
    setForm(f);
  }

  const jours = Number(form.nb_jours) || 0;
  const repartition = repartirParMois(form.date_debut, form.date_fin, jours);
  const salarie = salaries.find(s => s.id === form.salarie_id);

  async function soumettre(e) {
    e.preventDefault();
    if (!form.salarie_id) return toast.error('Choisis un salarié.');
    if (!(jours > 0)) return toast.error('Le nombre de jours doit être supérieur à 0.');
    if (fichier && fichier.size > TAILLE_MAX) return toast.error('Fichier trop lourd (10 Mo maximum).');
    setEnCours(true);
    await onSave({ ...form, nb_jours: jours }, fichier);
    setEnCours(false);
  }

  return (
    <div style={styles.modal}>
      <form style={styles.modalContent} onSubmit={soumettre}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>{initiale ? 'Modifier l\'absence justifiée' : 'Absence justifiée'}</h3>

        <label style={styles.label}>Salarié *</label>
        <select style={styles.input} value={form.salarie_id} disabled={!!initiale}
          onChange={e => setForm({ ...form, salarie_id: e.target.value })}>
          <option value="">— Choisir —</option>
          {salaries.map(s => (
            <option key={s.id} value={s.id}>{s.matricule} – {s.nom} {s.prenom || ''}{s.est_cadre ? ' (cadre)' : ''}</option>
          ))}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '14px' }}>
          <div>
            <label style={styles.label}>Du *</label>
            <input style={styles.input} type="date" value={form.date_debut} onChange={e => majDates('date_debut', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Au *</label>
            <input style={styles.input} type="date" value={form.date_fin} min={form.date_debut} onChange={e => majDates('date_fin', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Nb de jours *</label>
            <input style={styles.input} type="number" step="0.5" min="0.5" value={form.nb_jours}
              onChange={e => setForm({ ...form, nb_jours: e.target.value })} />
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#888' }}>
          Chaque jour compte, samedi et dimanche inclus (2 jours pour un week-end). Le nombre de jours reste modifiable (ex. demi-journée : 0,5).
          Une absence à cheval sur deux mois est répartie : chaque mois reçoit ses jours dans sa fiche de paie.
        </span>

        {repartition.length > 1 && (
          <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', fontSize: '13px', color: '#5d4037' }}>
            Cette absence touche {repartition.length} mois :{' '}
            {repartition.map(p => `${fmtNb(p.nb_jours)} j en ${p.mois.toLowerCase()} ${p.annee}`).join(' · ')}.
          </div>
        )}

        <label style={{ ...styles.label, marginTop: '14px' }}>Motif</label>
        <input style={styles.input} value={form.motif} maxLength={200}
          onChange={e => setForm({ ...form, motif: e.target.value })} />

        {!initiale && (
          <>
            <label style={{ ...styles.label, marginTop: '14px' }}>Pièce jointe (facultatif)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFichier(e.target.files?.[0] || null)} />
            {fichier && salarie && (
              <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '6px' }}>
                Sera enregistrée sous : {nomPieceJointe(salarie.nom, salarie.prenom, form.date_debut, fichier.name)}
              </div>
            )}
          </>
        )}

        <p style={{ fontSize: '12px', color: '#2e7d32', margin: '14px 0 0' }}>
          Ces jours seront repris dans la fiche de paie du mois (ligne « Absence justifiée »). Aucune retenue sur le salaire : ils sont payés
          au taux journalier. Ils ne sont déduits ni du solde de congé ni des jours de congé.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
          <button type="button" style={styles.bouton} onClick={onCancel}>Annuler</button>
          <button type="submit" disabled={enCours} style={{ ...styles.bouton, background: '#004d5a', color: 'white' }}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OngletAbsencesJustifiees() {
  const { entreprise } = useAuth();
  const [absences, setAbsences] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { absence } ou {} pour une création
  const [recherche, setRecherche] = useState('');
  const [annee, setAnnee] = useState('');

  const entete = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => { charger(); }, []);

  async function charger() {
    try {
      const [rA, rS] = await Promise.all([
        fetch(`${API_URL}/api/absences-justifiees/${entreprise.id}`, { headers: entete() }),
        fetch(`${API_URL}/api/rh/salaries/${entreprise.id}`, { headers: entete() })
      ]);
      const [dA, dS] = await Promise.all([rA.json(), rS.json()]);
      if (!dA.success) throw new Error(dA.message);
      setAbsences(dA.data || []);
      setSalaries((dS.data || []).filter(s => s.actif !== false && s.statut_emploi !== 'SORTI'));
    } catch (err) {
      toast.error(err.message || 'Erreur chargement des absences.');
    } finally {
      setLoading(false);
    }
  }

  async function appeler(url, methode, corps) {
    const res = await fetch(`${API_URL}${url}`, { method: methode, headers: entete(), body: corps ? JSON.stringify(corps) : undefined });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data;
  }

  async function enregistrer(form, fichier) {
    try {
      const piece = fichier ? { fichier_base64: await lireFichier(fichier), nom_fichier: fichier.name, type_mime: fichier.type } : {};
      const data = modal?.absence
        ? await appeler(`/api/absences-justifiees/${modal.absence.id}`, 'PUT', form)
        : await appeler('/api/absences-justifiees', 'POST', { ...form, ...piece, entreprise_id: entreprise.id });
      toast.success(data.message);
      setModal(null);
      charger();
    } catch (err) {
      toast.error(err.message || 'Erreur enregistrement.');
    }
  }

  async function ajouterPiece(absence, fichier) {
    if (!fichier) return;
    if (fichier.size > TAILLE_MAX) return toast.error('Fichier trop lourd (10 Mo maximum).');
    try {
      const data = await appeler(`/api/absences-justifiees/${absence.id}/piece-jointe`, 'POST',
        { fichier_base64: await lireFichier(fichier), nom_fichier: fichier.name, type_mime: fichier.type });
      toast.success(data.message);
      charger();
    } catch (err) {
      toast.error(err.message || 'Erreur pièce jointe.');
    }
  }

  async function supprimer(absence) {
    if (!window.confirm('Supprimer cette absence justifiée ?')) return;
    try {
      const data = await appeler(`/api/absences-justifiees/${absence.id}`, 'DELETE');
      toast.success(data.message);
      charger();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const annees = useMemo(() => [...new Set(absences.map(a => String(a.date_debut).slice(0, 4)))].sort().reverse(), [absences]);
  const lignes = absences.filter(a => {
    const r = recherche.trim().toLowerCase();
    return (!annee || String(a.date_debut).startsWith(annee))
      && (!r || `${a.matricule} ${a.nom_salarie} ${a.prenom_salarie} ${a.motif}`.toLowerCase().includes(r));
  });

  if (loading) return <p style={{ padding: '20px' }}>Chargement…</p>;

  return (
    <div>
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
          <h3 style={{ color: '#004d5a', margin: 0, flex: 1 }}>Absences justifiées</h3>
          <input style={{ ...styles.input, width: '240px', padding: '7px 10px' }} placeholder="🔍 Rechercher (nom, matricule, motif)"
            value={recherche} onChange={e => setRecherche(e.target.value)} />
          <select style={{ ...styles.input, width: '120px', padding: '7px' }} value={annee} onChange={e => setAnnee(e.target.value)}>
            <option value="">Toutes</option>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button style={{ ...styles.bouton, background: '#004d5a', color: 'white' }} onClick={() => setModal({})}>
            + Absence justifiée
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>
          Repos maladie, enterrement, mariage, congé de paternité… Une absence justifiée n'est pas retenue sur le salaire : ces jours sont payés
          au taux journalier (comme un jour travaillé) et apparaissent sur leur propre ligne de la fiche de paie. Ce n'est ni un congé ni une absence
          injustifiée : ils ne sont déduits ni du solde de congé ni des jours de congé.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Matricule', 'Salarié', 'Du', 'Au', 'Jours', 'Motif', 'Pièce jointe', ''].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {lignes.length === 0 && (
                <tr><td style={{ ...styles.td, textAlign: 'center', color: '#888' }} colSpan={8}>Aucune absence justifiée.</td></tr>
              )}
              {lignes.map(a => (
                <tr key={a.id}>
                  <td style={styles.td}>{a.matricule}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{[a.nom_salarie, a.prenom_salarie].filter(Boolean).join(' ')}</td>
                  <td style={styles.td}>{fmtDate(a.date_debut)}</td>
                  <td style={styles.td}>{fmtDate(a.date_fin)}</td>
                  <td style={styles.td}>
                    {fmtNb(a.nb_jours)}
                    {(a.repartition || []).length > 1 && (
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {a.repartition.map(p => `${fmtNb(p.nb_jours)} j ${p.mois.slice(0, 4).toLowerCase()}.`).join(' + ')}
                      </div>
                    )}
                  </td>
                  <td style={{ ...styles.td, whiteSpace: 'normal' }}>{a.motif || ''}</td>
                  <td style={styles.td}>
                    {a.piece_jointe_url ? (
                      <a href={a.piece_jointe_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1565c0' }}>
                        📎 {a.piece_jointe_nom || 'Voir'}
                      </a>
                    ) : <span style={{ color: '#bbb' }}>—</span>}
                    {' '}
                    <label style={{ ...styles.bouton, padding: '2px 8px', display: 'inline-block' }}>
                      {a.piece_jointe_url ? 'Remplacer' : '+ Ajouter'}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                        onChange={e => { ajouterPiece(a, e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.bouton} onClick={() => setModal({ absence: a })}>✏️</button>{' '}
                    <button style={styles.boutonRouge} onClick={() => supprimer(a)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Formulaire salaries={salaries} initiale={modal.absence} onSave={enregistrer} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}
