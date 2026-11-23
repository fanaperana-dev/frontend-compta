import React, { useState } from 'react';
import useSoumission from '../hooks/useSoumission';

/**
 * Facture envoyée / enregistrée : le contenu est verrouillé, mais la catégorie et la sous-catégorie
 * restent corrigeables au cas où le classement n'a pas été fait correctement.
 *
 * Props :
 *  - facture      : la facture (numero ou numero_facture, categorie, sous_categorie)
 *  - categories   : { 'catégorie': ['sous-catégorie', ...] }
 *  - styles       : styles de la page appelante (modal, modalContent, label, input, boutonPrimaire, boutonSecondaire)
 *  - onSave(categorie, sous_categorie) : promesse
 *  - onCancel()
 */
export default function ModalClassementFacture({ facture, categories, styles, onSave, onCancel }) {
  const { enCours, soumettre } = useSoumission();
  const [categorie, setCategorie] = useState(facture?.categorie || '');
  const [sousCategorie, setSousCategorie] = useState(facture?.sous_categorie || '');
  const sousListe = categories[categorie] || [];
  const numero = facture?.numero_facture || facture?.numero || '';
  // une ancienne valeur qui n'est plus dans la liste reste sélectionnable pour ne pas être perdue d'office
  const sousAffichees = sousCategorie && !sousListe.includes(sousCategorie) ? [sousCategorie, ...sousListe] : sousListe;
  const categoriesAffichees = categorie && !Object.keys(categories).includes(categorie) ? [categorie, ...Object.keys(categories)] : Object.keys(categories);
  const inchange = categorie === (facture?.categorie || '') && sousCategorie === (facture?.sous_categorie || '');

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '480px' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>🏷️ Modifier la catégorie — {numero}</h3>
        <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>
          Cette facture est verrouillée : seuls la catégorie et la sous-catégorie peuvent être corrigées.
        </p>
        <div style={{ marginBottom: '12px' }}>
          <label style={styles.label}>Catégorie</label>
          <select style={styles.input} value={categorie}
            onChange={e => { setCategorie(e.target.value); setSousCategorie(''); }}>
            <option value="">Sélectionner une catégorie</option>
            {categoriesAffichees.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {sousAffichees.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <label style={styles.label}>Sous-catégorie</label>
            <select style={styles.input} value={sousCategorie} onChange={e => setSousCategorie(e.target.value)}>
              <option value="">Sélectionner une sous-catégorie</option>
              {sousAffichees.map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={styles.boutonPrimaire}
            disabled={enCours || !categorie || inchange}
            onClick={() => soumettre(() => onSave(categorie, sousCategorie))}>
            {enCours ? '⏳ Patientez...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
