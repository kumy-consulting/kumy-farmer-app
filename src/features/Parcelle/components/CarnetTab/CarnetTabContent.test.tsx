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

  it('réunit dans une seule bande les photos de toutes les observations du jour', () => {
    render(
      <CarnetTabContent
        visites={[
          visite({
            observations: [
              { id: 'o1', texte: 'Foyer en bordure', photos: photos(2) },
              { id: 'o2', texte: 'Sol tassé', photos: [{ url: 'https://ex.test/autre.jpg' }] },
            ],
          }),
        ]}
      />,
    );

    // Trois photos venues de deux constats, une seule série.
    const vignettes = screen.getAllByRole('button', { name: /agrandir/i });
    expect(vignettes).toHaveLength(3);

    fireEvent.click(vignettes[2]);
    expect(screen.getByText('3 / 3')).toBeDefined();
  });

  it('la bande passe avant les notes du passage', () => {
    render(
      <CarnetTabContent
        visites={[visite({ observations: [{ id: 'o1', texte: 'Foyer en bordure', photos: photos(1) }] })]}
      />,
    );

    const bande = screen.getByRole('button', { name: /agrandir/i });
    const note = screen.getByText('Foyer en bordure');
    // Node.DOCUMENT_POSITION_FOLLOWING === 4
    expect(bande.compareDocumentPosition(note) & 4).toBeTruthy();
  });

  it('nomme, dans le visionneur, le constat dont la photo vient', () => {
    render(
      <CarnetTabContent
        visites={[
          visite({
            observations: [
              { id: 'o1', texte: 'Foyer en bordure', photos: photos(1) },
              { id: 'o2', texte: 'Sol tassé au nord', photos: [{ url: 'https://ex.test/autre.jpg' }] },
            ],
          }),
        ]}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /agrandir/i })[1]);

    const dialogue = screen.getByRole('dialog');
    expect(dialogue.textContent).toContain('Sol tassé au nord');
    expect(dialogue.textContent).not.toContain('Foyer en bordure');
  });

  it('retombe sur la pression quand le constat n’a pas de note', () => {
    render(
      <CarnetTabContent
        visites={[visite({ observations: [{ id: 'o1', pression: 'high', photos: photos(1) }] })]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /agrandir/i }));

    expect(screen.getByRole('dialog').textContent).toContain('Adventices : forte');
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
