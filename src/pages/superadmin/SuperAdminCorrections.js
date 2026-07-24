import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { entrepriseService, correctionService } from '../../services/api';

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
    width: '100%', padding: '8px', border: '2px solid #e0e0e0',
    borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none'
  },
  label: {
    display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#333', fontSize: '12px'
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
    width: '600px', maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  }
};

const onglets = [
  { key: 'factures', label: '🧾 Factures clients' },
  { key: 'encaissements', label: '💰 Encaissements' },
  { key: 'fournisseurs', label: '🏭 Factures fournisseurs' },
  { key: 'tiers', label: '📄 Factures tiers' },
  { key: 'paie', label: '👤 Fiches de paie' },
  { key: 'stocks', label: '📦 Stocks' },
  { key: 'immobilisations', label: '🏗️ Immobilisations' }
];

// Modal édition générique
function ModalEdition({ titre, donnee, champs, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const init = {};
    champs.forEach(c => { init[c.key] = donnee[c.key] ?? ''; });
    return init;
  });

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>{titre}</h3>
        <div style={{
          background: '#fff3e0', borderRadius: '8px', padding: '10px',
          marginBottom: '15px', fontSize: '12px', color: '#e65100'
        }}>
          ⚠️ Modification libre — aucune restriction de statut. À utiliser avec prudence.
          {(titre.includes('Facture') || titre.includes('FAC') || titre.includes('FFO') || titre.includes('FTI')) && (
            <><br/>📒 Pensez à <strong>resynchroniser le journal</strong> de cette entreprise après modification d'une facture payée (page Journal → bouton Synchroniser).</>
         )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {champs.map(c => (
            <div key={c.key} style={c.pleineLargeur ? { gridColumn: 'span 2' } : {}}>
              <label style={styles.label}>{c.label}</label>
              {c.type === 'select' ? (
                <select style={styles.input} value={form[c.key] || ''}
                  onChange={e => setForm({ ...form, [c.key]: e.target.value })}>
                  {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : c.type === 'textarea' ? (
                <textarea style={{ ...styles.input, height: '60px' }}
                  value={form[c.key] || ''}
                  onChange={e => setForm({ ...form, [c.key]: e.target.value })} />
              ) : (
                <input style={styles.input}
                  type={c.type || 'text'}
                  value={c.type === 'date' && form[c.key]
                    ? new Date(form[c.key]).toISOString().split('T')[0]
                    : form[c.key] || ''}
                  onChange={e => setForm({
                    ...form,
                    [c.key]: c.type === 'number' ? Number(e.target.value) : e.target.value
                  })} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire} onClick={() => onSave(form)}>
            💾 Corriger
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminCorrections() {
  const [entreprises, setEntreprises] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState('');
  const [ongletActif, setOngletActif] = useState('factures');
  const [donnees, setDonnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chargementDonnees, setChargementDonnees] = useState(false);
  const [elementSelectionne, setElementSelectionne] = useState(null);

  useEffect(() => { chargerEntreprises(); }, []);
  useEffect(() => { if (entrepriseId) chargerDonneesOnglet(); }, [entrepriseId, ongletActif]);

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

  async function chargerDonneesOnglet() {
    setChargementDonnees(true);
    try {
      let res;
      if (ongletActif === 'factures') res = await correctionService.getFacturesClients(entrepriseId);
      else if (ongletActif === 'encaissements') res = await correctionService.getEncaissements(entrepriseId);
      else if (ongletActif === 'fournisseurs') res = await correctionService.getFacturesFournisseurs(entrepriseId);
      else if (ongletActif === 'tiers') res = await correctionService.getFacturesTiers(entrepriseId);
      else if (ongletActif === 'paie') res = await correctionService.getFichesPaie(entrepriseId);
      else if (ongletActif === 'stocks') res = await correctionService.getArticles(entrepriseId);
      else if (ongletActif === 'immobilisations') res = await correctionService.getImmobilisations(entrepriseId);
      setDonnees(res.data.data || []);
    } catch (err) {
      toast.error('Erreur chargement données.');
      setDonnees([]);
    } finally {
      setChargementDonnees(false);
    }
  }

  async function sauvegarderCorrection(form) {
    try {
      if (ongletActif === 'factures') await correctionService.modifierFactureClient(elementSelectionne.id, form);
      else if (ongletActif === 'encaissements') await correctionService.modifierEncaissement(elementSelectionne.id, form);
      else if (ongletActif === 'fournisseurs') await correctionService.modifierFactureFournisseur(elementSelectionne.id, form);
      else if (ongletActif === 'tiers') await correctionService.modifierFactureTiers(elementSelectionne.id, form);
      else if (ongletActif === 'paie') await correctionService.modifierFichePaie(elementSelectionne.id, form);
      else if (ongletActif === 'stocks') await correctionService.modifierArticle(elementSelectionne.id, form);
      else if (ongletActif === 'immobilisations') await correctionService.modifierImmobilisation(elementSelectionne.id, form);

      toast.success('Correction enregistrée !');
      setElementSelectionne(null);
      chargerDonneesOnglet();
    } catch (err) {
      toast.error('Erreur lors de la correction.');
    }
  }

  // Définition colonnes affichées + champs éditables par onglet
  function getConfig() {
    if (ongletActif === 'factures') {
      return {
        colonnes: ['numero_facture', 'nom_client', 'date_facture', 'montant_total', 'statut'],
        champs: [
          { key: 'numero_facture', label: 'N° Facture' },
          { key: 'date_facture', label: 'Date facture', type: 'date' },
          { key: 'date_limite', label: 'Date limite', type: 'date' },
          { key: 'date_paiement', label: 'Date paiement', type: 'date' },
          { key: 'montant_total', label: 'Montant total', type: 'number' },
          { key: 'montant_paye', label: 'Montant payé', type: 'number' },
          { key: 'solde', label: 'Solde', type: 'number' },
          { key: 'mode_paiement', label: 'Mode paiement' },
          { key: 'statut', label: 'Statut', type: 'select',
            options: ['CREE', 'ENVOYEE', 'PAIEMENT_PARTIEL', 'PAYEE', 'EN_RETARD', 'ANNULEE', 'ARCHIVEE'] },
          { key: 'note', label: 'Note', type: 'textarea', pleineLargeur: true }
        ]
      };
    }
    if (ongletActif === 'encaissements') {
      return {
        colonnes: ['nom_client', 'montant', 'mode_paiement', 'date_encaissement'],
        champs: [
          { key: 'montant', label: 'Montant', type: 'number' },
          { key: 'mode_paiement', label: 'Mode paiement' },
          { key: 'reference_paiement', label: 'Référence paiement' },
          { key: 'date_encaissement', label: 'Date encaissement', type: 'date' },
          { key: 'commentaire', label: 'Commentaire', type: 'textarea', pleineLargeur: true }
        ]
      };
    }
    if (ongletActif === 'fournisseurs') {
      return {
        colonnes: ['numero', 'fournisseur', 'date_facture', 'montant', 'statut'],
        champs: [
          { key: 'numero', label: 'N° Facture' },
          { key: 'date_facture', label: 'Date facture', type: 'date' },
          { key: 'date_echeance', label: 'Date échéance', type: 'date' },
          { key: 'montant', label: 'Montant', type: 'number' },
          { key: 'montant_paye', label: 'Montant payé', type: 'number' },
          { key: 'mode_paiement', label: 'Mode paiement' },
          { key: 'statut', label: 'Statut', type: 'select',
            options: ['EN_ATTENTE', 'PAYEE', 'ANNULEE'] },
          { key: 'commentaire', label: 'Commentaire', type: 'textarea', pleineLargeur: true }
        ]
      };
    }
    if (ongletActif === 'tiers') {
      return {
        colonnes: ['numero', 'tiers', 'date_facture', 'montant', 'statut'],
        champs: [
          { key: 'numero', label: 'N° Facture' },
          { key: 'date_facture', label: 'Date facture', type: 'date' },
          { key: 'date_echeance', label: 'Date échéance', type: 'date' },
          { key: 'montant', label: 'Montant', type: 'number' },
          { key: 'montant_paye', label: 'Montant payé', type: 'number' },
          { key: 'mode_paiement', label: 'Mode paiement' },
          { key: 'statut', label: 'Statut', type: 'select',
            options: ['EN_ATTENTE', 'PAYEE', 'ANNULEE'] },
          { key: 'commentaire', label: 'Commentaire', type: 'textarea', pleineLargeur: true }
        ]
      };
    }
    if (ongletActif === 'paie') {
      return {
        colonnes: ['matricule', 'nom_salarie', 'mois', 'annee', 'salaire_net', 'statut'],
        champs: [
          { key: 'date_paiement', label: 'Date paiement', type: 'date' },
          { key: 'mode_paiement', label: 'Mode paiement' },
          { key: 'salaire_net', label: 'Salaire net', type: 'number' },
          { key: 'statut', label: 'Statut', type: 'select',
            options: ['BROUILLON', 'VALIDEE', 'PAYEE', 'ANNULEE'] }
        ]
      };
    }
    if (ongletActif === 'stocks') {
      return {
        colonnes: ['reference', 'designation', 'categorie', 'stock_actuel', 'valeur_stock'],
        champs: [
          { key: 'designation', label: 'Désignation' },
          { key: 'categorie', label: 'Catégorie' },
          { key: 'unite', label: 'Unité' },
          { key: 'prix_achat_ht', label: 'Prix achat HT', type: 'number' },
          { key: 'taux_tva', label: 'Taux TVA (%)', type: 'number' },
          { key: 'remise_pourcent', label: 'Remise (%)', type: 'number' },
          { key: 'stock_actuel', label: 'Stock actuel', type: 'number' },
          { key: 'valeur_stock', label: 'Valeur stock', type: 'number' },
          { key: 'stock_minimum', label: 'Stock minimum', type: 'number' },
          { key: 'methode_valorisation', label: 'Méthode valorisation', type: 'select',
            options: ['CMUP', 'FIFO'] }
        ]
      };
    }

    if (ongletActif === 'immobilisations') {
      return {
        colonnes: ['reference', 'designation', 'categorie', 'valeur_acquisition', 'date_acquisition'],
        champs: [
          { key: 'designation', label: 'Désignation' },
          { key: 'categorie', label: 'Catégorie' },
          { key: 'numero_compte', label: 'N° compte PCG' },
          { key: 'date_acquisition', label: 'Date acquisition', type: 'date' },
          { key: 'date_debut_amortissement', label: 'Début amortissement', type: 'date' },
          { key: 'date_fin_amortissement', label: 'Fin amortissement', type: 'date' },
          { key: 'valeur_acquisition', label: 'Valeur acquisition', type: 'number' },
          { key: 'fournisseur', label: 'Fournisseur' },
          { key: 'numero_facture', label: 'N° facture' },
          { key: 'localisation', label: 'Localisation' }
       ]
      };
    }
    return { colonnes: [], champs: [] };
  }

  const config = getConfig();

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  return (
    <div>
      {elementSelectionne && (
        <ModalEdition
          titre={`🔧 Correction — ${elementSelectionne.numero_facture || elementSelectionne.numero || elementSelectionne.matricule || elementSelectionne.reference || 'Élément'}`}
          donnee={elementSelectionne}
          champs={config.champs}
          onSave={sauvegarderCorrection}
          onCancel={() => setElementSelectionne(null)}
        />
      )}

      <h2 style={{ color: '#004d5a', marginBottom: '20px' }}>🔧 Corrections</h2>

      <div style={styles.card}>
        <label style={styles.label}>Sélectionner une entreprise</label>
        <select style={{ ...styles.input, maxWidth: '400px' }}
          value={entrepriseId}
          onChange={e => setEntrepriseId(e.target.value)}>
          <option value="">-- Choisir --</option>
          {entreprises.map(e => (
            <option key={e.id} value={e.id}>{e.nom}</option>
          ))}
        </select>
      </div>

      {entrepriseId && (
        <>
          <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
            {onglets.map(o => (
              <button key={o.key} onClick={() => setOngletActif(o.key)}
                style={{
                  padding: '10px 16px', border: 'none', whiteSpace: 'nowrap',
                  borderBottom: ongletActif === o.key ? '3px solid #004d5a' : '3px solid transparent',
                  background: 'transparent',
                  color: ongletActif === o.key ? '#004d5a' : '#666',
                  fontWeight: ongletActif === o.key ? 'bold' : 'normal',
                  fontSize: '13px', cursor: 'pointer'
                }}>
                {o.label}
              </button>
            ))}
          </div>

          <div style={styles.card}>
            {chargementDonnees ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Chargement...</div>
            ) : donnees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Aucune donnée.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    {config.colonnes.map(c => (
                      <th key={c} style={{ padding: '10px', textAlign: 'left', fontSize: '12px',
                        color: '#555', borderBottom: '2px solid #e0e0e0' }}>
                        {c.replace(/_/g, ' ')}
                      </th>
                    ))}
                    <th style={{ padding: '10px', borderBottom: '2px solid #e0e0e0' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.map((d, i) => (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      {config.colonnes.map(c => (
                        <td key={c} style={{ padding: '10px', fontSize: '13px' }}>
                          {c.includes('date') && d[c]
                            ? new Date(d[c]).toLocaleDateString('fr-FR')
                            : typeof d[c] === 'number'
                              ? d[c].toLocaleString('fr-FR')
                              : (d[c] || '—')}
                        </td>
                      ))}
                      <td style={{ padding: '10px' }}>
                        <button style={styles.boutonSecondaire} onClick={() => setElementSelectionne(d)}>
                          🔧 Corriger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}