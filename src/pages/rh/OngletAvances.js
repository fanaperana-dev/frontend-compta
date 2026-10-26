import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const styles = {
  boutonPrimaire: {
    background: '#004d5a', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 'bold'
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
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px' },
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
    width: '95vw', maxWidth: '650px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const modesPaiement = ['Espèces', 'Virement bancaire', 'Chèque', 'Mobile money'];
const TYPES = {
  AVANCE_SALAIRE: 'Avance sur salaire',
  AVANCE_EXCEPTIONNELLE: 'Avance exceptionnelle'
};
const moisListe = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet',
  'Août','Septembre','Octobre','Novembre','Décembre'];

const fmt = n => Number(n || 0).toLocaleString('fr-FR');
const aujourdhui = () => new Date().toISOString().split('T')[0];

function moisParDefaut(type, date) {
  const d = new Date(date || aujourdhui());
  let annee = d.getFullYear(); let mois = d.getMonth();
  if (type === 'AVANCE_EXCEPTIONNELLE') { mois += 1; if (mois > 11) { mois = 0; annee += 1; } }
  return `${annee}-${String(mois + 1).padStart(2, '0')}`;
}
function libelleMois(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '');
  return m ? `${moisListe[Number(m[2]) - 1]} ${m[1]}` : '—';
}

function FormulaireAvance({ salaries, onSave, onCancel }) {
  const [enCours, setEnCours] = useState(false);
  const [form, setForm] = useState({
    salarie_id: '',
    type_avance: 'AVANCE_SALAIRE',
    date_avance: aujourdhui(),
    montant: '',
    nb_mois_remboursement: 1,
    mois_debut_remboursement: moisParDefaut('AVANCE_SALAIRE', aujourdhui()),
    mode_paiement: 'Espèces',
    motif: ''
  });

  const salarie = salaries.find(s => s.id === form.salarie_id);
  const estSalaire = form.type_avance === 'AVANCE_SALAIRE';
  const plafond = salarie ? Math.round(Number(salarie.salaire_base || 0) * 0.5 * 100) / 100 : 0;
  const nbMois = estSalaire ? 1 : Math.max(1, parseInt(form.nb_mois_remboursement, 10) || 1);
  const montant = Number(form.montant) || 0;
  const mensualite = montant > 0 ? Math.round(montant / nbMois * 100) / 100 : 0;
  const depassePlafond = estSalaire && salarie && montant > plafond;

  function changerType(type) {
    setForm({
      ...form, type_avance: type,
      nb_mois_remboursement: type === 'AVANCE_SALAIRE' ? 1 : Math.max(2, Number(form.nb_mois_remboursement) || 2),
      mois_debut_remboursement: moisParDefaut(type, form.date_avance)
    });
  }

  function changerSalarie(id) {
    const s = salaries.find(x => x.id === id);
    setForm({ ...form, salarie_id: id, mode_paiement: s?.mode_paiement || form.mode_paiement });
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>💸 Nouvelle avance</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Type d'avance *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {Object.entries(TYPES).map(([val, lab]) => (
                <button key={val} type="button" onClick={() => changerType(val)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                    border: '2px solid #004d5a',
                    background: form.type_avance === val ? '#004d5a' : 'white',
                    color: form.type_avance === val ? 'white' : '#004d5a'
                  }}>{lab}</button>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
              {estSalaire
                ? 'Demandée en cours de mois, jusqu\'à 50 % du salaire de base, remboursée sur la paie du mois.'
                : 'Montant et durée de remboursement fixés entre le salarié et l\'entreprise.'}
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Salarié *</label>
            <select style={styles.input} value={form.salarie_id} onChange={e => changerSalarie(e.target.value)}>
              <option value="">Sélectionner un salarié</option>
              {salaries.filter(s => s.actif && s.statut_emploi !== 'SORTI').map(s => (
                <option key={s.id} value={s.id}>{s.matricule} — {s.nom} {s.prenom || ''}</option>
              ))}
            </select>
            {salarie && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                Salaire de base : <strong>{fmt(salarie.salaire_base)} Ar</strong>
                {estSalaire && <> — plafond de l'avance : <strong>{fmt(plafond)} Ar</strong></>}
              </div>
            )}
          </div>

          <div>
            <label style={styles.label}>Date de versement *</label>
            <input style={styles.input} type="date" value={form.date_avance}
              onChange={e => setForm({
                ...form, date_avance: e.target.value,
                mois_debut_remboursement: moisParDefaut(form.type_avance, e.target.value)
              })} />
          </div>
          <div>
            <label style={styles.label}>Montant (Ar) *</label>
            <input style={{ ...styles.input, borderColor: depassePlafond ? '#c62828' : '#e0e0e0' }}
              type="number" min="0" value={form.montant}
              onChange={e => setForm({ ...form, montant: e.target.value })} />
            {depassePlafond && (
              <div style={{ fontSize: '12px', color: '#c62828', marginTop: '4px' }}>
                Dépasse 50 % du salaire ({fmt(plafond)} Ar).
              </div>
            )}
          </div>

          {!estSalaire && (
            <div>
              <label style={styles.label}>Nombre de mois de remboursement *</label>
              <input style={styles.input} type="number" min="1" step="1" value={form.nb_mois_remboursement}
                onChange={e => setForm({ ...form, nb_mois_remboursement: e.target.value })} />
            </div>
          )}
          <div>
            <label style={styles.label}>Début des retenues</label>
            <input style={styles.input} type="month" value={form.mois_debut_remboursement}
              onChange={e => setForm({ ...form, mois_debut_remboursement: e.target.value })} />
          </div>

          <div>
            <label style={styles.label}>Mode de paiement</label>
            <select style={styles.input} value={form.mode_paiement}
              onChange={e => setForm({ ...form, mode_paiement: e.target.value })}>
              {modesPaiement.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Motif</label>
            <input style={styles.input} value={form.motif} placeholder="Facultatif"
              onChange={e => setForm({ ...form, motif: e.target.value })} />
          </div>

          <div style={{
            gridColumn: 'span 2', background: '#e8f5e9', borderRadius: '8px',
            padding: '12px', fontSize: '13px', color: '#2e7d32'
          }}>
            {montant > 0
              ? <>Remboursement : <strong>{fmt(mensualite)} Ar</strong> par mois pendant <strong>{nbMois}</strong> mois
                  {' '}(à partir de {libelleMois(form.mois_debut_remboursement)}).</>
              : 'Saisis un montant pour voir la mensualité.'}
            <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
              Une avance n'est pas imposable (ni IRSA, ni cotisations).
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours}
            onClick={async () => {
              if (!form.salarie_id) return toast.error('Sélectionne un salarié.');
              if (!(montant > 0)) return toast.error('Saisis un montant.');
              if (depassePlafond) return toast.error('Le montant dépasse 50 % du salaire.');
              setEnCours(true);
              const ok = await onSave({ ...form, montant, nb_mois_remboursement: nbMois });
              if (!ok) setEnCours(false);
            }}>
            {enCours ? '⏳ Enregistrement...' : 'Enregistrer l\'avance'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalRemboursement({ avance, onSave, onCancel }) {
  const [montant, setMontant] = useState(Math.min(Number(avance.montant_mensuel), Number(avance.solde)));
  const [enCours, setEnCours] = useState(false);
  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, maxWidth: '450px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>💶 Enregistrer un remboursement</h3>
        <p style={{ fontSize: '13px', color: '#555' }}>
          {avance.numero} — solde restant : <strong>{fmt(avance.solde)} Ar</strong>
        </p>
        <label style={styles.label}>Montant retenu (Ar)</label>
        <input style={styles.input} type="number" min="0" value={montant}
          onChange={e => setMontant(e.target.value)} />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
          Mensualité prévue : {fmt(avance.montant_mensuel)} Ar
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }} disabled={enCours}
            onClick={async () => {
              if (!(Number(montant) > 0)) return toast.error('Montant invalide.');
              setEnCours(true);
              const ok = await onSave(avance, Number(montant));
              if (!ok) setEnCours(false);
            }}>
            {enCours ? '⏳...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OngletAvances() {
  const { entreprise } = useAuth();
  const [avances, setAvances] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [avanceRemb, setAvanceRemb] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [filtreSalarie, setFiltreSalarie] = useState('');

  const entete = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => { charger(); }, []);

  async function charger() {
    try {
      const [rA, rS] = await Promise.all([
        fetch(`${API_URL}/api/avances/${entreprise.id}`, { headers: entete() }),
        fetch(`${API_URL}/api/rh/salaries/${entreprise.id}`, { headers: entete() })
      ]);
      const dA = await rA.json();
      const dS = await rS.json();
      if (!dA.success) throw new Error(dA.message);
      setAvances(dA.data || []);
      setSalaries(dS.data || []);
    } catch (err) {
      toast.error(err.message || 'Erreur chargement des avances.');
    } finally {
      setLoading(false);
    }
  }

  async function creerAvance(form) {
    try {
      const res = await fetch(`${API_URL}/api/avances`, {
        method: 'POST', headers: entete(),
        body: JSON.stringify({ ...form, entreprise_id: entreprise.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      setModalForm(false);
      charger();
      return true;
    } catch (err) {
      toast.error(err.message || 'Erreur création.');
      return false;
    }
  }

  async function enregistrerRemboursement(avance, montant) {
    try {
      const res = await fetch(`${API_URL}/api/avances/${avance.id}/remboursement`, {
        method: 'POST', headers: entete(), body: JSON.stringify({ montant })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      setAvanceRemb(null);
      charger();
      return true;
    } catch (err) {
      toast.error(err.message || 'Erreur remboursement.');
      return false;
    }
  }

  async function annulerAvance(avance) {
    if (!window.confirm(`Annuler l'avance ${avance.numero} ?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/avances/${avance.id}/annuler`, {
        method: 'PATCH', headers: entete()
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      charger();
    } catch (err) {
      toast.error(err.message || 'Erreur annulation.');
    }
  }

  // Ouvre un onglet tout de suite (sinon le navigateur bloque le popup après l'attente du PDF)
  async function visualiser(avance) {
    const onglet = window.open('', '_blank');
    if (onglet) onglet.document.write('<p style="font-family:Arial;padding:20px">Chargement du document...</p>');
    try {
      const res = await fetch(`${API_URL}/api/avances/${avance.id}/pdf`, { method: 'POST', headers: entete() });
      if (!res.ok) {
        let msg = 'Erreur génération du document.';
        try { msg = (await res.json()).message || msg; } catch (e) { /* pas de JSON */ }
        throw new Error(msg);
      }
      const url = URL.createObjectURL(await res.blob());
      if (onglet) onglet.location.href = url;
      else toast.warn('Autorise les popups pour ouvrir le document.');
    } catch (err) {
      if (onglet) onglet.close();
      toast.error(err.message);
    }
  }

  // Télécharge le document : Nom_Prenom_Avance_N°.pdf
  async function telecharger(avance) {
    try {
      const res = await fetch(`${API_URL}/api/avances/${avance.id}/pdf`, { method: 'POST', headers: entete() });
      if (!res.ok) {
        let msg = 'Erreur génération du document.';
        try { msg = (await res.json()).message || msg; } catch (e) { /* pas de JSON */ }
        throw new Error(msg);
      }
      const url = URL.createObjectURL(await res.blob());
      const propre = t => String(t || '').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
      const nom = [avance.salaries?.nom, avance.salaries?.prenom,
        avance.type_avance === 'AVANCE_SALAIRE' ? 'Avance_sur_salaire' : 'Avance_exceptionnelle', avance.numero]
        .map(propre).filter(Boolean).join('_') + '.pdf';
      const a = document.createElement('a');
      a.href = url; a.download = nom;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast.error(err.message);
    }
  }

  const avancesFiltrees = useMemo(() => avances.filter(a =>
    (!filtreStatut || a.statut === filtreStatut) &&
    (!filtreType || a.type_avance === filtreType) &&
    (!filtreSalarie || a.salarie_id === filtreSalarie)
  ), [avances, filtreStatut, filtreType, filtreSalarie]);

  const enCours = avances.filter(a => a.statut === 'EN_COURS');
  const totalSolde = enCours.reduce((s, a) => s + Number(a.solde), 0);
  const totalAvance = avances.filter(a => a.statut !== 'ANNULEE').reduce((s, a) => s + Number(a.montant), 0);

  const couleurStatut = {
    EN_COURS: { bg: '#fff3e0', color: '#e65100', label: '⏳ En cours' },
    REMBOURSEE: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Remboursée' },
    ANNULEE: { bg: '#ffebee', color: '#c62828', label: '❌ Annulée' }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modalForm && (
        <FormulaireAvance salaries={salaries} onSave={creerAvance} onCancel={() => setModalForm(false)} />
      )}
      {avanceRemb && (
        <ModalRemboursement avance={avanceRemb} onSave={enregistrerRemboursement}
          onCancel={() => setAvanceRemb(null)} />
      )}

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { label: 'Avances en cours', val: enCours.length, couleur: '#004d5a' },
          { label: 'Total avancé', val: `${fmt(totalAvance)} Ar`, couleur: '#1565c0' },
          { label: 'Reste à rembourser', val: `${fmt(totalSolde)} Ar`, couleur: '#e65100' }
        ].map(k => (
          <div key={k.label} style={{ ...styles.card, marginBottom: 0, flex: '1 1 200px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>{k.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: k.couleur }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{ ...styles.card, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={styles.label}>Salarié</label>
          <select style={{ ...styles.input, width: '220px' }} value={filtreSalarie}
            onChange={e => setFiltreSalarie(e.target.value)}>
            <option value="">Tous</option>
            {salaries.map(s => <option key={s.id} value={s.id}>{s.matricule} — {s.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={styles.label}>Type</label>
          <select style={{ ...styles.input, width: '200px' }} value={filtreType}
            onChange={e => setFiltreType(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={styles.label}>Statut</label>
          <select style={{ ...styles.input, width: '160px' }} value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(couleurStatut).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button style={styles.boutonPrimaire} onClick={() => setModalForm(true)}>➕ Nouvelle avance</button>
        </div>
      </div>

      <div style={styles.card}>
        {avancesFiltrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Aucune avance trouvée.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['N°', 'Date', 'Salarié', 'Type', 'Montant', 'Mensualité', 'Durée', 'Remboursé', 'Solde', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '13px',
                      color: '#555', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {avancesFiltrees.map((a, i) => {
                  const st = couleurStatut[a.statut] || { bg: '#f5f5f5', color: '#666', label: a.statut };
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a', whiteSpace: 'nowrap' }}>{a.numero}</td>
                      <td style={{ padding: '10px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {a.date_avance ? new Date(a.date_avance).toLocaleDateString('fr-FR') : ''}
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px' }}>
                        {a.salaries?.nom} {a.salaries?.prenom || ''}
                        <div style={{ fontSize: '11px', color: '#888' }}>{a.salaries?.matricule}</div>
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px' }}>{TYPES[a.type_avance] || a.type_avance}</td>
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{fmt(a.montant)} Ar</td>
                      <td style={{ padding: '10px', fontSize: '13px', whiteSpace: 'nowrap' }}>{fmt(a.montant_mensuel)} Ar</td>
                      <td style={{ padding: '10px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {a.nb_mois_remboursement} mois
                        <div style={{ fontSize: '11px', color: '#888' }}>dès {libelleMois(a.mois_debut_remboursement)}</div>
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px', color: '#2e7d32', whiteSpace: 'nowrap' }}>{fmt(a.montant_rembourse)} Ar</td>
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#e65100', whiteSpace: 'nowrap' }}>{fmt(a.solde)} Ar</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                          fontWeight: 'bold', background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                            onClick={() => visualiser(a)} title="Voir le document">👁️</button>
                          <button style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                            onClick={() => telecharger(a)} title="Télécharger le document">⬇️</button>
                          {a.statut === 'EN_COURS' && (
                            <button style={{ ...styles.boutonSecondaire, padding: '4px 8px', color: '#2e7d32', borderColor: '#2e7d32' }}
                              onClick={() => setAvanceRemb(a)} title="Enregistrer un remboursement">💶</button>
                          )}
                          {a.statut === 'EN_COURS' && Number(a.montant_rembourse) === 0 && (
                            <button style={{ ...styles.boutonDanger, padding: '4px 8px' }}
                              onClick={() => annulerAvance(a)} title="Annuler l'avance">❌</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
