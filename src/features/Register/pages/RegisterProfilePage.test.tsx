import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import 'dayjs/locale/fr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRegisterStore } from '@/features/Register/register.store';

import { RegisterProfilePage } from './RegisterProfilePage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

// `MobileDatePicker` exige un `LocalizationProvider` : en production il vient
// d'`App.tsx` à la racine, absent des tests unitaires. Même câblage que
// `OnboardingProfilePage.test.tsx`.
const renderPage = () =>
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <MemoryRouter>
        <RegisterProfilePage />
      </MemoryRouter>
    </LocalizationProvider>,
  );

describe('RegisterProfilePage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useRegisterStore.getState().reset();
    useRegisterStore.getState().setPhone('+224622201362');
    useRegisterStore.getState().setVerification('tok-1', { statut: 'absent' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ouvre un formulaire vierge en branche « absent »', () => {
    renderPage();

    expect(screen.getByLabelText('Prénom')).toHaveValue('');
    expect(screen.getByLabelText('Nom')).toHaveValue('');
  });

  it('pré-remplit prénom, nom et date en branche « pending »', () => {
    useRegisterStore.getState().setVerification('tok-2', {
      statut: 'pending',
      profil: { firstName: 'Awa', lastName: 'Diallo', birthDate: '1990-05-12' },
    });

    renderPage();

    expect(screen.getByLabelText('Prénom')).toHaveValue('Awa');
    expect(screen.getByLabelText('Nom')).toHaveValue('Diallo');
    // MUI X v9 rend le MobileDatePicker en `role="group"`, pas en input labellisé :
    // c'est la façon dont `OnboardingProfilePage.test.tsx` l'interroge déjà.
    expect(screen.getByRole('group', { name: 'Date de naissance' }).textContent).toContain(
      '12/05/1990',
    );
  });

  it('garde le bouton inerte tant que prénom et nom ne sont pas renseignés', async () => {
    const user = userEvent.setup();
    // La date arrive pré-remplie : le MobileDatePicker ne se tape pas sous jsdom,
    // on isole donc la validation des deux champs texte.
    useRegisterStore.getState().setVerification('tok-gate', {
      statut: 'pending',
      profil: { firstName: '', lastName: '', birthDate: '1990-05-12' },
    });

    renderPage();

    const bouton = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' });
    expect(bouton().disabled).toBe(true);

    await user.type(screen.getByLabelText('Prénom'), 'Awa');
    expect(bouton().disabled).toBe(true);

    await user.type(screen.getByLabelText('Nom'), 'Diallo');
    expect(bouton().disabled).toBe(false);
  });

  it('garde le bouton inerte quand la date de naissance manque', () => {
    // Branche « absent » : profil vierge, donc aucune date.
    renderPage();

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' }).disabled).toBe(
      true,
    );
  });

  it('refuse un prénom d’une seule lettre', async () => {
    const user = userEvent.setup();
    useRegisterStore.getState().setVerification('tok-3', {
      statut: 'pending',
      profil: { firstName: 'A', lastName: 'Diallo', birthDate: '1990-05-12' },
    });

    renderPage();

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' }).disabled).toBe(
      true,
    );

    await user.type(screen.getByLabelText('Prénom'), 'wa');
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' }).disabled).toBe(
      false,
    );
  });

  it('enregistre le profil et passe à l’adresse', async () => {
    const user = userEvent.setup();
    useRegisterStore.getState().setVerification('tok-4', {
      statut: 'pending',
      profil: { firstName: 'Awa', lastName: 'Diallo', birthDate: '1990-05-12' },
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    expect(useRegisterStore.getState().profil).toEqual({
      firstName: 'Awa',
      lastName: 'Diallo',
      birthDate: '1990-05-12',
    });
    expect(navigateMock).toHaveBeenCalledWith('/inscription/adresse');
  });

  it('renvoie au téléphone quand aucun jeton d’inscription n’est en mémoire', () => {
    useRegisterStore.getState().reset();
    renderPage();

    expect(screen.queryByLabelText('Prénom')).not.toBeInTheDocument();
  });
});
