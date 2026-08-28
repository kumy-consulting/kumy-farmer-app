import { useState, type FunctionComponent } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onboardingApi } from '@/features/Onboarding/onboarding.api';
import { registerApi } from '@/features/Register/register.api';

import type { ReponsesQuestionnaire } from '../profil.types';
import { EtapeExploitation } from './EtapeExploitation';
import { EtapeParcours } from './EtapeParcours';
import { EtapeVous } from './EtapeVous';

const reponses = { nomComplet: 'Mamadou Aliou Barry' } as never;

describe('EtapeVous', () => {
  it('demande le niveau d’éducation — 30 % du pilier social', () => {
    render(<EtapeVous reponses={reponses} setReponses={vi.fn()} erreurs={{}} />);
    expect(screen.getByText(/Niveau d’éducation/)).toBeDefined();
  });

  it('marque d’une astérisque ce qui bloque, pas le reste', () => {
    render(<EtapeVous reponses={reponses} setReponses={vi.fn()} erreurs={{}} />);
    expect(screen.getByText('Situation matrimoniale')).toBeDefined();
    expect(screen.queryByText('Situation matrimoniale *')).toBeNull();
  });

  it('affiche l’erreur d’un champ obligatoire vide', () => {
    render(<EtapeVous reponses={reponses} setReponses={vi.fn()} erreurs={{ genre: 'Choisissez une réponse.' }} />);
    expect(screen.getByText('Choisissez une réponse.')).toBeDefined();
  });
});

describe('EtapeParcours', () => {
  it('ne demande le nom de la coopérative qu’aux membres', async () => {
    const setReponses = vi.fn();
    const { rerender } = render(
      <EtapeParcours reponses={{ estMembreCooperative: false } as never} setReponses={setReponses} erreurs={{}} />,
    );
    expect(screen.queryByText(/Nom de la coopérative/)).toBeNull();

    rerender(
      <EtapeParcours reponses={{ estMembreCooperative: true } as never} setReponses={setReponses} erreurs={{}} />,
    );
    expect(screen.getByText(/Nom de la coopérative/)).toBeDefined();
  });

  it('propose les cinq tranches d’expérience', async () => {
    render(<EtapeParcours reponses={{} as never} setReponses={vi.fn()} erreurs={{}} />);
    await userEvent.click(screen.getByLabelText(/Depuis combien de temps/));
    expect(screen.getByText('15 ans et plus')).toBeDefined();
  });
});

/**
 * `EtapeExploitation` reprend le patron « tickets » de `RegisterAddressPage`
 * pour la cascade région → préfecture → sous-préfecture : ces deux tests
 * couvrent la remise à zéro et — surtout — le rejet d'une réponse devenue
 * obsolète, la classe de bug que le patron existe pour empêcher.
 */
describe('EtapeExploitation', () => {
  /** Composant contrôlé minimal : `EtapeExploitation` ne porte aucun état d'adresse lui-même. */
  const Harness: FunctionComponent = () => {
    const [reponses, setReponsesState] = useState<ReponsesQuestionnaire>({});
    const setReponses = (partiel: Partial<ReponsesQuestionnaire>) =>
      setReponsesState((precedent) => ({ ...precedent, ...partiel }));
    return <EtapeExploitation reponses={reponses} setReponses={setReponses} erreurs={{}} />;
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
