import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { tiersService, tiersListeService } from '../services/api';

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
    display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333', fontSize: '13px'
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
    width: '700px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const categoriesTiers = {
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
  '40 - Fournisseurs et comptes rattachés': [
    '401 - Fournisseurs',
    '402 - Fournisseurs effets à payer',
    '403 - Fournisseurs d\'immobilisations',
    '404 - Fournisseurs d\'immobilisations effets à payer',
    '405 - Fournisseurs factures non parvenues',
    '408 - Fournisseurs débiteurs',
    '409 - Fournisseurs'
  ],
  '41 - Clients et comptes rattachés': [
    '411 - Clients',
    '413 - Clients effets à recevoir',
    '416 - Clients douteux',
    '417 - Créances sur travaux non encore facturables',
    '418 - Clients produits non encore facturés',
    '419 - Clients créditeurs'
  ],
  '42 - Personnel et comptes rattachés': [
    '421 - Personnel - rémunérations dues',
    '422 - Personnel - œuvres sociales',
    '425 - Personnel - avances et acomptes accordés',
    '426 - Personnel - dépôts reçus',
    '427 - Personnel - opposition',
    '428 - Personnel - charges à payer et produits à recevoir'
  ],
  '43 - Organismes sociaux': [
    '431 - Organismes sociaux A',
    '432 - Organismes sociaux B',
    '438 - Organismes sociaux - charges à payer'
  ],
  '44 - État et collectivités': [
    '441 - État - subventions à recevoir',
    '442 - État - impôts et taxes recouvrables',
    '443 - Opérations particulières avec l\'État',
    '444 - État - impôts sur les résultats',
    '445 - État - taxes sur le chiffre d\'affaires',
    '447 - État - autres impôts et versements',
    '448 - État - charges à payer et produits à recevoir'
  ],
  '45 - Groupe et Associés': [
    '451 - Opérations Groupe',
    '452 - Associés - opérations courantes',
    '456 - Associés - opérations sur le capital',
    '457 - Associés - dividendes à payer',
    '458 - Associés - opérations faites en commun'
  ],
  '46 - Débiteurs et créditeurs divers': [
    '462 - Créances sur cessions d\'immobilisations',
    '464 - Dettes sur acquisitions de valeurs mobilières',
    '465 - Créances sur cessions de valeurs mobilières',
    '467 - Autres comptes débiteurs ou créditeurs',
    '468 - Divers - charges à payer ou produits à recevoir'
  ],
  '47 - Comptes transitoires ou d\'attente': [],
  '48 - Charges ou produits constatés d\'avance': [
    '481 - Provisions - passifs courants',
    '486 - Charges constatées d\'avance',
    '487 - Produits constatés d\'avance'
  ],
  '49 - Pertes de valeur sur comptes de tiers': [
    '491 - Pertes de valeur sur comptes de clients',
    '495 - Pertes de valeur sur comptes du groupe',
    '496 - Pertes de valeur sur comptes de débiteurs divers'
  ],
  '50 - Valeurs mobilières de placement': [
    '501 - Part dans des entreprises liées',
    '503 - Actions',
    '504 - Autres titres conférant un droit de propriété',
    '505 - Obligations et bons rachetés',
    '506 - Obligations',
    '507 - Bons du trésor',
    '508 - Autres valeurs mobilières',
    '509 - Versements restant à effectuer'
  ],
  '51 - Banque et établissements financiers': [
    '511 - Valeurs à l\'encaissement',
    '512 - Banques comptes courants',
    '515 - Caisse du Trésor Public',
    '517 - Autres organismes financiers',
    '518 - Intérêts courus',
    '519 - Concours bancaires courants'
  ],
  '53 - Caisse': [],
  '54 - Régies d\'avances et accréditifs': [],
  '58 - Virements internes': [
    '581 - Virements de fonds',
    '588 - Autres virements internes'
  ],
  '59 - Pertes de valeur sur comptes financiers': [
    '591 - Pertes de valeur sur valeurs en banque',
    '594 - Pertes de valeur sur régies d\'avances'
  ]
};

const depenses = [
  'Dépenses banque',
  'Dépenses caisse',
  'Dépenses Mvola',
  'Dépenses Orange money',
  'Dépenses Airtel money',
  'Dépense associé'
];

const recettes = [
  'Recettes banque',
  'Recette caisse',
  'Recette Mvola',
  'Recette Orange money',
  'Recette Airtel money',
  'Recette associé'
];

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
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>📎 Justificatifs — {facture.numero}</h3>
        {justificatifs.length === 0 ? (
          <p style={{ color: '#666' }}>Aucun justificatif.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {justificatifs.map((url, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', background: '#f5f5f5', borderRadius: '8px'
              }}>
                <span style={{ fontSize: '13px' }}>📄 Justificatif {i + 1}</span>
                <a href={url} target="_blank" rel="noreferrer"
                  style={{ ...styles.boutonSecondaire, textDecoration: 'none', padding: '4px 12px' }}>
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

function FormulaireFactureTiers({ facture, tiers, entreprise_id, onSave, onCancel }) {
  const [form, setForm] = useState({
    tiers_id: facture?.tiers_id || '',
    tiers: facture?.tiers || '',
    categorie: facture?.categorie || '',
    sous_categorie: facture?.sous_categorie || '',
    depense: facture?.depense || '',
    recette: facture?.recette || '',
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

  function handleTiersChange(e) {
    const id = e.target.value;
    const t = tiers.find(t => t.id === id);
    if (t) {
      const dateF = new Date(form.date_facture);
      const dateEch = new Date(dateF);
      dateEch.setDate(dateEch.getDate() + (t.delai_paiement || 30));
      setForm({
        ...form,
        tiers_id: id,
        tiers: t.nom,
        date_echeance: dateEch.toISOString().split('T')[0]
      });
    }
  }

  function handleCategorieChange(e) {
    const cat = e.target.value;
    setForm({ ...form, categorie: cat, sous_categorie: '' });
    setSousCategories(categoriesTiers[cat] || []);
  }

  function handleAjouterJustificatif(e) {
    setFichiersJustificatifs(prev => [...prev, ...Array.from(e.target.files)]);
    e.target.value = '';
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          {facture ? '✏️ Modifier facture tiers' : '➕ Nouvelle facture tiers'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

          {/* Tiers */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Tiers *</label>
            <select style={styles.input} value={form.tiers_id} onChange={handleTiersChange}>
              <option value="">Sélectionner un tiers</option>
              {tiers.filter(t => t.actif).map(t => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
          </div>

          {/* Date facture */}
          <div>
            <label style={styles.label}>Date facture *</label>
            <input style={styles.input} type="date" value={form.date_facture}
              onChange={e => setForm({ ...form, date_facture: e.target.value })} />
          </div>

          {/* Date échéance */}
          <div>
            <label style={styles.label}>Date limite paiement</label>
            <input style={styles.input} type="date" value={form.date_echeance}
              onChange={e => setForm({ ...form, date_echeance: e.target.value })} />
          </div>

          {/* Montant total */}
          <div>
            <label style={styles.label}>Montant total (Ar) *</label>
            <input style={styles.input} type="number" value={form.montant}
              onChange={e => setForm({ ...form, montant: Number(e.target.value) })} />
          </div>

          {/* Montant payé */}
          <div>
            <label style={styles.label}>Montant payé (Ar)</label>
            <input style={styles.input} type="number" value={form.montant_paye}
              onChange={e => setForm({ ...form, montant_paye: Number(e.target.value) })} />
          </div>

          {/* Reste à payer */}
          <div>
            <label style={styles.label}>Reste à payer (Ar)</label>
            <input style={{
              ...styles.input, background: '#f5f5f5',
              color: resteAPayer > 0 ? '#c62828' : '#2e7d32', fontWeight: 'bold'
            }} value={resteAPayer.toLocaleString('fr-FR')} readOnly />
          </div>

          {/* Mode paiement */}
          <div>
            <label style={styles.label}>Mode de paiement</label>
            <select style={styles.input} value={form.mode_paiement}
              onChange={e => setForm({ ...form, mode_paiement: e.target.value })}>
              <option value="">Sélectionner</option>
              {modesPaiement.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Dépenses */}
          <div>
            <label style={styles.label}>Dépenses</label>
            <select style={styles.input} value={form.depense}
              onChange={e => setForm({ ...form, depense: e.target.value })}>
              <option value="">Sélectionner</option>
              {[
                'Dépenses banque',
                'Dépenses caisse',
                'Dépenses Mvola',
                'Dépenses Orange money',
                'Dépenses Airtel money',
                'Dépense associé'
              ].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Recettes */}
          <div>
            <label style={styles.label}>Recettes</label>
            <select style={styles.input} value={form.recette}
              onChange={e => setForm({ ...form, recette: e.target.value })}>
              <option value="">Sélectionner</option>
              {[
                'Recettes banque',
                'Recette caisse',
                'Recette Mvola',
                'Recette Orange money',
                'Recette Airtel money',
                'Recette associé'
              ].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>


          {/* Catégorie */}
          <div>
            <label style={styles.label}>Catégorie</label>
            <select style={styles.input} value={form.categorie} onChange={handleCategorieChange}>
              <option value="">Sélectionner une catégorie</option>
              {Object.keys(categoriesTiers).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sous-catégorie */}
          {sousCategories.length > 0 && (
            <div>
              <label style={styles.label}>Sous-catégorie</label>
              <select style={styles.input} value={form.sous_categorie}
                onChange={e => setForm({ ...form, sous_categorie: e.target.value })}>
                <option value="">Sélectionner</option>
                {sousCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
              </select>
            </div>
          )}

          {/* Descriptif */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Descriptif</label>
            <textarea style={{ ...styles.input, height: '70px', resize: 'vertical' }}
              value={form.commentaire}
              onChange={e => setForm({ ...form, commentaire: e.target.value })}
              placeholder="Description..." />
          </div>

          {/* Scan */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>📄 Scan de la facture</label>
            <input style={styles.input} type="file" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFichierScan(e.target.files[0])} />
            {fichierScan && (
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                {fichierScan.name}
              </p>
            )}
          </div>

          {/* Justificatifs */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>📎 Justificatifs (plusieurs fichiers possibles)</label>
            <input style={styles.input} type="file" accept=".pdf,.jpg,.jpeg,.png"
              multiple onChange={handleAjouterJustificatif} />
            {fichiersJustificatifs.length > 0 && (
             <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
               {fichiersJustificatifs.map((f, i) => (
                 <div key={i} style={{
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                   padding: '6px 10px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px'
             }}>
                   <span>📄 {f.name}</span>
                   <button style={{ ...styles.boutonDanger, padding: '2px 8px' }}
                     onClick={() => setFichiersJustificatifs(prev => prev.filter((_, j) => j !== i))}>✕</button>
                 </div>
             ))}
            </div>
           )}
          </div>

        {/* Résumé */}
        {form.montant > 0 && (
          <div style={{
            background: resteAPayer === 0 ? '#e8f5e9' : '#fff3e0',
            borderRadius: '8px', padding: '12px', marginTop: '15px', fontSize: '13px'
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
          <button style={styles.boutonPrimaire}
            onClick={() => onSave(form, fichierScan, fichiersJustificatifs)}>
            {facture ? 'Modifier' : 'Créer'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}



export default function FacturesTiers() {
  const { entreprise } = useAuth();
  const [factures, setFactures] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [filtreTiers, setFiltreTiers] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const parPage = 20;
  const [modalOuvert, setModalOuvert] = useState(null);
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);

  const statuts = ['TOUS', 'EN_ATTENTE', 'PAYEE', 'EN_RETARD', 'ANNULEE'];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    try {
      const [facturesRes, tiersRes] = await Promise.all([
        tiersService.getAll(entreprise.id),
        tiersListeService.getAll(entreprise.id)
      ]);
      setFactures(facturesRes.data.data || []);
      setTiers(tiersRes.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement.');
    } finally {
      setLoading(false);
    }
  }

  async function convertirBase64(fichier) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(fichier);
    });
  }

  async function sauvegarderFacture(form, fichierScan, fichiersJustificatifs) {
    try {
      const donnees = {
        entreprise_id: entreprise.id,
        tiers_id: form.tiers_id,
        tiers: form.tiers,
        categorie: form.categorie,
        sous_categorie: form.sous_categorie,
        depense: form.depense,
        recette: form.recette,
        montant: form.montant,
        montant_paye: form.montant_paye,
        mode_paiement: form.mode_paiement,
        date_facture: form.date_facture,
        date_echeance: form.date_echeance || null,
        commentaire: form.commentaire,
        statut: Number(form.montant_paye) >= Number(form.montant) ? 'PAYEE' : 'EN_ATTENTE'
      };

      let factureId;
      if (factureSelectionnee) {
        await tiersService.modifier(factureSelectionnee.id, donnees);
        factureId = factureSelectionnee.id;
        toast.success('Facture modifiée !');
      } else {
        const res = await tiersService.creer(donnees);
        factureId = res.data.data.id;
        toast.success('Facture créée !');
      }

      if (fichierScan) {
        const base64 = await convertirBase64(fichierScan);
        await fetch(`http://localhost:5000/api/tiers/${factureId}/upload-scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fichier_base64: base64, nom_fichier: fichierScan.name, type_mime: fichierScan.type
          })
        });
      }

      for (let i = 0; i < fichiersJustificatifs.length; i++) {
        const fichier = fichiersJustificatifs[i];
        const base64 = await convertirBase64(fichier);
        await fetch(`http://localhost:5000/api/tiers/${factureId}/upload-justificatif`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fichier_base64: base64, nom_fichier: fichier.name,
            type_mime: fichier.type, index: i + 1
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
      await tiersService.changerStatut(id, statut);
      toast.success(`Statut mis à jour : ${statut}`);
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur changement statut.');
    }
  }

  const facturesFiltrees = factures.filter(f => {
    const matchStatut = filtreStatut === 'TOUS' || f.statut === filtreStatut;
    const matchTiers = !filtreTiers || f.tiers === filtreTiers;
    const matchRecherche = !recherche ||
      f.tiers?.toLowerCase().includes(recherche.toLowerCase()) ||
      f.numero?.toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchTiers && matchRecherche;
  });

  const totalPages = Math.ceil(facturesFiltrees.length / parPage);
  const facturesPage = facturesFiltrees.slice((page - 1) * parPage, page * parPage);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {modalOuvert === 'creer' && (
        <FormulaireFactureTiers
          facture={factureSelectionnee}
          tiers={tiers}
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
        `http://localhost:5000/api/tiers/${factureSelectionnee.id}/upload-justificatif`,
        { method: 'POST',
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>📄 Factures tiers</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {factures.length} facture(s) au total
          </p>
        </div>
        <button style={styles.boutonPrimaire}
          onClick={() => { setFactureSelectionnee(null); setModalOuvert('creer'); }}>
          + Nouvelle facture
        </button>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={styles.label}>Rechercher</label>
            <input style={{ ...styles.input, width: '250px' }}
              placeholder="Tiers, N° facture..."
              value={recherche} onChange={e => { setRecherche(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label style={styles.label}>Tiers</label>
            <select style={{ ...styles.input, width: '200px' }} value={filtreTiers}
              onChange={e => { setFiltreTiers(e.target.value); setPage(1); }}>
              <option value="">Tous les tiers</option>
              {tiers.map(t => <option key={t.id} value={t.nom}>{t.nom}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '15px', flexWrap: 'wrap' }}>
          {statuts.map(s => {
            const info = couleurStatut(s);
            return (
              <button key={s} onClick={() => { setFiltreStatut(s); setPage(1); }}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  background: filtreStatut === s ? '#004d5a' : '#e0e0e0',
                  color: filtreStatut === s ? 'white' : '#333',
                  fontSize: '12px', fontWeight: 'bold'
                }}>
                {s === 'TOUS' ? 'Toutes' : info.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.card}>
        {facturesPage.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Aucune facture trouvée.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['N°', 'Tiers', 'Date', 'Échéance', 'Montant', 'Payé', 'Reste', 'Type', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturesPage.map((f, i) => {
                const statut = couleurStatut(f.statut);
                const resteAPayer = Math.max(0, Number(f.montant) - Number(f.montant_paye || 0));
                return (
                  <tr key={f.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>{f.numero || '—'}</td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{f.tiers}</td>
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
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      <div style={{ fontSize: '11px' }}>
                        {f.depense && (
                         <span style={{
                           display: 'block', padding: '2px 6px', borderRadius: '10px',
                           background: '#ffebee', color: '#c62828', marginBottom: '2px'
                         }}>↓ {f.depense}</span>
             )}
                        {f.recette && (
                         <span style={{
                           display: 'block', padding: '2px 6px', borderRadius: '10px',
                           background: '#e8f5e9', color: '#2e7d32'
                         }}>↑ {f.recette}</span>
                )}
                        {!f.depense && !f.recette && '—'}
                      </div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                        background: statut.bg, color: statut.color, whiteSpace: 'nowrap'
                      }}>
                        {statut.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                          onClick={() => { setFactureSelectionnee(f); setModalOuvert('creer'); }}
                          title="Modifier">✏️</button>
                        {f.pj_url && (
                          <a href={f.pj_url} target="_blank" rel="noreferrer"
                            style={{ ...styles.boutonSecondaire, padding: '4px 8px', textDecoration: 'none' }}
                            title="Voir scan">📄</a>
                        )}
                        {Array.isArray(f.justificatifs_url) && f.justificatifs_url.length > 0 && (
                          <button style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                            onClick={() => { setFactureSelectionnee(f); setModalOuvert('justificatifs'); }}
                            title="Voir justificatifs">📎 {f.justificatifs_url.length}</button>
                        )}
                        {/* Ajouter justificatif — toujours visible */}
                        <button
                          style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                          onClick={() => { setFactureSelectionnee(f); setModalOuvert('ajouterPJ'); }}
                          title="Ajouter justificatif"
             >
                         ➕📎
                        </button>
                        {f.statut === 'EN_ATTENTE' && (
                          <button style={{ ...styles.boutonSecondaire, padding: '4px 8px', color: '#2e7d32', borderColor: '#2e7d32' }}
                            onClick={() => changerStatut(f.id, 'PAYEE')} title="Marquer payée">✅</button>
                        )}
                        {f.statut === 'EN_ATTENTE' && (
                          <button style={{ ...styles.boutonDanger, padding: '4px 8px' }}
                            onClick={() => changerStatut(f.id, 'ANNULEE')} title="Annuler">❌</button>
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
          <button style={{ ...styles.boutonSecondaire, padding: '6px 12px', opacity: page === 1 ? 0.5 : 1 }}
            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Précédent</button>
          <span style={{ color: '#666', fontSize: '13px' }}>
            Page {page}/{totalPages} — {facturesFiltrees.length} facture(s)
          </span>
          <button style={{ ...styles.boutonSecondaire, padding: '6px 12px', opacity: page === totalPages ? 0.5 : 1 }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant →</button>
        </div>
      )}
    </div>
  );
}