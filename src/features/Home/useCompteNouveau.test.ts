import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { compteApi } from '@/features/Home/compte.api';
import { useCompteNouveau } from '@/features/Home/useCompteNouveau';
import { useAuthStore } from '@/shared/stores/authStore';

describe('useCompteNouveau', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'uid-1', displayName: 'Awa Diallo', phone: '+224622201362', role: 'farmer' },
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('dit « nouveau » sans domaine et sans technicien', async () => {
    vi.spyOn(compteApi, 'etatDuCompte').mockResolvedValue({
      hasFarms: false,
      hasEngineer: false,
    });

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.estNouveau).toBe(true);
  });

  it('rend l’application complète dès qu’un domaine existe', async () => {
    vi.spyOn(compteApi, 'etatDuCompte').mockResolvedValue({
      hasFarms: true,
      hasEngineer: false,
    });

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.estNouveau).toBe(false);
  });

  it('rend l’application complète dès qu’un technicien est rattaché', async () => {
    vi.spyOn(compteApi, 'etatDuCompte').mockResolvedValue({
      hasFarms: false,
      hasEngineer: true,
    });

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.estNouveau).toBe(false);
  });

  it('ouvre l’application complète quand l’appel échoue, plutôt que d’enfermer un agriculteur établi', async () => {
    vi.spyOn(compteApi, 'etatDuCompte').mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.estNouveau).toBe(false);
  });

  it('n’appelle rien sans session', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    const spy = vi.spyOn(compteApi, 'etatDuCompte');

    const { result } = renderHook(() => useCompteNouveau());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.estNouveau).toBe(false);
  });
});
