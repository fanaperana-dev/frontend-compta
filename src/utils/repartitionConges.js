// (Même règle que le back : src/services/repartitionConges.js)
// Répartition d'un congé à cheval sur plusieurs mois.
//
// Un congé du 28 novembre au 10 décembre compte 3 jours sur la fiche de novembre
// et 10 jours sur celle de décembre. Règle :
//  - chaque mois reçoit ses jours calendaires compris entre les deux dates ;
//  - le dernier mois reçoit le reste du total saisi (week-end qui suit un congé terminant
//    un vendredi ou un samedi, jours réduits à la main, demi-journées…), de sorte que
//    la somme des mois égale toujours le nombre de jours de la demande.

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet',
  'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// 'YYYY-MM-DD' (ou ISO complet) → { a, m, j } sans passer par Date (pas de décalage de fuseau)
function decouper(date) {
  const t = String(date || '').slice(0, 10).split('-').map(Number);
  if (t.length !== 3 || t.some(n => !Number.isFinite(n)) || !t[0] || !t[1] || !t[2]) return null;
  return { a: t[0], m: t[1] - 1, j: t[2] };
}

const joursDansMois = (a, m) => new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
const arrondi2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * @returns {{mois:string, annee:number, nb_jours:number}[]} un élément par mois touché, dans l'ordre.
 */
function repartirParMois(date_debut, date_fin, nb_jours) {
  const d = decouper(date_debut);
  const f = decouper(date_fin) || d;
  const total = Number(nb_jours) || 0;
  if (!d || !f) return [];
  if (f.a * 372 + f.m * 31 + f.j < d.a * 372 + d.m * 31 + d.j) return [];

  // Liste des mois touchés avec leurs jours calendaires
  const parts = [];
  let a = d.a; let m = d.m;
  for (;;) {
    const premier = (a === d.a && m === d.m) ? d.j : 1;
    const dernier = (a === f.a && m === f.m) ? f.j : joursDansMois(a, m);
    parts.push({ mois: MOIS[m], annee: a, calendaires: dernier - premier + 1 });
    if (a === f.a && m === f.m) break;
    m += 1;
    if (m > 11) { m = 0; a += 1; }
  }

  let reste = total;
  const resultat = parts.map((p, i) => {
    const dernierMois = i === parts.length - 1;
    const jours = dernierMois ? reste : Math.min(p.calendaires, reste);
    reste = arrondi2(reste - jours);
    return { mois: p.mois, annee: p.annee, nb_jours: arrondi2(jours) };
  });
  // Un mois qui ne reçoit aucun jour (congé réduit à la main) n'est pas listé
  const utiles = resultat.filter(p => p.nb_jours > 0);
  return utiles.length ? utiles : resultat.slice(0, 1);
}

// Jours d'une demande pour un mois donné (0 si elle ne touche pas ce mois)
function joursDuMois(demande, mois, annee) {
  const cible = String(mois || '').toLowerCase();
  const parts = repartirParMois(demande.date_debut, demande.date_fin, demande.nb_jours);
  // Dates illisibles : on garde l'ancienne règle (tout sur le mois enregistré de la demande)
  if (parts.length === 0) {
    return (String(demande.mois || '').toLowerCase() === cible && Number(demande.annee) === Number(annee))
      ? Number(demande.nb_jours) || 0 : 0;
  }
  const part = parts.find(p => p.annee === Number(annee) && p.mois.toLowerCase() === cible);
  return part ? part.nb_jours : 0;
}

export { repartirParMois, joursDuMois, MOIS };
