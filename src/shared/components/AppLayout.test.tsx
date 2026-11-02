import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppLayout } from './AppLayout';

vi.mock('@/features/Home/useCompteNouveau', () => ({
  useCompteNouveau: () => ({ estNouveau: true, isLoading: false }),
}));

vi.mock('@/features/Home/BienvenuePage', () => ({
  BienvenuePage: () => <div>écran d’attente</div>,
}));

const rendre = (chemin: string) =>
  render(
    <MemoryRouter initialEntries={[chemin]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>tableau de bord</div>} />
          <Route path="/mon-espace/informations" element={<div>mes informations</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('AppLayout — la coquille d’un compte sans domaine', () => {
  it('remplace les onglets par l’écran d’attente', () => {
    rendre('/');

    expect(screen.getByText('écran d’attente')).toBeDefined();
    expect(screen.queryByText('tableau de bord')).toBeNull();
  });

  it('laisse quand même passer le profil', () => {
    // L'écran d'attente offre un accès au profil : la fiche se lit sans domaine
    // ni technicien, elle ne dépend que de `GET /farmers/me`. Sans cette porte,
    // le bouton menait à l'écran d'attente lui-même — un bouton qui ne fait rien.
    rendre('/mon-espace/informations');

    expect(screen.getByText('mes informations')).toBeDefined();
    expect(screen.queryByText('écran d’attente')).toBeNull();
  });

  it('n’affiche pas la barre d’onglets sur cette porte', () => {
    // Les autres onglets mèneraient à des écrans vides : c'est la raison d'être
    // du court-circuit, et l'exception ne doit pas la contredire.
    rendre('/mon-espace/informations');

    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
