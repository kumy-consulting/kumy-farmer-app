import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CarteBonnesPratiques } from './CarteBonnesPratiques';

describe('CarteBonnesPratiques', () => {
  it('s’ouvre depuis toute la carte, pas seulement la flèche', async () => {
    // Viser une pastille de 34 px au pouce, sur un téléphone tenu d'une main
    // dans un champ, ne va pas de soi : c'est la carte entière qui est le bouton.
    const onOuvrir = vi.fn();
    render(<CarteBonnesPratiques onOuvrir={onOuvrir} />);

    await userEvent.click(screen.getByText('Découvrir les bonnes pratiques'));

    expect(onOuvrir).toHaveBeenCalledTimes(1);
  });
});
