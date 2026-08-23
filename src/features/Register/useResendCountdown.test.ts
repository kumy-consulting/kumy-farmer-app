import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useResendCountdown } from './useResendCountdown';

describe('useResendCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('démarre au délai fourni', () => {
    const { result } = renderHook(() => useResendCountdown(60));
    expect(result.current.secondesRestantes).toBe(60);
  });

  it("décompte une seconde à la fois", () => {
    const { result } = renderHook(() => useResendCountdown(3));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondesRestantes).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondesRestantes).toBe(0);
  });

  it('s\'arrête à zéro et n\'y descend pas', () => {
    const { result } = renderHook(() => useResendCountdown(1));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current.secondesRestantes).toBe(0);
  });

  it('repart au délai demandé après un renvoi', () => {
    const { result } = renderHook(() => useResendCountdown(1));

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondesRestantes).toBe(0);

    act(() => {
      result.current.relancer(45);
    });
    expect(result.current.secondesRestantes).toBe(45);
  });
});
