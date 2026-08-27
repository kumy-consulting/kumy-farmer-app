import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError } from '@/shared/api/client';

import { compteApi } from './compte.api';
import { useEtudeDeSol } from './useEtudeDeSol';

vi.mock('./compte.api', () => ({
  compteApi: {
    etatDuCompte: vi.fn(),
    etudeDeSol: vi.fn(),
    demanderEtudeDeSol: vi.fn(),
  },
}));

const mocked = vi.mocked(compteApi);
const LE_27 = '2026-08-27T09:12:00.000Z';

describe('useEtudeDeSol', () => {
  beforeEach(() => {
    mocked.etudeDeSol.mockResolvedValue({ requestedAt: null });
    mocked.demanderEtudeDeSol.mockResolvedValue({ requestedAt: LE_27 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('relit au montage la dernière demande envoyée', async () => {
    mocked.etudeDeSol.mockResolvedValue({ requestedAt: LE_27 });

    const { result } = renderHook(() => useEtudeDeSol());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requestedAt).toBe(LE_27);
  });

  it('retient la date rendue par l’envoi', async () => {
    const { result } = renderHook(() => useEtudeDeSol());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.demander();
    });

    expect(result.current.requestedAt).toBe(LE_27);
    expect(result.current.error).toBeNull();
  });

  it('traite un 409 comme une demande déjà partie, pas comme une erreur', async () => {
    // Le serveur refuse une seconde demande sous 24 h. Ce n'est pas un échec :
    // l'agriculteur a bien une demande en cours, l'écran doit le lui dire.
    mocked.demanderEtudeDeSol.mockRejectedValue(
      new ApiRequestError('Une demande a déjà été envoyée.', 409),
    );

    const { result } = renderHook(() => useEtudeDeSol());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.demander();
    });

    expect(result.current.requestedAt).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('remonte un échec d’envoi et laisse réessayer', async () => {
    mocked.demanderEtudeDeSol.mockRejectedValue(
      new ApiRequestError("L'e-mail n'a pas pu être envoyé.", 502),
    );

    const { result } = renderHook(() => useEtudeDeSol());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.demander();
    });

    expect(result.current.requestedAt).toBeNull();
    expect(result.current.error).toMatch(/réessay/i);
    expect(result.current.isSending).toBe(false);
  });

  it('ne bloque pas l’écran quand la relecture échoue', async () => {
    // Un compte tout neuf, ou une API muette : le bouton doit rester offert.
    mocked.etudeDeSol.mockRejectedValue(new ApiRequestError('boom', 500));

    const { result } = renderHook(() => useEtudeDeSol());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requestedAt).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
