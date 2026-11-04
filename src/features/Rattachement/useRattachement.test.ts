import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rattachementApi, type EtatRattachement } from '@/features/Rattachement/rattachement.api';
import { useRattachement } from '@/features/Rattachement/useRattachement';
import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';

const enAttente: EtatRattachement = { statut: 'en_attente', codeExpireA: null };

const vider = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useRattachement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const monter = async () => {
    const hook = renderHook(() => useRattachement());
    await vider();
    return hook;
  };

  const tirer = (hook: Awaited<ReturnType<typeof monter>>) =>
    act(async () => {
      await hook.result.current.afficherCode();
    });

  it('lit l’état au montage', async () => {
    const etat = vi.spyOn(rattachementApi, 'etat').mockResolvedValue(enAttente);
    const { result } = await monter();

    expect(etat).toHaveBeenCalledTimes(1);
    expect(result.current.etat).toEqual(enAttente);
    expect(result.current.isLoading).toBe(false);
  });

  it('rend le code, puis relit l’état 10 s plus tard', async () => {
    const etat = vi.spyOn(rattachementApi, 'etat').mockResolvedValue(enAttente);
    vi.spyOn(rattachementApi, 'demanderCode').mockResolvedValue({
      code: '123456',
      expireA: new Date(Date.now() + 600_000).toISOString(),
    });
    const hook = await monter();

    await tirer(hook);
    expect(hook.result.current.code).toBe('123456');
    expect(hook.result.current.secondesRestantes).toBe(600);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(etat).toHaveBeenCalledTimes(2);
  });

  it('recharge le profil quand la demande est confirmée', async () => {
    const etat = vi.spyOn(rattachementApi, 'etat').mockResolvedValue(enAttente);
    const loadUser = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(useAuthStore, 'getState').mockReturnValue({ loadUser } as unknown as ReturnType<
      typeof useAuthStore.getState
    >);
    vi.spyOn(rattachementApi, 'demanderCode').mockResolvedValue({
      code: '123456',
      expireA: new Date(Date.now() + 600_000).toISOString(),
    });
    const hook = await monter();
    await tirer(hook);

    etat.mockResolvedValue({ statut: 'confirmee', codeExpireA: null });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(loadUser).toHaveBeenCalledTimes(1);
    expect(hook.result.current.etat?.statut).toBe('confirmee');
    expect(hook.result.current.code).toBeNull();
  });

  it('efface le code après 10 min et ne relit plus', async () => {
    const etat = vi.spyOn(rattachementApi, 'etat').mockResolvedValue(enAttente);
    vi.spyOn(rattachementApi, 'demanderCode').mockResolvedValue({
      code: '123456',
      expireA: new Date(Date.now() + 600_000).toISOString(),
    });
    const hook = await monter();
    await tirer(hook);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600_500);
    });
    expect(hook.result.current.code).toBeNull();

    const appels = etat.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(etat).toHaveBeenCalledTimes(appels);
  });

  it('ne relit plus rien après le démontage', async () => {
    const etat = vi.spyOn(rattachementApi, 'etat').mockResolvedValue(enAttente);
    vi.spyOn(rattachementApi, 'demanderCode').mockResolvedValue({
      code: '123456',
      expireA: new Date(Date.now() + 600_000).toISOString(),
    });
    const hook = await monter();
    await tirer(hook);
    hook.unmount();

    const appels = etat.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(etat).toHaveBeenCalledTimes(appels);
  });

  it('passe en « bloquée » sur un 409 ATTACH_REQUEST_BLOCKED, sans message', async () => {
    vi.spyOn(rattachementApi, 'etat').mockResolvedValue(enAttente);
    vi.spyOn(rattachementApi, 'demanderCode').mockRejectedValue(
      new ApiRequestError('m', 409, 'ATTACH_REQUEST_BLOCKED'),
    );
    const hook = await monter();
    await tirer(hook);

    expect(hook.result.current.etat?.statut).toBe('bloquee');
    expect(hook.result.current.error).toBeNull();
    expect(hook.result.current.code).toBeNull();
  });

  it('passe en « aucune » sur un 404 NO_ATTACH_REQUEST, sans message', async () => {
    vi.spyOn(rattachementApi, 'etat').mockResolvedValue(enAttente);
    vi.spyOn(rattachementApi, 'demanderCode').mockRejectedValue(new ApiRequestError('m', 404, 'NO_ATTACH_REQUEST'));
    const hook = await monter();
    await tirer(hook);

    expect(hook.result.current.etat?.statut).toBe('aucune');
    expect(hook.result.current.error).toBeNull();
  });

  it('relit l’état sur un 409 ATTACH_REQUEST_CLOSED', async () => {
    const etat = vi.spyOn(rattachementApi, 'etat').mockResolvedValue(enAttente);
    vi.spyOn(rattachementApi, 'demanderCode').mockRejectedValue(new ApiRequestError('m', 409, 'ATTACH_REQUEST_CLOSED'));
    const hook = await monter();
    etat.mockResolvedValue({ statut: 'refusee', codeExpireA: null });
    await tirer(hook);

    expect(etat).toHaveBeenCalledTimes(2);
    expect(hook.result.current.etat?.statut).toBe('refusee');
    expect(hook.result.current.error).toBeNull();
  });

  it('donne un message court sur toute autre erreur', async () => {
    vi.spyOn(rattachementApi, 'etat').mockResolvedValue(enAttente);
    vi.spyOn(rattachementApi, 'demanderCode').mockRejectedValue(new ApiRequestError('boum', 500));
    const hook = await monter();
    await tirer(hook);

    expect(hook.result.current.error).toMatch(/Impossible/);
  });
});
