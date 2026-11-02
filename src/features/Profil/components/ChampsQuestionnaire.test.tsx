import { useState, type FunctionComponent } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChampNombre, ChampTexte, ChoixMultiple } from './ChampsQuestionnaire';

/**
 * Bornes du serveur (tâche C1) reflétées à la saisie : `UpdateOwnProfileDto`
 * rejette en 400 tout ce que ces tests vérifient bloqué avant l'envoi.
 */

describe('ChampTexte — maxLength', () => {
  it('pose le maxLength sur le champ natif quand il est fourni', () => {
    render(<ChampTexte label="Nom de la coopérative" value="" onChange={vi.fn()} maxLength={120} />);
    expect(screen.getByLabelText('Nom de la coopérative')).toHaveAttribute('maxLength', '120');
  });

  it('ne pose rien quand aucune borne n’est fournie', () => {
    render(<ChampTexte label="Nom complet" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Nom complet')).not.toHaveAttribute('maxLength');
  });
});

/** Rend `ChampNombre` réellement contrôlé, comme il l'est dans les étapes réelles. */
const HarnessNombre: FunctionComponent<{ label: string; entier?: boolean }> = ({ label, entier }) => {
  const [valeur, setValeur] = useState<number | undefined>(undefined);
  return <ChampNombre label={label} value={valeur} onChange={setValeur} entier={entier} />;
};

describe('ChampNombre — entiers', () => {
  it('refuse la frappe d’une décimale quand `entier` est posé', async () => {
    render(<HarnessNombre label="Nombre d’enfants" entier />);

    await userEvent.type(screen.getByLabelText('Nombre d’enfants'), '3.5');

    // Le point n'a jamais atteint le champ : les chiffres s'accumulent sans lui.
    expect(screen.getByLabelText('Nombre d’enfants')).toHaveValue(35);
  });

  it('accepte les décimales quand `entier` n’est pas posé (ex. hectares)', async () => {
    render(<HarnessNombre label="Superficie cultivée" />);

    await userEvent.type(screen.getByLabelText('Superficie cultivée'), '2.5');

    expect(screen.getByLabelText('Superficie cultivée')).toHaveValue(2.5);
  });
});

describe('ChoixMultiple — plafond et longueur (tâche C1)', () => {
  it('refuse une seizième culture — reflète `@ArrayMaxSize(15)`', async () => {
    const quinzeCultures = Array.from({ length: 15 }, (_, i) => `culture-${i}`);
    const onChange = vi.fn();
    render(<ChoixMultiple label="Cultures principales" value={quinzeCultures} onChange={onChange} maxItems={15} />);

    await userEvent.type(screen.getByLabelText('Ajouter à Cultures principales'), 'Sésame{Enter}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('laisse retirer une entrée même au plafond', async () => {
    const quinzeCultures = Array.from({ length: 15 }, (_, i) => `culture-${i}`);
    const onChange = vi.fn();
    render(<ChoixMultiple label="Cultures principales" value={quinzeCultures} onChange={onChange} maxItems={15} />);

    await userEvent.click(screen.getByRole('button', { name: 'culture-0' }));

    expect(onChange).toHaveBeenCalledWith(quinzeCultures.slice(1));
  });

  it('pose le maxLength du champ d’ajout — reflète `@MaxLength(40)` par entrée', () => {
    render(<ChoixMultiple label="Cultures principales" value={[]} onChange={vi.fn()} maxLongueurItem={40} />);
    expect(screen.getByLabelText('Ajouter à Cultures principales')).toHaveAttribute('maxLength', '40');
  });
});
