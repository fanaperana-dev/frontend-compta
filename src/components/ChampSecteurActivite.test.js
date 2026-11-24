import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChampSecteurActivite from './ChampSecteurActivite';
import { SECTEURS_ACTIVITE, aideSecteur, libelleSecteur } from '../utils/secteursActivite';

test('liste fermée : un choix par secteur et aucune saisie libre', () => {
  const onChange = jest.fn();
  render(<ChampSecteurActivite valeur="" onChange={onChange} styleLabel={{}} styleChamp={{}} />);
  expect(screen.getAllByRole('option')).toHaveLength(SECTEURS_ACTIVITE.length + 1);
  expect(screen.queryByRole('textbox')).toBeNull();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ARTISANAT' } });
  expect(onChange).toHaveBeenCalledWith('ARTISANAT');
});

test('l\'aide montre les minima du secteur choisi', () => {
  expect(aideSecteur('ARTISANAT')).toMatch(/50\s?000 Ar \(impôt synthétique\)/);
  expect(aideSecteur('ARTISANAT')).toMatch(/500\s?000 Ar \+ 1 %/);
  expect(aideSecteur('EDUCATION_SANTE')).toMatch(/à confirmer/);
  expect(aideSecteur('')).toMatch(/n'est pas appliqué/);
});

test('codes uniques et libellés retrouvés', () => {
  const codes = SECTEURS_ACTIVITE.map(s => s.code);
  expect(new Set(codes).size).toBe(codes.length);
  expect(libelleSecteur('MINES')).toMatch(/minière/);
  expect(libelleSecteur('')).toBe('');
});
