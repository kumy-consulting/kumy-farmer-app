import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { WelcomeChoicePage } from './WelcomeChoicePage';

describe('WelcomeChoicePage', () => {
  it('affiche les 3 boutons du choix d’accueil', () => {
    render(
      <MemoryRouter>
        <WelcomeChoicePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Connexion' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Créer un compte' })).toBeDefined();
    expect(screen.getByRole('button', { name: /invitation/i })).toBeDefined();
  });
});
