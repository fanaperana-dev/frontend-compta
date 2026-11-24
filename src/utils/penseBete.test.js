import { etatRappel, estActif, libelleEcheance, trierRappels, ecartJours } from './penseBete';

const r = (date_echeance, rappel_jours_avant = 3, ferme = false) => ({ date_echeance, rappel_jours_avant, ferme });
const AUJ = '2026-11-24';

test('états selon la date et le délai de rappel', () => {
  expect(etatRappel(r('2026-11-20'), AUJ)).toBe('RETARD');
  expect(etatRappel(r('2026-11-24'), AUJ)).toBe('AUJOURDHUI');
  expect(etatRappel(r('2026-11-27'), AUJ)).toBe('BIENTOT');   // 3 jours, délai 3
  expect(etatRappel(r('2026-11-28'), AUJ)).toBe('A_VENIR');   // 4 jours, délai 3
  expect(etatRappel(r('2026-11-28', 7), AUJ)).toBe('BIENTOT');
  expect(etatRappel(r('2026-11-20', 3, true), AUJ)).toBe('FERME');
});

test('délai 0 : alerte seulement le jour même', () => {
  expect(etatRappel(r('2026-11-25', 0), AUJ)).toBe('A_VENIR');
  expect(etatRappel(r('2026-11-24', 0), AUJ)).toBe('AUJOURDHUI');
});

test('actifs = retard, aujourd\'hui, bientôt', () => {
  expect(estActif(r('2026-11-20'), AUJ)).toBe(true);
  expect(estActif(r('2026-12-30'), AUJ)).toBe(false);
  expect(estActif(r('2026-11-20', 3, true), AUJ)).toBe(false);
});

test('écart entre dates, y compris au changement de mois et d\'année', () => {
  expect(ecartJours('2026-12-01', '2026-11-30')).toBe(1);
  expect(ecartJours('2027-01-02', '2026-12-30')).toBe(3);
});

test('libellés', () => {
  expect(libelleEcheance(r('2026-11-24'), AUJ)).toBe("aujourd'hui");
  expect(libelleEcheance(r('2026-11-25'), AUJ)).toBe('demain');
  expect(libelleEcheance(r('2026-11-29'), AUJ)).toBe('dans 5 jours');
  expect(libelleEcheance(r('2026-11-21'), AUJ)).toBe('en retard de 3 jours');
});

test('tri par date', () => {
  expect(trierRappels([r('2026-12-02'), r('2026-11-01')]).map(x => x.date_echeance)).toEqual(['2026-11-01', '2026-12-02']);
});
