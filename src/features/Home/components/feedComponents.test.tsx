import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FeedItem } from '../home.feed.types';
import { FeedCard } from './FeedCard';
import { HomeHeader } from './HomeHeader';
import { RecapBar } from './RecapBar';

const item = (over: Partial<FeedItem> = {}): FeedItem => ({
  id: 'task:ft1',
  kind: 'task',
  title: 'Sarclage manuel',
  place: 'Kaporo 2',
  icon: 'treatment',
  at: '2026-08-17T00:00:00',
  status: 'planned',
  overdue: true,
  daysOverdue: 2,
  actionable: true,
  author: 'Dr Camara',
  score: 298,
  ...over,
});

describe('FeedCard', () => {
  it('affiche une consigne en retard avec son auteur et ses deux actions', () => {
    render(<FeedCard item={item()} onSelect={vi.fn()} onAction={vi.fn()} isOnline />);

    expect(screen.getByText('Sarclage manuel')).toBeDefined();
    expect(screen.getByText('Kaporo 2')).toBeDefined();
    expect(screen.getByText(/Dr Camara/)).toBeDefined();
    expect(screen.getByText('En retard de 2 j')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Démarrer' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Terminé' })).toBeDefined();
  });

  it('déclenche la transition demandée', () => {
    const onAction = vi.fn();
    render(<FeedCard item={item()} onSelect={vi.fn()} onAction={onAction} isOnline />);

    fireEvent.click(screen.getByRole('button', { name: 'Terminé' }));

    expect(onAction).toHaveBeenCalledWith('task:ft1', 'complete');
  });

  it('désactive les actions hors ligne', () => {
    render(<FeedCard item={item()} onSelect={vi.fn()} onAction={vi.fn()} isOnline={false} />);

    expect(screen.getByRole('button', { name: 'Démarrer' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Reconnectez-vous pour valider')).toBeDefined();
  });

  it('n’offre plus « Démarrer » sur une consigne déjà en cours, ni d’action sur une consigne faite', () => {
    const { rerender } = render(
      <FeedCard item={item({ status: 'in_progress' })} onSelect={vi.fn()} onAction={vi.fn()} isOnline />,
    );
    expect(screen.queryByRole('button', { name: 'Démarrer' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Terminé' })).toBeDefined();

    rerender(<FeedCard item={item({ status: 'done', overdue: false })} onSelect={vi.fn()} onAction={vi.fn()} isOnline />);
    expect(screen.queryByRole('button', { name: 'Terminé' })).toBeNull();
    expect(screen.getByText('Fait')).toBeDefined();
  });

  it('affiche le conseil d’une alerte et sa mention météo', () => {
    render(
      <FeedCard
        item={item({
          id: 'alert:al1',
          kind: 'alert',
          title: 'Fortes pluies attendues',
          icon: 'rain',
          severity: 'critical',
          advice: 'Reporter l’apport d’urée',
          actionable: false,
          overdue: false,
          status: undefined,
          author: undefined,
        })}
        onSelect={vi.fn()}
        onAction={vi.fn()}
        isOnline
      />,
    );

    expect(screen.getByText('Fortes pluies attendues')).toBeDefined();
    expect(screen.getByText('Reporter l’apport d’urée')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Terminé' })).toBeNull();
  });

  it('résume une visite', () => {
    render(
      <FeedCard
        item={item({
          id: 'visit:v1',
          kind: 'visit',
          title: 'Visite de Dr Camara',
          icon: 'visit',
          advice: '3 consignes · 2 faites',
          actionable: false,
          overdue: false,
          status: undefined,
        })}
        onSelect={vi.fn()}
        onAction={vi.fn()}
        isOnline
      />,
    );

    expect(screen.getByText('Visite de Dr Camara')).toBeDefined();
    expect(screen.getByText('3 consignes · 2 faites')).toBeDefined();
  });
});

describe('HomeHeader', () => {
  it('salue l’agriculteur et résume la météo du kit en une ligne', () => {
    render(
      <HomeHeader
        firstName="Mamadou"
        weather={{
          farmId: 'f1',
          farmName: 'Domaine Kaporo',
          tempC: 29,
          online: true,
          observedAt: '2026-08-19T08:56:00.000Z',
          hasKit: true,
        }}
        onWeatherClick={vi.fn()}
      />,
    );

    expect(screen.getByText(/Bonjour, Mamadou/)).toBeDefined();
    expect(screen.getByText(/Domaine Kaporo/)).toBeDefined();
    expect(screen.getByText(/29°/)).toBeDefined();
    expect(screen.getByText(/en direct/)).toBeDefined();
  });

  it('annonce une météo régionale estimée quand le domaine n’a pas de kit', () => {
    render(
      <HomeHeader
        firstName="Mamadou"
        weather={{
          farmId: 'f1',
          farmName: 'Domaine Kaporo',
          tempC: null,
          online: false,
          observedAt: null,
          hasKit: false,
        }}
        onWeatherClick={vi.fn()}
      />,
    );

    expect(screen.getByText(/météo régionale estimée/)).toBeDefined();
  });

  it('reste affichable sans aucune donnée météo', () => {
    render(<HomeHeader firstName="Mamadou" weather={null} onWeatherClick={vi.fn()} />);
    expect(screen.getByText(/Bonjour, Mamadou/)).toBeDefined();
  });
});

describe('RecapBar', () => {
  it('résume l’exploitation en une ligne et signale la santé', () => {
    const onClick = vi.fn();
    render(<RecapBar recap={{ domains: 3, parcels: 7, areaHa: 12.5, health: 'attention' }} onClick={onClick} />);

    expect(screen.getByText('3 domaines · 7 parcelles · 12,5 ha')).toBeDefined();
    expect(screen.getByText('Santé : attention')).toBeDefined();

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
