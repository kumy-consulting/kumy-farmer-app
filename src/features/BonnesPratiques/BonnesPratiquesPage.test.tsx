import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { SUJETS, TELEPHONE_CONSEILLER } from './bonnesPratiques.content';
import { BonnesPratiquesPage } from './BonnesPratiquesPage';

const rendre = () =>
  render(
    <MemoryRouter initialEntries={['/bonnes-pratiques']}>
      <Routes>
        <Route path="/bonnes-pratiques" element={<BonnesPratiquesPage />} />
        <Route path="/" element={<p>Votre exploitation reste à ouvrir</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('BonnesPratiquesPage', () => {
  it('affiche les six sujets', () => {
    rendre();

    for (const sujet of SUJETS) {
      expect(screen.getByText(sujet.titre)).toBeDefined();
    }
  });

  it('ramène à l’accueil, même sans historique de navigation', async () => {
    rendre();

    await userEvent.click(screen.getByRole('button', { name: /accueil/i }));

    expect(screen.getByText('Votre exploitation reste à ouvrir')).toBeDefined();
  });

  it('appelle le même numéro que l’écran d’attente', () => {
    // Deux numéros pour un même besoin, ce serait deux choses à retenir pour
    // l'agriculteur — et une de trop à tenir à jour pour nous.
    rendre();

    const lien = screen.getByRole('link', { name: /conseiller/i });
    expect(lien.getAttribute('href')).toBe(`tel:${TELEPHONE_CONSEILLER}`);
  });
});
