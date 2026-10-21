import { useCallback, useState } from 'react';

/**
 * Manual PWA update flow (US-1).
 *
 * `registerType: 'autoUpdate'` alone is unreliable for installed PWAs (iOS home
 * screen, desktop installed app) and long-lived tabs: the service worker may not
 * be re-checked for days. This hook gives Settings an explicit "check for
 * updates" action:
 *
 * 1. One-shot `controllerchange` listener reloads exactly once when the new
 *    worker takes control (works in standalone, installed and tab contexts).
 * 2. `registration.update()` forces the browser to fetch the latest worker.
 * 3. A waiting worker is asked to skip waiting; an installing one is given a
 *    bounded window to activate; nothing new → "up to date".
 */
export type UpdateState = 'idle' | 'checking' | 'uptodate' | 'failed' | 'unavailable';

const GRACE_MS = 300; // let the browser start installing the fetched worker
const ACTIVATION_TIMEOUT_MS = 5000; // bounded wait for a new worker to activate
const POLL_MS = 200;

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
    const reload = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
    const cleanup = () =>
      navigator.serviceWorker.removeEventListener('controllerchange', reload);

    try {
      await reg.update();
    } catch {
      cleanup();
      setState('failed');
      return;
    }
    // Grace period so `update()` can move the registration to "installing".
    await sleep(GRACE_MS);
    if (reg.waiting) {
      // New worker ready → activate it; `controllerchange` triggers the reload.
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    if (reg.installing) {
      const t0 = Date.now();
      while (reg.installing && Date.now() - t0 < ACTIVATION_TIMEOUT_MS) await sleep(POLL_MS);
      if (!reg.installing) return; // activated → controllerchange reloads
      cleanup();
      setState('failed');
      return;
    }
    cleanup();
    setState('uptodate');
  }, []);

  return { state, check, reset };
}
