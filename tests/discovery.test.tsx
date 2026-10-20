import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { discoveryData, methodsData, renderApp, stubRandom, tEs } from './helpers';

vi.mock('../src/lib/db', () => ({
  db: () => Promise.resolve({ put: async () => undefined }),
  persistStorage: async () => false,
}));

const methodName = (id: string): string => tEs(methodsData.find(m => m.id === id)!.nameKey);
const first = discoveryData[0];
const second = discoveryData[1];

function openDiscovery(): void {
  stubRandom(0); // deterministic pick: first of the (filtered) pool
  fireEvent.click(screen.getByRole('button', { name: tEs('home.discoverCta') }));
}

function closeDiscovery(): void {
  fireEvent.click(screen.getByRole('button', { name: tEs('discover.close') }));
}

describe('discovery modal', () => {
  it('opens a surprise recipe and focuses the prepare action', () => {
    renderApp();
    openDiscovery();
    const dialog = screen.getByRole('dialog', { name: tEs('discover.title') });
    expect(within(dialog).getByRole('heading', { level: 3, name: tEs(first.nameKey) })).toBeTruthy();
    expect(within(dialog).getAllByText(methodName(first.methodId)).length).toBeGreaterThan(0);
    expect((document.activeElement as HTMLElement).textContent).toBe(tEs('home.prepare'));
  });

  it('“another” rerolls to a different proposal without closing', () => {
    renderApp();
    openDiscovery();
    fireEvent.click(screen.getByRole('button', { name: tEs('discover.another') }));
    const dialog = screen.getByRole('dialog', { name: tEs('discover.title') });
    // Pool without the previous pick → next entry, still deterministic with random=0
    expect(within(dialog).getByRole('heading', { level: 3, name: tEs(second.nameKey) })).toBeTruthy();
    expect(within(dialog).getAllByText(methodName(second.methodId)).length).toBeGreaterThan(0);
  });

  it('closes via CTA, Escape and backdrop click', () => {
    const { container } = renderApp();

    openDiscovery();
    closeDiscovery();
    expect(screen.queryByRole('dialog')).toBeNull();

    openDiscovery();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    openDiscovery();
    fireEvent.click(container.querySelector('.modal-backdrop')!);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('prepare starts brewing the discovery recipe through the normal flow', () => {
    renderApp();
    openDiscovery();
    fireEvent.click(screen.getByRole('button', { name: tEs('home.prepare') }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: tEs(first.nameKey) })).toBeTruthy();
    expect(screen.getByRole('button', { name: `‹ ${tEs('nav.home')}` })).toBeTruthy(); // origin preserved

    fireEvent.click(screen.getByRole('button', { name: tEs('app.start') }));
    expect(screen.getAllByRole('listitem')).toHaveLength(first.phases.length);
  });

  it('shows the empty note when no selected equipment has discovery recipes', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.settings') }));
    fireEvent.click(screen.getByRole('button', { name: tEs('settings.equipmentChoose') }));
    // Discovery may cover only some methods — deselect exactly those that have recipes
    const withDiscovery = new Set(discoveryData.map(r => r.methodId));
    for (const m of methodsData) {
      if (!withDiscovery.has(m.id)) continue;
      fireEvent.click(screen.getByRole('checkbox', { name: methodName(m.id) }));
    }
    fireEvent.click(screen.getByRole('button', { name: tEs('settings.equipmentSave') }));

    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.home') }));
    expect(screen.getByText(tEs('discover.empty'))).toBeTruthy();
    expect(screen.queryByRole('button', { name: tEs('home.discoverCta') })).toBeNull();
  });
});
