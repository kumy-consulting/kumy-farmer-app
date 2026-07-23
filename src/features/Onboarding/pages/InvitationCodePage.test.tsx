import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { useOnboardingStore } from '@/features/Onboarding/onboarding.store';

import { InvitationCodePage } from './InvitationCodePage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <InvitationCodePage />
    </MemoryRouter>,
  );

describe('InvitationCodePage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useOnboardingStore.getState().reset?.();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche le champ de code et le bouton de validation', () => {
    renderPage();

    expect(screen.getByLabelText("Code d'invitation")).toBeDefined();
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeDefined();
  });

  it('désactive le bouton Continuer tant que le champ est vide', () => {
    renderPage();

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continuer' }).disabled).toBe(true);
  });

  it('valide le code saisi via onboardingApi.validateToken', async () => {
    const user = userEvent.setup();
    const validateSpy = vi.spyOn(onboardingApi, 'validateToken').mockResolvedValue({
      valid: true,
      email: 'agri@kumy.gn',
      phone: '+224620000000',
      firstName: 'Mamadou',
      lastName: 'Diallo',
      role: 'farmer',
    });

    renderPage();
    await user.type(screen.getByLabelText("Code d'invitation"), 'abc123def456');
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    await waitFor(() => expect(validateSpy).toHaveBeenCalledWith('abc123def456'));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/onboarding/welcome'));
  });

  it('affiche une erreur quand le code est invalide', async () => {
    const user = userEvent.setup();
    vi.spyOn(onboardingApi, 'validateToken').mockRejectedValue(new Error('boom'));

    renderPage();
    await user.type(screen.getByLabelText("Code d'invitation"), 'abc123def456');
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    expect(await screen.findByText(/invalide ou expiré/i)).toBeDefined();
  });

  it('affiche « Code détecté » pour un code hexadécimal de 12 caractères', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByText('Code détecté')).toBeNull();
    await user.type(screen.getByLabelText("Code d'invitation"), 'abc123def456');
    expect(await screen.findByText('Code détecté')).toBeDefined();
  });

  it('détecte le code dans un SMS complet collé', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("Code d'invitation"),
      'Bienvenue sur Kumy ! Activez votre compte: https://app.kumy.gn/activate?token=abc123def456',
    );
    expect(await screen.findByText('Code détecté')).toBeDefined();
  });

  it('renvoie vers /welcome via « Je n’ai pas de code »', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /je n'ai pas de code/i }));
    expect(navigateMock).toHaveBeenCalledWith('/welcome');
  });

  it('remplit le champ depuis le presse-papiers via « Coller le SMS »', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText: vi.fn().mockResolvedValue('token=abc123def456') },
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: /coller le sms/i }));

    await waitFor(() =>
      expect(screen.getByLabelText<HTMLInputElement>("Code d'invitation").value).toBe('token=abc123def456'),
    );
  });
});
