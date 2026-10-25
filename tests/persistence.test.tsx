import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dEn, flush, renderApp, renderLanding, tEs } from './helpers';
import { PREF_KEYS } from '../src/lib/prefs';

const loadEquipmentIds = vi.hoisted(() => vi.fn(async (): Promise<string[] | null> => null));
const saveEquipmentIds = vi.hoisted(() => vi.fn(async (_ids: string[]) => undefined));
vi.mock('../src/lib/db', () => ({
  loadEquipmentIds,
  saveEquipmentIds,
  persistStorage: async () => false,
}));

beforeEach(() => {
  loadEquipmentIds.mockClear();
  saveEquipmentIds.mockClear();
  loadEquipmentIds.mockResolvedValue(null);
});

const goSettings = (): void => {
  fireEvent.click(screen.getByRole('tab', { name: tEs('nav.settings') }));
};

describe('local preferences', () => {
  it('restores the chosen language after a remount', () => {
    const first = renderApp('es');
    goSettings();
    fireEvent.click(screen.getByRole('radio', { name: 'EN' }));
    expect(localStorage.getItem(PREF_KEYS.lang)).toBe('en');
    first.unmount();

    renderLanding('es'); // OS language is still Spanish — the saved preference must win
    fireEvent.click(screen.getByRole('button', { name: dEn['landing.cta'] }));
    expect(screen.getByRole('tab', { name: dEn['nav.home'] })).toBeTruthy();
    expect(screen.getByRole('tab', { name: dEn['nav.settings'] })).toBeTruthy();
  });

  it('restores advanced mode after a remount', () => {
    const first = renderApp();
    goSettings();
    fireEvent.click(screen.getByRole('radio', { name: 'On' }));
    expect(localStorage.getItem(PREF_KEYS.advanced)).toBe('1');
    first.unmount();

    renderApp();
    goSettings();
    expect(screen.getByRole('radio', { name: 'On' }).getAttribute('aria-checked')).toBe('true');
  });

  it('restores the equipment selection only once, without clobbering it with defaults', async () => {
    loadEquipmentIds.mockResolvedValueOnce(['aeropress']);
    const first = renderApp();
    await flush();
    first.unmount();

    expect(saveEquipmentIds).toHaveBeenLastCalledWith(['aeropress']);
  });

  it('renders and keeps working when localStorage is blocked', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => renderApp()).not.toThrow();
    expect(screen.getByRole('tab', { name: tEs('nav.home') })).toBeTruthy();
    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe('own recipes', () => {
  it('keeps custom recipes after a remount (page reload)', async () => {
    const first = renderApp();
    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
    fireEvent.click(screen.getByRole('button', { name: tEs('recipes.new') }));
    fireEvent.change(screen.getByPlaceholderText(tEs('recipes.fieldNamePh')), { target: { value: 'Mi receta de casa' } });
    fireEvent.click(screen.getByRole('button', { name: tEs('recipes.save') }));
    await flush();
    first.unmount();

    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
    expect(screen.getByText('Mi receta de casa')).toBeTruthy();
  });
});
