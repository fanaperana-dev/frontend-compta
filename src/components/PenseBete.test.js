import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PenseBete from './PenseBete';
import { aujourdhuiLocal } from '../utils/penseBete';

jest.mock('react-toastify', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

const decale = n => { const d = new Date(); d.setDate(d.getDate() + n); return aujourdhuiLocal(d); };
const rappel = (id, titre, jours, extra = {}) => ({ id, titre, date_echeance: decale(jours), rappel_jours_avant: 3, ferme: false, ...extra });

function monter(rappels, surcharges = {}) {
  const pb = {
    rappels, actifs: rappels.filter(r => !r.ferme && new Date(r.date_echeance) <= new Date(decale(3))),
    ajouter: jest.fn().mockResolvedValue(true), modifier: jest.fn().mockResolvedValue(true),
    supprimer: jest.fn().mockResolvedValue(true), ...surcharges
  };
  render(<PenseBete pb={pb} cardStyle={{}} />);
  return pb;
}

test('liste les rappels, les urgents sont signalés, les lointains restent discrets', () => {
  monter([rappel('1', 'Renouveler assurance', 2), rappel('2', 'Réunion fournisseur', 30), rappel('3', 'Déclaration en retard', -2)]);
  expect(screen.getByText(/Renouveler assurance/)).toBeTruthy();
  expect(screen.getByText(/dans 2 jours/)).toBeTruthy();
  expect(screen.getByText(/en retard de 2 jours/)).toBeTruthy();
  expect(screen.getByText(/dans 30 jours/)).toBeTruthy();
  expect(screen.getByText(/2 à voir/)).toBeTruthy();
});

test('« Fait, fermer » ferme le rappel', () => {
  const pb = monter([rappel('1', 'Renouveler assurance', 1)]);
  fireEvent.click(screen.getByText(/Fait, fermer/));
  expect(pb.modifier).toHaveBeenCalledWith('1', { ferme: true });
});

test('ajout d\'un rappel : titre obligatoire puis envoi', async () => {
  const pb = monter([]);
  fireEvent.click(screen.getByText('+ Ajouter un rappel'));
  fireEvent.click(screen.getByText('Enregistrer'));
  expect(pb.ajouter).not.toHaveBeenCalled();
  fireEvent.change(screen.getByPlaceholderText(/renouveler l'assurance/), { target: { value: 'Visite technique' } });
  fireEvent.click(screen.getByText('Enregistrer'));
  await waitFor(() => expect(pb.ajouter).toHaveBeenCalledTimes(1));
  expect(pb.ajouter.mock.calls[0][0]).toMatchObject({ titre: 'Visite technique', rappel_jours_avant: 3 });
});

test('les rappels fermés sont dans une liste repliée, avec « Rouvrir »', () => {
  const pb = monter([rappel('1', 'Ancien rappel', -10, { ferme: true })]);
  expect(screen.queryByText(/Ancien rappel/)).toBeNull();
  fireEvent.click(screen.getByText(/Rappels fermés \(1\)/));
  fireEvent.click(screen.getByText(/Rouvrir/));
  expect(pb.modifier).toHaveBeenCalledWith('1', { ferme: false });
});
