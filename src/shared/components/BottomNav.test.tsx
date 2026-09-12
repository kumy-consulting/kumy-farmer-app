import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { BottomNav } from './BottomNav';

const LocationProbe = () => {
  const { pathname } = useLocation();
  return <div data-testid="pathname">{pathname}</div>;
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
      <LocationProbe />
    </MemoryRouter>,
  );

describe('BottomNav', () => {
  it('rend les trois onglets', () => {
    renderAt('/');
    expect(screen.getByRole('button', { name: 'Accueil' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Domaines' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Mon espace' })).toBeDefined();
  });

  it('marque Accueil comme actif sur /', () => {
    renderAt('/');
    expect(screen.getByRole('button', { name: 'Accueil' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Domaines' }).getAttribute('aria-current')).toBeNull();
  });

  it('marque Domaines comme actif sur /domaines', () => {
    renderAt('/domaines');
    expect(screen.getByRole('button', { name: 'Domaines' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Accueil' }).getAttribute('aria-current')).toBeNull();
  });

  it('navigue vers l’onglet cliqué', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('button', { name: 'Mon espace' }));
    expect(screen.getByTestId('pathname').textContent).toBe('/mon-espace');
    expect(screen.getByRole('button', { name: 'Mon espace' }).getAttribute('aria-current')).toBe('page');
  });
});
