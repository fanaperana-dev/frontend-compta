import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormulaireFactureIntelligente from './FormulaireFactureIntelligente';

const styles = { modal: {}, modalContent: {}, label: {}, input: {}, boutonPrimaire: {}, boutonSecondaire: {}, boutonDanger: {} };
const categories = {
  '37 - Stocks de marchandises': [],
  '60 - Achats consommés': ['606 - Achats non stockés de matières et fournitures'],
  '21 - Immobilisations corporelles': ['218 - Autres immobilisations corporelles']
};
const fournisseurs = [{ id: 'f1', nom: 'Ravo SARL', actif: true, delai_paiement: 30 }];
const articles = [{ id: 'A1', designation: 'Balais', actif: true }];
const rendre = (onSave, tva = { assujettie: false, taux: 20 }) => render(
  <FormulaireFactureIntelligente fournisseurs={fournisseurs} articles={articles} categories={categories}
    modesPaiement={['Espèces', 'Mvola', 'Virement bancaire']} tva={tva} entreprise_id="E" styles={styles} onSave={onSave} onCancel={() => {}} />);
const champ = (placeholder, i = 0) => screen.getAllByPlaceholderText(placeholder)[i];

test('facture à plusieurs catégories : contrôle du total, reste affiché, enregistrement bloqué puis permis', async () => {
  const onSave = jest.fn().mockResolvedValue({ ok: true });
  const { container } = rendre(onSave);
  const selects = () => Array.from(container.querySelectorAll('select'));
  fireEvent.change(selects()[0], { target: { value: 'f1' } });
  fireEvent.change(container.querySelector('input[type=number]'), { target: { value: '1000' } });   // montant global
  // bloc 1 : stock
  fireEvent.change(selects()[1], { target: { value: '37 - Stocks de marchandises' } });
  fireEvent.change(champ('ex. Balais'), { target: { value: 'balais' } });
  const nombres = () => Array.from(container.querySelectorAll('input[type=number]'));
  fireEvent.change(nombres()[1], { target: { value: '10' } });    // quantité
  fireEvent.change(nombres()[3], { target: { value: '1200' } });  // montant > global
  expect(screen.getByText(/dépassement de/)).toBeTruthy();
  expect(screen.getByText('Créer la facture').disabled).toBe(true);
  fireEvent.change(nombres()[3], { target: { value: '400' } });
  expect(screen.getByText(/reste 600 Ar à détailler/)).toBeTruthy();
  // le reste n'a pas de catégorie de charge : bloqué
  expect(screen.getByText('Créer la facture').disabled).toBe(true);
  // 2e bloc : charge
  fireEvent.click(screen.getByText('+ Ajouter une autre catégorie'));
  fireEvent.change(selects()[3], { target: { value: '60 - Achats consommés' } });
  fireEvent.change(selects()[4], { target: { value: '606 - Achats non stockés de matières et fournitures' } });
  const libelles = screen.getAllByPlaceholderText('ex. Balais');
  fireEvent.change(libelles[1], { target: { value: 'Savons' } });
  fireEvent.change(nombres()[nombres().length - 1], { target: { value: '600' } });
  expect(screen.getByText(/tout est détaillé/)).toBeTruthy();
  // paiements en deux modes
  fireEvent.click(screen.getByText('+ Ajouter un paiement'));
  fireEvent.click(screen.getByText('+ Ajouter un paiement'));
  const dernierSelects = () => selects().filter((s) => Array.from(s.options).some((o) => o.value === 'Mvola'));
  fireEvent.change(dernierSelects()[0], { target: { value: 'Espèces' } });
  fireEvent.change(dernierSelects()[1], { target: { value: 'Mvola' } });
  const mont = screen.getAllByPlaceholderText('Montant (Ar)');
  fireEvent.change(mont[0], { target: { value: '300' } });
  fireEvent.change(mont[1], { target: { value: '200' } });
  expect(screen.getByText(/Reste à payer au fournisseur/).textContent).toMatch(/500 Ar/);
  const bouton = screen.getByText('Créer la facture');
  expect(bouton.disabled).toBe(false);
  fireEvent.click(bouton);
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  const payload = onSave.mock.calls[0][0];
  expect(payload.montant).toBe(1000);
  expect(payload.paiements.map((p) => p.mode)).toEqual(['Espèces', 'Mvola']);
  expect(payload.blocs[0].lignes[0].article_id).toBe('A1');            // « balais » = article existant « Balais »
  expect(payload.blocs[1].lignes[0]).toMatchObject({ libelle: 'Savons', montant: 600 });
});

test('refus du serveur : message affiché, formulaire conservé, confirmation d\'un article proche', async () => {
  const onSave = jest.fn()
    .mockResolvedValueOnce({ ok: false, code: 'ARTICLE_PROCHE', libelle: 'Brosse', message: 'Un article très proche existe déjà.' })
    .mockResolvedValueOnce({ ok: true });
  const { container } = rendre(onSave);
  const selects = () => Array.from(container.querySelectorAll('select'));
  fireEvent.change(selects()[0], { target: { value: 'f1' } });
  fireEvent.change(container.querySelector('input[type=number]'), { target: { value: '100' } });
  fireEvent.change(selects()[1], { target: { value: '37 - Stocks de marchandises' } });
  fireEvent.change(champ('ex. Balais'), { target: { value: 'Brosse' } });
  fireEvent.change(Array.from(container.querySelectorAll('input[type=number]'))[3], { target: { value: '100' } });
  fireEvent.click(screen.getByText('Créer la facture'));
  await screen.findByText(/très proche/);
  fireEvent.click(screen.getByText(/articles différents/));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  expect(onSave.mock.calls[1][0].blocs[0].lignes[0].nouvel_article.confirmer_similaire).toBe(true);
});

test('entreprise assujettie : la TVA est présaisie sur le montant TTC', () => {
  const { container } = rendre(jest.fn(), { assujettie: true, taux: 20 });
  fireEvent.change(container.querySelector('input[type=number]'), { target: { value: '1200' } });
  expect(container.querySelectorAll('input[type=number]')[1].value).toBe('200');
});
