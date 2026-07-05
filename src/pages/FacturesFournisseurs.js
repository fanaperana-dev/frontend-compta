import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { fournisseurService, fournisseurListeService } from '../services/api';
const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
const styles = {
  boutonPrimaire: {
    background: '#004d5a',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  boutonSecondaire: {
    background: 'white',
    color: '#004d5a',
    border: '2px solid #004d5a',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  boutonDanger: {
    background: 'white',
    color: '#c62828',
    border: '2px solid #c62828',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '13px'
  },
  card: {
    background: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '20px'
  },
  modal: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    width: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const categoriesDepenses = {
  '60 - Achats consommés': [
    '601 - Matières premières',
    '602 - Autres approvisionnements',
    '603 - Variations des stocks',
    '604 - Achats d\'études et de prestations de service',
    '605 - Achats de matériel, équipements et travaux',
    '606 - Achats non stockés de matières et fournitures',
    '607 - Rabais, remises et ristournes obtenus sur achats',
    '608 - Frais accessoires d\'achat',
    '609 - Rabais, remises, ristournes obtenus sur achats et services extérieurs'
  ],
  '61 - Services extérieurs': [
    '611 - Sous-traitance générale',
    '612 - Redevance de crédit-bail',
    '613 - Locations',
    '614 - Charges locatives et charges de copropriété',
    '615 - Entretiens, réparations et maintenance',
    '616 - Primes d\'assurances',
    '617 - Études et recherches',
    '618 - Divers',
    '619 - Rabais, remises, ristournes obtenus sur services extérieurs'
  ],
  '62 - Autres services extérieurs': [
    '621 - Personnel extérieur à l\'entreprise',
    '622 - Rémunérations d\'intermédiaires et honoraires',
    '623 - Publicité, publication, relations publiques',
    '624 - Transports de biens et transport collectif du personnel',
    '625 - Déplacements, missions et réceptions',
    '626 - Frais postaux et de télécommunications',
    '627 - Services bancaires et assimilés',
    '628 - Cotisations et divers',
    '629 - Rabais, remises, ristournes obtenus sur autres services extérieurs'
  ],
  '63 - Impôts, taxes et versements assimilés': [
    '631 - Impôts, taxes et versements assimilés sur rémunérations',
    '632 - Autres impôts, taxes et versements assimilés'
  ],
  '64 - Charges de personnel': [
    '641 - Rémunérations du personnel',
    '644 - Rémunérations des dirigeants',
    '645 - Cotisations aux organismes sociaux',
    '646 - Rémunérations transférées de charges',
    '647 - Autres charges sociales',
    '648 - Autres charges de personnel'
  ],
  '65 - Autres charges des activités ordinaires': [
    '651 - Redevances pour concessions, brevets, licences, logiciels',
    '652 - Pertes sur cessions d\'actifs non courants',
    '653 - Jetons de présence',
    '654 - Pertes sur créances irrécouvrables',
    '655 - Quote-part de résultat sur opérations faites en commun',
    '656 - Amendes et pénalités, subventions accordées, dons et libéralités',
    '657 - Charges exceptionnelles de gestion courante',
    '658 - Autres charges de gestion courante'
  ],
  '66 - Charges financières': [
    '661 - Charges d\'intérêts',
    '662 - Pertes de change liées à des participations',
    '665 - Moins-values sur titres de placement',
    '666 - Pertes de change',
    '667 - Moins-values sur instruments financiers et assimilés',
    '668 - Autres charges financières'
  ],
  '67 - Éléments extraordinaires (charges)': [],
  '68 - Dotations aux amortissements, provisions, pertes de valeur': [
    '681 - Dotations - actifs non courants',
    '685 - Dotations d\'exploitation - actifs courants'
  ],
  '69 - Impôts sur les bénéfices': [
    '691 - Impôt différé actif',
    '692 - Impôt différé passif',
    '695 - Impôts sur les bénéfices basés sur le résultat des activités ordinaires',
    '698 - Autres impôts sur les résultats'
  ]
};

const modesPaiement = [
    'Virement bancaire',
    'Carte bancaire',
    'Chèque',
    'Espèces',
    'Airtel money',
    'Orange money',
    'Mvola',
    'Associé',
    'Autre'
  ];

function couleurStatut(statut) {
  const couleurs = {
    EN_ATTENTE: { bg: '#fff3e0', color: '#e65100', label: '⏳ En attente' },
    PAIEMENT_PARTIEL: { bg: '#e3f2fd', color: '#1565c0', label: '💰 Partiel' },
    PAYEE: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Payée' },
    ANNULEE: { bg: '#fafafa', color: '#9e9e9e', label: '❌ Annulée' },
    EN_RETARD: { bg: '#ffebee', color: '#c62828', label: '⚠️ En retard' }
  };
  return couleurs[statut] || { bg: '#f5f5f5', color: '#616161', label: statut };
}

// Formulaire facture fournisseur
function FormulaireFactureFournisseur({ facture, fournisseurs, entreprise_id, onSave, onCancel }) {
  const [enCours, setEnCours] = useState(false);
  const [form, setForm] = useState({
    fournisseur_id: facture?.fournisseur_id || '',
    fournisseur: facture?.fournisseur || '',
    numero: facture?.numero || '',
    categorie: facture?.categorie || '',
    sous_categorie: facture?.sous_categorie || '',
    montant: facture?.montant || 0,
    montant_paye: facture?.montant_paye || 0,
    mode_paiement: facture?.mode_paiement || '',
    date_facture: facture?.date_facture
      ? new Date(facture.date_facture).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    date_echeance: facture?.date_echeance
      ? new Date(facture.date_echeance).toISOString().split('T')[0]
      : '',
    commentaire: facture?.commentaire || ''
  });

  const [sousCategories, setSousCategories] = useState([]);
  const [fichierScan, setFichierScan] = useState(null);
  const [fichiersJustificatifs, setFichiersJustificatifs] = useState([]);
 

  const resteAPayer = Math.max(0, Number(form.montant) - Number(form.montant_paye));

  function handleFournisseurChange(e) {
    const id = e.target.value;
    const f = fournisseurs.find(f => f.id === id);
    if (f) {
      const dateF = new Date(form.date_facture);
      const dateEch = new Date(dateF);
      dateEch.setDate(dateEch.getDate() + (f.delai_paiement || 30));
      setForm({
        ...form,
        fournisseur_id: id,
        fournisseur: f.nom,
        date_echeance: dateEch.toISOString().split('T')[0]
      });
    } else {
      setForm({ ...form, fournisseur_id: '', fournisseur: '' });
    }
  }

  function handleCategorieChange(e) {
    const cat = e.target.value;
    setForm({ ...form, categorie: cat, sous_categorie: '' });
    setSousCategories(categoriesDepenses[cat] || []);
  }

  function handleAjouterJustificatif(e) {
    const fichiers = Array.from(e.target.files);
    setFichiersJustificatifs(prev => [...prev, ...fichiers]);
    e.target.value = '';
  }

  function supprimerJustificatif(index) {
    setFichiersJustificatifs(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {facture ? '✏️ Modifier facture fournisseur' : '➕ Nouvelle facture fournisseur'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

          {/* Fournisseur */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Fournisseur *</label>
            <select
              style={styles.input}
              value={form.fournisseur_id}
              onChange={handleFournisseurChange}
            >
              <option value="">Sélectionner un fournisseur</option>
              {fournisseurs.filter(f => f.actif).map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>

          

          {/* Date facture */}
          <div>
            <label style={styles.label}>Date facture *</label>
            <input
              style={styles.input}
              type="date"
              value={form.date_facture}
              onChange={e => setForm({ ...form, date_facture: e.target.value })}
            />
          </div>

          {/* Date échéance */}
          <div>
            <label style={styles.label}>Date échéance</label>
            <input
              style={styles.input}
              type="date"
              value={form.date_echeance}
              onChange={e => setForm({ ...form, date_echeance: e.target.value })}
            />
          </div>

          {/* Montant total */}
          <div>
            <label style={styles.label}>Montant total (Ar) *</label>
            <input
              style={styles.input}
              type="number"
              value={form.montant}
              onChange={e => setForm({ ...form, montant: Number(e.target.value) })}
            />
          </div>

          {/* Montant déjà payé */}
          <div>
            <label style={styles.label}>Montant déjà payé (Ar)</label>
            <input
              style={styles.input}
              type="number"
              value={form.montant_paye}
              onChange={e => setForm({ ...form, montant_paye: Number(e.target.value) })}
            />
          </div>

          {/* Reste à payer — automatique */}
          <div>
            <label style={styles.label}>Reste à payer (Ar)</label>
            <input
              style={{ ...styles.input, background: '#f5f5f5', color: resteAPayer > 0 ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}
              value={resteAPayer.toLocaleString('fr-FR')}
              readOnly
            />
          </div>

          {/* Mode de paiement */}
          <div>
            <label style={styles.label}>Mode de paiement</label>
            <select
              style={styles.input}
              value={form.mode_paiement}
              onChange={e => setForm({ ...form, mode_paiement: e.target.value })}
            >
              <option value="">Sélectionner</option>
              {modesPaiement.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <label style={styles.label}>Catégorie</label>
            <select
              style={styles.input}
              value={form.categorie}
              onChange={handleCategorieChange}
            >
              <option value="">Sélectionner une catégorie</option>
              {Object.keys(categoriesDepenses).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sous-catégorie */}
          {sousCategories.length > 0 && (
            <div>
              <label style={styles.label}>Sous-catégorie</label>
              <select
                style={styles.input}
                value={form.sous_categorie}
                onChange={e => setForm({ ...form, sous_categorie: e.target.value })}
              >
                <option value="">Sélectionner</option>
                {sousCategories.map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>
          )}

          {/* Descriptif */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Descriptif</label>
            <textarea
              style={{ ...styles.input, height: '80px', resize: 'vertical' }}
              value={form.commentaire}
              onChange={e => setForm({ ...form, commentaire: e.target.value })}
              placeholder="Description de la facture..."
            />
          </div>

          {/* Scan de la facture */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>📄 Scan de la facture (PDF ou image)</label>
            <input
              style={styles.input}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFichierScan(e.target.files[0])}
            />
            {fichierScan && (
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                Fichier sélectionné : {fichierScan.name}
              </p>
            )}
          </div>

          {/* Justificatifs de paiement */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>📎 Justificatifs de paiement (plusieurs fichiers possibles)</label>
            <input
              style={styles.input}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={handleAjouterJustificatif}
            />
            {fichiersJustificatifs.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {fichiersJustificatifs.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    background: '#f5f5f5',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    <span>📄 {f.name}</span>
                    <button
                      style={{ ...styles.boutonDanger, padding: '2px 8px' }}
                      onClick={() => supprimerJustificatif(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Résumé paiement */}
        {form.montant > 0 && (
          <div style={{
            background: resteAPayer === 0 ? '#e8f5e9' : '#fff3e0',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '15px',
            fontSize: '13px'
          }}>
            <strong>Résumé :</strong><br />
            Montant total : {Number(form.montant).toLocaleString('fr-FR')} Ar<br />
            Montant payé : {Number(form.montant_paye).toLocaleString('fr-FR')} Ar<br />
            <span style={{ color: resteAPayer > 0 ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}>
              Reste à payer : {resteAPayer.toLocaleString('fr-FR')} Ar
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours}
            onClick={async () => {
             setEnCours(true);
             await onSave(form, fichierScan, fichiersJustificatifs);
             setEnCours(false);
            }}
         >
            {enCours ? '⏳ Enregistrement...' : (facture ? 'Modifier' : 'Créer')}
          </button>
        </div>
      </div>
    </div>
  );
}
function ModalJustificatifs({ facture, onClose }) {
  const justificatifs = Array.isArray(facture.justificatifs_url)
    ? facture.justificatifs_url
    : typeof facture.justificatifs_url === 'string'
      ? JSON.parse(facture.justificatifs_url)
      : [];
  
  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '500px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          📎 Justificatifs — {facture.numero}
        </h3>

        {(!facture.justificatifs_url || facture.justificatifs_url.length === 0) ? (
          <p style={{ color: '#666' }}>Aucun justificatif.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {justificatifs.map((url, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#f5f5f5',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '13px' }}>
                  📄 Justificatif {i + 1}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...styles.boutonSecondaire,
                    textDecoration: 'none',
                    padding: '4px 12px'
                  }}
                >
                  👁️ Voir
                </a>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function ModalAjouterPJ({ facture, onClose, onUpload }) {
  const [fichier, setFichier] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '450px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          📎 Ajouter justificatif — {facture.numero}
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
          <button
            style={styles.boutonPrimaire}
            disabled={!fichier || loading}
            onClick={async () => {
              setLoading(true);
              await onUpload(fichier);
              setLoading(false);
            }}
          >
            {loading ? 'Upload...' : '📤 Uploader'}
          </button>
        </div>
      </div>
    </div>
  );
}
// Page principale Factures Fournisseurs
export default function FacturesFournisseurs() {
  const { entreprise } = useAuth();
  const [factures, setFactures] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [filtreFournisseur, setFiltreFournisseur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const parPage = 20;
  const [modalOuvert, setModalOuvert] = useState(null);
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [modalPaiement, setModalPaiement] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState('');

  const statuts = ['TOUS', 'EN_ATTENTE', 'PAIEMENT_PARTIEL', 'PAYEE', 'EN_RETARD', 'ANNULEE'];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [facturesRes, fournisseursRes] = await Promise.all([
        fournisseurService.getAll(entreprise.id),
        fournisseurListeService.getAll(entreprise.id)
      ]);
      setFactures(facturesRes.data.data || []);
      setFournisseurs(fournisseursRes.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement.');
    } finally {
      setLoading(false);
    }
  }

  async function convertirFichierBase64(fichier) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(fichier);
    });
  }

  async function sauvegarderFacture(form, fichierScan, fichiersJustificatifs) {
    try {
      // Préparer les données
    
      const donnees = {
       
        entreprise_id: entreprise.id,
        fournisseur_id: form.fournisseur_id,
        fournisseur: form.fournisseur,
        numero: form.numero,
        categorie: form.categorie,
        sous_categorie: form.sous_categorie,
        montant: form.montant,
        montant_paye: form.montant_paye,
        mode_paiement: form.mode_paiement,
        date_facture: form.date_facture,
        date_echeance: form.date_echeance || null,
        commentaire: form.commentaire,
        statut: form.montant_paye >= form.montant ? 'PAYEE' : form.montant_paye > 0 ? 'PAIEMENT_PARTIEL' : 'EN_ATTENTE'
      };
      let factureId;

      if (factureSelectionnee) {
        await fournisseurService.modifier(factureSelectionnee.id, donnees);
        factureId = factureSelectionnee.id;
        toast.success('Facture modifiée !');
      } else {
        const res = await fournisseurService.creer(donnees);
        factureId = res.data.data.id;
        toast.success('Facture créée !');
      }

      // Upload scan facture
      if (fichierScan) {
  
        const base64 = await convertirFichierBase64(fichierScan);
        await fetch(`${API_URL}/api/fournisseurs/${factureId}/upload-scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fichier_base64: base64,
            nom_fichier: fichierScan.name,
            type_mime: fichierScan.type
          })
        });
      }

      // Upload justificatifs
      for (let i = 0; i < fichiersJustificatifs.length; i++) {
        const fichier = fichiersJustificatifs[i];
        const base64 = await convertirFichierBase64(fichier);
        await fetch(`${API_URL}/api/fournisseurs/${factureId}/upload-justificatif`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fichier_base64: base64,
            nom_fichier: fichier.name,
            type_mime: fichier.type,
            index: i + 1
          })
        });
      }

      setModalOuvert(null);
      setFactureSelectionnee(null);
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur sauvegarde.');
    }
  }

  async function changerStatut(id, statut) {
    try {
      await fournisseurService.changerStatut(id, statut);
      toast.success(`Statut mis à jour : ${statut}`);
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur changement statut.');
    }
  }

  const facturesFiltrees = factures.filter(f => {
    const matchStatut = filtreStatut === 'TOUS' || f.statut === filtreStatut;
    const matchFournisseur = !filtreFournisseur || f.fournisseur === filtreFournisseur;
    const matchRecherche = !recherche ||
      f.fournisseur?.toLowerCase().includes(recherche.toLowerCase()) ||
      f.numero?.toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchFournisseur && matchRecherche;
  });

  const totalPages = Math.ceil(facturesFiltrees.length / parPage);
  const facturesPage = facturesFiltrees.slice((page - 1) * parPage, page * parPage);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modalOuvert === 'creer' && (
        <FormulaireFactureFournisseur
          facture={factureSelectionnee}
          fournisseurs={fournisseurs}
          entreprise_id={entreprise.id}
          onSave={sauvegarderFacture}
          onCancel={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
        />
      )}

      {modalOuvert === 'justificatifs' && factureSelectionnee && (
        <ModalJustificatifs
          facture={factureSelectionnee}
          onClose={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
        />
      )}
      {modalPaiement && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, width: '400px' }}>
            <h3 style={{ color: '#004d5a', marginTop: 0 }}>💰 Enregistrer un paiement</h3>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
              <div><strong>Facture :</strong> {modalPaiement.numero}</div>
              <div><strong>Montant total :</strong> {Number(modalPaiement.montant).toLocaleString('fr-FR')} Ar</div>
              <div><strong>Déjà payé :</strong> {Number(modalPaiement.montant_paye).toLocaleString('fr-FR')} Ar</div>
              <div><strong>Reste à payer :</strong> {Number(modalPaiement.montant - modalPaiement.montant_paye).toLocaleString('fr-FR')} Ar</div>
            </div>
            <div>
              <label style={styles.label}>Montant du paiement (Ar) *</label>
              <input style={styles.input} type="number"
                value={montantPaiement}
                onChange={e => setMontantPaiement(e.target.value)}
                placeholder="Montant payé ce jour..." />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button style={styles.boutonSecondaire}
                onClick={() => { setModalPaiement(null); setMontantPaiement(''); }}>
                Annuler
              </button>
              <button style={styles.boutonPrimaire}
                onClick={async () => {
                  if (!montantPaiement || Number(montantPaiement) <= 0) {
                    toast.error('Montant invalide.');
                    return;
                  }
                  try {
                    await fournisseurService.enregistrerPaiement(modalPaiement.id, {
                      montant_paye: Number(montantPaiement)
                    });
                    toast.success('Paiement enregistré !');
                    setModalPaiement(null);
                    setMontantPaiement('');
                    chargerDonnees();
                  } catch (err) {
                    toast.error('Erreur enregistrement paiement.');
                  }
                }}>
                💾 Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
      {modalOuvert === 'ajouterPJ' && factureSelectionnee && (
        <ModalAjouterPJ
          facture={factureSelectionnee}
          onClose={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
          onUpload={async (fichier) => {
           const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(fichier);
         });
           await fetch(
            `${API_URL}/api/fournisseurs/${factureSelectionnee.id}/upload-justificatif`,
           {
               method: 'POST',
               headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
               body: JSON.stringify({
                fichier_base64: base64,
                nom_fichier: fichier.name,
                type_mime: fichier.type,
                index: (factureSelectionnee.justificatifs_url?.length || 0) + 1
             })
           }
         );
         toast.success('Justificatif ajouté !');
         setModalOuvert(null);
         setFactureSelectionnee(null);
         chargerDonnees();
         }}
       />
     )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>📄 Factures fournisseurs</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {factures.length} facture(s) au total
          </p>
        </div>
        <button
          style={styles.boutonPrimaire}
          onClick={() => { setFactureSelectionnee(null); setModalOuvert('creer'); }}
        >
          + Nouvelle facture
        </button>
      </div>

      {/* Filtres */}
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={styles.label}>Rechercher</label>
            <input
              style={{ ...styles.input, width: '250px' }}
              placeholder="Fournisseur, N° facture..."
              value={recherche}
              onChange={e => { setRecherche(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label style={styles.label}>Fournisseur</label>
            <select
              style={{ ...styles.input, width: '200px' }}
              value={filtreFournisseur}
              onChange={e => { setFiltreFournisseur(e.target.value); setPage(1); }}
            >
              <option value="">Tous les fournisseurs</option>
              {fournisseurs.map(f => (
                <option key={f.id} value={f.nom}>{f.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtres statut */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '15px', flexWrap: 'wrap' }}>
          {statuts.map(s => {
            const info = couleurStatut(s);
            return (
              <button
                key={s}
                onClick={() => { setFiltreStatut(s); setPage(1); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  background: filtreStatut === s ? '#004d5a' : '#e0e0e0',
                  color: filtreStatut === s ? 'white' : '#333',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {s === 'TOUS' ? 'Toutes' : info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tableau */}
      <div style={styles.card}>
        {facturesPage.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucune facture trouvée.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['N°', 'Fournisseur', 'Date', 'Échéance', 'Montant', 'Payé', 'Reste', 'Catégorie', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '13px',
                    color: '#555',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturesPage.map((f, i) => {
                const statut = couleurStatut(f.statut);
                const resteAPayer = Math.max(0, Number(f.montant) - Number(f.montant_paye || 0));
                return (
                  <tr key={f.id} style={{
                    background: i % 2 === 0 ? 'white' : '#fafafa',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                      {f.numero || '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{f.fournisseur}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {f.date_facture ? new Date(f.date_facture).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                      {Number(f.montant || 0).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#2e7d32' }}>
                      {Number(f.montant_paye || 0).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: resteAPayer > 0 ? '#c62828' : '#2e7d32' }}>
                      {resteAPayer.toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      {f.sous_categorie || f.categorie || '—'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: statut.bg,
                        color: statut.color,
                        whiteSpace: 'nowrap'
                      }}>
                        {statut.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                          onClick={() => { setFactureSelectionnee(f); setModalOuvert('creer'); }}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        {/* Voir scan */}
                        {f.pj_url ? (
                         <a
                          href={f.pj_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                           ...styles.boutonSecondaire,
                           padding: '4px 8px',
                           textDecoration: 'none'
                    }}
                          title="Voir scan"
             >
                          📄
                         </a>
                        ) : (
                          <span
                           style={{ ...styles.boutonSecondaire, padding: '4px 8px', 
                           cursor: 'default', opacity: 0.5, fontSize: '12px' }}
                           title="Document non disponible — non stocké sur la plateforme"
                          >
                          📄
                          </span>
                   )}
                        {/* Voir justificatifs existants */}
                        {f.justificatifs_url &&
                        Array.isArray(f.justificatifs_url) &&
                        f.justificatifs_url.length > 0 && (
                          <button
                            style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                            onClick={() => { setFactureSelectionnee(f); setModalOuvert('justificatifs'); }}
                            title="Voir justificatifs"
                >
                           📎 {f.justificatifs_url.length}
                          </button>
                        )}

                        {/* Ajouter justificatif — toujours visible */}
                        <button
                          style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                          onClick={() => { setFactureSelectionnee(f); setModalOuvert('ajouterPJ'); }}
                          title="Ajouter justificatif"
                        >
                          ➕📎
                        </button>
                        {(f.statut === 'EN_ATTENTE' || f.statut === 'PAIEMENT_PARTIEL') && (
                          <button
                            style={{ ...styles.boutonSecondaire, padding: '4px 8px',
                              color: '#1565c0', borderColor: '#1565c0' }}
                            onClick={() => { setModalPaiement(f); setMontantPaiement(''); }}
                            title="Enregistrer paiement partiel">💰
                          </button>
        )}

                        {/* Marquer payée */}
                        {(f.statut === 'EN_ATTENTE' || f.statut === 'PAIEMENT_PARTIEL') && (
                          <button
                            style={{ ...styles.boutonSecondaire, padding: '4px 8px', color: '#2e7d32', borderColor: '#2e7d32' }}
                            onClick={() => changerStatut(f.id, 'PAYEE')}
                            title="Marquer payée totalement"
                          >
                            ✅
                          </button>
                        )}
                        {(f.statut === 'EN_ATTENTE' || f.statut === 'PAIEMENT_PARTIEL') && (
                          <button
                            style={{ ...styles.boutonDanger, padding: '4px 8px' }}
                            onClick={() => changerStatut(f.id, 'ANNULEE')}
                            title="Annuler"
                          >
                            ❌
                          </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            style={{ ...styles.boutonSecondaire, padding: '6px 12px', opacity: page === 1 ? 0.5 : 1 }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Précédent
          </button>
          <span style={{ color: '#666', fontSize: '13px' }}>
            Page {page}/{totalPages} — {facturesFiltrees.length} facture(s)
          </span>
          <button
            style={{ ...styles.boutonSecondaire, padding: '6px 12px', opacity: page === totalPages ? 0.5 : 1 }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
