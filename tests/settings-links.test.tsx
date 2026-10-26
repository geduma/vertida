import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderApp, tEs } from './helpers';
import { CONFIG } from '../src/config';

vi.mock('../src/lib/db', () => ({
  loadEquipmentIds: async () => null,
  saveEquipmentIds: async () => undefined,
  persistStorage: async () => false,
}));

function goSettings(): void {
  fireEvent.click(screen.getByRole('tab', { name: tEs('nav.settings') }));
}

describe('project link (GitHub)', () => {
  it('points to the public repository from config', () => {
    expect(CONFIG.repoUrl).toBe('https://github.com/geduma/vertida');
  });

  it('renders an icon link with an accessible name and safe new-tab attributes', () => {
    renderApp();
    goSettings();

    expect(screen.getByText(tEs('settings.github'))).toBeTruthy();
    expect(screen.getByText(tEs('settings.githubDesc'))).toBeTruthy();

    const link = screen.getByTestId('settings-github');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe(CONFIG.repoUrl);
    expect(link.getAttribute('aria-label')).toBe(tEs('settings.githubOpen'));
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');

    const icon = link.querySelector('svg');
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('bug reports and feedback', () => {
  it('opens a new GitHub issue in a new tab', () => {
    expect(CONFIG.issuesUrl).toBe('https://github.com/geduma/vertida/issues/new');
    renderApp();
    goSettings();

    expect(screen.getByText(tEs('settings.feedback'))).toBeTruthy();
    expect(screen.getByText(tEs('settings.feedbackDesc'))).toBeTruthy();

    const cta = screen.getByTestId('settings-feedback');
    expect(cta.tagName).toBe('A');
    expect(cta.textContent).toBe(tEs('settings.feedbackCta'));
    expect(cta.getAttribute('href')).toBe(CONFIG.issuesUrl);
    expect(cta.getAttribute('target')).toBe('_blank');
    expect(cta.getAttribute('rel')).toContain('noopener');
    expect(cta.getAttribute('rel')).toContain('noreferrer');
  });
});
