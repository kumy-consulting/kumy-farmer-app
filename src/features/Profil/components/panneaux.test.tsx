import { useState, type FunctionComponent } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { registerApi } from '@/features/Register/register.api';

import type { ReponsesQuestionnaire } from '../profil.types';
import {
  PanneauCooperative,
  PanneauExperience,
  PanneauFamille,
  PanneauIdentite,
  PanneauZone,
} from './panneaux';
import { PANNEAUX, estDernierDeSonEtape, progressionDansEtape } from './parcoursPanneaux';

const reponses = { nomComplet: 'Mamadou Aliou Barry' } as never;

/**
 * Le découpage lui-même. Un panneau qui changerait d'étape enverrait ses
 * réponses dans le corps d'une autre étape — d'où ces deux invariants tenus
 * par un test plutôt que par un commentaire.
 */
describe('Le découpage en panneaux', () => {
  it('n’envoie qu’au dernier panneau de chaque étape', () => {
    const envois = PANNEAUX.map((_, i) => estDernierDeSonEtape(i));
    expect(envois.filter(Boolean)).toHaveLength(3);
    expect(envois.at(-1)).toBe(true);
  });

  it('couvre chaque champ obligatoire d’une étape exactement une fois', () => {
    const parEtape = { 1: [] as string[], 2: [] as string[], 3: [] as string[] };
    for (const p of PANNEAUX) parEtape[p.etape].push(...p.obligatoires);

    expect(parEtape[1].sort()).toEqual(['dateNaissance', 'genre', 'niveauEducation', 'nomComplet']);
    expect(parEtape[2].sort()).toEqual(['compteCreditRural', 'estMembreCooperative', 'farmingExperience']);
    expect(parEtape[3].sort()).toEqual([
      'foncier',
      'hectares',
      'prefectureId',
      'primaryCrops',
      'regionId',
      'sousPrefectureId',
    ]);
    // Aucun champ demandé deux fois : l'agriculteur ne doit pas retomber sur la
    // même question à l'écran suivant.
    const tous = PANNEAUX.flatMap((p) => p.obligatoires);
    expect(new Set(tous).size).toBe(tous.length);
  });

  it('remplit le rail au prorata des panneaux de l’étape', () => {
    // Étape 1 : deux panneaux, donc la barre passe par la moitié avant d'être pleine.
    expect(progressionDansEtape(0)).toBeCloseTo(0.5);
    expect(progressionDansEtape(1)).toBeCloseTo(1);
    // Dernier panneau : le rail est plein.
    expect(progressionDansEtape(PANNEAUX.length - 1)).toBeCloseTo(1);
  });
});

describe('PanneauIdentite', () => {
  it('affiche l’erreur d’un champ obligatoire vide', () => {
    render(<PanneauIdentite reponses={reponses} setReponses={vi.fn()} erreurs={{ genre: 'Choisissez une réponse.' }} />);
    expect(screen.getByText('Choisissez une réponse.')).toBeDefined();
  });
});

describe('PanneauFamille', () => {
  it('demande le niveau d’éducation — 30 % du pilier social', () => {
    render(<PanneauFamille reponses={reponses} setReponses={vi.fn()} erreurs={{}} />);
    expect(screen.getByText(/Niveau d’éducation/)).toBeDefined();
  });

  it('marque d’une astérisque ce qui bloque, pas le reste', () => {
    render(<PanneauFamille reponses={reponses} setReponses={vi.fn()} erreurs={{}} />);
    expect(screen.getByText('Situation matrimoniale')).toBeDefined();
    expect(screen.queryByText('Situation matrimoniale *')).toBeNull();
  });
});

describe('PanneauCooperative', () => {
  it('ne demande le nom de la coopérative qu’aux membres', () => {
    const setReponses = vi.fn();
    const { rerender } = render(
      <PanneauCooperative reponses={{ estMembreCooperative: false } as never} setReponses={setReponses} erreurs={{}} />,
    );
    expect(screen.queryByText(/Nom de la coopérative/)).toBeNull();

    rerender(
      <PanneauCooperative reponses={{ estMembreCooperative: true } as never} setReponses={setReponses} erreurs={{}} />,
    );
    expect(screen.getByText(/Nom de la coopérative/)).toBeDefined();
  });
});

describe('PanneauExperience', () => {
  it('propose les cinq tranches d’expérience', async () => {
    render(<PanneauExperience reponses={{} as never} setReponses={vi.fn()} erreurs={{}} />);
    await userEvent.click(screen.getByLabelText(/Depuis combien de temps/));
    expect(screen.getByText('15 ans et plus')).toBeDefined();
  });
});

/**
 * `PanneauZone` reprend le patron « tickets » de `RegisterAddressPage`
 * pour la cascade région → préfecture → sous-préfecture : ces deux tests
 * couvrent la remise à zéro et — surtout — le rejet d'une réponse devenue
 * obsolète, la classe de bug que le patron existe pour empêcher.
 */
describe('PanneauZone', () => {
  /** Composant contrôlé minimal : `PanneauZone` ne porte aucun état d'adresse lui-même. */
  const Harness: FunctionComponent = () => {
    const [reponses, setReponsesState] = useState<ReponsesQuestionnaire>({});
    const setReponses = (partiel: Partial<ReponsesQuestionnaire>) =>
      setReponsesState((precedent) => ({ ...precedent, ...partiel }));
    return <PanneauZone reponses={reponses} setReponses={setReponses} erreurs={{}} />;
  };

  /** Choisit une option dans un `ProfileSelect` (Select MUI, liste en portail). */
  const choisir = async (user: ReturnType<typeof userEvent.setup>, libelle: string, option: string) => {
    await user.click(screen.getByLabelText(libelle));
    await user.click(await screen.findByRole('option', { name: option }));
  };

  beforeEach(() => {
    vi.spyOn(onboardingApi, 'getRegions').mockResolvedValue([
      { id: 'r1', name: 'Kindia' },
      { id: 'r2', name: 'Boké' },
    ]);
    vi.spyOn(registerApi, 'getSousPrefectures').mockResolvedValue([{ id: 'sp1', name: 'Manéah' }]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('remet préfecture et sous-préfecture à zéro quand la région change', async () => {
    vi.spyOn(onboardingApi, 'getPrefectures').mockImplementation(async (regionId) =>
      regionId === 'r1' ? [{ id: 'p1', name: 'Coyah' }] : [{ id: 'p3', name: 'Boffa' }],
    );

    const user = userEvent.setup();
    render(<Harness />);
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    await choisir(user, 'Région', 'Kindia');
    await choisir(user, 'Préfecture', 'Coyah');
    await choisir(user, 'Sous-préfecture', 'Manéah');
    expect(screen.getByLabelText('Sous-préfecture')).toHaveTextContent('Manéah');

    await choisir(user, 'Région', 'Boké');

    await waitFor(() => {
      expect(screen.getByLabelText('Préfecture')).toHaveTextContent('Sélectionnez votre préfecture');
    });
    expect(screen.getByLabelText('Sous-préfecture')).toHaveTextContent('Sélectionnez votre sous-préfecture');
  });

  it('ignore une réponse de préfectures devenue obsolète quand la région change deux fois de suite', async () => {
    let resoudreAncienne: (items: { id: string; name: string }[]) => void = () => {};
    const ancienne = new Promise<{ id: string; name: string }[]>((resolve) => {
      resoudreAncienne = resolve;
    });

    vi.spyOn(onboardingApi, 'getPrefectures').mockImplementation(async (regionId) =>
      regionId === 'r1' ? ancienne : [{ id: 'p3', name: 'Boffa' }],
    );

    const user = userEvent.setup();
    render(<Harness />);
    await waitFor(() => expect(onboardingApi.getRegions).toHaveBeenCalled());

    // Première région : la requête de ses préfectures reste en vol.
    await choisir(user, 'Région', 'Kindia');
    // Deuxième région choisie avant que la première réponse n'arrive : le
    // ticket avance, la réponse de « Kindia » devient obsolète.
    await choisir(user, 'Région', 'Boké');

    await user.click(screen.getByLabelText('Préfecture'));
    expect(await screen.findByRole('option', { name: 'Boffa' })).toBeDefined();
    await user.keyboard('{Escape}');

    // La réponse tardive de « Kindia » arrive enfin : sans ticket, elle
    // écraserait la liste de « Boké » qu'on vient d'installer.
    resoudreAncienne([{ id: 'p1', name: 'Coyah' }]);

    await user.click(screen.getByLabelText('Préfecture'));
    expect(await screen.findByRole('option', { name: 'Boffa' })).toBeDefined();
    expect(screen.queryByRole('option', { name: 'Coyah' })).toBeNull();
  });
});
