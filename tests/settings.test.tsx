import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flush, methodsData, recipesData, renderApp, tEs } from './helpers';
import { calcCoffee } from '../src/lib/calc';
import { CONFIG } from '../src/config';

const saveEquipmentIds = vi.hoisted(() => vi.fn(async (_ids: string[]) => undefined));
const loadEquipmentIds = vi.hoisted(() => vi.fn(async (): Promise<string[] | null> => null));
vi.mock('../src/lib/db', () => ({
  loadEquipmentIds,
  saveEquipmentIds,
  persistStorage: async () => false,
}));

const methodName = (id: string): string => tEs(methodsData.find(m => m.id === id)!.nameKey);

function goSettings(): void {
  fireEvent.click(screen.getByRole('tab', { name: tEs('nav.settings') }));
}

function openEquipment(): void {
  goSettings();
  fireEvent.click(screen.getByRole('button', { name: tEs('settings.equipmentChoose') }));
}

function setEquipment(...ids: string[]): void {
  for (const id of ids) {
    fireEvent.click(screen.getByRole('checkbox', { name: methodName(id) }));
  }
}

beforeEach(() => {
  saveEquipmentIds.mockClear();
  loadEquipmentIds.mockClear();
  loadEquipmentIds.mockResolvedValue(null);
});

describe('theme', () => {
  it('applies dark mode to the document, the sub-label and localStorage', () => {
    const { container } = renderApp();
    goSettings();
    fireEvent.click(screen.getByRole('radio', { name: tEs('settings.dark') }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('vertida-theme-mode')).toBe('dark');
    expect(container.querySelector('.theme-current')!.textContent)
      .toBe(`${tEs('settings.themeCurrent')}: ${tEs('settings.dark')}`);
  });

  it('auto follows the OS preference (light in this environment)', () => {
    renderApp();
    goSettings();
    fireEvent.click(screen.getByRole('radio', { name: tEs('settings.auto') }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('vertida-theme')).toBe('light');
  });
});

describe('advanced mode', () => {
  it('enabling it reveals the retention reference in the brew summary', () => {
    renderApp();
    goSettings();
    fireEvent.click(screen.getByRole('radio', { name: tEs('common.on') }));
    expect(screen.getByRole('radio', { name: tEs('common.on') }).getAttribute('aria-checked')).toBe('true');

    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
    fireEvent.click(screen.getByRole('button', { name: `${tEs('brew.prepare')}: ${tEs('recipe.v60-balanced.name')}` }));
    // Retention reference = derived dose for 1 cup × g/g, with the cup taken from the method limits
    const v60 = recipesData.find(r => r.id === 'v60-balanced')!;
    const v60Limits = methodsData.find(m => m.id === 'v60')!.limits!;
    const cup = Math.min(Math.max(...v60.phases.map(p => p.waterAccumulatedG)), v60Limits.waterMaxG / v60Limits.cupsMax);
    const retention = (calcCoffee(cup, v60.ratio) * CONFIG.retentionGramsPerGram).toFixed(0);
    expect(screen.getByText(`${tEs('brew.retention')}: ${retention} g (${tEs('brew.reference')})`)).toBeTruthy();
  });
});

describe('equipment', () => {
  it('restores the selection saved in IndexedDB on startup', async () => {
    loadEquipmentIds.mockResolvedValueOnce(['v60']);
    renderApp();
    await flush();

    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.home') }));
    expect(screen.getByText(`1/${methodsData.length}`)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
    expect(screen.getByText(tEs('recipe.v60-balanced.name'))).toBeTruthy();
    expect(screen.queryByText(tEs('recipe.chemex-balanced-16.name'))).toBeNull();
  });

  it('upgrades legacy equipment ids saved by older builds', async () => {
    loadEquipmentIds.mockResolvedValueOnce(['v60', 'prensa-francesa']);
    renderApp();
    await flush();

    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
    expect(screen.getByText(tEs('recipe.v60-balanced.name'))).toBeTruthy();
    expect(screen.getByText(tEs('recipe.french-press-light-17.name'))).toBeTruthy();
    expect(screen.queryByText(tEs('recipe.chemex-balanced-16.name'))).toBeNull();
  });

  it('toggling updates the counter, persists via the IndexedDB seam and filters the app', async () => {
    renderApp();
    openEquipment();
    const dialog = screen.getByRole('dialog', { name: tEs('settings.equipmentChoose') });
    const total = methodsData.length;
    expect(screen.getAllByRole('checkbox')).toHaveLength(total);
    expect(screen.getAllByRole('checkbox').every(c => (c as HTMLInputElement).checked)).toBe(true);

    fireEvent.click(within(dialog).getByRole('button', { name: tEs('settings.equipmentSave') }));
    expect(screen.queryByRole('dialog')).toBeNull();

    openEquipment();
    setEquipment('chemex');
    expect(document.querySelector('.modal-count')!.textContent).toBe(`${total - 1} / ${total}`);
    await flush();
    const calls = saveEquipmentIds.mock.calls;
    const persisted = calls[calls.length - 1]?.[0] as string[] | undefined;
    expect(persisted).toContain('v60'); // remaining selection persisted
    expect(persisted).not.toContain('chemex'); // deselected method removed from storage

    fireEvent.click(within(dialog).getByRole('button', { name: tEs('settings.equipmentSave') }));

    // Home stats reflect total-1 / total methods
    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.home') }));
    expect(screen.getByText(`${total - 1}/${total}`)).toBeTruthy();

    // Recipes tab hides the deselected method
    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
    expect(screen.queryByText(tEs('recipe.chemex-balanced-16.name'))).toBeNull();
    expect(screen.getByText(tEs('recipe.v60-balanced.name'))).toBeTruthy();
  });

  it('deselecting everything shows the empty states and a shortcut back to equipment', () => {
    renderApp();
    openEquipment();
    setEquipment(...methodsData.map(m => m.id));
    fireEvent.click(screen.getByRole('button', { name: tEs('settings.equipmentSave') }));

    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.home') }));
    expect(screen.getByText(tEs('recipes.empty'))).toBeTruthy();
    expect(screen.getByText(tEs('discover.empty'))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: tEs('settings.equipmentChoose') }));
    expect(screen.getByRole('region', { name: tEs('settings.title') })).toBeTruthy();
  });
});
