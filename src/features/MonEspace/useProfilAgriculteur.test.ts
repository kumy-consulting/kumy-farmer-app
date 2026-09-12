import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/stores/authStore';

import { monEspaceApi } from './monEspace.api';
import { useProfilAgriculteur } from './useProfilAgriculteur';

const DTO = {
  farmerCode: 'KMY-DBK-0412',
  displayName: 'Mamadou Aliou Barry',
  phone: '+224621457890',
  address: { districtName: 'Kaporo', regionName: 'Kindia' },
  cooperativeName: 'Coopérative maraîchère de Tanènè',
  notificationSettings: { sms: false },
};

describe('useProfilAgriculteur', () => {
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

  it('rend le profil de l’agriculteur connecté', async () => {
    vi.spyOn(monEspaceApi, 'profil').mockResolvedValue(DTO);

    const { result } = renderHook(() => useProfilAgriculteur());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profil?.nomComplet).toBe('Mamadou Aliou Barry');
    expect(result.current.profil?.code).toBe('KMY-DBK-0412');
    expect(result.current.alertesSms).toBe(false);
  });

  it('se replie sur la session quand l’appel échoue, sans jamais montrer un autre nom', async () => {
    vi.spyOn(monEspaceApi, 'profil').mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useProfilAgriculteur());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profil?.nomComplet).toBe('Awa Diallo');
    expect(result.current.profil?.code).toBe('');
    expect(result.current.alertesSms).toBeNull();
  });

  it('traite un compte sans fiche agriculteur comme un cas légitime, pas une panne', async () => {
    vi.spyOn(monEspaceApi, 'profil').mockRejectedValue(
      Object.assign(new Error('not found'), { status: 404 }),
    );

    const { result } = renderHook(() => useProfilAgriculteur());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profil?.nomComplet).toBe('Awa Diallo');
  });

  it('n’appelle rien sans session', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    const appel = vi.spyOn(monEspaceApi, 'profil');

    const { result } = renderHook(() => useProfilAgriculteur());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(appel).not.toHaveBeenCalled();
    expect(result.current.profil).toBeNull();
  });

  it('suit la bascule des alertes une fois le profil chargé', async () => {
    vi.spyOn(monEspaceApi, 'profil').mockResolvedValue(DTO);

    const { result } = renderHook(() => useProfilAgriculteur());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.poserAlertesSms(true);
    await waitFor(() => expect(result.current.alertesSms).toBe(true));
  });
});
