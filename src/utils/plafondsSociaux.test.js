import { plafondCnapsOstie, salaireMinimumEmbauche, numeroMois } from './plafondsSociaux';

test('plafond = 8 × SME : 2 400 000 jusqu\'en septembre 2026, 2 520 000 depuis octobre 2026', () => {
  expect(plafondCnapsOstie('Septembre', 2026)).toBe(2400000);
  expect(plafondCnapsOstie('Octobre', 2026)).toBe(2520000);
  expect(plafondCnapsOstie(12, 2026)).toBe(2520000);
  expect(plafondCnapsOstie('Janvier', 2027)).toBe(2520000);
  expect(plafondCnapsOstie('Mars', 2026)).toBe(2400000);
});

test('SME 315 000 depuis octobre 2026', () => {
  expect(salaireMinimumEmbauche(10, 2026)).toBe(315000);
  expect(salaireMinimumEmbauche('Août', 2026)).toBe(300000);
});

test('période illisible : valeur la plus récente', () => {
  expect(plafondCnapsOstie(null, null)).toBe(2520000);
  expect(numeroMois('Février')).toBe(2);
  expect(numeroMois('décembre')).toBe(12);
});
