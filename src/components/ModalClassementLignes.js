import React, { useState } from 'react';
import useSoumission from '../hooks/useSoumission';

/**
 * Facture fournisseur enregistrée et ventilée en plusieurs lignes : la catégorie se corrige ligne par ligne.
 * Une ligne qui a créé du stock ou une immobilisation garde sa catégorie (annuler la facture et la recréer).
 *
 * Props : facture (avec lignes_facture_fournisseur), categories, styles, onSave(corrections), onCancel()
 *   corrections = [{ id, categorie, sous_categorie }] — seulement les lignes modifiées
 */
export default function ModalClassementLignes({ facture, categories, styles, onSave, onCancel }) {
  const { enCours, soumettre } = useSoumission();
  const lignes = [...(facture?.lignes_facture_fournisseur || [])].sort((a, b) => (a.bloc - b.bloc) || (a.position - b.position));
  const [choix, setChoix] = useState(() => Object.fromEntries(lignes.map((l) => [l.id, { categorie: l.categorie || '', sous_categorie: l.sous_categorie || '' }])));
  const modifiees = lignes.filter((l) => choix[l.id].categorie !== (l.categorie || '') || choix[l.id].sous_categorie !== (l.sous_categorie || ''));
  const fr = (n) => Number(n || 0).toLocaleString('fr-FR');

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, width: '760px', maxWidth: '96vw' }}>
        <h3 style={{ color: '#004d5a', marginTop: 0 }}>🏷️ Modifier les catégories — {facture?.numero}</h3>
        <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>
          Cette facture est verrouillée : seule la catégorie de chaque ligne peut être corrigée.
          Les lignes entrées en stock ou en immobilisation ne peuvent plus changer de catégorie (annule la facture et recrée-la).
        </p>
        {lignes.map((l) => {
          const verrou = !!(l.article_id || l.immobilisation_id);
          const c = choix[l.id];
          const sous = categories[c.categorie] || [];
          const sousAff = c.sous_categorie && !sous.includes(c.sous_categorie) ? [c.sous_categorie, ...sous] : sous;
          const catAff = c.categorie && !Object.keys(categories).includes(c.categorie) ? [c.categorie, ...Object.keys(categories)] : Object.keys(categories);
          return (
            <div key={l.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '10px', marginBottom: '8px', opacity: verrou ? 0.7 : 1 }}>
              <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                <strong>{l.libelle}</strong> — {fr(l.montant)} Ar{verrou ? (l.article_id ? '  📦 entré en stock' : '  🏢 immobilisation créée') : ''}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select style={styles.input} disabled={verrou} value={c.categorie}
                  onChange={(e) => setChoix({ ...choix, [l.id]: { categorie: e.target.value, sous_categorie: '' } })}>
                  <option value="">Catégorie</option>
                  {catAff.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <select style={styles.input} disabled={verrou || !sousAff.length} value={c.sous_categorie}
                  onChange={(e) => setChoix({ ...choix, [l.id]: { ...c, sous_categorie: e.target.value } })}>
                  <option value="">Sous-catégorie</option>
                  {sousAff.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button style={styles.boutonSecondaire} onClick={onCancel}>Annuler</button>
          <button style={{ ...styles.boutonPrimaire, opacity: enCours || !modifiees.length ? 0.5 : 1 }} disabled={enCours || !modifiees.length}
            onClick={() => soumettre(() => onSave(modifiees.map((l) => ({ id: l.id, ...choix[l.id] }))))}>
            {enCours ? '⏳ Patientez...' : '💾 Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
