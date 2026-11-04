import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CarteRattachement } from '@/features/Rattachement/CarteRattachement';
import * as hook from '@/features/Rattachement/useRattachement';

const afficherCode = vi.fn();

const etatHook = (surcharge: Partial<ReturnType<typeof hook.useRattachement>> = {}) => ({
  etat: { statut: 'en_attente' as const, codeExpireA: null },
  code: null,
  secondesRestantes: 0,
  isLoading: false,
  isRequesting: false,
  error: null,
  afficherCode,
  ...surcharge,
});

const simuler = (surcharge: Partial<ReturnType<typeof hook.useRattachement>> = {}) =>
  vi.spyOn(hook, 'useRattachement').mockReturnValue(etatHook(surcharge));

describe('CarteRattachement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    afficherCode.mockReset();
  });

  it.each(['aucune', 'refusee', 'confirmee'] as const)('ne rend rien pour « %s »', (statut) => {
    simuler({ etat: { statut, codeExpireA: null } });
    const { container } = render(<CarteRattachement />);
    expect(container.textContent).toBe('');
  });

  it('ne rend rien pendant le chargement', () => {
    simuler({ etat: null, isLoading: true });
    const { container } = render(<CarteRattachement />);
    expect(container.textContent).toBe('');
  });

  it('propose d’afficher le code quand la demande est en attente', () => {
    simuler();
    render(<CarteRattachement />);

    expect(screen.getByText('Votre encadreur doit confirmer votre identité')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Afficher mon code' }));
    expect(afficherCode).toHaveBeenCalledTimes(1);
  });

  it('montre le code en deux groupes et le temps restant', () => {
    simuler({ code: '123456', secondesRestantes: 599 });
    render(<CarteRattachement />);

    expect(screen.getByText('123 456')).toBeDefined();
    expect(screen.getByText('Valable encore 9:59')).toBeDefined();
    expect(screen.getByText(/Ne le donnez à personne d’autre/)).toBeDefined();
  });

  it('propose un nouveau code une fois le premier expiré', () => {
    const espion = simuler({ code: '123456', secondesRestantes: 5 });
    const { rerender } = render(<CarteRattachement />);
    espion.mockReturnValue(etatHook());
    rerender(<CarteRattachement />);

    expect(screen.getByRole('button', { name: 'Nouveau code' })).toBeDefined();
  });

  it('dit le blocage', () => {
    simuler({ etat: { statut: 'bloquee', codeExpireA: null } });
    render(<CarteRattachement />);

    expect(
      screen.getByText('Trop d’essais. Kumy va désigner un encadreur pour confirmer votre identité.'),
    ).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('affiche l’erreur de la demande', () => {
    simuler({ error: 'Impossible d’afficher le code pour le moment. Réessayez.' });
    render(<CarteRattachement />);
    expect(screen.getByText(/Impossible d’afficher/)).toBeDefined();
  });
});
