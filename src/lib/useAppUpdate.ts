import { useCallback, useState } from 'react';

/**
 * Manual PWA update flow (US-1).
 *
 * `registerType: 'autoUpdate'` alone is unreliable for installed PWAs (iOS home
 * screen, desktop installed app) and long-lived tabs: the service worker may not
 * be re-checked for days. This hook gives Settings an explicit "check for
 * updates" action.
 */
export type UpdateState = 'idle' | 'checking' | 'uptodate' | 'failed' | 'unavailable';

const GRACE_MS = 300; // let the browser start installing the fetched worker
const ACTIVATION_TIMEOUT_MS = 5000; // bounded wait for a new worker to activate
const POLL_MS = 200;
const RELOAD_FALLBACK_MS = 600; // fallback reload if controllerchange doesn't fire

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export function useAppUpdate(): { state: UpdateState; check: () => Promise<void>; reset: () => void } {
  const [state, setState] = useState<UpdateState>('idle');
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

    let reloaded = false;
    const reload = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    // Try to reload on controller change, but don't rely on it alone
    const onControllerChange = () => reload();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true });

    const cleanup = () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };

    try {
      await reg.update();
    } catch {
      cleanup();
      setState('failed');
      return;
    }

    // Grace period so `update()` can move the registration to "installing".
    await sleep(GRACE_MS);

    // Case 1: There is already a worker waiting to be activated
    if (reg.waiting) {
      try {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch {
        // ignore
      }
      // Fallback in case controllerchange never fires in standalone/PWA
      window.setTimeout(reload, RELOAD_FALLBACK_MS);
      return;
    }

    // Case 2: A worker is currently installing
    if (reg.installing) {
      const installing = reg.installing;
      const t0 = Date.now();

      const onStateChange = () => {
        if (installing.state === 'activated') {
          installing.removeEventListener('statechange', onStateChange);
          // Give the browser a moment to take control, then reload
          window.setTimeout(reload, 150);
        }
      };

      installing.addEventListener('statechange', onStateChange);

      // Also poll as a safety net
      while (reg.installing && Date.now() - t0 < ACTIVATION_TIMEOUT_MS) {
        await sleep(POLL_MS);
        if (installing.state === 'activated') break;
      }

      installing.removeEventListener('statechange', onStateChange);

      if (installing.state === 'activated') {
        window.setTimeout(reload, RELOAD_FALLBACK_MS);
        return;
      }

      cleanup();
      setState('failed');
      return;
    }

    // Case 3: No new worker found
    cleanup();
    setState('uptodate');
  }, []);

  return { state, check, reset };
}
