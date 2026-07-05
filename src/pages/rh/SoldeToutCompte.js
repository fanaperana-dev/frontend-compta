import React, { useState, useEffect } from 'react';
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
  input: {
    width: '100%', padding: '10px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
  },
  label: {
    display: 'block', marginBottom: '5px', fontWeight: 'bold',
    color: '#333', fontSize: '13px'
  },
  card: {
    background: 'white', borderRadius: '10px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px'
  }
};

export default function SoldeToutCompte() {
  const { entreprise } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    salarie_id: '',
    date_sortie: new Date().toISOString().split('T')[0],
    motif_sortie: '',
    nb_jours_travailles_dernier_mois: 0,
    nb_jours_conges_non_pris: 0,
    nb_jours_preavis: 0,
    indemnite_licenciement_taux: 0,
    indemnite_licenciement_jours: 0,
    autres_retenues: 0
  });

  useEffect(() => { chargerSalaries(); }, []);

  async function chargerSalaries() {
    try {
      const res = await fetch(
        `${API_URL}/api/rh/salaries/${entreprise.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      // Afficher seulement les salariés SORTI ou EN_POSTE
      setSalaries((data.data || []).filter(s =>
        s.statut_emploi === 'SORTI' || s.statut_emploi === 'EN_POSTE'
      ));
    } catch (err) {
      toast.error('Erreur chargement salariés.');
    }
  }

  async function calculerSTC() {
    if (!form.salarie_id) {
      toast.error('Sélectionnez un salarié.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('${API_URL}/api/rh/stc/calculer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...form, entreprise_id: entreprise.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResultat(data.data);
      toast.success('Calcul effectué !');
    } catch (err) {
      toast.error(err.message || 'Erreur calcul.');
    } finally {
      setLoading(false);
    }
  }

  function exporterExcel() {
    if (!resultat) return;
    const XLSX = require('xlsx');
    const donnees = [{
      'Salarié': resultat.salarie,
      'Matricule': resultat.matricule,
      'Date sortie': resultat.date_sortie,
      'Motif': resultat.motif_sortie,
      'Salaire prorata': resultat.salaire_prorata,
      'ICCP': resultat.iccp,
      'Taux journalier congé': resultat.taux_journalier_conge,
      'Indemnité préavis': resultat.indemnite_preavis,
      'Indemnité licenciement': resultat.indemnite_licenciement,
      'Salaire brut STC': resultat.salaire_brut_stc,
      'CNAPS': resultat.cnaps,
      'OSTIE': resultat.ostie,
      'FMFP': resultat.fmfp,
      'IRSA': resultat.irsa,
      'Autres retenues': resultat.autres_retenues,
      'NET STC': resultat.net_stc
    }];
    const ws = XLSX.utils.json_to_sheet(donnees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'STC');
    XLSX.writeFile(wb, `STC_${resultat.matricule}_${resultat.date_sortie}.xlsx`);
    toast.success('Export Excel téléchargé !');
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#004d5a' }}>🚪 Solde tout compte</h2>
        {resultat && (
          <button style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
            onClick={exporterExcel}>📊 Excel</button>
        )}
      </div>

      <div style={styles.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Salarié *</label>
            <select style={styles.input} value={form.salarie_id}
              onChange={e => setForm({ ...form, salarie_id: e.target.value })}>
              <option value="">Sélectionner un salarié</option>
              {salaries.map(s => (
                <option key={s.id} value={s.id}>
                  {s.matricule} — {s.nom} ({s.statut_emploi})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Date de sortie</label>
            <input style={styles.input} type="date" value={form.date_sortie}
              onChange={e => setForm({ ...form, date_sortie: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Motif de sortie</label>
            <select style={styles.input} value={form.motif_sortie}
              onChange={e => setForm({ ...form, motif_sortie: e.target.value })}>
              <option value="">Sélectionner</option>
              <option value="Démission">Démission</option>
              <option value="Licenciement">Licenciement</option>
              <option value="Fin de CDD">Fin de CDD</option>
              <option value="Retraite">Retraite</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Jours travaillés (dernier mois)</label>
            <input style={styles.input} type="number" step="0.5"
              value={form.nb_jours_travailles_dernier_mois}
              onChange={e => setForm({ ...form, nb_jours_travailles_dernier_mois: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Jours de congés non pris</label>
            <p style={{ fontSize: '11px', color: '#666', margin: '-5px 0 5px 0' }}>
              ℹ️ Taux calculé sur moyenne des 12 derniers salaires bruts
            </p>
            <input style={styles.input} type="number" step="0.5"
              value={form.nb_jours_conges_non_pris}
              onChange={e => setForm({ ...form, nb_jours_conges_non_pris: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Jours de préavis</label>
            <p style={{ fontSize: '11px', color: '#666', margin: '-5px 0 5px 0' }}>
              ℹ️ Taux calculé sur moyenne des 2 derniers salaires bruts
            </p>
            <input style={styles.input} type="number" step="0.5"
              value={form.nb_jours_preavis}
              onChange={e => setForm({ ...form, nb_jours_preavis: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Indemnité licenciement — Taux (Ar/jour)</label>
            <p style={{ fontSize: '11px', color: '#666', margin: '-5px 0 5px 0' }}>
              ℹ️ Selon catégorie et ancienneté
            </p>
            <input style={styles.input} type="number"
              value={form.indemnite_licenciement_taux}
              onChange={e => setForm({ ...form, indemnite_licenciement_taux: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Indemnité licenciement — Nb jours</label>
            <input style={styles.input} type="number"
              value={form.indemnite_licenciement_jours}
              onChange={e => setForm({ ...form, indemnite_licenciement_jours: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Autres retenues (Ar)</label>
            <input style={styles.input} type="number"
              value={form.autres_retenues}
              onChange={e => setForm({ ...form, autres_retenues: Number(e.target.value) })} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonPrimaire} onClick={calculerSTC} disabled={loading}>
            {loading ? 'Calcul en cours...' : '🧮 Calculer le STC'}
          </button>
        </div>
      </div>

      {/* Résultats */}
      {resultat && (
        <div style={styles.card}>
          <h3 style={{ color: '#004d5a', marginTop: 0 }}>
            📊 Résultat STC — {resultat.salarie} ({resultat.matricule})
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px' }}>Rubrique</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>Montant (Ar)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Salaire prorata dernier mois', val: resultat.salaire_prorata, type: 'gain' },
                { label: `ICCP (taux journalier : ${Number(resultat.taux_journalier_conge).toLocaleString('fr-FR')} Ar)`, val: resultat.iccp, type: 'gain' },
                { label: `Indemnité préavis (taux : ${Number(resultat.taux_journalier_preavis).toLocaleString('fr-FR')} Ar/jour)`, val: resultat.indemnite_preavis, type: 'gain' },
                { label: 'Indemnité de licenciement', val: resultat.indemnite_licenciement, type: 'gain' },
              ].filter(r => r.val > 0).map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{r.label}</td>
                  <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', color: '#2e7d32', fontWeight: 'bold' }}>
                    {Number(r.val).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}

              <tr style={{ background: '#e8f5e9' }}>
                <td style={{ padding: '10px', fontSize: '14px', fontWeight: 'bold' }}>SALAIRE BRUT STC</td>
                <td style={{ padding: '10px', fontSize: '14px', fontWeight: 'bold', textAlign: 'right', color: '#2e7d32' }}>
                  {Number(resultat.salaire_brut_stc).toLocaleString('fr-FR')}
                </td>
              </tr>

              {[
                { label: 'CNAPS salarial (1%)', val: resultat.cnaps, type: 'retenue' },
                { label: 'OSTIE salarial (1%)', val: resultat.ostie, type: 'retenue' },
                { label: 'FMFP salarial (1%)', val: resultat.fmfp, type: 'retenue' },
                { label: 'IRSA', val: resultat.irsa, type: 'retenue' },
                { label: 'Autres retenues', val: resultat.autres_retenues, type: 'retenue' },
              ].filter(r => r.val > 0).map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{r.label}</td>
                  <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', color: '#c62828' }}>
                    -{Number(r.val).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#004d5a', color: 'white' }}>
                <td style={{ padding: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                  NET À PAYER (STC)
                </td>
                <td style={{ padding: '12px', fontSize: '15px', fontWeight: 'bold', textAlign: 'right' }}>
                  {Number(resultat.net_stc).toLocaleString('fr-FR')} Ar
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}