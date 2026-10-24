import { act, renderHook } from '@testing-library/react';
import { parseHash, useHashRoute } from './useHashRoute';

describe('parseHash', () => {
  it('maps known hashes to views', () => {
    expect(parseHash('#/spellbook')).toBe('spellbook');
    expect(parseHash('#/cheatsheet')).toBe('cheatsheet');
    expect(parseHash('#/sheet')).toBe('sheet');
  });
  it('falls back to sheet for empty or unknown hashes', () => {
    expect(parseHash('')).toBe('sheet');
    expect(parseHash('#/nope')).toBe('sheet');
  });
});

describe('useHashRoute', () => {
  it('updates the hash and the returned view when set', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => result.current[1]('cheatsheet'));
    expect(window.location.hash).toBe('#/cheatsheet');
    expect(result.current[0]).toBe('cheatsheet');
  });
});

describe('useHashRoute on iOS 10', () => {
  it('sets the view without the HashChangeEvent constructor', () => {
    vi.stubGlobal('HashChangeEvent', undefined);
    try {
      const { result } = renderHook(() => useHashRoute());
      act(() => result.current[1]('spellbook'));
      expect(result.current[0]).toBe('spellbook');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
