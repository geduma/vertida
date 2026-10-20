import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFavorites, saveFavorites, toggleFavorite } from '../src/lib/favorites';

const KEY = 'vertida-favorites';

describe('loadFavorites', () => {
  beforeEach(() => localStorage.clear());

  it('returns [] when nothing is stored', () => {
    expect(loadFavorites()).toEqual([]);
  });

  it('loads a stored id list', () => {
    localStorage.setItem(KEY, JSON.stringify(['a', 'b']));
    expect(loadFavorites()).toEqual(['a', 'b']);
  });

  it('purges non-string entries', () => {
    localStorage.setItem(KEY, JSON.stringify(['a', 1, null, { x: 1 }, 'b']));
    expect(loadFavorites()).toEqual(['a', 'b']);
  });

  it('returns [] for broken JSON or non-array payloads', () => {
    localStorage.setItem(KEY, '{oops');
    expect(loadFavorites()).toEqual([]);
    localStorage.setItem(KEY, '"a-string"');
    expect(loadFavorites()).toEqual([]);
  });
});

describe('saveFavorites', () => {
  it('round-trips through localStorage', () => {
    saveFavorites(['x', 'y']);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')).toEqual(['x', 'y']);
    expect(loadFavorites()).toEqual(['x', 'y']);
  });

  it('survives a throwing localStorage without crashing', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => saveFavorites(['a'])).not.toThrow();
    spy.mockRestore();
  });
});

describe('toggleFavorite', () => {
  it('adds an id that is not present (append, no reorder)', () => {
    expect(toggleFavorite(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleFavorite([], 'a')).toEqual(['a']);
  });

  it('removes an id that is present', () => {
    expect(toggleFavorite(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
    expect(toggleFavorite(['a'], 'a')).toEqual([]);
  });

  it('does not mutate the input list', () => {
    const ids = ['a'];
    toggleFavorite(ids, 'b');
    expect(ids).toEqual(['a']);
  });
});
