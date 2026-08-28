import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInvitationProfilStore } from './invitationProfil.store';
import { profilApi } from './profil.api';
import { useInvitationProfil } from './useInvitationProfil';

vi.mock('./profil.api', () => ({ profilApi: { lireProfil: vi.fn(), envoyerEtape: vi.fn() } }));
vi.mock('@/features/Home/useCompteNouveau', () => ({
  useCompteNouveau: () => ({ estNouveau: true, aDesDomaines: false, isLoading: false }),
}));

const mocked = vi.mocked(profilApi);

describe('useInvitationProfil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useInvitationProfilStore.setState({ dejaProposee: false });
    mocked.lireProfil.mockResolvedValue({
      displayName: 'M. B.',
      address: {},
      profileSurvey: { step: 0, completedAt: null },
      questionnaire: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('s’ouvre cinq secondes après l’arrivée, pas avant', async () => {
    const { result } = renderHook(() => useInvitationProfil());

    await vi.advanceTimersByTimeAsync(4_000);
    expect(result.current.ouverte).toBe(false);

    await vi.advanceTimersByTimeAsync(1_500);
    expect(result.current.ouverte).toBe(true);
  });

  it('ne s’ouvre pas quand un domaine est déjà tracé', async () => {
    // `vi.doMock` seul ne rejoue pas un module déjà importé statiquement plus
    // haut dans ce fichier : sans `resetModules`, le réimport dynamique rendrait
    // la même instance, liée au mock d'origine.
    vi.resetModules();
    vi.doMock('@/features/Home/useCompteNouveau', () => ({
      useCompteNouveau: () => ({ estNouveau: false, aDesDomaines: true, isLoading: false }),
    }));
    const { useInvitationProfil: hook } = await import('./useInvitationProfil');

    const { result } = renderHook(() => hook());
    await vi.advanceTimersByTimeAsync(6_000);

    expect(result.current.ouverte).toBe(false);
  });

  it('ne s’ouvre pas quand le questionnaire est terminé', async () => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'M. B.',
      address: {},
      profileSurvey: { step: 3, completedAt: '2026-08-28T09:12:00.000Z' },
      questionnaire: {},
    });

    const { result } = renderHook(() => useInvitationProfil());
    await vi.advanceTimersByTimeAsync(6_000);

    expect(result.current.ouverte).toBe(false);
  });

  it('ne s’ouvre qu’une fois par session', async () => {
    const premier = renderHook(() => useInvitationProfil());
    await vi.advanceTimersByTimeAsync(6_000);
    expect(premier.result.current.ouverte).toBe(true);
    premier.unmount();

    const second = renderHook(() => useInvitationProfil());
    await vi.advanceTimersByTimeAsync(6_000);

    expect(second.result.current.ouverte).toBe(false);
  });

  it('annule la minuterie au démontage', async () => {
    // Un agriculteur qui ouvre une parcelle dans les cinq secondes ne doit pas
    // se faire interrompre par une modale remontant d'un écran qu'il a quitté.
    const { unmount } = renderHook(() => useInvitationProfil());
    await vi.advanceTimersByTimeAsync(2_000);
    unmount();

    await vi.advanceTimersByTimeAsync(6_000);

    expect(useInvitationProfilStore.getState().dejaProposee).toBe(false);
  });
});
