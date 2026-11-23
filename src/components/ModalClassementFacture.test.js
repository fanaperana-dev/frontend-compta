import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModalClassementFacture from './ModalClassementFacture';

const styles = { modal: {}, modalContent: {}, label: {}, input: {}, boutonPrimaire: {}, boutonSecondaire: {} };
const categories = { '70 - Ventes': ['701 - Produits finis', '706 - Prestations'], '60 - Achats': ['604 - Etudes'] };
const facture = { numero_facture: 'SOB-044', categorie: '70 - Ventes', sous_categorie: '706 - Prestations' };

test('verrouille tout sauf categorie et sous-categorie, bouton grise tant que rien ne change', async () => {
  const onSave = jest.fn().mockResolvedValue();
  render(<ModalClassementFacture facture={facture} categories={categories} styles={styles} onSave={onSave} onCancel={() => {}} />);
  expect(screen.getByText(/SOB-044/)).toBeTruthy();
  const bouton = screen.getByText('Enregistrer');
  expect(bouton.disabled).toBe(true);
  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[1], { target: { value: '701 - Produits finis' } });
  expect(bouton.disabled).toBe(false);
  fireEvent.click(bouton);
  await waitFor(() => expect(onSave).toHaveBeenCalledWith('70 - Ventes', '701 - Produits finis'));
});

test('changer de categorie vide la sous-categorie et interdit d\'enregistrer sans categorie', () => {
  render(<ModalClassementFacture facture={facture} categories={categories} styles={styles} onSave={jest.fn()} onCancel={() => {}} />);
  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[0], { target: { value: '60 - Achats' } });
  const sous = screen.getAllByRole('combobox')[1];
  expect(sous.value).toBe('');
  expect(screen.getAllByRole('combobox')[1].querySelectorAll('option').length).toBe(2);
});
