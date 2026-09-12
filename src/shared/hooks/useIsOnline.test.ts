import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIsOnline } from './useIsOnline';

/**
 * Ces tests couvrent le chemin WEB uniquement : sous jsdom,
 * `Capacitor.isNativePlatform()` est faux, donc le chemin `@capacitor/network`
 * est inatteignable. C'est voulu — voir la spec du 2026-08-22.
 */

const setNavigatorOnLine = (value: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
};

afterEach(() => {
  setNavigatorOnLine(true);
  vi.restoreAllMocks();
});

describe('useIsOnline', () => {
  it("part de l'état courant du navigateur", () => {
    setNavigatorOnLine(false);
    const { result } = renderHook(() => useIsOnline());
    expect(result.current).toBe(false);
  });

  it('bascule à false quand le navigateur passe hors-ligne', () => {
    setNavigatorOnLine(true);
    const { result } = renderHook(() => useIsOnline());
    expect(result.current).toBe(true);

    act(() => {
      setNavigatorOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
  });

  it('revient à true quand le navigateur repasse en ligne', () => {
    setNavigatorOnLine(false);
    const { result } = renderHook(() => useIsOnline());

    act(() => {
      setNavigatorOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });

  it('retire ses écouteurs au démontage', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useIsOnline());
    unmount();

    const removed = removeSpy.mock.calls.map(([type]) => type);
    expect(removed).toContain('online');
    expect(removed).toContain('offline');
  });
});
