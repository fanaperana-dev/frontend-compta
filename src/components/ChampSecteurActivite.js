import React from 'react';
import { SECTEURS_ACTIVITE, aideSecteur } from '../utils/secteursActivite';

// Liste déroulante du secteur d'activité (pas de saisie libre : l'activité en texte libre reste dans son propre champ).
export default function ChampSecteurActivite({ valeur, onChange, styleLabel, styleChamp }) {
  return (
    <div>
      <label style={styleLabel}>Secteur d'activité (calcul du minimum d'impôt)</label>
      <select style={styleChamp} value={valeur || ''} onChange={e => onChange(e.target.value)}>
        <option value="">— Choisir —</option>
        {SECTEURS_ACTIVITE.map(s => <option key={s.code} value={s.code}>{s.libelle}</option>)}
      </select>
      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{aideSecteur(valeur)}</div>
    </div>
  );
}
