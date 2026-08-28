import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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
