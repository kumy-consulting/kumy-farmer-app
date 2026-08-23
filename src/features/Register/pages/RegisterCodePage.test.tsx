import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerApi } from '@/features/Register/register.api';
import { useRegisterStore } from '@/features/Register/register.store';

import { RegisterCodePage } from './RegisterCodePage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock, useLocation: () => ({ state: { resendAfter: 60 } }) };
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
