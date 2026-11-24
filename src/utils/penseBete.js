// Pense-bête du dashboard : état d'un rappel selon la date du jour (fonctions pures).

export const DELAIS_RAPPEL = [
  { jours: 0, label: 'Le jour même' },
  { jours: 1, label: '1 jour avant' },
  { jours: 3, label: '3 jours avant' },
  { jours: 7, label: '7 jours avant' },
  { jours: 15, label: '15 jours avant' },
  { jours: 30, label: '30 jours avant' }
];

// Date du jour dans le fuseau de l'utilisateur, au format AAAA-MM-JJ
export function aujourdhuiLocal(date = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

// Nombre de jours entre deux dates AAAA-MM-JJ (positif = la date est dans le futur)
export function ecartJours(date, reference) {
  const t = s => { const [a, m, j] = String(s).slice(0, 10).split('-').map(Number); return Date.UTC(a, m - 1, j); };
  return Math.round((t(date) - t(reference)) / 86400000);
}

/**
 * RETARD (date passée) · AUJOURDHUI · BIENTOT (dans la fenêtre de rappel) · A_VENIR · FERME
 */
export function etatRappel(rappel, aujourdhui = aujourdhuiLocal()) {
  if (rappel.ferme) return 'FERME';
  const j = ecartJours(rappel.date_echeance, aujourdhui);
  if (j < 0) return 'RETARD';
  if (j === 0) return 'AUJOURDHUI';
  if (j <= (Number(rappel.rappel_jours_avant) || 0)) return 'BIENTOT';
  return 'A_VENIR';
}

// Rappels qui doivent alerter l'utilisateur maintenant
export const estActif = (rappel, aujourdhui) => ['RETARD', 'AUJOURDHUI', 'BIENTOT'].includes(etatRappel(rappel, aujourdhui));

export function libelleEcheance(rappel, aujourdhui = aujourdhuiLocal()) {
  const j = ecartJours(rappel.date_echeance, aujourdhui);
  if (j === 0) return "aujourd'hui";
  if (j === 1) return 'demain';
  if (j === -1) return 'hier';
  if (j > 1) return `dans ${j} jours`;
  return `en retard de ${-j} jours`;
}

// Ordre d'affichage : ce qui est urgent d'abord (date croissante), les fermés à part
export function trierRappels(rappels) {
  return [...rappels].sort((a, b) => String(a.date_echeance).localeCompare(String(b.date_echeance)));
}
