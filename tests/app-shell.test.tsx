import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderApp, renderLanding, tEs, dEn } from './helpers';

vi.mock('../src/lib/db', () => ({
  db: () => Promise.resolve({ put: async () => undefined }),
  persistStorage: async () => false,
}));

describe('landing screen', () => {
  it('greets with the landing title and hides the tab bar until entering', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1, name: tEs('landing.welcome') })).toBeTruthy();
    expect(screen.getByRole('button', { name: tEs('landing.cta') })).toBeTruthy();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('entering through the CTA reveals the app shell', () => {
    renderApp();
    expect(screen.queryByRole('heading', { level: 1, name: tEs('landing.welcome') })).toBeNull();
    expect(screen.getByRole('tablist', { name: tEs('nav.label') })).toBeTruthy();
  });
});

describe('app shell and navigation', () => {
  it('exposes the three-tab navigation with home selected', () => {
    renderApp();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(x => x.textContent)).toEqual([tEs('nav.home'), tEs('nav.recipes'), tEs('nav.settings')]);
    expect(screen.getByRole('tab', { name: tEs('nav.home') }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: tEs('nav.recipes') }).getAttribute('aria-selected')).toBe('false');
  });

  it('switches between home, recipes and settings sections', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
    expect(screen.getByRole('region', { name: tEs('recipes.title') })).toBeTruthy();
    expect(screen.getByRole('tab', { name: tEs('nav.recipes') }).getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.settings') }));
    expect(screen.getByRole('region', { name: tEs('settings.title') })).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.home') }));
    expect(screen.getByRole('region', { name: tEs('nav.home') })).toBeTruthy();
  });

  it('does not expose brew as a tab (it is a destination)', () => {
    renderApp();
    expect(screen.queryByRole('tab', { name: tEs('nav.brew') })).toBeNull();
  });

  it('home shows the suggested recipe with ratio, dose and time', () => {
    renderApp();
    const home = screen.getByRole('region', { name: tEs('nav.home') });
    const meta = home.querySelector('.hero-meta');
    expect(meta?.textContent).toBe(tEs('home.suggested'));
    // Suggested CTA always reads "Preparar: <name>"
    expect(screen.getByRole('button', { name: new RegExp(`^${tEs('home.prepare')}: .+`) })).toBeTruthy();
  });
});

describe('language switching', () => {
  it('switches the whole UI to English and back', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.settings') }));

    fireEvent.click(screen.getByRole('radio', { name: 'EN' }));
    expect(screen.getByRole('tab', { name: dEn['nav.recipes'] }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('region', { name: dEn['settings.title'] })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'EN' }).getAttribute('aria-checked')).toBe('true');

    fireEvent.click(screen.getByRole('radio', { name: 'ES' }));
    expect(screen.getByRole('region', { name: tEs('settings.title') })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'ES' }).getAttribute('aria-checked')).toBe('true');
  });
});
