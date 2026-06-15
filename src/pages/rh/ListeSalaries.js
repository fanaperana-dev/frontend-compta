import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

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
    width: '750px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const typesContrat = ['CDI', 'CDD', 'STAGE', 'INTERIM'];
const statutsEmploi = ['EN_POSTE', 'STAGIAIRE', 'SUSPENDU', 'SORTI'];

function couleurStatutEmploi(statut) {
  const c = {
    EN_POSTE: { bg: '#e8f5e9', color: '#2e7d32', label: '🟢 En poste' },
    STAGIAIRE: { bg: '#e3f2fd', color: '#1565c0', label: '🔵 Stagiaire' },
    SUSPENDU: { bg: '#fff3e0', color: '#e65100', label: '🟡 Suspendu' },
    SORTI: { bg: '#ffebee', color: '#c62828', label: '🔴 Sorti' }
  };
  return c[statut] || { bg: '#f5f5f5', color: '#666', label: statut };
}

function FormulaireSalarie({ salarie, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: salarie?.nom || '',
    prenom: salarie?.prenom || '',
    date_naissance: salarie?.date_naissance || '',
    telephone: salarie?.telephone || '',
    email: salarie?.email || '',
    mode_paiement: salarie?.mode_paiement || '',
    adresse: salarie?.adresse || '',
    sexe: salarie?.sexe || '',
    cin: salarie?.cin || '',
    numero_cnaps: salarie?.numero_cnaps || '',
    fonction: salarie?.fonction || '',
    categorie: salarie?.categorie || '',
    type_contrat: salarie?.type_contrat || 'CDI',
    occasionnel: salarie?.occasionnel || 'N',
    date_embauche: salarie?.date_embauche || '',
    salaire_base: salarie?.salaire_base || 0,
    nb_jours_mois: salarie?.nb_jours_mois || 30,
    nb_heures_mois: salarie?.nb_heures_mois || 173.33,
    nb_enfants: salarie?.nb_enfants || 0,
    valeur_panier_repas: salarie?.valeur_panier_repas || 0,
    valeur_transport: salarie?.valeur_transport || 0,
    date_remise_niveau: salarie?.date_remise_niveau || '',
    nouveau_salaire_base: salarie?.nouveau_salaire_base || 0
  });

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {salarie ? '✏️ Modifier salarié' : '➕ Nouveau salarié'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={styles.label}>Nom *</label>
            <input style={styles.input} value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Prénom</label>
            <input style={styles.input} value={form.prenom}
              onChange={e => setForm({ ...form, prenom: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Date de naissance</label>
            <input style={styles.input} type="date" value={form.date_naissance}
              onChange={e => setForm({ ...form, date_naissance: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Téléphone</label>
            <input style={styles.input} value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@salarié.com" />
          </div>
          <div>
            <label style={styles.label}>Mode de paiement</label>
            <select style={styles.input} value={form.mode_paiement}
              onChange={e => setForm({ ...form, mode_paiement: e.target.value })}>
              <option value="">Sélectionner</option>
              <option value="Virement bancaire">Virement bancaire</option>
              <option value="Espèces">Espèces</option>
              <option value="Chèque">Chèque</option>
              <option value="Airtel money">Airtel money</option>
              <option value="Orange money">Orange money</option>
              <option value="Mvola">Mvola</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Sexe</label>
            <select style={styles.input} value={form.sexe}
              onChange={e => setForm({ ...form, sexe: e.target.value })}>
              <option value="">Sélectionner</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Adresse</label>
            <input style={styles.input} value={form.adresse}
              onChange={e => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>N° CIN</label>
            <input style={styles.input} value={form.cin}
              onChange={e => setForm({ ...form, cin: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>N° CNAPS</label>
            <input style={styles.input} value={form.numero_cnaps}
              onChange={e => setForm({ ...form, numero_cnaps: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Fonction</label>
            <input style={styles.input} value={form.fonction}
              onChange={e => setForm({ ...form, fonction: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Catégorie</label>
            <input style={styles.input} value={form.categorie}
              onChange={e => setForm({ ...form, categorie: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Type de contrat</label>
            <select style={styles.input} value={form.type_contrat}
              onChange={e => setForm({ ...form, type_contrat: e.target.value })}>
              {typesContrat.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Occasionnel</label>
            <select style={styles.input} value={form.occasionnel}
              onChange={e => setForm({ ...form, occasionnel: e.target.value })}>
              <option value="N">N — Non</option>
              <option value="O">O — Oui</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Date d'embauche</label>
            <input style={styles.input} type="date" value={form.date_embauche}
              onChange={e => setForm({ ...form, date_embauche: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Salaire de base (Ar) *</label>
            <input style={styles.input} type="number" value={form.salaire_base}
              onChange={e => setForm({ ...form, salaire_base: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Nb jours/mois</label>
            <input style={styles.input} type="number" value={form.nb_jours_mois}
              onChange={e => setForm({ ...form, nb_jours_mois: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Nb heures/mois</label>
            <input style={styles.input} type="number" step="0.01" value={form.nb_heures_mois}
              onChange={e => setForm({ ...form, nb_heures_mois: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Nombre d'enfants</label>
            <input style={styles.input} type="number" value={form.nb_enfants}
              onChange={e => setForm({ ...form, nb_enfants: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Valeur panier repas (Ar/jour)</label>
            <input style={styles.input} type="number" value={form.valeur_panier_repas}
              onChange={e => setForm({ ...form, valeur_panier_repas: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Valeur transport (Ar/jour)</label>
            <input style={styles.input} type="number" value={form.valeur_transport}
              onChange={e => setForm({ ...form, valeur_transport: Number(e.target.value) })} />
          </div>
          <div>
            <label style={styles.label}>Date remise à niveau</label>
            <input style={styles.input} type="date" value={form.date_remise_niveau}
              onChange={e => setForm({ ...form, date_remise_niveau: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Nouveau salaire de base (Ar)</label>
            <input style={styles.input} type="number" value={form.nouveau_salaire_base}
              onChange={e => setForm({ ...form, nouveau_salaire_base: Number(e.target.value) })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire} onClick={() => onSave(form)}>
            {salarie ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalStatut({ salarie, onSave, onCancel }) {
  const [form, setForm] = useState({
    statut_emploi: salarie.statut_emploi || 'EN_POSTE',
    date_sortie: new Date().toISOString().split('T')[0],
    motif_sortie: ''
  });

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '450px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          🔄 Changer statut — {salarie.nom}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Nouveau statut</label>
            <select style={styles.input} value={form.statut_emploi}
              onChange={e => setForm({ ...form, statut_emploi: e.target.value })}>
              {statutsEmploi.map(s => (
                <option key={s} value={s}>{couleurStatutEmploi(s).label}</option>
              ))}
            </select>
          </div>
          {form.statut_emploi === 'SORTI' && (
            <>
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
                  <option value="Fin de stage">Fin de stage</option>
                  <option value="Retraite">Retraite</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire} onClick={() => onSave(form)}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListeSalaries() {
  const { entreprise } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [modalOuvert, setModalOuvert] = useState(null);
  const [salarieSelectionne, setSalarieSelectionne] = useState(null);

  useEffect(() => { chargerSalaries(); }, []);

  async function chargerSalaries() {
    try {
      const res = await fetch(
        `http://localhost:5000/api/rh/salaries/${entreprise.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      setSalaries(data.data || []);
    } catch (err) {
      toast.error('Erreur chargement salariés.');
    } finally {
      setLoading(false);
    }
  }

  async function sauvegarderSalarie(form) {
    try {
      const url = salarieSelectionne
        ? `http://localhost:5000/api/rh/salaries/${salarieSelectionne.id}`
        : 'http://localhost:5000/api/rh/salaries';
      const method = salarieSelectionne ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...form, entreprise_id: entreprise.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success(salarieSelectionne ? 'Salarié modifié !' : 'Salarié créé !');
      setModalOuvert(null);
      setSalarieSelectionne(null);
      chargerSalaries();
    } catch (err) {
      toast.error(err.message || 'Erreur sauvegarde.');
    }
  }

  async function changerStatut(form) {
    try {
      const res = await fetch(
        `http://localhost:5000/api/rh/salaries/${salarieSelectionne.id}/statut`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(form)
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Statut mis à jour !');
      setModalOuvert(null);
      setSalarieSelectionne(null);
      chargerSalaries();
    } catch (err) {
      toast.error(err.message || 'Erreur.');
    }
  }

  async function toggleActif(salarie) {
    try {
      const res = await fetch(
        `http://localhost:5000/api/rh/salaries/${salarie.id}/actif`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ actif: !salarie.actif })
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`Salarié ${!salarie.actif ? 'activé' : 'désactivé'}.`);
      chargerSalaries();
    } catch (err) {
      toast.error('Erreur.');
    }
  }

  function exporterExcel() {
    const XLSX = require('xlsx');
    const donnees = salaries.map(s => ({
      'Matricule': s.matricule,
      'Nom': s.nom,
      'Prénom': s.prenom || '',
      'Téléphone': s.telephone || '',
      'Adresse': s.adresse || '',
      'Sexe': s.sexe || '',
      'CIN': s.cin || '',
      'N° CNAPS': s.numero_cnaps || '',
      'Fonction': s.fonction || '',
      'Catégorie': s.categorie || '',
      'Type contrat': s.type_contrat || '',
      'Statut emploi': s.statut_emploi || '',
      'Date embauche': s.date_embauche || '',
      'Salaire base': s.salaire_base || 0,
      'Nb jours/mois': s.nb_jours_mois || 30,
      'Nb heures/mois': s.nb_heures_mois || 173.33,
      'Nb enfants': s.nb_enfants || 0,
      'Panier repas': s.valeur_panier_repas || 0,
      'Transport': s.valeur_transport || 0,
      'Date remise niveau': s.date_remise_niveau || '',
      'Nouveau salaire': s.nouveau_salaire_base || 0,
      'Actif': s.actif ? 'Oui' : 'Non'
    }));
    const ws = XLSX.utils.json_to_sheet(donnees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salariés');
    XLSX.writeFile(wb, `Salaries_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
    toast.success('Export Excel téléchargé !');
  }

  const salariesFiltres = salaries.filter(s => {
    const matchStatut = filtreStatut === 'TOUS' || s.statut_emploi === filtreStatut;
    const matchRecherche = !recherche ||
      s.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      s.matricule?.toLowerCase().includes(recherche.toLowerCase()) ||
      s.fonction?.toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modalOuvert === 'formulaire' && (
        <FormulaireSalarie
          salarie={salarieSelectionne}
          onSave={sauvegarderSalarie}
          onCancel={() => { setModalOuvert(null); setSalarieSelectionne(null); }}
        />
      )}
      {modalOuvert === 'statut' && salarieSelectionne && (
        <ModalStatut
          salarie={salarieSelectionne}
          onSave={changerStatut}
          onCancel={() => { setModalOuvert(null); setSalarieSelectionne(null); }}
        />
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>👥 Liste des salariés</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {salaries.length} salarié(s) au total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
            onClick={exporterExcel}>📊 Excel</button>
          <button style={styles.boutonPrimaire}
            onClick={() => { setSalarieSelectionne(null); setModalOuvert('formulaire'); }}>
            + Nouveau salarié
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={styles.label}>Rechercher</label>
            <input style={{ ...styles.input, width: '250px' }}
              placeholder="Nom, matricule, fonction..."
              value={recherche} onChange={e => setRecherche(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['TOUS', 'EN_POSTE', 'STAGIAIRE', 'SUSPENDU', 'SORTI'].map(s => (
              <button key={s} onClick={() => setFiltreStatut(s)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none',
                  cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                  background: filtreStatut === s ? '#004d5a' : '#e0e0e0',
                  color: filtreStatut === s ? 'white' : '#333'
                }}>
                {s === 'TOUS' ? 'Tous' : couleurStatutEmploi(s).label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div style={styles.card}>
        {salariesFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucun salarié trouvé.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Matricule', 'Nom', 'Fonction', 'Contrat', 'Statut', 'Salaire base',
                  'Jours/mois', 'Heures/mois', 'Actif', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '13px',
                    color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {salariesFiltres.map((s, i) => {
                const statut = couleurStatutEmploi(s.statut_emploi);
                return (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa',
                    borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold',
                      color: '#004d5a' }}>{s.matricule}</td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>
                      {s.nom} {s.prenom || ''}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {s.fonction || '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {s.type_contrat || '—'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: 'bold',
                        background: statut.bg, color: statut.color }}>
                        {statut.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                      {Number(s.salaire_base).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {s.nb_jours_mois || 30}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {s.nb_heures_mois || 173.33}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                        fontWeight: 'bold',
                        background: s.actif ? '#e8f5e9' : '#ffebee',
                        color: s.actif ? '#2e7d32' : '#c62828'
                      }}>
                        {s.actif ? '✅ Actif' : '❌ Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                          onClick={() => { setSalarieSelectionne(s); setModalOuvert('formulaire'); }}
                          title="Modifier">✏️</button>
                        <button style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                          onClick={() => { setSalarieSelectionne(s); setModalOuvert('statut'); }}
                          title="Changer statut">🔄</button>
                        <button style={{
                          ...styles.boutonSecondaire, padding: '4px 8px',
                          color: s.actif ? '#2e7d32' : '#c62828',
                          borderColor: s.actif ? '#2e7d32' : '#c62828'
                        }}
                          onClick={() => toggleActif(s)}
                          title={s.actif ? 'Désactiver' : 'Activer'}>
                          {s.actif ? '🟢' : '🔴'}
                        </button>
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