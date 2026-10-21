import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderApp, renderLanding, tEs } from './helpers';
import { CONFIG } from '../src/config';

vi.mock('../src/lib/db', () => ({
  db: () => Promise.resolve({ put: vi.fn(async () => undefined) }),
  persistStorage: async () => false,
}));

type SWLike = {
  update?: () => Promise<void>;
  waiting?: { postMessage: (msg: unknown) => void } | null;
  installing?: unknown;
};

/** Install a `navigator.serviceWorker` seam returning the given registration. */
function mockSW(reg: SWLike | undefined): { getRegistration: ReturnType<typeof vi.fn> } {
  const getRegistration = vi.fn(async () => reg);
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: {
      getRegistration,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    configurable: true,
  });
  return { getRegistration };
}

function goSettings(): void {
  fireEvent.click(screen.getByRole('tab', { name: tEs('nav.settings') }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('version indicator (US-2)', () => {
  it('shows the build-time version from package.json with a v prefix', () => {
    renderApp();
    goSettings();
    expect(screen.getByText(tEs('settings.version'))).toBeTruthy();
    expect(screen.getByTestId('app-version').textContent).toMatch(/^v\d+\.\d+\.\d+/);
  });
});

describe('update action (US-1)', () => {
  it('reports "up to date" after checking a registration without a new worker', async () => {
    mockSW({ update: vi.fn(async () => undefined), waiting: null, installing: null });
    renderApp();
    goSettings();
    fireEvent.click(screen.getByTestId('update-button'));
    expect(screen.getByTestId('update-feedback').textContent).toBe(tEs('settings.updateChecking'));
    expect(await screen.findByRole('dialog', { name: tEs('settings.updateModalTitle') })).toBeTruthy();
    expect(screen.getByText(tEs('settings.updateModalBody').replace('{version}', `v${__APP_VERSION__}`))).toBeTruthy();
    fireEvent.click(screen.getByTestId('update-modal-close'));
  });

  it('asks a waiting worker to skip waiting (reload happens via controllerchange)', async () => {
    const postMessage = vi.fn();
    mockSW({ update: vi.fn(async () => undefined), waiting: { postMessage }, installing: null });
    renderApp();
    goSettings();
    fireEvent.click(screen.getByTestId('update-button'));
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' }));
    // No uptodate/failed feedback while the new worker takes control
    expect(screen.queryByText(tEs('settings.updateUptodate'))).toBeNull();
  });

  it('reports a neutral failure when the update check rejects (e.g. offline)', async () => {
    mockSW({ update: vi.fn(async () => { throw new Error('offline'); }), waiting: null, installing: null });
    renderApp();
    goSettings();
    fireEvent.click(screen.getByTestId('update-button'));
    expect(await screen.findByText(tEs('settings.updateFailed'))).toBeTruthy();
  });

  it('reports unavailable when there is no service worker registration', async () => {
    mockSW(undefined);
    renderApp();
    goSettings();
    fireEvent.click(screen.getByTestId('update-button'));
    expect(await screen.findByText(tEs('settings.updateUnavailable'))).toBeTruthy();
  });
});

describe('credits (US-3)', () => {
  it('links "By geduma" to the maker site from the landing screen in a new tab', () => {
    renderLanding();
    const credit = screen.getByTestId('landing-credit');
    expect(credit.textContent).toBe(tEs('app.credit'));
    expect(credit.getAttribute('href')).toBe(CONFIG.creditUrl);
    expect(credit.getAttribute('target')).toBe('_blank');
    expect(credit.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps a persistent credit row in settings, also opening in a new tab', () => {
    renderApp();
    goSettings();
    const credit = screen.getByTestId('settings-credit');
    expect(credit.textContent).toBe(tEs('app.credit'));
    expect(credit.getAttribute('href')).toBe(CONFIG.creditUrl);
    expect(credit.getAttribute('target')).toBe('_blank');
    expect(credit.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('scoped scrolling (US-4)', () => {
  it('home keeps the hero fixed and scrolls methods + stats in a list container', () => {
    const { container } = renderApp();
    expect(container.querySelector('.home .hero-home')).toBeTruthy();
    expect(container.querySelector('.home .surface.home-methods')).toBeTruthy();
  });

  it('recipes and settings scroll their list containers, not the page', () => {
    const { container } = renderApp();
    fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
    expect(container.querySelector('section.surface .list-scroll')).toBeTruthy();
    goSettings();
    expect(screen.getByRole('region', { name: tEs('settings.title') }).classList.contains('list-scroll')).toBe(true);
  });

  it('locks the page scroll in the stylesheet contract', () => {
    const css = readFileSync('src/theme/app.css', 'utf8');
    expect(css).toMatch(/html,body\{height:100%;overflow:hidden\}/);
    expect(css).toMatch(/\.list-scroll\{[^}]*overflow-y:auto/);
  });
});
