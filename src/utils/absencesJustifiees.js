// Absences justifiées : chaque jour calendaire compte (samedi et dimanche comptent chacun 1 jour).
// Le nombre de jours reste modifiable à la main, comme pour un congé (ex. demi-journée : 0,5).
export function joursCalendaires(debut, fin) {
  if (!debut || !fin) return 0;
  const lire = d => {
    const t = String(d).slice(0, 10).split('-').map(Number);
    return t.length === 3 && t.every(n => Number.isFinite(n) && n) ? Date.UTC(t[0], t[1] - 1, t[2]) : null;
  };
  const a = lire(debut); const b = lire(fin);
  if (a === null || b === null || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

// Nom de la pièce jointe côté serveur : Absencejustifié_nom_prenom_date.extension
export function nomPieceJointe(nom, prenom, dateDebut, nomFichier) {
  const propre = t => String(t || '').replace(/[\\/:*?"<>|\s]+/g, '').replace(/^[_.]+|[_.]+$/g, '');
  const ext = String(nomFichier || '').includes('.') ? String(nomFichier).split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const base = ['Absencejustifié', propre(nom) || 'Salarie', propre(prenom), String(dateDebut || '').slice(0, 10)].filter(Boolean).join('_');
  return ext ? `${base}.${ext}` : base;
}
