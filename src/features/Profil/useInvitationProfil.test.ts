import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInvitationProfilStore } from './invitationProfil.store';
import { profilApi } from './profil.api';
import { useInvitationProfil, type CompteInvitationProfil } from './useInvitationProfil';

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
    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false, surAccueil: true }));

    await vi.advanceTimersByTimeAsync(4_000);
    expect(result.current.ouverte).toBe(false);

    await vi.advanceTimersByTimeAsync(1_500);
    expect(result.current.ouverte).toBe(true);
  });

  it('s’ouvre pour un compte neuf, dont le dossier n’a ni questionnaire ni profileSurvey', async () => {
    // Charge utile réelle de `GET /farmers/me` pour un compte qui n'a rien
    // rempli — le serveur omet ces blocs. C'est EXACTEMENT le compte que
    // l'invitation vise ; or déréférencer `profileSurvey.completedAt` jetait un
    // TypeError, capté par le `.catch()` qui posait `termine = true`. La modale
    // ne s'ouvrait donc jamais pour eux, et pour eux seuls.
    mocked.lireProfil.mockResolvedValue({
      farmerCode: 'AGR-073',
      displayName: 'Mamadou Test-Actif',
      phone: '+224600000003',
      address: {},
      notificationSettings: { sms: true },
    } as never);

    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false, surAccueil: true }));

    await vi.advanceTimersByTimeAsync(5_500);
    expect(result.current.ouverte).toBe(true);
  });

  it('ne s’ouvre pas quand un domaine est déjà tracé', async () => {
    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: true, isLoading: false, surAccueil: true }));
    await vi.advanceTimersByTimeAsync(6_000);

    expect(result.current.ouverte).toBe(false);
  });

  it('ne s’ouvre pas quand le questionnaire est terminé', async () => {
    mocked.lireProfil.mockResolvedValue(profilTermine);

    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false, surAccueil: true }));
    await vi.advanceTimersByTimeAsync(6_000);

    expect(result.current.ouverte).toBe(false);
  });

  it('ne s’ouvre qu’une fois par session', async () => {
    const premier = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false, surAccueil: true }));
    await vi.advanceTimersByTimeAsync(6_000);
    expect(premier.result.current.ouverte).toBe(true);
    premier.unmount();

    const second = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false, surAccueil: true }));
    await vi.advanceTimersByTimeAsync(6_000);

    expect(second.result.current.ouverte).toBe(false);
  });

  it('annule la minuterie au démontage', async () => {
    // Un agriculteur qui ouvre une parcelle dans les cinq secondes ne doit pas
    // se faire interrompre par une modale remontant d'un écran qu'il a quitté.
    const { unmount } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false, surAccueil: true }));
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

    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false, surAccueil: true }));

    await vi.advanceTimersByTimeAsync(5_500);
    expect(result.current.ouverte).toBe(false);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(result.current.ouverte).toBe(true);
  });

  it('ne s’ouvre pas si l’échéance tombe hors de l’accueil (I4)', async () => {
    // `AppLayout` ne se démonte pas entre onglets : sans ce garde, l'échéance
    // atteinte pendant qu'on lit « Mes informations » ferait remonter la
    // modale par-dessus cet écran.
    const { result } = renderHook(() => useInvitationProfil({ aDesDomaines: false, isLoading: false, surAccueil: false }));

    await vi.advanceTimersByTimeAsync(6_000);

    expect(result.current.ouverte).toBe(false);
  });

  it('s’ouvre si on est revenu à l’accueil avant l’échéance', async () => {
    const compte: CompteInvitationProfil = { aDesDomaines: false, isLoading: false, surAccueil: false };
    const { result, rerender } = renderHook((props: CompteInvitationProfil) => useInvitationProfil(props), {
      initialProps: compte,
    });

    await vi.advanceTimersByTimeAsync(2_000);
    rerender({ ...compte, surAccueil: true });
    await vi.advanceTimersByTimeAsync(3_500);

    expect(result.current.ouverte).toBe(true);
  });
});
