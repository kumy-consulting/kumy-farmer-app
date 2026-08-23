import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CarnetTabContent } from './CarnetTabContent';
import type { CarnetVisite } from '../../carnet.types';


const visite = (over: Partial<CarnetVisite> = {}): CarnetVisite => ({
  id: 'v1',
  date: '2026-08-24T09:00:00.000Z',
  auteur: 'Thierno Barry',
  observations: [],
  consignes: [],
  ...over,
});

const photos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ url: `https://ex.test/${i}.jpg`, legende: `Photo ${i + 1}` }));

describe('CarnetTabContent — photos', () => {
  it('rend chaque photo comme une vignette qu’on peut ouvrir', () => {
    render(
      <CarnetTabContent
        visites={[visite({ observations: [{ id: 'o1', texte: 'Foyer en bordure', photos: photos(2) }] })]}
      />,
    );

    const vignettes = screen.getAllByRole('button', { name: /agrandir/i });
    expect(vignettes).toHaveLength(2);
  });

  it('ouvre la photo touchée en grand, et dit où l’on est dans la série', () => {
    render(
      <CarnetTabContent
        visites={[visite({ observations: [{ id: 'o1', texte: 'Foyer', photos: photos(3) }] })]}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /agrandir/i })[1]);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('2 / 3')).toBeDefined();
  });

  it('passe à la photo suivante puis revient', () => {
    render(
      <CarnetTabContent
        visites={[visite({ observations: [{ id: 'o1', texte: 'Foyer', photos: photos(3) }] })]}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /agrandir/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /photo suivante/i }));
    expect(screen.getByText('2 / 3')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /photo précédente/i }));
    expect(screen.getByText('1 / 3')).toBeDefined();
  });

  it('ne propose pas de navigation pour une photo seule', () => {
    render(
      <CarnetTabContent visites={[visite({ observations: [{ id: 'o1', photos: photos(1) }] })]} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /agrandir/i }));

    expect(screen.queryByRole('button', { name: /photo suivante/i })).toBeNull();
    expect(screen.queryByText('1 / 1')).toBeNull();
  });

  it('ferme le visionneur avec la touche Échap', () => {
    render(
      <CarnetTabContent visites={[visite({ observations: [{ id: 'o1', photos: photos(2) }] })]} />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /agrandir/i })[0]);
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('n’ouvre que les photos de l’observation touchée', () => {
    render(
      <CarnetTabContent
        visites={[
          visite({
            observations: [
              { id: 'o1', photos: photos(2) },
              { id: 'o2', photos: [{ url: 'https://ex.test/autre.jpg' }] },
            ],
          }),
        ]}
      />,
    );

    // La 3e vignette de la page appartient à la 2e observation.
    fireEvent.click(screen.getAllByRole('button', { name: /agrandir/i })[2]);

    expect(screen.queryByText(/\/ 2$/)).toBeNull();
  });
});

describe('CarnetTabContent — sourcil', () => {
  it('annonce la pression d’adventices constatée', () => {
    render(
      <CarnetTabContent
        visites={[visite({ observations: [{ id: 'o1', texte: 'Vu', photos: [], pression: 'high' }] })]}
      />,
    );

    expect(screen.getByText('Adventices : forte')).toBeDefined();
  });

  it('annonce la tâche quand l’observation y était accrochée', () => {
    render(
      <CarnetTabContent
        visites={[visite({ observations: [{ id: 'o1', aPropos: 'Contrôle du paillage', texte: 'Vu', photos: [] }] })]}
      />,
    );

    expect(screen.getByText('Contrôle du paillage')).toBeDefined();
  });
});
