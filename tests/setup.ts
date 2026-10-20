import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Workaround — happy-dom fidelity bug: HTMLLabelElement.dispatchEvent re-dispatches EVERY
// bubbled click onto its labeled control (lib/nodes/html-label-element/HTMLLabelElement.js).
// Real browsers only forward clicks made on plain label content; a click on a nested button
// fires once. Without this, every click on a <button> inside a <label> (e.g. the brew ratio
// +/- stepper) double-fires with a net zero effect. Buttons have no click default action,
// so preventDefault only suppresses the quirk. Checkbox targets keep native behavior.
const labelClass = (globalThis as Record<string, unknown>).HTMLLabelElement as
  | { prototype: { dispatchEvent: (e: Event) => boolean } }
  | undefined;
if (labelClass) {
  const originalLabelDispatch = labelClass.prototype.dispatchEvent;
  labelClass.prototype.dispatchEvent = function (event: Event): boolean {
    if (event.type === 'click' && (event.target as HTMLElement | null)?.tagName === 'BUTTON') {
      event.preventDefault();
    }
    return originalLabelDispatch.call(this, event);
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks(); // restore Math.random stubs etc. — tests stay order-free
});
