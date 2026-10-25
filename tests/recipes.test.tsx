import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { flush, methodsData, renderApp, recipesData, tEs } from './helpers';

vi.mock('../src/lib/db', () => ({
  loadEquipmentIds: async () => null,
  saveEquipmentIds: async () => undefined,
  persistStorage: async () => false,
}));

const v60 = recipesData.find(r => r.id === 'v60-clasica')!;
const chemex = recipesData.find(r => r.id === 'chemex-clasica')!;
const v60Name = tEs(v60.nameKey);
const chemexName = tEs(chemex.nameKey);

const CUSTOM_NAME = 'Café de la abuela';

/** Live limits of a method straight from methods.json — the copy under test interpolates them. */
const limitsOf = (methodId: string) => methodsData.find(m => m.id === methodId)!.limits!;

const hintText = (methodId: string) =>
  tEs('method.limitHint')
    .replace('{tazas}', String(limitsOf(methodId).cupsMax))
    .replace('{agua}', String(limitsOf(methodId).waterMaxG))
    .replace('{metodo}', tEs(methodsData.find(m => m.id === methodId)!.nameKey));

/** The modal's error copy interpolates the selected method's live limits. */
const ratioErr = (methodId: string) =>
  tEs('error.ratio-range')
    .replace('{min}', String(limitsOf(methodId).ratioMin))
    .replace('{max}', String(limitsOf(methodId).ratioMax));

const coffeeErr = (methodId: string) =>
  tEs('error.coffee-range')
    .replace('{min}', '1')
    .replace('{max}', String(limitsOf(methodId).coffeeMaxG));

function goRecipes(): void {
  fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
}

function card(name: string) {
  return screen.getByRole('button', { name: `${tEs('brew.prepare')}: ${name}` });
}

function openCreateModal(): void {
  goRecipes();
  fireEvent.click(screen.getByRole('button', { name: tEs('recipes.new') }));
}

describe('recipes list', () => {
  it('groups official recipes by method, in method order, with counts', () => {
    const { container } = renderApp();
    goRecipes();
    const heads = container.querySelectorAll('.method-group-head');
    expect([...heads].map(h => h.querySelector('h3')!.textContent))
      .toEqual(methodsData.map(m => tEs(m.nameKey)));
    expect([...heads].map(h => h.querySelector('.hero-meta')!.textContent))
      .toEqual(methodsData.map(m => String(recipesData.filter(r => r.methodId === m.id).length)));
  });

  it('cards are role=button and Enter / Space both start brewing', () => {
    renderApp();
    goRecipes();
    const v60Card = card(v60Name);
    fireEvent.keyDown(v60Card, { key: 'Enter' });
    expect(screen.getByRole('button', { name: `‹ ${tEs('nav.recipes')}` })).toBeTruthy();

    goRecipes();
    fireEvent.keyDown(card(chemexName), { key: ' ' });
    expect(screen.getByRole('button', { name: `‹ ${tEs('nav.recipes')}` })).toBeTruthy();
    expect(screen.getByTestId('method-limit-hint').textContent)
      .toContain(tEs('method.chemex.name'));
  });

  it('official recipes do not show a delete action', () => {
    renderApp();
    goRecipes();
    expect(screen.queryByRole('button', { name: new RegExp(`^${tEs('recipes.delete')}`) })).toBeNull();
  });
});

describe('favorites', () => {
  it('starts with an empty favorites state message', () => {
    renderApp();
    goRecipes();
    fireEvent.click(screen.getByRole('radio', { name: tEs('recipes.favorites') }));
    expect(screen.getByText(tEs('recipes.emptyFav'))).toBeTruthy();
    expect(screen.queryByRole('button', { name: new RegExp(`^${tEs('brew.prepare')}:`) })).toBeNull();
  });

  it('toggling a heart persists and the filter narrows the list', () => {
    renderApp();
    goRecipes();
    const heart = within(card(v60Name)).getByRole('button', { name: `${tEs('recipes.favorite')}: ${v60Name}` });
    expect(heart.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(heart);
    expect(heart.getAttribute('aria-pressed')).toBe('true');
    expect(JSON.parse(localStorage.getItem('vertida-favorites') ?? '[]')).toContain(v60.id);

    fireEvent.click(screen.getByRole('radio', { name: tEs('recipes.favorites') }));
    expect(card(v60Name)).toBeTruthy();
    expect(screen.queryByText(chemexName)).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: tEs('recipes.all') }));
    expect(card(chemexName)).toBeTruthy();
  });
});

describe('custom recipes', () => {
  function fillName(name: string): void {
    fireEvent.change(screen.getByPlaceholderText(tEs('recipes.fieldNamePh')), { target: { value: name } });
  }

  it('validates name, ratio and dose before saving', () => {
    renderApp();
    openCreateModal();
    const dialog = screen.getByRole('dialog', { name: tEs('recipes.create') });

    fireEvent.click(within(dialog).getByRole('button', { name: tEs('recipes.save') }));
    expect(screen.getByRole('alert').textContent).toBe(tEs('error.required'));

    fillName('Test');
    fireEvent.change(within(dialog).getByLabelText(tEs('calc.ratio')), { target: { value: '99' } });
    fireEvent.click(within(dialog).getByRole('button', { name: tEs('recipes.save') }));
    expect(screen.getByRole('alert').textContent).toBe(ratioErr('v60')); // default method band 14–18

    fireEvent.change(within(dialog).getByLabelText(tEs('calc.ratio')), { target: { value: '16' } });
    fireEvent.change(within(dialog).getByLabelText(tEs('calc.coffee')), { target: { value: '999' } });
    fireEvent.click(within(dialog).getByRole('button', { name: tEs('recipes.save') }));
    expect(screen.getByRole('alert').textContent).toBe(coffeeErr('v60')); // "1 a 30 g", not the old static 500

    // Switching the method re-reads its limits in the error copy too (espresso: 1.5–2.5, ≤22 g)
    fireEvent.change(within(dialog).getByLabelText(tEs('brew.method')), { target: { value: 'espresso' } });
    fireEvent.click(within(dialog).getByRole('button', { name: tEs('recipes.save') }));
    expect(screen.getByRole('alert').textContent).toBe(ratioErr('espresso'));

    fireEvent.change(within(dialog).getByLabelText(tEs('calc.ratio')), { target: { value: '2' } });
    fireEvent.click(within(dialog).getByRole('button', { name: tEs('recipes.save') }));
    expect(screen.getByRole('alert').textContent).toBe(coffeeErr('espresso'));
  });

  it('shows live method limits in the modal, fully interpolated (no raw placeholders)', () => {
    renderApp();
    openCreateModal();
    const hint = screen.getByTestId('create-limit-hint');

    expect(hint.textContent).toBe(hintText('v60'));
    expect(hint.textContent).not.toContain('{');

    fireEvent.change(screen.getByLabelText(tEs('brew.method')), { target: { value: 'aeropress' } });
    expect(hint.textContent).toBe(hintText('aeropress'));
  });

  it('rejects a dose that would exceed the method water cap', () => {
    renderApp();
    openCreateModal();
    const dialog = screen.getByRole('dialog', { name: tEs('recipes.create') });
    fillName('Too big');
    fireEvent.change(within(dialog).getByLabelText(tEs('calc.ratio')), { target: { value: '18' } });
    fireEvent.change(within(dialog).getByLabelText(tEs('calc.coffee')), { target: { value: '30' } });
    fireEvent.click(within(dialog).getByRole('button', { name: tEs('recipes.save') }));
    // 30 g × 18 = 540 g > v60 cap 420 g (methods.json) → App enforces the method limit hint
    expect(screen.getByRole('alert').textContent).toBe(hintText('v60'));
  });

  it('creates, brews, persists and finally deletes a custom recipe', async () => {
    renderApp();
    openCreateModal();
    const dialog = screen.getByRole('dialog', { name: tEs('recipes.create') });
    fillName(CUSTOM_NAME);
    fireEvent.change(within(dialog).getByLabelText(tEs('calc.coffee')), { target: { value: '15' } });
    fireEvent.change(within(dialog).getByLabelText(tEs('recipes.fieldNotes')), { target: { value: 'Con canela' } });
    fireEvent.click(within(dialog).getByRole('button', { name: tEs('recipes.save') }));

    // Saved → navigates to the brew summary of the new recipe
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: CUSTOM_NAME })).toBeTruthy();

    // Appears in the list with its notes and is persisted
    goRecipes();
    expect(card(CUSTOM_NAME)).toBeTruthy();
    expect(screen.getByText('Con canela')).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem('vertida-custom-recipes') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe(CUSTOM_NAME);
    await flush();

    // Deleting removes it from the list and storage without leaving the tab
    fireEvent.click(screen.getByRole('button', { name: `${tEs('recipes.delete')} ${CUSTOM_NAME}` }));
    expect(screen.queryByText(CUSTOM_NAME)).toBeNull();
    expect(JSON.parse(localStorage.getItem('vertida-custom-recipes') ?? '[]')).toHaveLength(0);
    expect(screen.getByRole('region', { name: tEs('recipes.title') })).toBeTruthy();
  });

  it('the create modal closes on Escape and restores focus to its trigger', () => {
    renderApp();
    openCreateModal();
    const nameInput = screen.getByPlaceholderText(tEs('recipes.fieldNamePh'));
    expect(document.activeElement).toBe(nameInput); // autofocus

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect((document.activeElement as HTMLElement).textContent).toBe(tEs('recipes.new'));
  });
});
