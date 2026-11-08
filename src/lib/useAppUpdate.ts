import { useCallback, useEffect, useRef, useState } from 'react';
import { restartApp } from './appRestart';

/**
 * Manual PWA update flow (US-1).
 *
 * `registerType: 'autoUpdate'` alone is unreliable for installed PWAs (iOS home
 * screen, desktop installed app) and long-lived tabs: the service worker may not
 * be re-checked for days. This hook gives Settings an explicit "check for
 * updates" action.
 *
 * When a newer worker is found the whole app is restarted through `restartApp`
 * (cache purge + worker unregister + cache-busted navigation). On iOS standalone
 * a plain `location.reload()` can keep the old shell alive, so a full restart is
 * the only reliable way to apply the new build without closing the app by hand.
 */
export type UpdateState = 'idle' | 'checking' | 'restarting' | 'uptodate' | 'failed' | 'unavailable';

const UPDATE_WAIT_MS = 400; // how long to wait for the fetched worker to surface
const POLL_MS = 50;

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

/** Wait until the browser exposes the worker fetched by `update()` (or give up). */
async function waitForPendingWorker(reg: ServiceWorkerRegistration): Promise<ServiceWorker | null> {
  const deadline = Date.now() + UPDATE_WAIT_MS;
  let pending = reg.waiting ?? reg.installing ?? null;
  while (!pending && Date.now() < deadline) {
    await sleep(POLL_MS);
    pending = reg.waiting ?? reg.installing ?? null;
  }
  return pending;
}

export function useAppUpdate(): { state: UpdateState; check: () => Promise<void>; reset: () => void } {
  const [state, setState] = useState<UpdateState>('idle');
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const reset = useCallback(() => setState('idle'), []);

  const check = useCallback(async () => {
    setState('checking');
    if (!('serviceWorker' in navigator)) {
      setState('unavailable');
      return;
    }

    let reg: ServiceWorkerRegistration | undefined;
    try {
      reg = await navigator.serviceWorker.getRegistration();
    } catch {
      setState('failed');
      return;
    }
    if (!reg) {
      setState('unavailable');
      return;
    }

    try {
      await reg.update();
    } catch {
      setState('failed');
      return;
    }

    // `update()` resolves when the check finishes; the fetched worker can still
    // be moving to `installing` / `waiting` for a few frames.
    const pending = await waitForPendingWorker(reg);
    if (!aliveRef.current) return;

    if (!pending) {
      setState('uptodate');
      return;
    }

    try {
      pending.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      // A restart follows regardless: the next navigation fetches the new shell.
    }

    setState('restarting');
    let navigated = false;
    try {
      navigated = await restartApp();
    } catch {
      navigated = false;
    }
    // In a real browser the navigation unloads this document before this line.
    // If the environment blocked it, surface a failure instead of hanging.
    if (!navigated && aliveRef.current) setState('failed');
  }, []);

  return { state, check, reset };
}
