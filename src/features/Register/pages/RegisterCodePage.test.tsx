import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerApi } from '@/features/Register/register.api';
import { useRegisterStore } from '@/features/Register/register.store';
import { ApiRequestError } from '@/shared/api/client';

import { RegisterCodePage } from './RegisterCodePage';

const navigateMock = vi.fn();

/** Le délai porté par la navigation ; réglé à 0 pour tester le renvoi sans attendre. */
let resendAfterInitial = 60;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ state: { resendAfter: resendAfterInitial } }),
  };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterCodePage />
    </MemoryRouter>,
  );

/** Le code se saisit dans l'input caché de `PinDisplay`, ciblé par son aria-label. */
const saisirCode = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
  await user.type(screen.getByLabelText('Code de vérification'), code);
};

describe('RegisterCodePage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    resendAfterInitial = 60;
    useRegisterStore.getState().reset();
    useRegisterStore.getState().setPhone('+224622201362');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('affiche le numéro vérifié pour que l’on puisse le relire', () => {
    renderPage();
    expect(screen.getByText('+224 622 20 13 62')).toBeInTheDocument();
  });

  it('envoie « active » vers l’écran « déjà inscrit »', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockResolvedValue({
      registrationToken: 'tok-1',
      account: { statut: 'active' },
    });

    renderPage();
    await saisirCode(user, '123456');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/inscription/deja-inscrit'),
    );
  });

  it('envoie « suspended » vers l’écran dédié', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockResolvedValue({
      registrationToken: 'tok-2',
      account: { statut: 'suspended' },
    });

    renderPage();
    await saisirCode(user, '123456');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/inscription/suspendu'));
  });

  it('envoie « pending » vers le profil et retient le profil pré-rempli', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockResolvedValue({
      registrationToken: 'tok-3',
      account: {
        statut: 'pending',
        profil: { firstName: 'Awa', lastName: 'Diallo', birthDate: '1990-05-12' },
      },
    });

    renderPage();
    await saisirCode(user, '123456');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/inscription/profil'));
    expect(useRegisterStore.getState().profil.firstName).toBe('Awa');
    expect(useRegisterStore.getState().registrationToken).toBe('tok-3');
  });

  it('envoie « absent » vers le profil, vierge', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockResolvedValue({
      registrationToken: 'tok-4',
      account: { statut: 'absent' },
    });

    renderPage();
    await saisirCode(user, '123456');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/inscription/profil'));
    expect(useRegisterStore.getState().profil.firstName).toBe('');
  });

  it('affiche un message et vide le champ quand le code est refusé', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'verifierCode').mockRejectedValue(new Error('nope'));

    renderPage();
    await saisirCode(user, '000000');
    await user.click(screen.getByRole('button', { name: 'Vérifier' }));

    expect(await screen.findByText(/code est incorrect ou a expiré/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('annonce le plafond horaire quand le renvoi est refusé en 429', async () => {
    // Le délai d'une minute n'est pas une erreur : l'API le rend en 200 avec le
    // `resendAfter` restant. Un 429 ne peut donc dire que le plafond horaire.
    resendAfterInitial = 0;
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'demanderCode').mockRejectedValue(
      new ApiRequestError('Trop de demandes', 429),
    );

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Renvoyer le code' }));

    expect(await screen.findByText(/Trop de codes ont été demandés/i)).toBeInTheDocument();
    expect(screen.queryByText(/Impossible de renvoyer le code/i)).not.toBeInTheDocument();
  });

  it('garde le message générique quand le renvoi échoue pour une autre raison', async () => {
    resendAfterInitial = 0;
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'demanderCode').mockRejectedValue(new Error('offline'));

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Renvoyer le code' }));

    expect(await screen.findByText(/Impossible de renvoyer le code/i)).toBeInTheDocument();
    expect(screen.queryByText(/Trop de codes/i)).not.toBeInTheDocument();
  });

  it('laisse le renvoi inerte tant que le délai court, puis l’ouvre', async () => {
    vi.useFakeTimers();
    renderPage();

    const bouton = screen.getByRole<HTMLButtonElement>('button', { name: /Renvoyer/ });
    expect(bouton.disabled).toBe(true);
    expect(bouton).toHaveTextContent('60');

    // Les mises à jour déclenchées par l'intervalle du compte à rebours doivent
    // être appliquées dans le périmètre `act`, sinon React ne les répercute pas
    // dans le DOM que `screen` interroge.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: /Renvoyer/ }).disabled,
    ).toBe(false);
  });
});
