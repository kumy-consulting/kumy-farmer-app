import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/shared/stores/authStore';

import { HomePage } from './HomePage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('HomePage (tableau de bord)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'u1', displayName: 'Awa Diallo', phone: '+224620000000', role: 'farmer' },
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('salue l’agriculteur par son prénom après chargement', async () => {
    renderPage();
    expect(await screen.findByText(/Bonjour, Awa/)).toBeDefined();
  });

  it('affiche les alertes, activités et la vue d’ensemble', async () => {
    renderPage();
    await screen.findByText(/Bonjour, Awa/);

    // Sections
    expect(screen.getByText('Alertes')).toBeDefined();
    expect(screen.getByText('Activités planifiées')).toBeDefined();
    expect(screen.getByText('Vos domaines')).toBeDefined();

    // Contenu maquetté
    expect(screen.getByText(/Risque de sécheresse/)).toBeDefined();
    expect(screen.getByText('Irrigation goutte-à-goutte')).toBeDefined();

    // Tuiles vue d'ensemble (métriques actionnables)
    expect(screen.getByText('Domaines')).toBeDefined();
    expect(screen.getByText('Exploité')).toBeDefined();
    expect(screen.getByText('Cultures')).toBeDefined();
    expect(screen.getByText(/domaines équipés/)).toBeDefined();
  });
});
