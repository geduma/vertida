/**
 * Shared modal chrome: while at least one dialog is open the app shell is made
 * inert and the floating island is hidden, so background content cannot be
 * clicked or focused. Focus is kept inside the dialog with a simple tab trap.
 */
let depth = 0;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function lockModalLayer(): void {
  depth += 1;
  document.body.dataset.modal = 'true';
  document.querySelector<HTMLElement>('.app')?.setAttribute('inert', '');
}

export function unlockModalLayer(): void {
  depth = Math.max(0, depth - 1);
  if (depth > 0) return;
  delete document.body.dataset.modal;
  document.querySelector<HTMLElement>('.app')?.removeAttribute('inert');
}

/** Keep Tab / Shift+Tab inside the open dialog (e.g. the island is unreachable). */
export function trapModalFocus(event: KeyboardEvent, container: HTMLElement | null): void {
  if (event.key !== 'Tab' || !container) return;
  const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)];
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  const outside = !active || !container.contains(active);

  if (event.shiftKey && (outside || active === first)) {
    event.preventDefault();
    last.focus();
    return;
  }
  if (!event.shiftKey && (outside || active === last)) {
    event.preventDefault();
    first.focus();
  }
}
