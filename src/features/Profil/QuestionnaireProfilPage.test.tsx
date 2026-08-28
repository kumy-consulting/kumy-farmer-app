import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { profilApi } from './profil.api';
import { QuestionnaireProfilPage } from './QuestionnaireProfilPage';

vi.mock('./profil.api', () => ({
  profilApi: { lireProfil: vi.fn(), envoyerEtape: vi.fn() },
}));

const mocked = vi.mocked(profilApi);

const profil = (step: number) => ({
  displayName: 'Mamadou Aliou Barry',
  address: { regionId: 'reg-1', prefectureId: 'pref-1', sousPrefectureId: 'sp-1' },
  profileSurvey: { step, completedAt: null },
  questionnaire: { dateOfBirth: '1986-04-12', gender: 'male', educationLevel: 'secondary' },
});

const rendre = () =>
  render(
    <MemoryRouter>
      <QuestionnaireProfilPage />
    </MemoryRouter>,
  );

describe('QuestionnaireProfilPage', () => {
  beforeEach(() => {
    mocked.lireProfil.mockResolvedValue(profil(0));
    mocked.envoyerEtape.mockResolvedValue({ step: 1, completedAt: null });
  });

  afterEach(() => vi.clearAllMocks());

  it('bloque le passage à l’étape 2 tant qu’un champ obligatoire manque', async () => {
    mocked.lireProfil.mockResolvedValue({
      ...profil(0),
      questionnaire: {}, // ni genre ni éducation
    });
    rendre();
    await screen.findByText('Informations personnelles');

    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    expect(screen.getByText('Informations personnelles')).toBeDefined();
    expect(mocked.envoyerEtape).not.toHaveBeenCalled();
  });

  it('envoie l’étape avant de passer à la suivante', async () => {
    rendre();
    await screen.findByText('Informations personnelles');

    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(expect.objectContaining({ step: 1 }));
    expect(await screen.findByText('Expériences et parcours')).toBeDefined();
  });

  it('reste sur l’étape quand l’envoi échoue, et le dit', async () => {
    mocked.envoyerEtape.mockRejectedValue(new Error('réseau'));
    rendre();
    await screen.findByText('Informations personnelles');

    await userEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    expect(await screen.findByText(/Envoi impossible/)).toBeDefined();
    expect(screen.getByText('Informations personnelles')).toBeDefined();
  });

  it('reprend à l’étape 3 quand deux étapes sont déjà validées', async () => {
    mocked.lireProfil.mockResolvedValue(profil(2));
    rendre();

    expect(await screen.findByText('Zone d’exploitation')).toBeDefined();
  });

  it('ferme par « Enregistrer » à la troisième étape', async () => {
    mocked.lireProfil.mockResolvedValue(profil(2));
    mocked.envoyerEtape.mockResolvedValue({ step: 3, completedAt: '2026-08-28T09:12:00.000Z' });
    rendre();
    await screen.findByText('Zone d’exploitation');

    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeDefined();
  });
});
