import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError } from '@/shared/api/client';

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

  it('signale un dossier illisible au montage plutôt que de rester muette', async () => {
    mocked.lireProfil.mockRejectedValue(new ApiRequestError('réseau', 500));

    const { result } = renderHook(() => useQuestionnaireProfil());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toMatch(/réessay/i);
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
});
