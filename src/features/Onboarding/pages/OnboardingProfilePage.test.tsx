import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import 'dayjs/locale/fr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';

import { OnboardingProfilePage } from './OnboardingProfilePage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const regions = [
  { id: 'r1', name: 'Kindia' },
  { id: 'r2', name: 'Boké' },
];
const prefectures = [
  { id: 'p1', name: 'Dubréka' },
  { id: 'p2', name: 'Coyah' },
];

const seedUser = (dateOfBirth?: string | null) =>
  useOnboardingStore.getState().setUserData({
    email: 'a@b.c',
    phone: '+224620000000',
    firstName: 'Awa',
    lastName: 'D',
    role: 'farmer',
    dateOfBirth,
  });

const renderPage = () =>
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <MemoryRouter>
        <OnboardingProfilePage />
      </MemoryRouter>
    </LocalizationProvider>,
  );

const selectRegion = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByLabelText('Région'));
  await user.click(await screen.findByRole('option', { name }));
};

const selectPrefecture = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByLabelText('Préfecture'));
  await user.click(await screen.findByRole('option', { name }));
};

describe('OnboardingProfilePage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useOnboardingStore.getState().reset();
    seedUser();
    vi.spyOn(onboardingApi, 'getRegions').mockResolvedValue(regions);
    vi.spyOn(onboardingApi, 'getPrefectures').mockResolvedValue(prefectures);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rend les champs date, région et préfecture', async () => {
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    expect(screen.getByRole('group', { name: 'Date de naissance' })).toBeDefined();
    expect(screen.getByLabelText('Région')).toBeDefined();
    expect(screen.getByLabelText('Préfecture')).toBeDefined();
  });

  it('désactive la préfecture tant qu’aucune région n’est choisie', async () => {
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    expect(screen.getByLabelText('Préfecture').getAttribute('aria-disabled')).toBe('true');
  });

  it('garde le bouton désactivé sans date de naissance, même région + préfecture remplies', async () => {
    const user = userEvent.setup();
    renderPage(); // pas de dateOfBirth pré-remplie
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    await selectRegion(user, 'Kindia');
    await waitFor(() => expect(onboardingApi.getPrefectures).toHaveBeenCalledWith('r1'));
    await selectPrefecture(user, 'Dubréka');

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' }).disabled).toBe(true);
  });

  it('active le bouton Continuer une fois date (pré-remplie) + région + préfecture remplies', async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().reset();
    seedUser('1990-05-12');
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' }).disabled).toBe(true);

    await selectRegion(user, 'Kindia');
    await selectPrefecture(user, 'Dubréka');

    await waitFor(() =>
      expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' }).disabled).toBe(false),
    );
  });

  it('change de région réinitialise la préfecture sélectionnée', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    await selectRegion(user, 'Kindia');
    await selectPrefecture(user, 'Dubréka');
    expect(screen.getByLabelText('Préfecture').textContent).toContain('Dubréka');

    await selectRegion(user, 'Boké');
    expect(screen.getByLabelText('Préfecture').textContent).not.toContain('Dubréka');
  });

  it('pré-remplit la date depuis userData.dateOfBirth', async () => {
    useOnboardingStore.getState().reset();
    seedUser('1990-05-12');
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    expect(screen.getByRole('group', { name: 'Date de naissance' }).textContent).toContain('12/05/1990');
  });

  it('affiche un ErrorBanner si le chargement des régions échoue', async () => {
    vi.mocked(onboardingApi.getRegions).mockRejectedValueOnce(new Error('offline'));
    renderPage();

    expect(await screen.findByText(/impossible de charger la liste/i)).toBeDefined();
  });

  it('persiste le profil et navigue vers /onboarding/pin', async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().reset();
    seedUser('1990-05-12');
    renderPage();
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    await selectRegion(user, 'Kindia');
    await selectPrefecture(user, 'Dubréka');
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    expect(navigateMock).toHaveBeenCalledWith('/onboarding/pin');
    const { profile } = useOnboardingStore.getState();
    expect(profile.regionId).toBe('r1');
    expect(profile.regionName).toBe('Kindia');
    expect(profile.prefectureId).toBe('p1');
    expect(profile.prefectureName).toBe('Dubréka');
    expect(profile.birthDate).toBe('1990-05-12');
  });
});
