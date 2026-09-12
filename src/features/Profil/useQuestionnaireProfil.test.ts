import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';

import { profilApi } from './profil.api';
import { useQuestionnaireProfil } from './useQuestionnaireProfil';

vi.mock('./profil.api', () => ({
  profilApi: { lireProfil: vi.fn(), envoyerEtape: vi.fn() },
}));

const mocked = vi.mocked(profilApi);

describe('useQuestionnaireProfil', () => {
  beforeEach(() => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'Mamadou Aliou Barry',
      address: { regionId: 'reg-1', prefectureId: 'pref-1', sousPrefectureId: 'sp-1' },
      profileSurvey: { step: 0, completedAt: null },
      questionnaire: {},
    });
    mocked.envoyerEtape.mockResolvedValue({ step: 1, completedAt: null });
  });

  afterEach(() => vi.clearAllMocks());

  it('préremplit depuis le dossier', async () => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'Mamadou Aliou Barry',
      address: { regionId: 'reg-1', prefectureId: 'pref-1', sousPrefectureId: 'sp-1' },
      profileSurvey: { step: 0, completedAt: null },
      questionnaire: { farmingExperience: 10, primaryCrops: ['riz'] },
    });

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reponses.nomComplet).toBe('Mamadou Aliou Barry');
    expect(result.current.reponses.farmingExperience).toBe(10);
    expect(result.current.reponses.primaryCrops).toEqual(['riz']);
    expect(result.current.reponses.regionId).toBe('reg-1');
  });

  it('reprend à l’étape suivante de celle déjà validée', async () => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'M. B.',
      address: {},
      profileSurvey: { step: 2, completedAt: null },
      questionnaire: {},
    });

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.etapeCourante).toBe(3);
  });

  it('coupe le nom complet en prénom et nom à l’envoi', async () => {
    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setReponses({ nomComplet: 'Aïssatou Camara Diallo' }));
    await act(async () => {
      await result.current.envoyerEtape(1);
    });

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(
      expect.objectContaining({ step: 1, firstName: 'Aïssatou', lastName: 'Camara Diallo' }),
    );
  });

  it('envoie une coopérative absente plutôt qu’un objet vide', async () => {
    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setReponses({ estMembreCooperative: false }));
    await act(async () => {
      await result.current.envoyerEtape(2);
    });

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(
      expect.objectContaining({ cooperative: { isMember: false } }),
    );
  });

  it('transforme l’année d’adhésion en date', async () => {
    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.setReponses({
        estMembreCooperative: true,
        nomCooperative: 'Tanènè',
        anneeAdhesion: 2019,
      }),
    );
    await act(async () => {
      await result.current.envoyerEtape(2);
    });

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(
      expect.objectContaining({
        cooperative: { isMember: true, name: 'Tanènè', joinDate: '2019-01-01' },
      }),
    );
  });

  it('préremplit les formations et équipements en chaîne, pas en tableau', async () => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'Mamadou Aliou Barry',
      address: { regionId: 'reg-1', prefectureId: 'pref-1', sousPrefectureId: 'sp-1' },
      profileSurvey: { step: 0, completedAt: null },
      questionnaire: {
        declaredTrainings: 'Formation compostage 2023',
        declaredEquipment: 'Motoculteur, brouette',
      },
    });

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reponses.formations).toBe('Formation compostage 2023');
    expect(result.current.reponses.equipements).toBe('Motoculteur, brouette');
  });

  it('envoie les formations et équipements en chaîne à l’étape 2', async () => {
    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() =>
      result.current.setReponses({
        formations: 'Formation compostage 2023',
        equipements: 'Motoculteur, brouette',
      }),
    );
    await act(async () => {
      await result.current.envoyerEtape(2);
    });

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(
      expect.objectContaining({
        declaredTrainings: 'Formation compostage 2023',
        declaredEquipment: 'Motoculteur, brouette',
      }),
    );
  });

  it('omet le nom de famille quand le nom complet n’a qu’un mot', async () => {
    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setReponses({ nomComplet: 'Kadiatou' }));
    await act(async () => {
      await result.current.envoyerEtape(1);
    });

    const corps = mocked.envoyerEtape.mock.calls[0][0] as Record<string, unknown>;
    expect(corps.firstName).toBe('Kadiatou');
    expect(corps).not.toHaveProperty('lastName');
  });

  it('dit qu’un dossier illisible n’a pas pu être CHARGÉ, jamais « envoi impossible »', async () => {
    // Rien n'a été envoyé au montage : parler d'envoi raté décrirait un geste
    // que l'agriculteur n'a pas fait, devant un formulaire vide.
    mocked.lireProfil.mockRejectedValue(new ApiRequestError('réseau', 500));

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toMatch(/chargées/i);
    expect(result.current.error).not.toMatch(/envoi/i);
    expect(result.current.echecChargement).toBe(true);
  });

  it('accepte un dossier sans questionnaire ni profileSurvey — le cas d’un compte neuf', async () => {
    // Charge utile réelle de `GET /farmers/me` pour un agriculteur qui n'a
    // jamais rempli le questionnaire : le serveur OMET `questionnaire` et
    // `profileSurvey` au lieu de les renvoyer vides. Les déréférencer jetait un
    // TypeError depuis le `.then()`, que le `.catch()` transformait en « vos
    // réponses n'ont pas pu être chargées » — sur une requête pourtant réussie,
    // et en perdant au passage le nom déjà connu.
    mocked.lireProfil.mockResolvedValue({
      farmerCode: 'AGR-073',
      displayName: 'Mamadou Test-Actif',
      phone: '+224600000003',
      address: {},
      notificationSettings: { sms: true },
    } as never);

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.echecChargement).toBe(false);
    // Le peu qu'on sait de lui est quand même repris.
    expect(result.current.reponses.nomComplet).toBe('Mamadou Test-Actif');
    expect(result.current.etapeCourante).toBe(1);
    expect(result.current.termine).toBe(false);
  });

  it('n’appelle pas l’API en aperçu de démonstration', async () => {
    // `?demo` fait passer `ProtectedRoute` sans session : appeler l'API
    // renverrait 401 et l'aperçu ne montrerait qu'un bandeau d'échec.
    const url = window.location.href;
    window.history.pushState({}, '', '/mon-profil/completer?demo=1');
    try {
      const { result } = renderHook(() => useQuestionnaireProfil());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mocked.lireProfil).not.toHaveBeenCalled();
      expect(result.current.reponses.nomComplet).toBe('Mamadou Aliou Barry');
      expect(result.current.error).toBeNull();
    } finally {
      window.history.pushState({}, '', url);
    }
  });

  it('ne propose pas de réessayer une session morte — il la déclare morte', async () => {
    // Un 401 ne se répare jamais en rejouant la même requête : « Réessayer »
    // enfermerait l'agriculteur dans une boucle. On marque plutôt la session
    // invalide, et `ProtectedRoute` le ramène à son code PIN.
    useAuthStore.setState({ isAuthenticated: true, rememberedPhone: '+224621234567' });
    mocked.lireProfil.mockRejectedValue(new ApiRequestError('Session expirée', 401));

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    // Le numéro reste mémorisé : il doit retomber sur le PIN, pas sur l'accueil.
    expect(useAuthStore.getState().rememberedPhone).toBe('+224621234567');
    // Pas de bandeau « Réessayer » : il n'y a rien à réessayer.
    expect(result.current.echecChargement).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('dit qu’une session expirée à l’envoi demande de se reconnecter, pas de réessayer', async () => {
    mocked.envoyerEtape.mockRejectedValue(new ApiRequestError('Session expirée', 401));

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.envoyerEtape(1);
    });

    expect(result.current.error).toMatch(/session a expiré/i);
    expect(result.current.error).not.toMatch(/réessayez dans un moment/i);
  });

  it('recharge le dossier à la demande, et efface l’échec quand ça repasse', async () => {
    mocked.lireProfil.mockRejectedValueOnce(new ApiRequestError('réseau', 500));

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.echecChargement).toBe(true));

    mocked.lireProfil.mockResolvedValue({
      displayName: 'Mamadou Aliou Barry',
      address: { regionId: 'reg-1', prefectureId: 'pref-1', sousPrefectureId: 'sp-1' },
      profileSurvey: { step: 0, completedAt: null },
      questionnaire: {},
    });
    act(() => result.current.rechargerProfil());

    await waitFor(() => expect(result.current.echecChargement).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.reponses.nomComplet).toBe('Mamadou Aliou Barry');
  });

  it('n’avance pas l’étape quand l’envoi échoue', async () => {
    mocked.envoyerEtape.mockRejectedValue(new ApiRequestError('réseau', 500));

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = true;
    await act(async () => {
      ok = await result.current.envoyerEtape(1);
    });

    expect(ok).toBe(false);
    expect(result.current.error).toMatch(/réessay/i);
    expect(result.current.isSending).toBe(false);
  });

  it('distingue un 400 — une réponse refusée — d’une panne réseau', async () => {
    // Un 400 dit « ce que vous avez envoyé est refusé » : accuser le réseau
    // pousse à réessayer indéfiniment sans jamais pouvoir réussir.
    mocked.envoyerEtape.mockRejectedValue(new ApiRequestError('Bad Request', 400));

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.envoyerEtape(3);
    });

    expect(result.current.error).toMatch(/n['’]a pas été acceptée/i);
    expect(result.current.error).not.toMatch(/réessay/i);
  });

  it('garde le message réseau pour tout ce qui n’est pas un 400', async () => {
    mocked.envoyerEtape.mockRejectedValue(new ApiRequestError('Erreur serveur', 500));

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.envoyerEtape(1);
    });

    expect(result.current.error).toMatch(/réessay/i);
  });

  it('déduit « non membre » quand l’étape 2 est validée sans coopérative', async () => {
    // Le serveur n'écrit rien pour un non-membre (voulu) : sans cette
    // déduction, l'agriculteur qui a répondu « non » retrouve une question
    // obligatoire vierge en reprenant le questionnaire.
    mocked.lireProfil.mockResolvedValue({
      displayName: 'Mamadou Aliou Barry',
      address: {},
      profileSurvey: { step: 2, completedAt: null },
      questionnaire: {},
    });

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reponses.estMembreCooperative).toBe(false);
  });

  it('laisse la question ouverte tant que l’étape 2 n’est pas encore validée', async () => {
    mocked.lireProfil.mockResolvedValue({
      displayName: 'Mamadou Aliou Barry',
      address: {},
      profileSurvey: { step: 1, completedAt: null },
      questionnaire: {},
    });

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reponses.estMembreCooperative).toBeUndefined();
  });
});
