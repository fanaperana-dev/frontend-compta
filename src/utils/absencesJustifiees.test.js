import { joursCalendaires, nomPieceJointe } from './absencesJustifiees';

test('samedi et dimanche comptent chacun 1 jour', () => {
  expect(joursCalendaires('2026-11-28', '2026-11-29')).toBe(2);
  expect(joursCalendaires('2026-11-26', '2026-11-26')).toBe(1);
  expect(joursCalendaires('2026-11-28', '2026-12-10')).toBe(13);
});

test('dates inversées ou vides : 0 jour', () => {
  expect(joursCalendaires('2026-11-26', '2026-11-25')).toBe(0);
  expect(joursCalendaires('', '')).toBe(0);
});

test('nom de la pièce jointe : Absencejustifié_nom_prenom_date', () => {
  expect(nomPieceJointe('RAKOTO', 'Jean Paul', '2026-11-26', 'certificat.PDF')).toBe('Absencejustifié_RAKOTO_JeanPaul_2026-11-26.pdf');
  expect(nomPieceJointe('Rabe', '', '2026-12-01', 'photo.jpg')).toBe('Absencejustifié_Rabe_2026-12-01.jpg');
});
