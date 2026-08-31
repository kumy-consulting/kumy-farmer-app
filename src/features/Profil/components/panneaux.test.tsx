import { useState, type FunctionComponent } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'dayjs/locale/fr';
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

const reponses = { nomComplet: 'Mamadou Aliou Barry', dateNaissance: '1986-04-12' } as never;

/** Bornes d'âge de `ChampDate`, alignées sur celles de l'inscription. */
const AGE_MIN = 15;
const AGE_MAX = 100;

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
  // `ChampDate` monte un `MobileDatePicker` — cf. `RegisterProfilePage.test.tsx`.
  const rendreIdentite = (erreurs: Record<string, string>) =>
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <PanneauIdentite reponses={reponses} setReponses={vi.fn()} erreurs={erreurs} />
      </LocalizationProvider>,
    );

  it('affiche l’erreur d’un champ obligatoire vide', () => {
    rendreIdentite({ genre: 'Choisissez une réponse.' });
    expect(screen.getByText('Choisissez une réponse.')).toBeDefined();
  });

  it('ouvre le calendrier quand on touche la capsule', async () => {
    // Le seul geste dont dispose l'agriculteur. Le bouton d'ouverture que MUI
    // pose en fin de champ est masqué par l'habillage (aucune des capsules du
    // questionnaire ne porte d'icône) : si la capsule elle-même n'ouvre pas le
    // sélecteur, la date de naissance devient impossible à saisir.
    //
    // Ce test passe par le champ, jamais par le bouton : en jsdom le bouton
    // masqué reste trouvable par son rôle, si bien qu'un test qui le cliquerait
    // passerait alors même que le calendrier est inatteignable dans un vrai
    // navigateur.
    rendreIdentite({});
    await userEvent.click(screen.getByRole('spinbutton', { name: /day|jour/i }));

    expect(await screen.findByRole('dialog')).toBeDefined();
  });

  it('borne la naissance à un âge plausible plutôt que de tout accepter', async () => {
    // Le champ natif `type="date"` acceptait 1850 comme l'an prochain. Les
    // bornes sont celles de l'inscription : entre 15 et 100 ans.
    rendreIdentite({});
    await userEvent.click(screen.getByRole('spinbutton', { name: /day|jour/i }));

    // Le sélecteur s'ouvre sur les années — c'est ce qu'on cherche en premier
    // pour une naissance, et ce que les deux autres écrans de l'app n'offrent
    // pas encore.
    const annee = new Date().getFullYear();
    const annees = await screen.findAllByRole('radio');
    const libelles = annees.map((a) => a.textContent);
    expect(libelles).toContain(String(annee - AGE_MIN));
    expect(libelles).toContain(String(annee - AGE_MAX));
    expect(libelles).not.toContain(String(annee - AGE_MIN + 1));
    expect(libelles).not.toContain(String(annee - AGE_MAX - 1));
  });
});

describe('PanneauFamille', () => {
  it('demande le niveau d’éducation — 30 % du pilier social', () => {
    render(<PanneauFamille reponses={reponses} setReponses={vi.fn()} erreurs={{}} />);
    expect(screen.getByText(/Niveau d’éducation/)).toBeDefined();
  });

  it('montre les quatre situations sans rien ouvrir', () => {
    // Quatre libellés courts et exclusifs : les cacher dans une liste
    // déroulante coûtait deux gestes (ouvrir, choisir) et empêchait de lire ses
    // options. Le select reste justifié pour l'éducation, six entrées dont
    // « Formation professionnelle » — il est d'ailleurs toujours là, au-dessus.
    render(<PanneauFamille reponses={reponses} setReponses={vi.fn()} erreurs={{}} />);

    const groupe = screen.getByRole('radiogroup', { name: 'Situation matrimoniale' });
    expect(within(groupe).getAllByRole('radio')).toHaveLength(4);
    for (const libelle of ['Célibataire', 'Marié(e)', 'Veuf(ve)', 'Divorcé(e)']) {
      expect(within(groupe).getByRole('radio', { name: libelle })).toBeDefined();
    }
  });

  it('marque d’une astérisque ce qui bloque, pas le reste', () => {
    render(<PanneauFamille reponses={reponses} setReponses={vi.fn()} erreurs={{}} />);
    expect(screen.getByText('Situation matrimoniale')).toBeDefined();
    expect(screen.queryByText('Situation matrimoniale *')).toBeNull();
  });
});

describe('PanneauCooperative', () => {
  /** `ChampAnnee` monte un `MobileDatePicker` — cf. `RegisterProfilePage.test.tsx`. */
  const rendreCoop = (reponsesCoop: object) =>
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <PanneauCooperative reponses={reponsesCoop as never} setReponses={vi.fn()} erreurs={{}} />
      </LocalizationProvider>,
    );

  it('fait choisir l’année d’adhésion dans une grille, sans descendre avant la naissance', async () => {
    // On n'adhère pas à une coopérative avant d'être né : la borne basse vient
    // de la date de naissance déjà demandée à l'étape 1.
    rendreCoop({ estMembreCooperative: true, dateNaissance: '1986-04-12', anneeAdhesion: 2010 });
    await userEvent.click(screen.getByRole('button', { name: /choose date|choisir/i }));

    const annees = (await screen.findAllByRole('radio')).map((a) => a.textContent);
    const annee = new Date().getFullYear();
    expect(annees).toContain('1986');
    expect(annees).toContain(String(annee));
    expect(annees).not.toContain('1985');
    expect(annees).not.toContain(String(annee + 1));
    // Une seule vue : ni mois ni jour ne sont demandés pour cette réponse.
    expect(screen.queryByRole('radio', { name: /janvier/i })).toBeNull();
  });

  it('ne demande le nom de la coopérative qu’aux membres', () => {
    // Enveloppé : la branche « membre » monte `ChampAnnee`, donc un
    // `MobileDatePicker`, qui exige un `LocalizationProvider`.
    const enveloppe = (estMembre: boolean) => (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <PanneauCooperative
          reponses={{ estMembreCooperative: estMembre } as never}
          setReponses={vi.fn()}
          erreurs={{}}
        />
      </LocalizationProvider>
    );

    const { rerender } = render(enveloppe(false));
    expect(screen.queryByText(/Nom de la coopérative/)).toBeNull();

    rerender(enveloppe(true));
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
