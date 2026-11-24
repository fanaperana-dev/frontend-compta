import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { fournisseurService, fournisseurListeService, stockService } from '../services/api';
import useSoumission from '../hooks/useSoumission';
import ModalClassementFacture from '../components/ModalClassementFacture';
import ModalClassementLignes from '../components/ModalClassementLignes';
import FormulaireFactureIntelligente from '../components/FormulaireFactureIntelligente';

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
const styles = {
  boutonPrimaire: {
    background: 'white', color: '#004d5a', border: '2px solid #004d5a',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 'normal'
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

// Seules les dépenses justifiées par une facture de fournisseur sont proposées ici.
// Sont saisies ailleurs : frais bancaires, impôts et taxes, pertes, amendes, charges financières, impôt sur les bénéfices
// (onglet Divers) ; salaires et cotisations (module RH) ; dotations aux amortissements (module Immobilisations) ;
// variation de stock (module Stocks).
const categoriesDepenses = {
  '20 - Immobilisations incorporelles': [
    '203 - Frais de développement immobilisés',
    '204 - Logiciels informatiques et assimilés',
    '205 - Concessions et droits similaires, brevets, licences, marques',
    '207 - Fonds commercial',
    '208 - Autres immobilisations incorporelles'
  ],

  '21 - Immobilisations corporelles': [
    '211 - Terrains',
    '212 - Agencements et aménagements de terrain',
    '213 - Constructions',
    '215 - Installations techniques',
    '218 - Autres immobilisations corporelles'
  ],

  '22 - Immobilisations mises en concession': [
    '221 - Terrains en concession',
    '222 - Agencements et aménagements de terrain en concession',
    '223 - Constructions en concession',
    '225 - Installations techniques en concession',
    '228 - Autres immobilisations corporelles en concession',
    '229 - Droits du concédant'
  ],

  '23 - Immobilisations en cours': [
    '232 - Immobilisations corporelles en cours',
    '237 - Immobilisations incorporelles en cours',
    '238 - Avances et acomptes versés sur commandes d’immobilisations'
  ],

  '24 - Disponible': [],

  '25 - Disponible': [],

  '26 - Participations et créances rattachées à des participations': [
    '261 - Titres de participation',
    '262 - Autres formes de participations',
    '265 - Titres de participation évalués par équivalence',
    '266 - Créances rattachées à des participations groupe',
    '267 - Créances rattachées à des participations hors groupe',
    '268 - Créances rattachées à des sociétés en participation',
    '269 - Versements restant à effectuer sur titres de participation non libérés'
  ],

  '27 - Autres immobilisations financières': [
    '271 - Titres immobilisés autres que les titres immobilisés de l’activité de portefeuille',
    '272 - Titres représentatifs de droit de créance (obligations, bons)',
    '273 - Titres immobilisés de l’activité de portefeuille',
    '274 - Prêts',
    '275 - Dépôts et cautionnements versés',
    '276 - Autres créances immobilisées',
    '277 - Actions propres (ou parts propres)',
    '279 - Versements restant à effectuer sur titres immobilisés non libérés'
  ],

  '28 - Amortissement des immobilisations': [
    '280 - Amortissement des immobilisations incorporelles',
    '281 - Amortissement des immobilisations corporelles',
    '282 - Amortissement des immobilisations mises en concession'
  ],

  '29 - Pertes de valeur sur immobilisations': [
    '290 - Pertes de valeur sur immobilisations incorporelles',
    '291 - Pertes de valeur sur immobilisations corporelles',
    '292 - Dépréciation sur immobilisations mises en concession',
    '293 - Pertes de valeur sur immobilisations en cours',
    '296 - Pertes de valeur sur participations et créances rattachées à participations',
    '297 - Pertes de valeur sur autres immobilisations financières'
  ],
  
  '31 - Matières premières et fournitures': [],
  '32 - Autres approvisionnements': [
    '321 - Matières consommables',
    '322 - Fournitures consommables',
    '326 - Emballages'
  ],
  '33 - En cours de production de biens': [
    '331 - Produits en cours',
    '335 - Travaux en cours'
  ],
  '34 - En cours de production de services': [
    '341 - Études en cours',
    '345 - Prestations de service en cours'
  ],
  '35 - Stocks de produits': [
    '351 - Produits intermédiaires',
    '355 - Produits finis',
    '358 - Produits résiduels ou matières de récupération'
  ],
  '37 - Stocks de marchandises': [],
  '38 - Stocks à l\'extérieur': [],
  '39 - Pertes de valeur sur stocks': [
    '391 - Pertes de valeur Matières premières',
    '392 - Pertes de valeur Autres approvisionnements',
    '393 - Pertes de valeur En cours de production de biens',
    '394 - Pertes de valeur En cours de production de services',
    '395 - Pertes de valeur Stocks de produits',
    '397 - Pertes de valeur Stocks de marchandises',
    '398 - Pertes de valeur Stocks à l\'extérieur'
  ],
  '60 - Achats consommés': [
    '601 - Matières premières',
    '602 - Autres approvisionnements',
    '604 - Achats d\'études et de prestations de service',
    '605 - Achats de matériel, équipements et travaux',
    '606 - Achats non stockés de matières et fournitures',
    '607 - Achats de marchandises',
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
    '628 - Cotisations et divers',
    '629 - Rabais, remises, ristournes obtenus sur autres services extérieurs'
  ],
  '64 - Charges de personnel': [
    '646 - Rémunérations transférées de charges',
    '647 - Autres charges sociales',
    '648 - Autres charges de personnel'
  ],
  '65 - Autres charges des activités ordinaires': [
    '651 - Redevances pour concessions, brevets, licences, logiciels',
    '655 - Quote-part de résultat sur opérations faites en commun',
    '657 - Charges exceptionnelles de gestion courante',
    '658 - Autres charges de gestion courante'
  ],
  '67 - Éléments extraordinaires (charges)': []
};

const modesPaiement = [
    'Virement bancaire',
    'Carte bancaire',
    'Chèque',
    'Espèces',
    'Airtel money',
    'Orange money',
    'Mvola',
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
  const { enCours: envoiEnCours, soumettre } = useSoumission();
  const { entreprise } = useAuth();
  const [regimeTva, setRegimeTva] = useState({ assujettie: false, taux: 20 });
  const [factures, setFactures] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [filtreFournisseur, setFiltreFournisseur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const parPage = 20;
  const [modalOuvert, setModalOuvert] = useState(null);
  const [articlesStock, setArticlesStock] = useState([]);   // articles existants : une ligne de stock peut les réapprovisionner
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [modalPaiement, setModalPaiement] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [datePaiement, setDatePaiement] = useState('');

  const statuts = ['TOUS', 'EN_ATTENTE', 'PAIEMENT_PARTIEL', 'PAYEE', 'EN_RETARD', 'ANNULEE'];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [facturesRes, fournisseursRes, entrepriseRes] = await Promise.all([
        fournisseurService.getAll(entreprise.id),
        fournisseurListeService.getAll(entreprise.id),
        fetch(`${API_URL}/api/entreprises/detail/${entreprise.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()).catch(() => ({}))
      ]);
      setRegimeTva({
        assujettie: entrepriseRes.data?.assujettie_tva === true,
        taux: Number(entrepriseRes.data?.taux_tva) || 20
      });
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

  async function ouvrirCreation() {
    try {
      const res = await stockService.getArticles(entreprise.id);
      setArticlesStock(res.data.data || []);
    } catch (e) { setArticlesStock([]); /* tout sera proposé en nouvel article */ }
    setModalOuvert('creer');
  }

  // Facture intelligente : une seule requête crée la facture, ses lignes, ses paiements, le stock et les immobilisations
  async function sauvegarderFacture(payload, fichierScan, fichiersJustificatifs) {
    try {
      const res = await fournisseurService.creerIntelligente(payload);
      const factureCreee = res.data.data;
      toast.success(res.data.message || 'Facture créée !');
      await envoyerPiecesJointes(factureCreee.id, fichierScan, fichiersJustificatifs);
      setFactureSelectionnee(null);
      setModalOuvert(null);
      chargerDonnees();
      return { ok: true };
    } catch (err) {
      const d = err.response?.data || {};
      if (d.code === 'ENTREE_PARTIELLE') {
        // la facture existe mais le stock s'est arrêté en route : on referme et on prévient
        toast.error(d.message, { autoClose: false });
        setModalOuvert(null);
        chargerDonnees();
        return { ok: true };
      }
      // le formulaire reste ouvert avec le message du serveur : rien n'est perdu
      return { ok: false, code: d.code, libelle: d.libelle, message: d.message || 'Erreur sauvegarde de la facture.' };
    }
  }

  async function envoyerPiecesJointes(factureId, fichierScan, fichiersJustificatifs) {
    const entetes = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` };
    try {
      if (fichierScan) {
        const base64 = await convertirFichierBase64(fichierScan);
        await fetch(`${API_URL}/api/fournisseurs/${factureId}/upload-scan`, {
          method: 'POST', headers: entetes,
          body: JSON.stringify({ fichier_base64: base64, nom_fichier: fichierScan.name, type_mime: fichierScan.type })
        });
      }
      for (let i = 0; i < fichiersJustificatifs.length; i++) {
        const fichier = fichiersJustificatifs[i];
        const base64 = await convertirFichierBase64(fichier);
        await fetch(`${API_URL}/api/fournisseurs/${factureId}/upload-justificatif`, {
          method: 'POST', headers: entetes,
          body: JSON.stringify({ fichier_base64: base64, nom_fichier: fichier.name, type_mime: fichier.type, index: i + 1 })
        });
      }
    } catch (e) {
      toast.warn('Facture créée, mais un document n\'a pas pu être envoyé : ajoute-le avec ➕📎.');
    }
  }

  // Ouvre l'écran de paiement ; ✅ le préremplit avec le reste à payer
  function ouvrirPaiement(facture, solde = false) {
    const reste = Math.max(0, Math.round((Number(facture.montant) - Number(facture.montant_paye || 0)) * 100) / 100);
    setModalPaiement(facture);
    setMontantPaiement(solde ? String(reste) : '');
    setModePaiement('');
    setDatePaiement(new Date().toISOString().split('T')[0]);
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
        <FormulaireFactureIntelligente
          fournisseurs={fournisseurs}
          articles={articlesStock}
          categories={categoriesDepenses}
          modesPaiement={modesPaiement}
          tva={regimeTva}
          entreprise_id={entreprise.id}
          styles={styles}
          onSave={sauvegarderFacture}
          onCancel={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
        />
      )}

      {modalOuvert === 'classement' && factureSelectionnee && (factureSelectionnee.lignes_facture_fournisseur || []).length > 0 && (
        <ModalClassementLignes
          facture={factureSelectionnee}
          categories={categoriesDepenses}
          styles={styles}
          onSave={async (corrections) => {
            try {
              await fournisseurService.modifier(factureSelectionnee.id, { lignes_classement: corrections });
              toast.success('Catégories modifiées.');
              setModalOuvert(null);
              setFactureSelectionnee(null);
              chargerDonnees();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Erreur modification des catégories.');
            }
          }}
          onCancel={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
        />
      )}

      {modalOuvert === 'classement' && factureSelectionnee && !(factureSelectionnee.lignes_facture_fournisseur || []).length && (
        <ModalClassementFacture
          facture={factureSelectionnee}
          categories={categoriesDepenses}
          styles={styles}
          onSave={async (cat, sous) => {
            try {
              await fournisseurService.modifier(factureSelectionnee.id, { categorie: cat, sous_categorie: sous });
              toast.success('Catégorie modifiée.');
              setModalOuvert(null);
              setFactureSelectionnee(null);
              chargerDonnees();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Erreur modification de la catégorie.');
            }
          }}
          onCancel={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
        />
      )}

      {modalOuvert === 'justificatifs' && factureSelectionnee && (
        <ModalJustificatifs
          facture={factureSelectionnee}
          onClose={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
        />
      )}
      {modalPaiement && (() => {
        const reste = Math.max(0, Math.round((Number(modalPaiement.montant) - Number(modalPaiement.montant_paye || 0)) * 100) / 100);
        const fermer = () => { setModalPaiement(null); setMontantPaiement(''); setModePaiement(''); };
        return (
          <div style={styles.modal}>
            <div style={{ ...styles.modalContent, width: '420px' }}>
              <h3 style={{ color: '#004d5a', marginTop: 0 }}>💰 Enregistrer un paiement</h3>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                <div><strong>Facture :</strong> {modalPaiement.numero}</div>
                <div><strong>Montant total :</strong> {Number(modalPaiement.montant).toLocaleString('fr-FR')} Ar</div>
                <div><strong>Déjà payé :</strong> {Number(modalPaiement.montant_paye || 0).toLocaleString('fr-FR')} Ar</div>
                <div><strong>Reste à payer :</strong> {reste.toLocaleString('fr-FR')} Ar</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Montant du paiement (Ar) *</label>
                <input style={styles.input} type="number" min="0" value={montantPaiement}
                  onChange={e => setMontantPaiement(e.target.value)} placeholder="Montant payé..." />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Mode de paiement *</label>
                <select style={styles.input} value={modePaiement} onChange={e => setModePaiement(e.target.value)}>
                  <option value="">Sélectionner</option>
                  {modesPaiement.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>Le paiement va dans le journal correspondant (caisse, banque, mobile money).</div>
              </div>
              <div>
                <label style={styles.label}>Date du paiement *</label>
                <input style={styles.input} type="date" value={datePaiement} onChange={e => setDatePaiement(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button style={styles.boutonSecondaire} onClick={fermer}>Annuler</button>
                <button style={{ ...styles.boutonPrimaire, opacity: envoiEnCours ? 0.6 : 1 }}
                  onClick={() => soumettre(async () => {
                    if (!montantPaiement || Number(montantPaiement) <= 0) { toast.error('Montant invalide.'); return; }
                    if (Number(montantPaiement) > reste + 0.01) { toast.error(`Le paiement dépasse le reste à payer (${reste.toLocaleString('fr-FR')} Ar).`); return; }
                    if (!modePaiement) { toast.error('Choisis le mode de paiement.'); return; }
                    if (!datePaiement) { toast.error('Choisis la date du paiement.'); return; }
                    try {
                      await fournisseurService.enregistrerPaiement(modalPaiement.id, {
                        montant_paye: Number(montantPaiement), mode_paiement: modePaiement, date_paiement: datePaiement
                      });
                      toast.success('Paiement enregistré !');
                      fermer();
                      chargerDonnees();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Erreur enregistrement paiement.');
                    }
                  })} disabled={envoiEnCours}>
                  {envoiEnCours ? '⏳ Patientez...' : '💾 Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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
          onClick={() => { setFactureSelectionnee(null); ouvrirCreation(); }}
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
                      {Number(f.montant_is) > 0 && (
                        <div style={{ fontSize: '11px', fontWeight: 'normal', color: '#888' }}>
                          dont IS {Number(f.montant_is).toLocaleString('fr-FR')} (information)
                        </div>
                      )}
                      {Number(f.montant_tva) > 0 && (
                        <div style={{ fontSize: '11px', fontWeight: 'normal', color: '#888' }}>
                          dont TVA {Number(f.montant_tva).toLocaleString('fr-FR')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#2e7d32' }}>
                      {Number(f.montant_paye || 0).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: resteAPayer > 0 ? '#c62828' : '#2e7d32' }}>
                      {resteAPayer.toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      {(() => {
                        const l = f.lignes_facture_fournisseur || [];
                        const distinctes = new Set(l.map(x => x.sous_categorie || x.categorie)).size;
                        return distinctes > 1 ? `${distinctes} catégories (${l.length} lignes)` : (f.sous_categorie || f.categorie || '—');
                      })()}
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
                        {/* Facture enregistrée : verrouillée, seule la catégorie se corrige */}
                        {f.statut !== 'ANNULEE' && (
                          <button
                            style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                            onClick={() => { setFactureSelectionnee(f); setModalOuvert('classement'); }}
                            title="Facture enregistrée : modifier la catégorie"
                          >
                            🏷️
                          </button>
                        )}
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
                            onClick={() => ouvrirPaiement(f)}
                            title="Enregistrer paiement partiel">💰
                          </button>
        )}

                        {/* Marquer payée */}
                        {(f.statut === 'EN_ATTENTE' || f.statut === 'PAIEMENT_PARTIEL') && (
                          <button
                            style={{ ...styles.boutonSecondaire, padding: '4px 8px', color: '#2e7d32', borderColor: '#2e7d32' }}
                            onClick={() => ouvrirPaiement(f, true)}
                            title="Payer le solde"
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
