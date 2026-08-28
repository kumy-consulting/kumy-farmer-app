import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInvitationProfilStore } from './invitationProfil.store';
import { profilApi } from './profil.api';
import { useInvitationProfil } from './useInvitationProfil';

vi.mock('./profil.api', () => ({ profilApi: { lireProfil: vi.fn(), envoyerEtape: vi.fn() } }));

const mocked = vi.mocked(profilApi);

const profilEnCours = {
  displayName: 'M. B.',
  address: {},
  profileSurvey: { step: 0, completedAt: null },
  questionnaire: {},
};

const profilTermine = {
  displayName: 'M. B.',
  address: {},
  profileSurvey: { step: 3, completedAt: '2026-08-28T09:12:00.000Z' },
  questionnaire: {},
};

describe('useInvitationProfil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useInvitationProfilStore.setState({ dejaProposee: false });
    mocked.lireProfil.mockResolvedValue(profilEnCours);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('s’ouvre cinq secondes après l’arrivée, pas avant', async () => {
    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false }));

    await vi.advanceTimersByTimeAsync(4_000);
    expect(result.current.ouverte).toBe(false);

    await vi.advanceTimersByTimeAsync(1_500);
    expect(result.current.ouverte).toBe(true);
  });

  it('ne s’ouvre pas quand un domaine est déjà tracé', async () => {
    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: true, isLoading: false }));
    await vi.advanceTimersByTimeAsync(6_000);

    expect(result.current.ouverte).toBe(false);
  });

  it('ne s’ouvre pas quand le questionnaire est terminé', async () => {
    mocked.lireProfil.mockResolvedValue(profilTermine);

    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false }));
    await vi.advanceTimersByTimeAsync(6_000);

    expect(result.current.ouverte).toBe(false);
  });

  it('ne s’ouvre qu’une fois par session', async () => {
    const premier = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false }));
    await vi.advanceTimersByTimeAsync(6_000);
    expect(premier.result.current.ouverte).toBe(true);
    premier.unmount();

    const second = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false }));
    await vi.advanceTimersByTimeAsync(6_000);

    expect(second.result.current.ouverte).toBe(false);
  });

  it('annule la minuterie au démontage', async () => {
    // Un agriculteur qui ouvre une parcelle dans les cinq secondes ne doit pas
    // se faire interrompre par une modale remontant d'un écran qu'il a quitté.
    const { unmount } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false }));
    await vi.advanceTimersByTimeAsync(2_000);
    unmount();

    await vi.advanceTimersByTimeAsync(6_000);

    expect(useInvitationProfilStore.getState().dejaProposee).toBe(false);
  });

  it('s’ouvre quand même si la lecture du profil répond après l’échéance de cinq secondes', async () => {
    // La minuterie et la lecture partent ensemble : une réponse serveur lente
    // ne doit pas faire perdre l'invitation, seulement en retarder l'ouverture.
    mocked.lireProfil.mockImplementation(
      () =>
        new Promise((resolve) => {
          window.setTimeout(() => resolve(profilEnCours), 6_000);
        }),
    );

    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false }));

    await vi.advanceTimersByTimeAsync(5_500);
    expect(result.current.ouverte).toBe(false);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(result.current.ouverte).toBe(true);
  });
});
