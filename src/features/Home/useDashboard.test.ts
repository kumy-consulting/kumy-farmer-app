import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDashboard } from './useDashboard';

describe('useDashboard', () => {
  it('démarre en chargement puis expose le tableau de bord maquetté', async () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.alerts.length).toBeGreaterThan(0);
    expect(result.current.data?.activities.length).toBeGreaterThan(0);
    expect(result.current.data?.overview.domains).toBeGreaterThan(0);
    expect(result.current.data?.weather.location).toBeTruthy();
  });
});
