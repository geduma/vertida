import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from './helpers';

vi.mock('../src/lib/db', () => ({
  loadEquipmentIds: async () => null,
  saveEquipmentIds: async () => undefined,
  persistStorage: async () => false,
}));

const originalInnerHeight = window.innerHeight;

afterEach(() => {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
  document.documentElement.style.removeProperty('--app-h');
});

describe('app viewport height', () => {
  it('publishes window.innerHeight into --app-h and follows resize', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
    renderApp();
    expect(document.documentElement.style.getPropertyValue('--app-h')).toBe('844px');

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 932 });
    fireEvent(window, new Event('resize'));
    expect(document.documentElement.style.getPropertyValue('--app-h')).toBe('932px');
  });
});
