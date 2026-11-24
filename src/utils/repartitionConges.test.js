import { repartirParMois, joursDuMois } from './repartitionConges';

describe('repartirParMois', () => {
  test('28 novembre → 10 décembre : 3 j en novembre, 10 j en décembre', () => {
    expect(repartirParMois('2026-11-28', '2026-12-10', 13)).toEqual([
      { mois: 'Novembre', annee: 2026, nb_jours: 3 },
      { mois: 'Décembre', annee: 2026, nb_jours: 10 }
    ]);
  });
  test('un congé dans un seul mois reste tel quel', () => {
    expect(repartirParMois('2026-11-10', '2026-11-12', 3)).toEqual([{ mois: 'Novembre', annee: 2026, nb_jours: 3 }]);
  });
  test('passage d\'année', () => {
    expect(repartirParMois('2026-12-28', '2027-01-03', 7)).toEqual([
      { mois: 'Décembre', annee: 2026, nb_jours: 4 },
      { mois: 'Janvier', annee: 2027, nb_jours: 3 }
    ]);
  });
  test('le week-end ajouté et les jours réduits à la main restent sur le total saisi', () => {
    const somme = l => l.reduce((s, p) => s + p.nb_jours, 0);
    expect(somme(repartirParMois('2026-11-28', '2026-12-04', 9))).toBe(9);
    expect(repartirParMois('2026-11-28', '2026-12-10', 12.5)[1].nb_jours).toBe(9.5);
    expect(repartirParMois('2026-11-28', '2026-12-10', 10)).toEqual([
      { mois: 'Novembre', annee: 2026, nb_jours: 3 }, { mois: 'Décembre', annee: 2026, nb_jours: 7 }
    ]);
  });
  test('un mois sans aucun jour n\'est pas listé', () => {
    expect(repartirParMois('2026-11-28', '2027-01-05', 9).map(p => p.mois)).toEqual(['Novembre', 'Décembre']);
  });
  test('joursDuMois', () => {
    const d = { date_debut: '2026-11-28', date_fin: '2026-12-10', nb_jours: 13, mois: 'Novembre', annee: 2026 };
    expect(joursDuMois(d, 'Décembre', 2026)).toBe(10);
    expect(joursDuMois(d, 'Janvier', 2027)).toBe(0);
  });
});
