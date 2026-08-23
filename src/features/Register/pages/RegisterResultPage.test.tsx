import { StrictMode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerApi } from '@/features/Register/register.api';
import { useRegisterStore } from '@/features/Register/register.store';
import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';

import { RegisterResultPage } from './RegisterResultPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterResultPage />
    </MemoryRouter>,
  );

describe('RegisterResultPage', () => {
  beforeEach(() => {
    useRegisterStore.getState().reset();
    useRegisterStore.getState().setPhone('+224622201362');
    useRegisterStore.getState().setVerification('tok-1', { statut: 'absent' });
    useRegisterStore
      .getState()
      .setProfil({ firstName: 'Awa', lastName: 'Diallo', birthDate: '1990-05-12' });
    useRegisterStore.getState().setAdresse({
      regionId: 'r1',
      regionName: 'Kindia',
      prefectureId: 'p1',
      prefectureName: 'Dubréka',
      sousPrefectureId: 'sp1',
      sousPrefectureName: 'Manéah',
    });
    useRegisterStore.getState().setPin('123456');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('un double montage (StrictMode) n’appelle `creerCompte` qu’une seule fois', async () => {
    const creerSpy = vi.spyOn(registerApi, 'creerCompte').mockResolvedValue({ uid: 'u1' });
    vi.spyOn(useAuthStore.getState(), 'login').mockResolvedValue();

    // `MemoryRouter` (routeur déclaratif) n'expose pas le double-effet de
    // StrictMode dans cet environnement de test ; l'app réelle monte
    // `RouterProvider` sur un routeur de données (`createHashRouter` /
    // `createBrowserRouter`), ce que reproduit `createMemoryRouter` ici — et
    // sous cette forme, le double montage est bien observable.
    const router = createMemoryRouter([{ path: '/', element: <RegisterResultPage /> }]);
    render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );

    expect(await screen.findByText('Compte créé !')).toBeInTheDocument();

    expect(creerSpy).toHaveBeenCalledTimes(1);
  });

  it('vide le parcours dès la connexion réussie, tout en saluant l’agriculteur', async () => {
    vi.spyOn(registerApi, 'creerCompte').mockResolvedValue({ uid: 'u1' });
    vi.spyOn(useAuthStore.getState(), 'login').mockResolvedValue();

    renderPage();

    expect(await screen.findByText('Compte créé !')).toBeInTheDocument();
    // Le prénom est recopié avant le vidage : le message reste complet.
    expect(screen.getByText(/Bienvenue Awa/)).toBeInTheDocument();

    // Le jeton et le code confidentiel ne survivent pas au parcours : un retour
    // matériel Android ne peut plus rejouer une création déjà consommée.
    await waitFor(() => {
      expect(useRegisterStore.getState().registrationToken).toBeNull();
      expect(useRegisterStore.getState().pin).toBeNull();
    });
  });

  it('création réussie puis connexion en échec : message dédié, et « Réessayer » ne rejoue pas la création', async () => {
    const user = userEvent.setup();
    const creerSpy = vi.spyOn(registerApi, 'creerCompte').mockResolvedValue({ uid: 'u1' });
    const loginSpy = vi.spyOn(useAuthStore.getState(), 'login').mockRejectedValue(new Error('réseau'));

    renderPage();

    expect(await screen.findByText(/votre compte a bien été créé/i)).toBeInTheDocument();
    expect(creerSpy).toHaveBeenCalledTimes(1);
    expect(loginSpy).toHaveBeenCalledTimes(1);

    loginSpy.mockResolvedValue();
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(loginSpy).toHaveBeenCalledTimes(2));
    // La création ne doit jamais être rejouée : le jeton est déjà consommé.
    expect(creerSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Compte créé !')).toBeInTheDocument();
  });

  it('création en échec 503 : message d’indisponibilité, pas de « la création a échoué »', async () => {
    const creerSpy = vi
      .spyOn(registerApi, 'creerCompte')
      .mockRejectedValue(new ApiRequestError('Inscription indisponible pour le moment.', 503));
    vi.spyOn(useAuthStore.getState(), 'login').mockResolvedValue();

    renderPage();

    expect(
      await screen.findByText(/service est momentanément indisponible/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/la création du compte a échoué/i)).not.toBeInTheDocument();
    expect(creerSpy).toHaveBeenCalledTimes(1);
  });

  it('échec de création véritable : message mappé, et « Réessayer » rejoue bien la création', async () => {
    const user = userEvent.setup();
    const creerSpy = vi
      .spyOn(registerApi, 'creerCompte')
      .mockRejectedValue(new ApiRequestError('conflit', 409));
    vi.spyOn(useAuthStore.getState(), 'login').mockResolvedValue();

    renderPage();

    expect(
      await screen.findByText(/un compte existe déjà pour ce numéro/i),
    ).toBeInTheDocument();
    expect(creerSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(creerSpy).toHaveBeenCalledTimes(2));
  });
});
