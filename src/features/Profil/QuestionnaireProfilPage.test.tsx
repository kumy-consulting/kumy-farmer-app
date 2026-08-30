import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import 'dayjs/locale/fr';
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

// `ChampDate` monte un `MobileDatePicker`, qui exige un `LocalizationProvider` :
// en production il vient d'`App.tsx` à la racine, absent des tests unitaires.
// Même câblage que `RegisterProfilePage.test.tsx`.
const rendre = () =>
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <MemoryRouter>
        <QuestionnaireProfilPage />
      </MemoryRouter>
    </LocalizationProvider>,
  );

/**
 * Avance d'un écran. Une étape serveur tient désormais en plusieurs panneaux
 * (voir `PANNEAUX`) : « Suivant » ne déclenche l'envoi qu'au dernier d'entre
 * eux, d'où ces enchaînements explicites plutôt qu'un clic unique par étape.
 */
const suivant = async () => userEvent.click(screen.getByRole('button', { name: /Suivant/ }));

describe('QuestionnaireProfilPage', () => {
  beforeEach(() => {
    mocked.lireProfil.mockResolvedValue(profil(0));
    mocked.envoyerEtape.mockResolvedValue({ step: 1, completedAt: null });
  });

  afterEach(() => vi.clearAllMocks());

  it('bloque le passage au panneau suivant tant qu’un champ obligatoire manque', async () => {
    mocked.lireProfil.mockResolvedValue({
      ...profil(0),
      questionnaire: {}, // ni genre ni éducation
    });
    rendre();
    await screen.findByText('Informations personnelles');

    await suivant();

    expect(screen.getByText('Informations personnelles')).toBeDefined();
    expect(mocked.envoyerEtape).not.toHaveBeenCalled();
  });

  it('n’envoie rien tant qu’on n’a pas atteint le dernier panneau de l’étape', async () => {
    rendre();
    await screen.findByText('Informations personnelles');

    await suivant();

    // Deuxième panneau de l'étape 1 : on a changé d'écran, pas d'étape.
    expect(await screen.findByText('Votre situation')).toBeDefined();
    expect(mocked.envoyerEtape).not.toHaveBeenCalled();
  });

  it('envoie l’étape au dernier de ses panneaux, avant de passer à la suivante', async () => {
    rendre();
    await screen.findByText('Informations personnelles');

    await suivant(); // → Situation familiale (dernier panneau de l'étape 1)
    await screen.findByText('Votre situation');
    await suivant();

    expect(mocked.envoyerEtape).toHaveBeenCalledWith(expect.objectContaining({ step: 1 }));
    expect(await screen.findByText('Expériences et parcours')).toBeDefined();
  });

  it('reste sur le panneau quand l’envoi échoue, et le dit', async () => {
    mocked.envoyerEtape.mockRejectedValue(new Error('réseau'));
    rendre();
    await screen.findByText('Informations personnelles');

    await suivant();
    await screen.findByText('Votre situation');
    await suivant();

    expect(await screen.findByText(/Envoi impossible/)).toBeDefined();
    expect(screen.getByText('Votre situation')).toBeDefined();
  });

  it('reprend à l’étape 3 quand deux étapes sont déjà validées', async () => {
    mocked.lireProfil.mockResolvedValue(profil(2));
    rendre();

    expect(await screen.findByText('Zone d’exploitation')).toBeDefined();
  });

  it('efface le message d’échec quand on revient à l’étape précédente', async () => {
    // L’étape 2 a elle aussi ses champs obligatoires (tâche 7) : sans eux, le
    // clic sur « Suivant » resterait bloqué par la validation locale, avant
    // même d’atteindre l’appel réseau que ce test veut faire échouer.
    mocked.lireProfil.mockResolvedValue({
      ...profil(0),
      questionnaire: {
        ...profil(0).questionnaire,
        farmingExperience: 5,
        cooperative: { isMember: true },
        hasCreditRuralAccount: true,
      },
    });
    mocked.envoyerEtape
      .mockResolvedValueOnce({ step: 1, completedAt: null })
      .mockRejectedValueOnce(new Error('réseau'));
    rendre();
    await screen.findByText('Informations personnelles');

    await suivant();
    await screen.findByText('Votre situation');
    await suivant();
    await screen.findByText('Expériences et parcours');

    await suivant();
    await screen.findByText('Coopérative');
    await suivant();
    await screen.findByText('Accès au financement');
    await suivant();
    await screen.findByText(/Envoi impossible/);

    await userEvent.click(screen.getByRole('button', { name: /Précédent/ }));

    expect(await screen.findByText('Coopérative')).toBeDefined();
    expect(screen.queryByText(/Envoi impossible/)).toBeNull();
  });

  it('ne propose « Enregistrer » qu’au tout dernier panneau', async () => {
    mocked.lireProfil.mockResolvedValue({
      ...profil(2),
      questionnaire: { ...profil(2).questionnaire, cultivatedHectares: 2.5, declaredLandTenure: 'owned' },
    });
    rendre();
    await screen.findByText('Zone d’exploitation');

    // Deux panneaux restent après celui-ci : le bouton dit encore « Suivant ».
    expect(screen.queryByRole('button', { name: /Enregistrer/ })).toBeNull();

    await suivant();
    await screen.findByText('Votre exploitation');
    await suivant();
    await screen.findByText('Vos cultures');

    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeDefined();
  });

  it('affiche la date rendue par l’API (yyyy-mm-dd) en JJ/MM/AAAA', async () => {
    // `GET /farmers/me` rend `dateOfBirth` tronqué à dix caractères. L'écran ne
    // le montre plus tel quel : `ChampDate` le lit en ISO et l'affiche dans la
    // forme qu'on écrit à la main en français.
    rendre();
    await screen.findByText('Informations personnelles');

    // MUI X rend la date en trois sections éditables plutôt qu'en un seul
    // nœud de texte : on interroge donc chacune.
    expect(screen.getByRole('spinbutton', { name: /day|jour/i })).toHaveTextContent('12');
    expect(screen.getByRole('spinbutton', { name: /month|mois/i })).toHaveTextContent('04');
    expect(screen.getByRole('spinbutton', { name: /year|ann/i })).toHaveTextContent('1986');
  });

  it('affiche un écran de confirmation sobre à la fin, puis revient à l’accueil', async () => {
    mocked.lireProfil.mockResolvedValue({
      ...profil(2),
      questionnaire: {
        ...profil(2).questionnaire,
        cultivatedHectares: 2.5,
        primaryCrops: ['Riz'],
        declaredLandTenure: 'owned',
      },
    });
    mocked.envoyerEtape.mockResolvedValue({ step: 3, completedAt: '2026-08-28T09:12:00.000Z' });
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <MemoryRouter initialEntries={['/mon-profil/completer']}>
          <Routes>
            <Route path="/mon-profil/completer" element={<QuestionnaireProfilPage />} />
            <Route path="/" element={<div>tableau de bord</div>} />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );
    await screen.findByText('Zone d’exploitation');

    await suivant();
    await screen.findByText('Votre exploitation');
    await suivant();
    await screen.findByText('Vos cultures');

    await userEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    // Sobre : ni rail, ni formulaire — une accusé de réception et un retour.
    // (Le message évite `/enregistr/i` seul : « Enregistrer », le bouton
    // qu'on vient de cliquer, matcherait ce motif aussi.)
    expect(await screen.findByText('Merci, votre profil est enregistré')).toBeDefined();
    expect(screen.queryByText('tableau de bord')).toBeNull();
    expect(screen.queryByText('Vos cultures')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Retour à l’accueil/i }));
    expect(await screen.findByText('tableau de bord')).toBeDefined();
  });
});
