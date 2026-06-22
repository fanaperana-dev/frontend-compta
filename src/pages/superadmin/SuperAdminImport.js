import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { entrepriseService } from '../../services/api';
import api from '../../services/api';

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
  boutonVert: {
    background: '#2e7d32', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
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
  }
};

const modules = [
  {
    key: 'clients', label: '👥 Clients',
    colonnes: ['nom', 'societe', 'email', 'telephone', 'adresse', 'ville',
      'nif', 'stat', 'conditions_paiement', 'delai_paiement', 'montant_mensuel', 'actif'],
    exemples: [['Dupont SARL', 'Dupont SARL', 'contact@dupont.mg', '034000000',
      'Lot 1 Antananarivo', 'Antananarivo', '123456', '654321', 'NET30', '30', '500000', 'OUI']]
  },
  {
    key: 'factures-clients', label: '🧾 Factures clients',
    colonnes: ['numero_facture', 'nom_client', 'email_client', 'type_facture',
      'categorie', 'mois', 'date_facture', 'date_limite', 'montant_total',
      'montant_paye', 'statut', 'mode_paiement', 'date_paiement', 'note'],
    exemples: [['FAC-001', 'Dupont SARL', 'contact@dupont.mg', 'MENSUELLE',
      'Prestation de service', 'Janvier 2025', '2025-01-01', '2025-01-31',
      '500000', '500000', 'PAYEE', 'Virement', '2025-01-15', '']]
  },
  {
    key: 'fournisseurs', label: '🏭 Fournisseurs',
    colonnes: ['nom', 'adresse', 'ville', 'nif', 'stat', 'rcs',
      'telephone', 'email', 'conditions_paiement', 'delai_paiement'],
    exemples: [['Fournisseur A', 'Rue 1', 'Antananarivo', '111', '222', '333',
      '034111111', 'fourn@mg.com', 'NET30', '30']]
  },
  {
    key: 'factures-fournisseurs', label: '📄 Factures fournisseurs',
    colonnes: ['fournisseur', 'categorie', 'sous_categorie', 'montant',
      'montant_paye', 'mode_paiement', 'date_facture', 'date_echeance', 'statut', 'commentaire'],
    exemples: [['Fournisseur A', 'Charges', 'Loyer', '300000', '300000',
      'Virement', '2025-01-05', '2025-01-31', 'PAYEE', '']]
  },
  {
    key: 'tiers', label: '🔄 Tiers',
    colonnes: ['nom', 'adresse', 'ville', 'nif', 'stat', 'rcs',
      'telephone', 'email', 'conditions_paiement', 'delai_paiement'],
    exemples: [['Tiers A', 'Rue 2', 'Antananarivo', '444', '555', '666',
      '034222222', 'tiers@mg.com', 'NET30', '30']]
  },
  {
    key: 'factures-tiers', label: '📋 Factures tiers',
    colonnes: ['tiers', 'categorie', 'sous_categorie', 'depense', 'recette',
      'montant', 'montant_paye', 'mode_paiement', 'date_facture', 'date_echeance', 'statut', 'commentaire'],
    exemples: [['Tiers A', 'Divers', '', 'Achat fournitures', '', '150000', '150000',
      'Espèces', '2025-01-10', '2025-01-31', 'PAYEE', '']]
  },
  {
    key: 'salaries', label: '👤 Salariés',
    colonnes: ['nom', 'prenom', 'sexe', 'cin', 'numero_cnaps', 'date_naissance',
      'telephone', 'email', 'adresse', 'fonction', 'categorie', 'type_contrat',
      'date_embauche', 'salaire_base', 'nb_jours_mois', 'nb_heures_mois',
      'nb_enfants', 'valeur_panier_repas', 'valeur_transport', 'mode_paiement'],
    exemples: [['Martin', 'Jean', 'M', '101010101010', '123456789', '1990-01-01',
      '034333333', 'jean@mg.com', 'Lot 2', 'Comptable', 'Cadre', 'CDI',
      '2020-01-01', '800000', '26', '173.33', '2', '5000', '3000', 'Virement']]
  },
  {
    key: 'fiches-paie', label: '💰 Fiches de paie',
    colonnes: ['matricule', 'mois', 'annee', 'date_paiement', 'mode_paiement',
      'statut', 'salaire_brut', 'salaire_net', 'cnaps_salarial', 'ostie_salarial',
      'fmfp_salarial', 'cnaps_patronal', 'ostie_patronal', 'fmfp_patronal',
      'irsa_final', 'allocations_familiales', 'brut_imposable',
      'nb_jours_travailles', 'nb_jours_conge', 'nb_jours_absence',
      'nb_jours_transport', 'nb_jours_panier_repas', 'nb_heures_sup_130',
      'nb_heures_sup_150', 'nb_heures_ferie', 'prime', 'acompte', 'retenue'],
    exemples: [['EMP-001', 'Janvier', '2025', '2025-01-31', 'Virement',
      'PAYEE', '800000', '720000', '8000', '8000', '8000', '104000', '40000',
      '8000', '25000', '0', '776000', '26', '0', '0', '26', '26', '0', '0', '0', '0', '0', '0']]
  }
];

export default function SuperAdminImport() {
  const [entreprises, setEntreprises] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState('');
  const [moduleSelectionne, setModuleSelectionne] = useState('');
  const [donnees, setDonnees] = useState([]);
  const [modeFiche, setModeFiche] = useState('complet');
  const [importEnCours, setImportEnCours] = useState(false);
  const [resultats, setResultats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { chargerEntreprises(); }, []);

  async function chargerEntreprises() {
    try {
      const res = await entrepriseService.getAll();
      setEntreprises(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement entreprises.');
    } finally {
      setLoading(false);
    }
  }

  function telechargerMatrice() {
    const module = modules.find(m => m.key === moduleSelectionne);
    if (!module) return;

    const wb = XLSX.utils.book_new();
    const wsData = [module.colonnes, ...module.exemples];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Largeur colonnes auto
    ws['!cols'] = module.colonnes.map(() => ({ wch: 20 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Import');
    XLSX.writeFile(wb, `matrice_${moduleSelectionne}.xlsx`);
    toast.success('Matrice téléchargée !');
  }

  function lireFichierExcel(e) {
    const fichier = e.target.files[0];
    if (!fichier) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setDonnees(json);
        setResultats(null);
        toast.success(`${json.length} ligne(s) lue(s) depuis le fichier.`);
      } catch (err) {
        toast.error('Erreur lecture fichier Excel.');
      }
    };
    reader.readAsBinaryString(fichier);
  }

  async function lancerImport() {
    if (!entrepriseId || !moduleSelectionne || donnees.length === 0) {
      toast.error('Sélectionnez une entreprise, un module et uploadez un fichier.');
      return;
    }

    setImportEnCours(true);
    try {
      const body = { entreprise_id: entrepriseId, donnees };
      if (moduleSelectionne === 'fiches-paie') body.mode = modeFiche;

      const res = await api.post(`/import/${moduleSelectionne}`, body);
      setResultats(res.data.resultats);

      const nb = res.data.resultats.importes?.length || 0;
      const nbErr = res.data.resultats.erreurs?.length || 0;
      toast.success(`Import terminé : ${nb} importé(s), ${nbErr} erreur(s).`);
    } catch (err) {
      toast.error('Erreur lors de l\'import.');
    } finally {
      setImportEnCours(false);
    }
  }

  const moduleInfo = modules.find(m => m.key === moduleSelectionne);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      <h2 style={{ color: '#004d5a', marginBottom: '20px' }}>📥 Import Excel</h2>

      <div style={styles.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={styles.label}>Entreprise *</label>
            <select style={styles.input} value={entrepriseId}
              onChange={e => { setEntrepriseId(e.target.value); setDonnees([]); setResultats(null); }}>
              <option value="">-- Choisir --</option>
              {entreprises.map(e => (
                <option key={e.id} value={e.id}>{e.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Module à importer *</label>
            <select style={styles.input} value={moduleSelectionne}
              onChange={e => { setModuleSelectionne(e.target.value); setDonnees([]); setResultats(null); }}>
              <option value="">-- Choisir --</option>
              {modules.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {moduleSelectionne && (
        <>
          {moduleSelectionne === 'fiches-paie' && (
            <div style={styles.card}>
              <label style={styles.label}>Mode d'import fiches de paie</label>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '13px', cursor: 'pointer' }}>
                  <input type="radio" value="complet" checked={modeFiche === 'complet'}
                    onChange={() => setModeFiche('complet')} />
                  <div>
                    <strong>Données complètes</strong>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      Importer tous les montants depuis Excel (cotisations, IRSA, etc.)
                    </div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '13px', cursor: 'pointer' }}>
                  <input type="radio" value="recalcul" checked={modeFiche === 'recalcul'}
                    onChange={() => setModeFiche('recalcul')} />
                  <div>
                    <strong>Recalcul automatique</strong>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      Saisir variables seulement, le système recalcule tout
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>
              📋 Étape 1 — Télécharger la matrice Excel
            </h3>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Téléchargez le fichier modèle, remplissez-le et uploadez-le ensuite.
              La première ligne contient les noms de colonnes — ne la modifiez pas.
            </p>
            <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '12px',
              marginBottom: '15px', fontSize: '12px' }}>
              <strong>Colonnes attendues :</strong>{' '}
              {moduleInfo?.colonnes.join(', ')}
            </div>
            <button style={styles.boutonSecondaire} onClick={telechargerMatrice}>
              ⬇️ Télécharger la matrice {moduleInfo?.label}
            </button>
          </div>

          <div style={styles.card}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>
              📤 Étape 2 — Uploader le fichier rempli
            </h3>
            <input type="file" accept=".xlsx,.xls"
              onChange={lireFichierExcel}
              style={{ fontSize: '13px', marginBottom: '10px' }} />

            {donnees.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '10px',
                  fontSize: '13px', color: '#2e7d32', marginBottom: '15px' }}>
                  ✅ {donnees.length} ligne(s) prête(s) à importer
                </div>

                <div style={{ overflow: 'auto', maxHeight: '250px', border: '1px solid #e0e0e0',
                  borderRadius: '8px', marginBottom: '15px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#004d5a', color: 'white' }}>
                        {Object.keys(donnees[0]).map(k => (
                          <th key={k} style={{ padding: '8px', textAlign: 'left',
                            whiteSpace: 'nowrap' }}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {donnees.slice(0, 5).map((d, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                          {Object.values(d).map((v, j) => (
                            <td key={j} style={{ padding: '6px 8px',
                              borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                              {String(v).substring(0, 30)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {donnees.length > 5 && (
                    <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#666' }}>
                      ... et {donnees.length - 5} ligne(s) supplémentaire(s)
                    </div>
                  )}
                </div>

                <button
                  style={{ ...styles.boutonPrimaire, opacity: importEnCours ? 0.6 : 1 }}
                  disabled={importEnCours}
                  onClick={lancerImport}
                >
                  {importEnCours ? '⏳ Import en cours...' : `🚀 Importer ${donnees.length} ligne(s)`}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {resultats && (
        <div style={styles.card}>
          <h3 style={{ color: '#004d5a', marginTop: 0 }}>📊 Résultats de l'import</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '15px' }}>
              <div style={{ fontSize: '13px', color: '#2e7d32' }}>✅ Importés avec succès</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                {resultats.importes?.length || 0}
              </div>
            </div>
            <div style={{ background: '#ffebee', borderRadius: '8px', padding: '15px' }}>
              <div style={{ fontSize: '13px', color: '#c62828' }}>❌ Erreurs</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c62828' }}>
                {resultats.erreurs?.length || 0}
              </div>
            </div>
          </div>

          {resultats.erreurs?.length > 0 && (
            <div>
              <strong style={{ fontSize: '13px', color: '#c62828' }}>Détail des erreurs :</strong>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {resultats.erreurs.map((e, i) => (
                  <div key={i} style={{ background: '#ffebee', padding: '8px 12px',
                    borderRadius: '6px', fontSize: '12px', color: '#c62828' }}>
                    <strong>{e.ligne || 'Ligne inconnue'}</strong> — {e.raison}
                  </div>
                ))}
              </div>
            </div>
          )}

          {moduleSelectionne === 'factures-clients' && resultats.importes?.length > 0 && (
            <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '12px',
              marginTop: '15px', fontSize: '12px', color: '#e65100' }}>
              📒 N'oubliez pas de <strong>synchroniser le journal</strong> après l'import
              (page Journal → bouton Synchroniser) pour que les factures importées
              apparaissent dans le journal comptable.
            </div>
          )}
        </div>
      )}
    </div>
  );
}