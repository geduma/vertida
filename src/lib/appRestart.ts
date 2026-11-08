/**
 * Full-app restart used after a manual PWA update check finds a newer build.
 *
 * `location.reload()` is not enough on iOS when the app is installed to the Home
 * Screen: the standalone shell can keep serving the previous document from the
 * service-worker cache, so the user has to close and open the app by hand.
 *
 * A real restart therefore means: drop every Cache Storage bucket, unregister
 * the service workers and navigate to a cache-busted URL. The next document is
 * fetched from the network and the PWA registers a fresh worker on load.
 */
const RESTART_PARAM = '__vertida_restart';

/** Build a same-origin URL that cannot be answered by the previous shell cache. */
export function restartUrl(href: string, stamp: number = Date.now()): string {
  const url = new URL(href);
  url.searchParams.set(RESTART_PARAM, String(stamp));
  return url.toString();
}

export async function restartApp(): Promise<boolean> {
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Cache Storage may be unavailable (private mode / old browser): navigation
    // with the cache-busting query still forces a fresh document request.
  }

  try {
    const container = (navigator as Navigator & { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
    const registrations = (await container?.getRegistrations?.()) ?? [];
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {
    // Unregistering is best-effort; clearing the caches is the critical step.
  }

  try {
    window.location.replace(restartUrl(window.location.href));
    return true;
  } catch {
    try {
      window.location.reload();
      return true;
    } catch {
      return false;
    }
  }
}
