import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerApi } from '@/features/Register/register.api';
import { useRegisterStore } from '@/features/Register/register.store';
import { ApiRequestError } from '@/shared/api/client';

import { RegisterPhonePage } from './RegisterPhonePage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterPhonePage />
    </MemoryRouter>,
  );

const saisirNumero = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox'), '622201362');
};

describe('RegisterPhonePage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useRegisterStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enregistre le numéro et passe à l’écran du code', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'demanderCode').mockResolvedValue({ expiresIn: 300, resendAfter: 60 });

    renderPage();
    await saisirNumero(user);
    await user.click(screen.getByRole('button', { name: 'Suivant' }));

    expect(await screen.findByRole('button', { name: 'Suivant' })).toBeEnabled();
    expect(registerApi.demanderCode).toHaveBeenCalledWith('+224622201362');
    expect(useRegisterStore.getState().phone).toBe('+224622201362');
    expect(navigateMock).toHaveBeenCalledWith('/inscription/code', {
      state: { resendAfter: 60 },
    });
  });

  it('annonce le plafond horaire sur un 429, sans accuser la connexion', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'demanderCode').mockRejectedValue(
      new ApiRequestError('Trop de demandes', 429),
    );

    renderPage();
    await saisirNumero(user);
    await user.click(screen.getByRole('button', { name: 'Suivant' }));

    expect(await screen.findByText(/Trop de codes ont été demandés/i)).toBeInTheDocument();
    expect(screen.queryByText(/Vérifiez votre connexion/i)).not.toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('garde le message générique pour une panne réseau', async () => {
    const user = userEvent.setup();
    vi.spyOn(registerApi, 'demanderCode').mockRejectedValue(new Error('offline'));

    renderPage();
    await saisirNumero(user);
    await user.click(screen.getByRole('button', { name: 'Suivant' }));

    expect(await screen.findByText(/Impossible d’envoyer le code/i)).toBeInTheDocument();
    expect(screen.queryByText(/Trop de codes/i)).not.toBeInTheDocument();
  });
});
