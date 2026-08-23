import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { registerApi } from '@/features/Register/register.api';
import { useRegisterStore } from '@/features/Register/register.store';

import { RegisterAddressPage } from './RegisterAddressPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterAddressPage />
    </MemoryRouter>,
  );

/** Choisit une option dans un `ProfileSelect` (Select MUI, liste en portail). */
const choisir = async (
  user: ReturnType<typeof userEvent.setup>,
  libelle: string,
  option: string,
) => {
  await user.click(screen.getByLabelText(libelle));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('RegisterAddressPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useRegisterStore.getState().reset();
    useRegisterStore.getState().setVerification('tok-1', { statut: 'absent' });

    vi.spyOn(onboardingApi, 'getRegions').mockResolvedValue([
      { id: 'r1', name: 'Kindia' },
      { id: 'r2', name: 'Boké' },
    ]);
    vi.spyOn(onboardingApi, 'getPrefectures').mockImplementation(async (regionId) =>
      regionId === 'r1'
        ? [{ id: 'p1', name: 'Coyah' }, { id: 'p2', name: 'Dubréka' }]
        : [{ id: 'p3', name: 'Boffa' }],
    );
    vi.spyOn(registerApi, 'getSousPrefectures').mockImplementation(async (prefectureId) =>
      prefectureId === 'p1' ? [{ id: 'sp1', name: 'Manéah' }] : [{ id: 'sp2', name: 'Tanéné' }],
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('charge les régions à l’ouverture', async () => {
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());
  });

  it('laisse préfecture et sous-préfecture inertes tant qu’il n’y a pas de région', async () => {
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    expect(screen.getByLabelText('Préfecture')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText('Sous-préfecture')).toHaveAttribute('aria-disabled', 'true');
  });

  it('charge les préfectures de la région choisie', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    await choisir(user, 'Région', 'Kindia');

    await waitFor(() => expect(onboardingApi.getPrefectures).toHaveBeenCalledWith('r1'));
  });

  it('remet préfecture et sous-préfecture à zéro quand la région change', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    await choisir(user, 'Région', 'Kindia');
    await choisir(user, 'Préfecture', 'Coyah');
    await choisir(user, 'Sous-préfecture', 'Manéah');
    expect(useRegisterStore.getState().adresse.sousPrefectureId).toBe('sp1');

    await choisir(user, 'Région', 'Boké');

    await waitFor(() => {
      const adresse = useRegisterStore.getState().adresse;
      expect(adresse.regionId).toBe('r2');
      expect(adresse.prefectureId).toBeNull();
      expect(adresse.sousPrefectureId).toBeNull();
    });
  });

  it('n’ouvre le bouton qu’une fois les trois niveaux choisis, puis passe au code confidentiel', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    const bouton = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' });
    expect(bouton().disabled).toBe(true);

    await choisir(user, 'Région', 'Kindia');
    expect(bouton().disabled).toBe(true);

    await choisir(user, 'Préfecture', 'Coyah');
    expect(bouton().disabled).toBe(true);

    await choisir(user, 'Sous-préfecture', 'Manéah');
    expect(bouton().disabled).toBe(false);

    await user.click(bouton());
    expect(navigateMock).toHaveBeenCalledWith('/inscription/code-confidentiel');
  });

  it('signale un référentiel injoignable sans vider l’écran', async () => {
    vi.spyOn(onboardingApi, 'getRegions').mockRejectedValue(new Error('offline'));

    renderPage();

    expect(await screen.findByText(/Impossible de charger la liste/)).toBeInTheDocument();
  });
});
