import { afterEach, describe, expect, it, vi } from 'vitest';
import { restartApp, restartUrl } from '../src/lib/appRestart';

const originalServiceWorker = Object.getOwnPropertyDescriptor(window.navigator, 'serviceWorker');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (originalServiceWorker) {
    Object.defineProperty(window.navigator, 'serviceWorker', originalServiceWorker);
  } else {
    delete (window.navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
  }
});

describe('restartUrl', () => {
  it('keeps the current location and adds a unique cache-busting query', () => {
    const url = new URL(restartUrl('https://app.test/recipe?cup=2#timer', 42));
    expect(url.origin).toBe('https://app.test');
    expect(url.pathname).toBe('/recipe');
    expect(url.searchParams.get('cup')).toBe('2');
    expect(url.searchParams.get('__vertida_restart')).toBe('42');
    expect(url.hash).toBe('#timer');
  });
});

describe('restartApp', () => {
  it('purges cache and workers, then navigates to the cache-busted URL', async () => {
    const deleted: string[] = [];
    vi.stubGlobal('caches', {
      keys: async () => ['workbox-precache-v2', 'runtime'],
      delete: async (key: string) => {
        deleted.push(key);
        return true;
      },
    });
    const unregister = vi.fn(async () => true);
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: { getRegistrations: async () => [{ unregister }] },
      configurable: true,
    });
    const replace = vi.fn();
    vi.spyOn(Object.getPrototypeOf(window.location), 'replace').mockImplementation(replace);

    await expect(restartApp()).resolves.toBe(true);

    expect(deleted.sort()).toEqual(['runtime', 'workbox-precache-v2']);
    expect(unregister).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledTimes(1);
    const target = new URL(String(replace.mock.calls[0][0]));
    expect(target.searchParams.has('__vertida_restart')).toBe(true);
  });

  it('still navigates when Cache Storage and service workers are unavailable', async () => {
    Object.defineProperty(window.navigator, 'serviceWorker', { value: undefined, configurable: true });
    const replace = vi.fn();
    vi.spyOn(Object.getPrototypeOf(window.location), 'replace').mockImplementation(replace);

    await expect(restartApp()).resolves.toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
