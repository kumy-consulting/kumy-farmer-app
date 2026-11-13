import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CarteParcours } from './CarteParcours';

describe('CarteParcours', () => {
  it('dit le rang de l’étape et le numéro qui sera appelé', () => {
    render(<CarteParcours telephone="+224621555555" />);

    expect(screen.getByText('Étape 2 sur 4')).toBeDefined();
    expect(screen.getByText('Un technicien va vous appeler')).toBeDefined();
    expect(screen.getByText('au +224 621 55 55 55')).toBeDefined();
  });

  it('déplie et replie les quatre étapes', async () => {
    render(<CarteParcours />);
    const bouton = screen.getByRole('button', { name: 'Voir les étapes' });
    expect(bouton.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(bouton);

    expect(screen.getByRole('button', { name: 'Masquer les étapes' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
});
