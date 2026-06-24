import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { factureService, clientService, mailService, paiementService } from '../services/api';

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
    width: '650px',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

// Couleurs par statut
function couleurStatut(statut) {
  const couleurs = {
    CREE: { bg: '#f5f5f5', color: '#616161', label: '📝 Créée' },
    ENVOYEE: { bg: '#e3f2fd', color: '#1565c0', label: '📧 Envoyée' },
    PAIEMENT_PARTIEL: { bg: '#fff3e0', color: '#e65100', label: '💰 Partiel' },
    PAYEE: { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Payée' },
    EN_RETARD: { bg: '#ffebee', color: '#c62828', label: '⚠️ Retard' },
    ANNULEE: { bg: '#fafafa', color: '#9e9e9e', label: '❌ Annulée' },
    ARCHIVEE: { bg: '#f3e5f5', color: '#6a1b9a', label: '📦 Archivée' }
  };
  return couleurs[statut] || { bg: '#f5f5f5', color: '#616161', label: statut };
}

// Modal création facture
function FormulaireFacture({ clients, onSave, onCancel, entreprise_id, noteDefaut }) {
  const [tropPercu, setTropPercu] = useState(0);
  const [sousCategories, setSousCategories] = useState([]);
  const [enCours, setEnCours] = useState(false);
  const [form, setForm] = useState({
    client_id: '',
    type_facture: 'UNIQUE',
    categorie: '',
    sous_categorie: '',
    mois: '',
    date_facture: new Date().toISOString().split('T')[0],
    delai_paiement: 30,
    note: noteDefaut || '',
    lignes: [{ description: '', quantite: 1, prix_unitaire: 0, remise_pourcent: 0 }]
  });

  const categoriesEtSousCategories = {
  '70 - Ventes de produits fabriqués, marchandises, prestations': [
    '701 - Ventes de produits finis',
    '702 - Ventes de produits intermédiaires',
    '703 - Ventes de produits résiduels',
    '704 - Vente de travaux',
    '705 - Vente d\'études',
    '706 - Vente de prestations de service',
    '707 - Ventes de marchandises',
    '708 - Produits des activités annexes',
    '709 - Rabais, remises et ristournes accordés'
  ],
  '71 - Production stockée (ou déstockage)': [
    '713 - Variation de stocks d\'en-cours',
    '714 - Variation de stocks de produits'
  ],
  '72 - Production immobilisée': [
    '721 - Production immobilisée d\'actif incorporel',
    '722 - Production immobilisée d\'actif corporel'
  ],
  '74 - Subventions d\'exploitation': [
    '741 - Subvention d\'équilibre',
    '748 - Autres subventions d\'exploitation'
  ],
  '75 - Autres produits opérationnels': [
    '751 - Redevances pour concessions, brevets, licences, logiciels',
    '752 - Plus-values sur cessions d\'actifs non courants',
    '753 - Jetons de présence et rémunérations d\'administrateurs',
    '754 - Quotes-parts de subventions d\'investissement virées au résultat',
    '755 - Quote-part de résultat sur opérations faites en commun',
    '756 - Libéralités perçues, rentrées sur créances amorties',
    '757 - Produits exceptionnels sur opérations de gestion',
    '758 - Autres produits de gestion courante'
  ],
  '76 - Produits financiers': [
    '761 - Produits de participations',
    '762 - Produits des autres immobilisations financières',
    '763 - Revenus des autres créances',
    '764 - Revenus et plus-values des valeurs mobilières de placement',
    '766 - Gains de change',
    '767 - Produits nets sur cessions de valeurs mobilières de placement',
    '768 - Autres produits financiers'
  ],
  '77 - Eléments extraordinaires (produits)': [],
  '78 - Reprises sur provisions et pertes de valeur': [
    '781 - Reprise d\'exploitation - actifs non courants',
    '785 - Reprise d\'exploitation - actifs courants',
    '786 - Reprises financières'
  ]
};

  const moisListe = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  function ajouterLigne() {
    setForm({
      ...form,
      lignes: [...form.lignes, { description: '', quantite: 1, prix_unitaire: 0, remise_pourcent: 0 }]
    });
  }

  function supprimerLigne(index) {
    const nouvLignes = form.lignes.filter((_, i) => i !== index);
    setForm({ ...form, lignes: nouvLignes });
  }

  function modifierLigne(index, champ, valeur) {
    const nouvLignes = [...form.lignes];
    nouvLignes[index][champ] = valeur;
    setForm({ ...form, lignes: nouvLignes });
  }

  function calculerTotal() {
    return form.lignes.reduce((sum, l) => {
      const brut = Number(l.quantite) * Number(l.prix_unitaire);
      return sum + (brut - (brut * Number(l.remise_pourcent) / 100));
    }, 0);
  }

  // Quand on sélectionne un client, on récupère son délai
  function handleClientChange(e) {
    const clientId = e.target.value;
    const client = clients.find(c => c.id === clientId);
    setForm({
      ...form,
      client_id: clientId,
      delai_paiement: client?.delai_paiement || 30
    });
  }
  async function handleClientChange(e) {
  const clientId = e.target.value;
  const client = clients.find(c => c.id === clientId);
  setForm({
    ...form,
    client_id: clientId,
    delai_paiement: client?.delai_paiement || 30
  });

  // Récupérer le trop perçu du client
  if (clientId) {
    try {
      const res = await fetch(
        `http://localhost:5000/api/paiements/credit/${entreprise_id}/${clientId}`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        }
      );
      const data = await res.json();
      setTropPercu(data.credit || 0);
    } catch (err) {
      setTropPercu(0);
    }
  } else {
    setTropPercu(0);
  }
}

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>🧾 Nouvelle facture</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={styles.label}>Client *</label>
            <select
              style={styles.input}
              value={form.client_id}
              onChange={handleClientChange}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.filter(c => c.actif === 'OUI').map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.societe ? `(${c.societe})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Type facture</label>
            <select
              style={styles.input}
              value={form.type_facture}
              onChange={e => setForm({ ...form, type_facture: e.target.value })}
            >
              <option value="UNIQUE">Unique</option>
              <option value="MENSUELLE">Mensuelle</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Catégorie</label>
            <select
              style={styles.input}
              value={form.categorie}
              onChange={e => {
               const cat = e.target.value;
               setForm({ ...form, categorie: cat, sous_categorie: '' });
               setSousCategories(categoriesEtSousCategories[cat] || []);
         }}
       >
              <option value="">Sélectionner une catégorie</option>
              {Object.keys(categoriesEtSousCategories).map(c => (
               <option key={c} value={c}>{c}</option>
             ))}
            </select>
          </div>

          {/* Sous-catégorie — apparaît seulement si catégorie sélectionnée */}
          {sousCategories.length > 0 && (
            <div>
              <label style={styles.label}>Sous-catégorie</label>
              <select
                style={styles.input}
                value={form.sous_categorie}
                onChange={e => setForm({ ...form, sous_categorie: e.target.value })}
        >
                <option value="">Sélectionner une sous-catégorie</option>
                {sousCategories.map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
          ))}
              </select>
            </div>
     )}
          <div>
            <label style={styles.label}>Mois</label>
            <select
              style={styles.input}
              value={form.mois}
              onChange={e => setForm({ ...form, mois: e.target.value })}
            >
              <option value="">Sélectionner</option>
              {moisListe.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Date facture</label>
            <input
              style={styles.input}
              type="date"
              value={form.date_facture}
              onChange={e => setForm({ ...form, date_facture: e.target.value })}
            />
          </div>
          <div>
            <label style={styles.label}>Délai paiement (jours)</label>
            <input
              style={styles.input}
              type="number"
              value={form.delai_paiement}
              onChange={e => setForm({ ...form, delai_paiement: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Lignes de facture */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={styles.label}>Lignes de facture</label>
            <button style={styles.boutonSecondaire} onClick={ajouterLigne}>
              + Ajouter ligne
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Description', 'Qté', 'Prix unitaire', 'Remise %', 'Total', ''].map(h => (
                  <th key={h} style={{ padding: '8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.lignes.map((ligne, i) => {
                const brut = Number(ligne.quantite) * Number(ligne.prix_unitaire);
                const total = brut - (brut * Number(ligne.remise_pourcent) / 100);
                return (
                  <tr key={i}>
                    <td style={{ padding: '5px' }}>
                      <input
                        style={{ ...styles.input, padding: '6px' }}
                        value={ligne.description}
                        onChange={e => modifierLigne(i, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </td>
                    <td style={{ padding: '5px', width: '60px' }}>
                      <input
                        style={{ ...styles.input, padding: '6px' }}
                        type="number"
                        value={ligne.quantite}
                        onChange={e => modifierLigne(i, 'quantite', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '5px', width: '120px' }}>
                      <input
                        style={{ ...styles.input, padding: '6px' }}
                        type="number"
                        value={ligne.prix_unitaire}
                        onChange={e => modifierLigne(i, 'prix_unitaire', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '5px', width: '70px' }}>
                      <input
                        style={{ ...styles.input, padding: '6px' }}
                        type="number"
                        value={ligne.remise_pourcent}
                        onChange={e => modifierLigne(i, 'remise_pourcent', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '5px', width: '100px', fontWeight: 'bold', fontSize: '13px' }}>
                      {total.toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '5px' }}>
                      {form.lignes.length > 1 && (
                        <button
                          style={{ ...styles.boutonDanger, padding: '4px 8px' }}
                          onClick={() => supprimerLigne(i)}
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '16px', fontWeight: 'bold', color: '#004d5a' }}>
            TOTAL : {calculerTotal().toLocaleString('fr-FR')} Ar
          </div>
        </div>
        {/* Note de facture */}
        <div style={{ marginBottom: '15px' }}>
          <label style={styles.label}>📝 Note (affichée sur la facture, alignée à droite — laissez vide pour ne pas l'afficher)</label>
          <textarea
            style={{ ...styles.input, height: '70px', resize: 'vertical' }}
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
            placeholder="Ex : Arrêtée la présente facture à la somme de..."
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {tropPercu > 0 && (
           <div style={{
             background: '#e8f5e9',
             border: '1px solid #2e7d32',
             borderRadius: '8px',
             padding: '12px',
             marginBottom: '15px',
             fontSize: '13px',
             color: '#2e7d32'
        }}>
            ℹ️ Ce client a un crédit de <strong>{Number(tropPercu).toLocaleString('fr-FR')} Ar</strong> qui sera automatiquement déduit de cette facture.
           </div>
          )}
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
           style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
           disabled={enCours}
           onClick={async () => {
             setEnCours(true);
             await onSave({ ...form, entreprise_id });
             setEnCours(false);
     }}
        >
           {enCours ? '⏳ Création en cours...' : 'Créer la facture'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal paiement
function FormulairePaiement({ facture, onSave, onCancel }) {
  const [form, setForm] = useState({
    montant: facture.solde || 0,
    type_paiement: 'TOTAL',
    mode_paiement: '',
    reference_paiement: '',
    commentaire: '',
    date_encaissement: new Date().toISOString().split('T')[0]
  });
  const [fichierJustificatif, setFichierJustificatif] = useState(null);
  const modesPaiement = [
    'Virement bancaire',
    'Carte bancaire',
    'Chèque',
    'Espèces',
    'Airtel money',
    'Orange money',
    'Mvola',
    
    'Autre' ];

  function handleTypePaiement(type) {
    setForm({
      ...form,
      type_paiement: type,
      montant: type === 'TOTAL' ? facture.solde : 0
    });
  }

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '500px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          💰 Enregistrer un paiement
        </h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Facture : <strong>{facture.numero_facture}</strong> —
          Solde restant : <strong>{Number(facture.solde).toLocaleString('fr-FR')} Ar</strong>
        </p>

        {/* Type de paiement */}
        <div style={{ marginBottom: '15px' }}>
          <label style={styles.label}>Type de paiement</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'TOTAL', label: '✅ Paiement total' },
              { value: 'PARTIEL', label: '💰 Paiement partiel' },
              { value: 'ACOMPTE', label: '📋 Acompte' }
            ].map(t => (
              <button
                key={t.value}
                onClick={() => handleTypePaiement(t.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '2px solid',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  borderColor: form.type_paiement === t.value ? '#004d5a' : '#e0e0e0',
                  background: form.type_paiement === t.value ? '#004d5a' : 'white',
                  color: form.type_paiement === t.value ? 'white' : '#333'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={styles.label}>
              Montant {form.type_paiement === 'TOTAL' ? '(total)' : 'reçu'} (Ar) *
            </label>
            <input
              style={{
                ...styles.input,
                background: form.type_paiement === 'TOTAL' ? '#f5f5f5' : 'white'
              }}
              type="number"
              value={form.montant}
              onChange={e => setForm({ ...form, montant: Number(e.target.value) })}
              readOnly={form.type_paiement === 'TOTAL'}
              max={facture.solde}
            />
            {form.type_paiement !== 'TOTAL' && (
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                Maximum : {Number(facture.solde).toLocaleString('fr-FR')} Ar
              </p>
            )}
          </div>
          <div>
            <label style={styles.label}>Date encaissement</label>
            <input
              style={styles.input}
              type="date"
              value={form.date_encaissement}
              onChange={e => setForm({ ...form, date_encaissement: e.target.value })}
            />
          </div>
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
          <div>
            <label style={styles.label}>Référence paiement</label>
            <input
              style={styles.input}
              value={form.reference_paiement}
              onChange={e => setForm({ ...form, reference_paiement: e.target.value })}
              placeholder="N° chèque, virement..."
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Commentaire</label>
            <input
              style={styles.input}
              value={form.commentaire}
              onChange={e => setForm({ ...form, commentaire: e.target.value })}
              placeholder="Commentaire optionnel"
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Pièce justificative (PDF ou image)</label>
            <input
              style={styles.input}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFichierJustificatif(e.target.files[0])}
            />
           {fichierJustificatif && (
             <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
               Fichier sélectionné : {fichierJustificatif.name}
             </p>
           )}
          </div>
        </div>

        {/* Résumé */}
        {form.type_paiement !== 'TOTAL' && form.montant > 0 && (
          <div style={{
            background: '#e8f5e9',
            borderRadius: '8px',
            padding: '10px',
            marginTop: '15px',
            fontSize: '13px'
          }}>
            <strong>Résumé :</strong><br />
            Montant reçu : {Number(form.montant).toLocaleString('fr-FR')} Ar<br />
            Solde restant après : {Math.max(0, Number(facture.solde) - Number(form.montant)).toLocaleString('fr-FR')} Ar
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={styles.boutonPrimaire}
            onClick={() => onSave({
             ...form,
             facture_id: facture.id,
             entreprise_id: facture.entreprise_id,
             fichier_justificatif: fichierJustificatif
           })}
          >
            Enregistrer paiement
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal annulation
function FormulaireAnnulation({ facture, onSave, onCancel }) {
  const [motif, setMotif] = useState('');

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '450px' }}>
        <h3 style={{ color: '#c62828', marginTop: 0 }}>❌ Annuler la facture</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Facture : <strong>{facture.numero_facture}</strong>
        </p>
        <div>
          <label style={styles.label}>Motif d'annulation *</label>
          <textarea
            style={{ ...styles.input, height: '100px', resize: 'vertical' }}
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Expliquez la raison de l'annulation..."
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Retour</button>
          <button
            style={{ ...styles.boutonPrimaire, background: '#c62828' }}
            onClick={() => onSave(facture.id, motif)}
            disabled={!motif.trim()}
          >
            Confirmer annulation
          </button>
        </div>
      </div>
    </div>
  );
}

function FormulaireFactureMasse({ onSave, onCancel, noteDefaut }) {
  const moisListe = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const moisActuel = new Date().toLocaleDateString('fr-FR', { month: 'long' });
  const moisCapitalize = moisActuel.charAt(0).toUpperCase() + moisActuel.slice(1);
  
  const [form, setForm] = useState({
    mois: moisCapitalize,
    date_facture: new Date().toISOString().split('T')[0],
    description: '',
    note: noteDefaut || ''
  });
  const [enCours, setEnCours] = useState(false);
  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '450px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          📋 Créer factures en masse
        </h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Crée automatiquement une facture pour tous les clients actifs avec un montant mensuel.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={styles.label}>Mois de facturation *</label>
            <select
              style={styles.input}
              value={form.mois}
              onChange={e => setForm({ ...form, mois: e.target.value })}
            >
              {moisListe.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Date de facturation *</label>
            <input
              style={styles.input}
              type="date"
              value={form.date_facture}
              onChange={e => setForm({ ...form, date_facture: e.target.value })}
            />
          </div>
          <div>
            <label style={styles.label}>Description (optionnel)</label>
            <input
              style={styles.input}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder={`706 - Vente de prestations de service' - ${form.mois}`}
            />
          </div>
          <div>
            <label style={styles.label}>📝 Note (affichée sur la facture)</label>
            <textarea
              style={{ ...styles.input, height: '70px', resize: 'vertical' }}
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="Note par défaut de l'entreprise..."
            />
          </div>

          <div style={{
            background: '#e3f2fd',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            color: '#1565c0'
          }}>
            ℹ️ Les factures seront créées pour tous les clients <strong>actifs</strong> ayant un <strong>montant mensuel</strong> défini. Les clients déjà facturés pour ce mois seront ignorés.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>
            Annuler
          </button>
          <button
            style={{ ...styles.boutonPrimaire, opacity: enCours ? 0.6 : 1 }}
            disabled={enCours}
            onClick={async () => {
             setEnCours(true);
             await onSave(form);
             setEnCours(false);
       }}
          >
            {enCours ? '⏳ Création en cours...' : 'Créer les factures'}
          </button>
         
        </div>
      </div>
    </div>
  );
}


// Modal modification facture
function FormulaireModificationFacture({ facture, lignes, onSave, onCancel }) {
  const [form, setForm] = useState({
    lignes: lignes.length > 0 ? lignes.map(l => ({
      id: l.id,
      description: l.description,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      remise_pourcent: l.remise_pourcent || 0
    })) : [{ description: '', quantite: 1, prix_unitaire: 0, remise_pourcent: 0 }]
  });

  function ajouterLigne() {
    setForm({
      ...form,
      lignes: [...form.lignes, { description: '', quantite: 1, prix_unitaire: 0, remise_pourcent: 0 }]
    });
  }

  function supprimerLigne(index) {
    if (form.lignes.length === 1) return;
    setForm({ ...form, lignes: form.lignes.filter((_, i) => i !== index) });
  }

  function modifierLigne(index, champ, valeur) {
    const nouvLignes = [...form.lignes];
    nouvLignes[index][champ] = valeur;
    setForm({ ...form, lignes: nouvLignes });
  }

  function calculerTotal() {
    return form.lignes.reduce((sum, l) => {
      const brut = Number(l.quantite) * Number(l.prix_unitaire);
      return sum + (brut - (brut * Number(l.remise_pourcent) / 100));
    }, 0);
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>
          ✏️ Modifier facture {facture.numero_facture}
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={styles.label}>Lignes de facture</label>
            <button style={styles.boutonSecondaire} onClick={ajouterLigne}>
              + Ajouter ligne
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Description', 'Qté', 'Prix unitaire', 'Remise %', 'Total', ''].map(h => (
                  <th key={h} style={{ padding: '8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.lignes.map((ligne, i) => {
                const brut = Number(ligne.quantite) * Number(ligne.prix_unitaire);
                const total = brut - (brut * Number(ligne.remise_pourcent) / 100);
                return (
                  <tr key={i}>
                    <td style={{ padding: '5px' }}>
                      <input
                        style={{ ...styles.input, padding: '6px' }}
                        value={ligne.description}
                        onChange={e => modifierLigne(i, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </td>
                    <td style={{ padding: '5px', width: '60px' }}>
                      <input
                        style={{ ...styles.input, padding: '6px' }}
                        type="number"
                        value={ligne.quantite}
                        onChange={e => modifierLigne(i, 'quantite', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '5px', width: '120px' }}>
                      <input
                        style={{ ...styles.input, padding: '6px' }}
                        type="number"
                        value={ligne.prix_unitaire}
                        onChange={e => modifierLigne(i, 'prix_unitaire', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '5px', width: '70px' }}>
                      <input
                        style={{ ...styles.input, padding: '6px' }}
                        type="number"
                        value={ligne.remise_pourcent}
                        onChange={e => modifierLigne(i, 'remise_pourcent', e.target.value)}
                      />
                    </td>
                    <td style={{ padding: '5px', width: '100px', fontWeight: 'bold', fontSize: '13px' }}>
                      {total.toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '5px' }}>
                      <button
                        style={{ ...styles.boutonDanger, padding: '4px 8px' }}
                        onClick={() => supprimerLigne(i)}
                        disabled={form.lignes.length === 1}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '16px', fontWeight: 'bold', color: '#004d5a' }}>
            TOTAL : {calculerTotal().toLocaleString('fr-FR')} Ar
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button
            style={styles.boutonPrimaire}
            onClick={() => onSave(facture.id, form.lignes)}
          >
            Enregistrer modifications
          </button>
        </div>
      </div>
    </div>
  );
}
// Page principale Factures
export default function Factures() {
  const { entreprise } = useAuth();
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [filtreClient, setFiltreClient] = useState('');
  const [filtreMois, setFiltreMois] = useState('');
  const [page, setPage] = useState(1);
  const parPage = 20;
  const [recherche, setRecherche] = useState('');
  const [modalOuvert, setModalOuvert] = useState(null);
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [selection, setSelection] = useState([]);
  const [lignesFactureSelectionnee, setLignesFactureSelectionnee] = useState([]);
  const [noteDefaut, setNoteDefaut] = useState('');

  const statuts = ['TOUS', 'CREE', 'ENVOYEE', 'PAIEMENT_PARTIEL', 'PAYEE', 'EN_RETARD', 'ANNULEE', 'ARCHIVEE'];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
  try {
    const [facturesRes, clientsRes, entrepriseRes] = await Promise.all([
      factureService.getAll(entreprise.id),
      clientService.getAll(entreprise.id),
      fetch(`http://localhost:5000/api/entreprises/detail/${entreprise.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.json())
    ]);
    console.log('[FACTURES] entrepriseRes:', entrepriseRes);
    setFactures(facturesRes.data.data || []);
    setClients(clientsRes.data.data || []);
    setNoteDefaut(entrepriseRes.data?.note_facture_defaut || '');
  } catch (err) {
    console.error('[FACTURES] Erreur lors du chargement:', err);
    toast.error('Erreur lors du chargement.');
  } finally {
    setLoading(false);
  }
}

  async function creerFacture(data) {
    try {
      await factureService.creer(data);
      toast.success('Facture créée avec succès !');
      setModalOuvert(null);
      chargerDonnees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création facture.');
    }
  }

  async function creerFacturesMasse(formData) {
  try {
    const res = await factureService.creerMasse({
      entreprise_id: entreprise.id,
      date_facture: formData.date_facture,
      mois: formData.mois,
      description: formData.description || `Abonnement mensuel - ${formData.mois}`,
      note: formData.note || ''
    });
    const r = res.data.resultats;
    toast.success(`${r.creees?.length || 0} facture(s) créée(s) !`);
    if (r.ignorees?.length > 0) {
      toast.info(`${r.ignorees.length} client(s) ignoré(s) (déjà facturés).`);
    }
    if (r.erreurs?.length > 0) {
      toast.error(`${r.erreurs.length} erreur(s).`);
    }
    setModalOuvert(null);
    chargerDonnees();
  } catch (err) {
    toast.error('Erreur création en masse.');
  }
}

  async function envoyerFacture(facture) {
    try {
      await mailService.envoyerFacture({
        entreprise_id: entreprise.id,
        facture_id: facture.id
      });
      toast.success(`Facture ${facture.numero_facture} envoyée !`);
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur envoi mail.');
    }
  }

  async function envoyerSelectionMasse() {
    try {
      let envoyees = 0;
      for (const id of selection) {
        const facture = factures.find(f => f.id === id);
        if (facture && ['CREE', 'ENVOYEE'].includes(facture.statut)) {
          await mailService.envoyerFacture({
            entreprise_id: entreprise.id,
            facture_id: id
          });
          envoyees++;
        }
      }
      toast.success(`${envoyees} facture(s) envoyée(s) !`);
      setSelection([]);
      chargerDonnees();
    } catch (err) {
      toast.error('Erreur envoi en masse.');
    }
  }

  async function enregistrerPaiement(data) {
  try {
    let justificatif_url = '';

    // Upload du justificatif si présent
    if (data.fichier_justificatif) {
      const fichier = data.fichier_justificatif;
      const extension = fichier.name.split('.').pop();
      const nomFichier = `${data.facture_id}_justificatif.${extension}`;

      // Convertir en base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(fichier);
      });

      // Envoyer au backend
      const uploadRes = await fetch(
        'http://localhost:5000/api/paiements/upload-justificatif',
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
          facture_id: data.facture_id
        })
      });

      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        justificatif_url = uploadData.url;
      }
    }

    await paiementService.enregistrer({
      ...data,
      justificatif_url,
      fichier_justificatif: undefined
    });

    toast.success('Paiement enregistré !');
    setModalOuvert(null);
    setFactureSelectionnee(null);
    chargerDonnees();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur paiement.');
  }
}

  async function annulerFacture(id, motif) {
    try {
      await factureService.annuler(id, motif);
      toast.success('Facture annulée.');
      setModalOuvert(null);
      setFactureSelectionnee(null);
      chargerDonnees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur annulation.');
    }
  }
  async function visualiserFacture(facture) {
  // Facture importée — pas de PDF disponible
  if (!facture.pdf_url) {
    toast.info('📄 PDF non disponible, car cette facture n\'a pas été créée via la plateforme.');
    return;
  }

  try {
    toast.info('Chargement du PDF...');
    const response = await fetch(
      `http://localhost:5000/api/mails/pdf/${facture.id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ entreprise_id: entreprise.id })
      }
    );

    if (!response.ok) {
      toast.error('Erreur chargement PDF.');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (err) {
    toast.error('Erreur visualisation.');
  }
}

  async function ouvrirModificationFacture(facture) {
    try {
      const res = await factureService.getById(facture.id);
      const lignes = res.data.data?.lignes_facture || [];
      setLignesFactureSelectionnee(lignes);
      setFactureSelectionnee(facture);
      setModalOuvert('modifier');
    } catch (err) {
      toast.error('Erreur chargement facture.');
    }
  }

  

  async function modifierFacture(id, lignes) {
    try {
      await factureService.modifier(id, { lignes });
      toast.success('Facture modifiée avec succès !');
      setModalOuvert(null);
      setFactureSelectionnee(null);
      chargerDonnees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur modification.');
    }
  }
  async function telechargerSelection() {
  try {
    toast.info(`Téléchargement de ${selection.length} facture(s) en cours...`);
    for (const id of selection) {
      const facture = factures.find(f => f.id === id);
      if (!facture) continue;

      const response = await fetch(
        `http://localhost:5000/api/mails/pdf/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ entreprise_id: entreprise.id })
        }
      );

      if (!response.ok) {
        toast.error(`Erreur pour ${facture.numero_facture}`);
        continue;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Facture_${facture.numero_facture}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
    toast.success('Téléchargement terminé !');
    setSelection([]);
  } catch (err) {
    toast.error('Erreur téléchargement.');
  }
}

async function imprimerSelection() {
  try {
    for (const id of selection) {
      const response = await fetch(
        `http://localhost:5000/api/mails/pdf/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ entreprise_id: entreprise.id })
        }
      );

      if (!response.ok) continue;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Ouvrir dans iframe caché et lancer l'impression
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow.print();
        // Nettoyer après impression
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(url);
        }, 1000);
      };
    }
    setSelection([]);
  } catch (err) {
    toast.error('Erreur impression.');
  }
}

function exporterExcel() {
  const XLSX = require('xlsx');

  const donnees = facturesFiltrees.map(f => ({
    'N° Facture': f.numero_facture,
    'Client': f.nom_client,
    'Email': f.email_client || '',
    'Mois': f.mois || '',
    'Date facture': f.date_facture ? new Date(f.date_facture).toLocaleDateString('fr-FR') : '',
    'Date échéance': f.date_limite ? new Date(f.date_limite).toLocaleDateString('fr-FR') : '',
    'Montant total (Ar)': f.montant_total || 0,
    'Montant payé (Ar)': f.montant_paye || 0,
    'Solde (Ar)': f.solde || 0,
    'Statut': f.statut || '',
    'Mode paiement': f.mode_paiement || '',
    'Date paiement': f.date_paiement ? new Date(f.date_paiement).toLocaleDateString('fr-FR') : ''
  }));

  const ws = XLSX.utils.json_to_sheet(donnees);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Factures');

  // Ajuster la largeur des colonnes
  ws['!cols'] = [
    { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 12 },
    { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
    { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }
  ];

  XLSX.writeFile(wb, `Factures_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
  toast.success('Export Excel téléchargé !');
}

function exporterCSV() {
  const XLSX = require('xlsx');

  const donnees = facturesFiltrees.map(f => ({
    'N° Facture': f.numero_facture,
    'Client': f.nom_client,
    'Mois': f.mois || '',
    'Date facture': f.date_facture ? new Date(f.date_facture).toLocaleDateString('fr-FR') : '',
    'Montant total': f.montant_total || 0,
    'Montant payé': f.montant_paye || 0,
    'Solde': f.solde || 0,
    'Statut': f.statut || ''
  }));

  const ws = XLSX.utils.json_to_sheet(donnees);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Factures');
  XLSX.writeFile(wb, `Factures_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`);
  toast.success('Export CSV téléchargé !');
}

  function toggleSelection(id) {
    setSelection(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function toggleTout() {
    if (selection.length === facturesFiltrees.length) {
      setSelection([]);
    } else {
      setSelection(facturesFiltrees.map(f => f.id));
    }
  }

  // Filtrer les factures
  
  const facturesFiltrees = factures.filter(f => {
  
  const matchStatut = filtreStatut === 'TOUS' || f.statut === filtreStatut;
  const matchClient = !filtreClient || f.client_id === filtreClient;
  const matchMois = !filtreMois || f.mois === filtreMois;
  const matchRecherche =
    !recherche ||
    f.numero_facture?.toLowerCase().includes(recherche.toLowerCase()) ||
    f.nom_client?.toLowerCase().includes(recherche.toLowerCase());
  return matchStatut && matchClient && matchMois && matchRecherche;
});
  const totalPages = Math.ceil(facturesFiltrees.length / parPage);
  const facturesPage = facturesFiltrees.slice((page - 1) * parPage, page * parPage);
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>
  );

  return (
    <div>
      {/* Modals */}
      {modalOuvert === 'creer' && (
        <FormulaireFacture
          clients={clients}
          entreprise_id={entreprise.id}
          noteDefaut={noteDefaut}
          onSave={creerFacture}
          onCancel={() => setModalOuvert(null)}
        />
      )}
      {modalOuvert === 'masse' && (
        <FormulaireFactureMasse
          noteDefaut={noteDefaut}
          onSave={creerFacturesMasse}
          onCancel={() => setModalOuvert(null)}
        />
      )}
      {modalOuvert === 'paiement' && factureSelectionnee && (
        <FormulairePaiement
          facture={factureSelectionnee}
          onSave={enregistrerPaiement}
          onCancel={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
        />
      )}
      {modalOuvert === 'annuler' && factureSelectionnee && (
        <FormulaireAnnulation
          facture={factureSelectionnee}
          onSave={annulerFacture}
          onCancel={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
        />
      )}
      {modalOuvert === 'modifier' && factureSelectionnee && (
        <FormulaireModificationFacture
          facture={factureSelectionnee}
          lignes={lignesFactureSelectionnee}
          onSave={modifierFacture}
          onCancel={() => { setModalOuvert(null); setFactureSelectionnee(null); }}
        />
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#004d5a' }}>🧾 Factures</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {factures.length} facture(s) au total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
         {selection.length > 0 && (
          <>
          <button
                style={{ ...styles.boutonSecondaire, color: '#1565c0', borderColor: '#1565c0' }}
                onClick={envoyerSelectionMasse}
        >
               📧 Envoyer ({selection.length})
          </button>
          <button
               style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
               onClick={() => telechargerSelection()}
          >
              📥 Télécharger ({selection.length})
          </button>
          <button
               style={{ ...styles.boutonSecondaire, color: '#e65100', borderColor: '#e65100' }}
               onClick={() => imprimerSelection()}
          >
              🖨️ Imprimer ({selection.length})
          </button>
         </>
        )}
          <button
             style={{ ...styles.boutonSecondaire, color: '#2e7d32', borderColor: '#2e7d32' }}
             onClick={exporterExcel}
            >
             📊 Excel
          </button>
          <button
             style={{ ...styles.boutonSecondaire, color: '#1565c0', borderColor: '#1565c0' }}
             onClick={exporterCSV}
     >
             📄 CSV
          </button>
          <button
            style={{ ...styles.boutonSecondaire }}
            onClick={() => setModalOuvert('masse')}
          >
            📋 Factures en masse
          </button>
          <button
            style={styles.boutonPrimaire}
            onClick={() => setModalOuvert('creer')}
          >
            + Nouvelle facture
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ ...styles.card }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={styles.label}>Rechercher</label>
            <input
              style={{ ...styles.input, width: '250px' }}
              placeholder="N° facture, nom client..."
              value={recherche}
              onChange={e => { setRecherche(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label style={styles.label}>Client</label>
            <select
              style={{ ...styles.input, width: '200px' }}
              value={filtreClient}
              onChange={e => { setFiltreClient(e.target.value); setPage(1); }}
            >
              <option value="">Tous les clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div>
  <label style={styles.label}>Mois</label>
  <select
    style={{ ...styles.input, width: '150px' }}
    value={filtreMois}
    onChange={e => { setFiltreMois(e.target.value); setPage(1); }}
  >
    <option value="">Tous les mois</option>
    {['Janvier','Février','Mars','Avril','Mai','Juin',
      'Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map(m => (
      <option key={m} value={m}>{m}</option>
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
        {facturesFiltrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Aucune facture trouvée.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selection.length === facturesFiltrees.length && facturesFiltrees.length > 0}
                    onChange={toggleTout}
                  />
                </th>
                {['N° Facture', 'Client', 'Mois', 'Date', 'Échéance', 'Montant', 'Payé', 'Solde', 'Statut', 'Actions'].map(h => (
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
              {facturesPage.map((facture, i) => {
                const statut = couleurStatut(facture.statut);
                const estSelectionnee = selection.includes(facture.id);
                return (
                  <tr
                    key={facture.id}
                    style={{
                      background: estSelectionnee ? '#e3f2fd' : (i % 2 === 0 ? 'white' : '#fafafa'),
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={estSelectionnee}
                        onChange={() => toggleSelection(facture.id)}
                      />
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#004d5a' }}>
                      {facture.numero_facture}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>
                      {facture.nom_client}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {facture.mois || '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {facture.date_facture ? new Date(facture.date_facture).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
                      {facture.date_limite ? new Date(facture.date_limite).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                      {Number(facture.montant_total).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#2e7d32' }}>
                      {Number(facture.montant_paye || 0).toLocaleString('fr-FR')} Ar
                    </td>
                    <td style={{ 
                      padding: '10px', 
                      fontSize: '13px', 
                      fontWeight: 'bold',
                      color: facture.solde > 0 ? '#c62828' : '#2e7d32' 
                  }}>
                     {facture.trop_percu > 0
                       ? <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                         -{Number(facture.trop_percu).toLocaleString('fr-FR')} Ar
                         </span>
                       : facture.solde > 0
                       ? <span style={{ color: '#c62828', fontWeight: 'bold' }}>
                         {Number(facture.solde).toLocaleString('fr-FR')} Ar
                         </span>
                       : <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                         0 Ar
                         </span>
                        }
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
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        
                          {/* Visualiser */}
                           <button
                             style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                             onClick={() => visualiserFacture(facture)}
                             title="Visualiser la facture"
    >
                            👁️
                           </button>

                          {/* Modifier */}
                          {['CREE', 'ENVOYEE'].includes(facture.statut) && 
                          facture.montant_paye === 0 && (
                           <button
                             style={{ ...styles.boutonSecondaire, padding: '4px 8px' }}
                             onClick={() => ouvrirModificationFacture(facture)}
                             title="Modifier"
                          >
                            ✏️
                           </button>
                )}
  
                        {/* Paiement */}
                        {!['PAYEE', 'ANNULEE', 'ARCHIVEE'].includes(facture.statut) && (
                          <button
                            style={{ ...styles.boutonSecondaire, padding: '4px 8px', color: '#2e7d32', borderColor: '#2e7d32' }}
                            onClick={() => { setFactureSelectionnee(facture); setModalOuvert('paiement'); }}
                            title="Enregistrer paiement"
                          >
                            💰
                          </button>
                        )}
                        {/* Annuler */}
                        {!['PAYEE', 'ANNULEE', 'ARCHIVEE'].includes(facture.statut) && facture.montant_paye === 0 && (
                          <button
                            style={{ ...styles.boutonDanger, padding: '4px 8px' }}
                            onClick={() => { setFactureSelectionnee(facture); setModalOuvert('annuler'); }}
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
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '20px'
  }}>
    <button
      style={{
        ...styles.boutonSecondaire,
        padding: '6px 12px',
        opacity: page === 1 ? 0.5 : 1
      }}
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page === 1}
    >
      ← Précédent
    </button>

    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
      .map((p, i, arr) => (
        <React.Fragment key={p}>
          {i > 0 && arr[i - 1] !== p - 1 && (
            <span style={{ color: '#666' }}>...</span>
          )}
          <button
            onClick={() => setPage(p)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: page === p ? '#004d5a' : '#e0e0e0',
              color: page === p ? 'white' : '#333',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            {p}
          </button>
        </React.Fragment>
      ))
    }

    <button
      style={{
        ...styles.boutonSecondaire,
        padding: '6px 12px',
        opacity: page === totalPages ? 0.5 : 1
      }}
      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
      disabled={page === totalPages}
    >
      Suivant →
    </button>

    <span style={{ color: '#666', fontSize: '13px' }}>
      Page {page}/{totalPages} — {facturesFiltrees.length} facture(s)
    </span>
  </div>
)}
    </div>
  );
}