import { useLayoutEffect } from 'react';

/**
 * Publish the measured viewport height into `--app-h`.
 *
 * Installed iOS PWAs can under-report `100dvh`, which leaves a band below the
 * floating island. `window.innerHeight` is used instead of `visualViewport` so
 * the on-screen keyboard does not shrink the shell.
 */
export function useAppHeight(): void {
  useLayoutEffect(() => {
    const sync = (): void => {
      const height = window.innerHeight;
      if (Number.isFinite(height) && height > 0) {
        document.documentElement.style.setProperty('--app-h', `${Math.round(height)}px`);
      }
    };

    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);

    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);
}
