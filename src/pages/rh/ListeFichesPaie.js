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
  boutonDanger: {
    background: 'white', color: '#c62828', border: '2px solid #c62828',
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
  },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalContent: {
    background: 'white', borderRadius: '12px', padding: '30px',
    width: '95vw', maxWidth: '1200px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const moisListe = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const modesPaiement = ['Virement bancaire','Espèces','Chèque','Mobile money'];;


// Composant création en masse
function FormulaireMasse({ salaries, onSave, onCancel }) {
  const anneeActuelle = new Date().getFullYear();
  const moisActuel = moisListe[new Date().getMonth()];
  const [enCours, setEnCours] = useState(false);
  const [config, setConfig] = useState({
    mois: moisActuel,
    annee: anneeActuelle,
    date_paiement: new Date().toISOString().split('T')[0],
    
  });

  const [lignes, setLignes] = useState(
    salaries.filter(s => s.actif && s.statut_emploi !== 'SORTI').map(s => ({
      salarie_id: s.id,
      matricule: s.matricule,
      nom: s.nom,
      type_contrat: s.type_contrat,
      salaire_base: s.salaire_base,
      nb_jours_mois: s.nb_jours_mois || 30,
      nb_jours_travailles: s.nb_jours_mois || 30,
      nb_jours_conge: 0,
      nb_jours_absence: 0,
      nb_jours_panier_repas: 0,
      nb_jours_transport: 0,
      nb_heures_sup_130: 0,
      nb_heures_sup_150: 0,
      nb_heures_ferie: 0,
      autre_indemnite: 0,
      prime: 0,
      prime_exceptionnelle: 0,
      acompte: 0,
      retenue: 0,
      avance_sur_salaire: 0
    }))
  );

  function modifierLigne(index, champ, valeur) {
    const nouvLignes = [...lignes];
    nouvLignes[index][champ] = Number(valeur) || 0;
    setLignes(nouvLignes);
  }

  const colonnesNormales = [
    { key: 'nb_jours_travailles', label: 'Jours trav.' },
    { key: 'nb_jours_conge', label: 'Congés' },
    { key: 'nb_jours_absence', label: 'Absences' },
    { key: 'nb_jours_panier_repas', label: 'Panier (j)' },
    { key: 'nb_jours_transport', label: 'Transport (j)' },
    { key: 'nb_heures_sup_130', label: 'H.sup 130%' },
    { key: 'nb_heures_sup_150', label: 'H.sup 150%' },
    { key: 'nb_heures_ferie', label: 'H.férié (50%)' },
    { key: 'autre_indemnite', label: 'Autre ind.' },
    { key: 'prime', label: 'Prime' },
    { key: 'prime_exceptionnelle', label: 'Prime excep.' },
    { key: 'acompte', label: 'Acompte' },
    { key: 'retenue', label: 'Retenue' },
    { key: 'avance_sur_salaire', label: 'Avance sal.' }
  ];

  const colonnesStage = [
    { key: 'nb_jours_travailles', label: 'Jours trav.' },
    { key: 'nb_jours_panier_repas', label: 'Panier (j)' },
    { key: 'nb_jours_transport', label: 'Transport (j)' },
    { key: 'autre_indemnite', label: 'Autre ind.' },
    { key: 'retenue', label: 'Retenue' },
    { key: 'acompte', label: 'Acompte' }
  ];

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          📋 Créer fiches de paie en masse
        </h3>

        {/* Config */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={styles.label}>Mois *</label>
            <select style={styles.input} value={config.mois}
              onChange={e => setConfig({ ...config, mois: e.target.value })}>
              {moisListe.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Année *</label>
            <input style={styles.input} type="number" value={config.annee}
              onChange={e => setConfig({ ...config, annee: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Date de paiement</label>
            <input style={styles.input} type="date" value={config.date_paiement}
              onChange={e => setConfig({ ...config, date_paiement: e.target.value })} />
          </div>
          
        </div>

        {/* Tableau variables */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#004d5a', color: 'white' }}>
                <th style={{
                  padding: '8px', textAlign: 'left', minWidth: '80px',
                  position: 'sticky', left: 0, background: '#004d5a', zIndex: 2
                }}>Matricule</th>
                <th style={{
                  padding: '8px', textAlign: 'left', minWidth: '150px',
                  position: 'sticky', left: '80px', background: '#004d5a', zIndex: 2
                }}>Nom</th>
                <th style={{ padding: '8px', textAlign: 'left', minWidth: '80px' }}>Contrat</th>
                <th style={{ padding: '8px', textAlign: 'right', minWidth: '100px' }}>Sal. base</th>
                {colonnesNormales.map(c => (
                  <th key={c.key} style={{ padding: '8px', textAlign: 'center', minWidth: '80px' }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne, i) => {
                const estStage = ligne.type_contrat === 'STAGE';
                const colonnes = estStage ? colonnesStage : colonnesNormales;
                const bgRow = i % 2 === 0 ? 'white' : '#f9f9f9';
                return (
                 <tr key={ligne.salarie_id} style={{
                   background: bgRow,
                   borderBottom: '1px solid #e0e0e0'
                  }}>
                  <td style={{
                   padding: '6px', fontWeight: 'bold', color: '#004d5a',
                   position: 'sticky', left: 0, background: bgRow, zIndex: 1,
                   minWidth: '80px', borderRight: '1px solid #e0e0e0'
                  }}>
                   {ligne.matricule}
                  </td>
                  <td style={{
                   padding: '6px',
                   position: 'sticky', left: '80px', background: bgRow, zIndex: 1,
                   minWidth: '150px', borderRight: '1px solid #e0e0e0'
                  }}>
                  {ligne.nom}
                  </td>
                  <td style={{ padding: '6px', width: '55px', minWidth: '55px' }}>
                   <span style={{
                     padding: '2px 4px', borderRadius: '8px', fontSize: '10px',
                     background: estStage ? '#e3f2fd' : '#e8f5e9',
                     color: estStage ? '#1565c0' : '#2e7d32'
                }}>
                     {ligne.type_contrat}
                   </span>
                  </td>
                  <td style={{ padding: '6px', textAlign: 'right', minWidth: '90px' }}>
                   {Number(ligne.salaire_base).toLocaleString('fr-FR')}
                  </td>
                   {colonnesNormales.map(c => {
                     const colonneActive = colonnes.find(col => col.key === c.key);
                     return (
                       <td key={c.key} style={{ padding: '4px' }}>
                        {colonneActive ? (
                         <input
                           type="number"
                           step="0.5"
                           value={ligne[c.key]}
                           onChange={e => modifierLigne(i, c.key, e.target.value)}
                           style={{
                             width: '70px', padding: '4px 6px',
                             border: '1px solid #e0e0e0', borderRadius: '4px',
                             fontSize: '12px', textAlign: 'center'
                           }}
                         />
                       ) : (
                         <span style={{ color: '#ccc', fontSize: '11px', display: 'block', textAlign: 'center' }}>
                           —
                         </span>
                       )}
                     </td>
                   );
                 })}

                 </tr>
             );
  })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire}
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours}
            onClick={async () => {
              setEnCours(true);
              await onSave(config, lignes);
              setEnCours(false);
            }}>
            
            {enCours ? '⏳ Génération en cours...' : '🚀 Générer les fiches de paie'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant création fiche unique
function FormulaireUnique({ salaries, onSave, onCancel }) {
  const anneeActuelle = new Date().getFullYear();
  const [enCours, setEnCours] = useState(false);
  const [form, setForm] = useState({
    salarie_id: '',
    mois: moisListe[new Date().getMonth()],
    annee: anneeActuelle,
    date_paiement: new Date().toISOString().split('T')[0],
    nb_jours_travailles: 0,
    nb_jours_conge: 0,
    nb_jours_absence: 0,
    nb_jours_panier_repas: 0,
    nb_jours_transport: 0,
    nb_heures_sup_130: 0,
    nb_heures_sup_150: 0,
    nb_heures_ferie: 0,
    autre_indemnite: 0,
    prime: 0,
    prime_exceptionnelle: 0,
    acompte: 0,
    retenue: 0,
    avance_sur_salaire: 0,
    regulation_positive: 0,
    regulation_negative: 0,
    indemnite_logement: 0,
    indemnite_carburant: 0,
    indemnite_ecolage: 0,
    indemnite_telephone: 0,
    indemnite_autre: 0,
    avantage_nature_logement: 0,
    avantage_nature_vehicule: 0,
    avantage_nature_autre: 0,
    solde_conge_precedent: 0
  });

  const salarieSelectionne = salaries.find(s => s.id === form.salarie_id);
  const estStage = salarieSelectionne?.type_contrat === 'STAGE';

  function handleSalarieChange(e) {
    const s = salaries.find(sal => sal.id === e.target.value);
    setForm({
      ...form,
      salarie_id: e.target.value,
      nb_jours_travailles: s?.nb_jours_mois || 30
    });
  }

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, maxWidth: '700px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>📝 Nouvelle fiche de paie</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {/* Salarié */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Salarié *</label>
            <select style={styles.input} value={form.salarie_id} onChange={handleSalarieChange}>
              <option value="">Sélectionner un salarié</option>
              {salaries.filter(s => s.actif && s.statut_emploi !== 'SORTI').map(s => (
                <option key={s.id} value={s.id}>
                  {s.matricule} — {s.nom} ({s.type_contrat})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Mois *</label>
            <select style={styles.input} value={form.mois}
              onChange={e => setForm({ ...form, mois: e.target.value })}>
              {moisListe.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Année *</label>
            <input style={styles.input} type="number" value={form.annee}
              onChange={e => setForm({ ...form, annee: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Date de paiement</label>
            <input style={styles.input} type="date" value={form.date_paiement}
              onChange={e => setForm({ ...form, date_paiement: e.target.value })} />
          </div>
        

          {/* Variables communes */}
          <div>
            <label style={styles.label}>Jours travaillés</label>
            <input style={styles.input} type="number" step="0.5" value={form.nb_jours_travailles}
              onChange={e => setForm({ ...form, nb_jours_travailles: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Jours d'absence</label>
            <input style={styles.input} type="number" step="0.5" value={form.nb_jours_absence}
              onChange={e => setForm({ ...form, nb_jours_absence: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Panier repas (nb jours)</label>
            <input style={styles.input} type="number" step="0.5" value={form.nb_jours_panier_repas}
              onChange={e => setForm({ ...form, nb_jours_panier_repas: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Transport (nb jours)</label>
            <input style={styles.input} type="number" step="0.5" value={form.nb_jours_transport}
              onChange={e => setForm({ ...form, nb_jours_transport: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Autre indemnité (Ar)</label>
            <input style={styles.input} type="number" value={form.autre_indemnite}
              onChange={e => setForm({ ...form, autre_indemnite: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Acompte (Ar)</label>
            <input style={styles.input} type="number" value={form.acompte}
              onChange={e => setForm({ ...form, acompte: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Retenue (Ar)</label>
            <input style={styles.input} type="number" value={form.retenue}
              onChange={e => setForm({ ...form, retenue: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Avance sur salaire (Ar)</label>
            <input style={styles.input} type="number" value={form.avance_sur_salaire}
              onChange={e => setForm({ ...form, avance_sur_salaire: Number(e.target.value) })} />
          </div>

          {/* Variables non-stage */}
          {!estStage && (
            <>
              <div>
                <label style={styles.label}>Solde congé précédent (jours)</label>
                <input style={styles.input} type="number" step="0.5" value={form.solde_conge_precedent}
                  onChange={e => setForm({ ...form, solde_conge_precedent: Number(e.target.value) })} />
                <span style={{ fontSize: '11px', color: '#666' }}>
                  Laisser à 0 si l'historique existe déjà sur la plateforme
                </span>
              </div>
              <div>
                <label style={styles.label}>Congés payés (nb jours)</label>
                <input style={styles.input} type="number" step="0.5" value={form.nb_jours_conge}
                  onChange={e => setForm({ ...form, nb_jours_conge: Number(e.target.value) })} />
              </div>
              <div>
                <label style={styles.label}>H.sup 130% (nb heures)</label>
                <input style={styles.input} type="number" step="0.5" value={form.nb_heures_sup_130}
                  onChange={e => setForm({ ...form, nb_heures_sup_130: Number(e.target.value) })} />
              </div>
              <div>
                <label style={styles.label}>H.sup 150% (nb heures)</label>
                <input style={styles.input} type="number" step="0.5" value={form.nb_heures_sup_150}
                  onChange={e => setForm({ ...form, nb_heures_sup_150: Number(e.target.value) })} />
              </div>
              <div>
                <label style={styles.label}>H.férié travaillé (nb heures)</label>
                <input style={styles.input} type="number" step="0.5" value={form.nb_heures_ferie}
                  onChange={e => setForm({ ...form, nb_heures_ferie: Number(e.target.value) })} />
              </div>
              <div>
                <label style={styles.label}>Prime (Ar)</label>
                <input style={styles.input} type="number" value={form.prime}
                  onChange={e => setForm({ ...form, prime: Number(e.target.value) })} />
              </div>
              <div>
                <label style={styles.label}>Prime exceptionnelle (Ar)</label>
                <input style={styles.input} type="number" value={form.prime_exceptionnelle}
                  onChange={e => setForm({ ...form, prime_exceptionnelle: Number(e.target.value) })} />
              </div>
              <div>
                <label style={styles.label}>Régulation positive (Ar)</label>
                <input style={styles.input} type="number" value={form.regulation_positive}
                  onChange={e => setForm({ ...form, regulation_positive: Number(e.target.value) })} />
              </div>
              <div>
                <label style={styles.label}>Régulation négative (Ar)</label>
                <input style={styles.input} type="number" value={form.regulation_negative}
                  onChange={e => setForm({ ...form, regulation_negative: Number(e.target.value) })} />
              </div>

              {/* Avantages cadres */}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ background: '#e3f2fd', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
                  <strong style={{ color: '#1565c0' }}>💼 Indemnités cadres</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    {[
                      { key: 'indemnite_logement', label: 'Indemnité logement (Ar)' },
                      { key: 'indemnite_carburant', label: 'Indemnité carburant (Ar)' },
                      { key: 'indemnite_ecolage', label: 'Indemnité écolage (Ar)' },
                      { key: 'indemnite_telephone', label: 'Indemnité téléphone (Ar)' },
                      { key: 'indemnite_autre', label: 'Autre indemnité cadre (Ar)' }
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ ...styles.label, fontSize: '12px' }}>{f.label}</label>
                        <input style={{ ...styles.input, padding: '6px' }} type="number"
                          value={form[f.key]}
                          onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '12px' }}>
                  <strong style={{ color: '#e65100' }}>🏠 Avantages en nature</strong>
                  <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 10px 0' }}>
                    Ces montants sont inclus dans le brut mais soustraits du net (fournis en nature, pas en argent)
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { key: 'avantage_nature_logement', label: 'Logement (Ar)' },
                      { key: 'avantage_nature_vehicule', label: 'Véhicule (Ar)' },
                      { key: 'avantage_nature_autre', label: 'Autre (Ar)' }
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ ...styles.label, fontSize: '12px' }}>{f.label}</label>
                        <input style={{ ...styles.input, padding: '6px' }} type="number"
                          value={form[f.key]}
                          onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button 
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours}
            onClick={async () => {
             setEnCours(true);
             await onSave(form);
             setEnCours(false);
            }}
          >
            {enCours ? '⏳ Création en cours...' : 'Créer la fiche de paie'}
          </button>
        </div>
      </div>
    </div>
  );
}
function ModalPaiementFiche({ fiches, onSave, onCancel }) {
  const [enCours, setEnCours] = useState(false);
  const [form, setForm] = useState({
    type_paiement: '421 - Personnel - rémunérations dues',
    date_paiement: new Date().toISOString().split('T')[0]
  });
  const [fichierJustificatif, setFichierJustificatif] = useState(null);
  const estUnique = fiches.length === 1; // ← vérifier si une seule fiche

  const typesPaiement = [
    '421 - Personnel - rémunérations dues',
    '425 - Personnel - avances et acomptes accordés',
    '422 - Personnel - œuvres sociales',
    '426 - Personnel - dépôts reçus',
    '427 - Personnel - opposition',
    '428 - Personnel - charges à payer et produits à recevoir'
  ];

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '500px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          💰 Marquer comme payée — {fiches.length} fiche(s)
        </h3>

        <div style={{
          background: '#e3f2fd', borderRadius: '8px',
          padding: '10px', marginBottom: '15px', fontSize: '13px'
        }}>
          ℹ️ Cette action va marquer les fiches comme payées,
          générer les PDF avec tampon, envoyer les mails aux salariés
          et écrire les opérations dans le journal.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Type de paiement (compte comptable)</label>
            <select style={styles.input} value={form.type_paiement}
              onChange={e => setForm({ ...form, type_paiement: e.target.value })}>
              {typesPaiement.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Date de paiement</label>
            <input style={styles.input} type="date"
              value={form.date_paiement}
              onChange={e => setForm({ ...form, date_paiement: e.target.value })} />
          </div>
        </div>

        {/* Liste des fiches concernées */}
        <div style={{ marginTop: '15px' }}>
          <label style={styles.label}>Fiches concernées :</label>
          <div style={{ maxHeight: '150px', overflowY: 'auto',
            border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px' }}>
            {fiches.map(f => (
              <div key={f.id} style={{
                padding: '4px 0', fontSize: '12px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                {f.matricule} — {f.nom_salarie} — {f.mois} {f.annee}
              </div>
            ))}
          </div>
        </div>
        {/* PJ seulement pour paiement unique */}
        {estUnique && (
        <div>
          <label style={styles.label}>📎 Justificatif de paiement (optionnel)</label>
          <input style={styles.input} type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setFichierJustificatif(e.target.files[0])} />
          {fichierJustificatif && (
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
              {fichierJustificatif.name}
            </p>
          )}
        </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours}
            onClick={async () => {
              setEnCours(true);
              await onSave(form, estUnique ? fichierJustificatif : null);
              setEnCours(false);
            }}
            >
            {enCours ? '⏳ Traitement en cours...' : '✅ Confirmer le paiement'}
  
          </button>
        </div>
      </div>
    </div>
  );
}
function ModalAjouterPJFiche({ fiche, onClose, onUpload }) {
  const [fichier, setFichier] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '450px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          📎 Ajouter justificatif — {fiche.matricule} {fiche.mois} {fiche.annee}
        </h3>
        <div>
          <label style={styles.label}>Sélectionner un fichier (PDF ou image)</label>
          <input style={styles.input} type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setFichier(e.target.files[0])} />
          {fichier && (
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
              {fichier.name}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onClose}>Annuler</button>
          <button style={styles.boutonPrimaire}
            disabled={!fichier || loading}
            onClick={async () => {
              setLoading(true);
              await onUpload(fichier);
              setLoading(false);
            }}>
            {loading ? 'Upload...' : '📤 Uploader'}
          </button>
        </div>
      </div>
    </div>
  );
}
// Page principale
export default function ListeFichesPaie() {
  const { entreprise } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreMois, setFiltreMois] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState(new Date().getFullYear());
  const [selection, setSelection] = useState([]);
  const [modalOuvert, setModalOuvert] = useState(null);
  const [ficheSelectionnee, setFicheSelectionnee] = useState(null);
  const [modalPaiement, setModalPaiement] = useState(false);
  const [fichierJustificatif, setFichierJustificatif] = useState(null);
  const [modalAjouterPJ, setModalAjouterPJ] = useState(false);

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [fichesRes, salariesRes] = await Promise.all([
        fetch(`${API_URL}/api/rh/fiches-paie/${entreprise.id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch(`${API_URL}/api/rh/salaries/${entreprise.id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      const fichesData = await fichesRes.json();
      const salariesData = await salariesRes.json();
      setFiches(fichesData.data || []);
      setSalaries(salariesData.data || []);
    } catch (err) {
      toast.error('Erreur chargement.');
    } finally {
      setLoading(false);
    }
  }

  async function creerFicheUnique(form) {
    try {
      const res = await fetch(`${API_URL}/api/rh/fiches-paie`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...form, entreprise_id: entreprise.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Fiche de paie créée !');
      setModalOuvert(null);
      chargerDonnees();
    } catch (err) {
      toast.error(err.message || 'Erreur création.');
    }
  }

  async function creerFichesMasse(config, lignes) {
    try {
      const res = await fetch(`${API_URL}/api/rh/fiches-paie/masse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entreprise_id: entreprise.id,
          mois: config.mois,
          annee: config.annee,
          date_paiement: config.date_paiement,
          mode_paiement: config.mode_paiement,
          fiches: lignes
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const r = data.resultats;
      toast.success(`${r.creees?.length || 0} fiche(s) créée(s) !`);
      if (r.ignorees?.length > 0) toast.info(`${r.ignorees.length} ignorée(s) (déjà existantes).`);
      if (r.erreurs?.length > 0) toast.error(`${r.erreurs.length} erreur(s).`);
      setModalOuvert(null);
      chargerDonnees();
    } catch (err) {
      toast.error(err.message || 'Erreur création en masse.');
    }
  }

  async function payerFichesSelectionnees(form, fichierJustificatif) {
  try {
    const fichesAPayer = ficheSelectionnee && !selection.includes(ficheSelectionnee.id)
      ? [ficheSelectionnee]
      : fiches.filter(f => selection.includes(f.id));

    let nb = 0;
    const erreurs = [];

    for (const fiche of fichesAPayer) {
      try {
        const res = await fetch(
          `${API_URL}/api/rh/fiches-paie/${fiche.id}/statut`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              statut: 'PAYEE',
              sous_categorie_journal: form.type_paiement,
              date_paiement: form.date_paiement
            })
          }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        // Upload justificatif seulement pour fiche unique
        if (fichierJustificatif) {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(fichierJustificatif);
          });

          await fetch(
            `${API_URL}/api/rh/fiches-paie/${fiche.id}/upload-justificatif`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                fichier_base64: base64,
                nom_fichier: fichierJustificatif.name,
                type_mime: fichierJustificatif.type
              })
            }
          );
        }

        nb++;
      } catch (err) {
        erreurs.push(`${fiche.matricule}: ${err.message}`);
      }
    }

    toast.success(`${nb} fiche(s) marquée(s) comme payée(s) !`);
    if (erreurs.length > 0) toast.error(`${erreurs.length} erreur(s).`);
    setModalPaiement(false);
    setFicheSelectionnee(null);
    setSelection([]);
    chargerDonnees();
  } catch (err) {
    toast.error('Erreur paiement.');
  }
}
  async function changerStatutFiche(fiche, statut) {
    if (statut === 'PAYEE') {
    // Ouvrir le modal questionnaire
    setFicheSelectionnee(fiche);
    setModalPaiement(true);
    return;
  }
  // Si ANNULEE, pas de questionnaire
    try {
      const res = await fetch(`${API_URL}/api/rh/fiches-paie/${fiche.id}/statut`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ statut: 'ANNULEE' })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Fiche annulée !');
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur.');
    }
  }

  async function visualiserFiche(fiche) {
      // Fiche importée — pas de PDF disponible
      if (!fiche.pdf_url && fiche.statut === 'PAYEE') {
       toast.info('📄 PDF non disponible — cette fiche de paie a été importée et n\'est pas stockée sur la plateforme.');
       return;
    }
    try {
      const res = await fetch(
        `${API_URL}/api/rh/fiches-paie/${fiche.id}/pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ entreprise_id: entreprise.id })
        }
      );
      if (!res.ok) { toast.error('Erreur génération PDF.'); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Erreur visualisation.');
    }
  }

  async function telechargerSelection() {
    for (const id of selection) {
      const fiche = fiches.find(f => f.id === id);
      if (!fiche) continue;
      const res = await fetch(`${API_URL}/api/rh/fiches-paie/${id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ entreprise_id: entreprise.id })
      });
      if (!res.ok) continue;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FichePaie_${fiche.matricule}_${fiche.mois}_${fiche.annee}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
    setSelection([]);
    toast.success('Téléchargement terminé !');
  }

  async function imprimerSelection() {
    for (const id of selection) {
      const res = await fetch(`${API_URL}/api/rh/fiches-paie/${id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ entreprise_id: entreprise.id })
      });
      if (!res.ok) continue;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(url);
        }, 1000);
      };
    }
    setSelection([]);
  }

  function exporterExcel() {
    const XLSX = require('xlsx');
    const donnees = fichesFiltrees.map(f => ({
      'Matricule': f.matricule,
      'Nom': f.nom_salarie,
      'Fonction': f.fonction || '',
      'Mois': f.mois,
      'Année': f.annee,
      'Date paiement': f.date_paiement || '',
      'Mode paiement': f.mode_paiement || '',
      'Salaire base': f.salaire_base || 0,
      'Jours travaillés': f.nb_jours_travailles || 0,
      'Congés': f.nb_jours_conge || 0,
      'Absences': f.nb_jours_absence || 0,
      'Salaire brut': f.salaire_brut || 0,
      'CNAPS salarial': f.cnaps_salarial || 0,
      'OSTIE salarial': f.ostie_salarial || 0,
      'FMFP salarial': f.fmfp_salarial || 0,
      'CNAPS patronal': f.cnaps_patronal || 0,
      'OSTIE patronal': f.ostie_patronal || 0,
      'FMFP patronal': f.fmfp_patronal || 0,
      'Brut imposable': f.brut_imposable || 0,
      'IRSA': f.irsa_final || 0,
      'Salaire net': f.salaire_net || 0,
      'Statut': f.statut || ''
    }));
    const ws = XLSX.utils.json_to_sheet(donnees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fiches de paie');
    XLSX.writeFile(wb, `FichesPaie_${filtreMois || 'tous'}_${filtreAnnee}.xlsx`);
    toast.success('Export Excel téléchargé !');
  }

  function couleurStatut(statut) {
    const c = {
      BROUILLON: { bg: '#f5f5f5', color: '#616161', label: '📝 Brouillon' },
      VALIDEE: { bg: '#e3f2fd', color: '#1565c0', label: '✅ Validée' },
      PAYEE: { bg: '#e8f5e9', color: '#2e7d32', label: '💰 Payée' },
      ANNULEE: { bg: '#ffebee', color: '#c62828', label: '❌ Annulée' }
    };
    return c[statut] || { bg: '#f5f5f5', color: '#666', label: statut };
  }

  const fichesFiltrees = fiches.filter(f => {
    const matchMois = !filtreMois || f.mois === filtreMois;
    const matchAnnee = !filtreAnnee || f.annee === filtreAnnee;
    return matchMois && matchAnnee;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modalOuvert === 'unique' && (
        <FormulaireUnique
          salaries={salaries}
          onSave={creerFicheUnique}
          onCancel={() => setModalOuvert(null)}
        />
      )}
      {modalOuvert === 'masse' && (
        <FormulaireMasse
          salaries={salaries}
          onSave={creerFichesMasse}
          onCancel={() => setModalOuvert(null)}
        />
      )}
      {modalPaiement && (
        <ModalPaiementFiche
          fiches={
            ficheSelectionnee && selection.length === 0
             ? [ficheSelectionnee]
             : fiches.filter(f => selection.includes(f.id))
          }
          onSave={payerFichesSelectionnees}
          onCancel={() => { setModalPaiement(false); setFicheSelectionnee(null); }}
        />
    )}
      {modalAjouterPJ && ficheSelectionnee && (
  <ModalAjouterPJFiche
    fiche={ficheSelectionnee}
    onClose={() => { setModalAjouterPJ(false); setFicheSelectionnee(null); }}
    onUpload={async (fichier) => {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(fichier);
      });
      await fetch(
        `${API_URL}/api/rh/fiches-paie/${ficheSelectionnee.id}/upload-justificatif`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fichier_base64: base64,
            nom_fichier: fichier.name,
            type_mime: fichier.type
          })
        }
      );
      toast.success('Justificatif ajouté !');
      setModalAjouterPJ(false);
      setFicheSelectionnee(null);
      chargerDonnees();
    }}
  />
)}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>📋 Fiches de paie</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {fiches.length} fiche(s) au total
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {selection.length > 0 && (
            <>
              <button style={{ ...styles.boutonSecondaire, color: '#1565c0', borderColor: '#1565c0' }}
                onClick={telechargerSelection}>
                📥 Télécharger ({selection.length})
              </button>
              <button style={{ ...styles.boutonSecondaire, color: '#e65100', borderColor: '#e65100' }}
                onClick={imprimerSelection}>
                🖨️ Imprimer ({selection.length})
              </button>
            </>
          )}
          {selection.length > 0 && (
            <>
              <button
                style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
                onClick={() => setModalPaiement(true)}
            >
                ✅ Payer ({selection.length})
              </button>
              {/* boutons télécharger et imprimer existants */}
            </>
    )}
          <button style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
            onClick={exporterExcel}>📊 Excel</button>
          <button style={styles.boutonSecondaire}
            onClick={() => setModalOuvert('masse')}>
            📋 Fiches en masse
          </button>
          <button style={styles.boutonPrimaire}
            onClick={() => setModalOuvert('unique')}>
            + Nouvelle fiche
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={styles.label}>Mois</label>
            <select style={{ ...styles.input, width: '150px' }} value={filtreMois}
              onChange={e => setFiltreMois(e.target.value)}>
              <option value="">Tous les mois</option>
              {moisListe.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Année</label>
            <input style={{ ...styles.input, width: '100px' }} type="number"
              value={filtreAnnee}
              onChange={e => setFiltreAnnee(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div style={styles.card}>
        {fichesFiltrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucune fiche de paie trouvée.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', width: '40px' }}>
                  <input type="checkbox"
                    checked={selection.length === fichesFiltrees.length && fichesFiltrees.length > 0}
                    onChange={() => {
                      if (selection.length === fichesFiltrees.length) setSelection([]);
                      else setSelection(fichesFiltrees.map(f => f.id));
                    }} />
                </th>
                {['Matricule', 'Nom', 'Fonction', 'Mois/Année', 'Sal. base', 'Sal. net', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '13px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fichesFiltrees.map((f, i) => {
                const statut = couleurStatut(f.statut);
                const estSelectionnee = selection.includes(f.id);
                return (
                  <tr key={f.id} style={{
                    background: estSelectionnee ? '#e3f2fd' : (i % 2 === 0 ? 'white' : '#fafafa'),
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <input type="checkbox" checked={estSelectionnee}
                        onChange={() => setSelection(prev =>
                          prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id]
                        )} />
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                      {f.matricule}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{f.nom_salarie}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {f.fonction || '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {f.mois} {f.annee}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                      {Number(f.salaire_base || 0).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#2e7d32' }}>
                      {Number(f.salaire_net || 0).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                        fontWeight: 'bold', background: statut.bg, color: statut.color }}>
                        {statut.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                          onClick={() => visualiserFiche(f)} title="Voir fiche">👁️</button>
                        {/* Voir justificatif existant */}
                        {f.justificatif_url && (
                          <a href={f.justificatif_url} target="_blank" rel="noreferrer"
                            style={{ ...styles.boutonSecondaire, padding: '4px 8px', textDecoration: 'none' }}
                            title="Voir justificatif">📎</a>
         )}

                        {/* Ajouter justificatif — toujours visible */}
                        <button
                          style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                          onClick={() => { setFicheSelectionnee(f); setModalAjouterPJ(true); }}
                          title="Ajouter justificatif">
                         ➕📎
                        </button>  
                        {f.statut !== 'ANNULEE' && f.statut !== 'PAYEE' && (
                          <>
                            <button style={{ ...styles.boutonSecondaire, padding: '4px 8px',
                              color: '#2e7d32', borderColor: '#2e7d32' }}
                              onClick={() => changerStatutFiche(f, 'PAYEE')}
                              title="Marquer payée">✅</button>
                            <button style={{ ...styles.boutonDanger, padding: '4px 8px' }}
                              onClick={() => changerStatutFiche(f, 'ANNULEE')}
                              title="Annuler">❌</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}