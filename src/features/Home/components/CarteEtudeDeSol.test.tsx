import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CarteEtudeDeSol } from './CarteEtudeDeSol';

const base = {
  requestedAt: null,
  isLoading: false,
  isSending: false,
  error: null,
  demander: vi.fn(),
};

describe('CarteEtudeDeSol', () => {
  it('propose la demande tant qu’aucune n’est partie', () => {
    render(<CarteEtudeDeSol {...base} />);

    expect(screen.getByText('Étude de sol')).toBeDefined();
    expect(screen.getByRole('button', { name: /Demander une étude de sol/i })).toBeDefined();
  });

  it('déclenche la demande au clic', () => {
    const demander = vi.fn();
    render(<CarteEtudeDeSol {...base} demander={demander} />);

    fireEvent.click(screen.getByRole('button', { name: /Demander une étude de sol/i }));

    expect(demander).toHaveBeenCalledTimes(1);
  });

  it('dit l’envoi en cours et verrouille le bouton', () => {
    render(<CarteEtudeDeSol {...base} isSending />);

    const bouton = screen.getByRole('button', { name: /Envoi/i });
    expect(bouton.hasAttribute('disabled')).toBe(true);
  });

  it('remplace le bouton par la date une fois la demande partie', () => {
    render(<CarteEtudeDeSol {...base} requestedAt="2026-08-27T09:12:00.000Z" />);

    expect(screen.getByText(/Demande envoyée le 27 août/)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Demander une étude de sol/i })).toBeNull();
  });

  it('affiche l’échec sans retirer le bouton', () => {
    render(<CarteEtudeDeSol {...base} error="Envoi impossible. Réessayez." />);

    expect(screen.getByText(/Envoi impossible/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Demander une étude de sol/i })).toBeDefined();
  });

  it('ne montre rien tant que l’état n’est pas connu', () => {
    const { container } = render(<CarteEtudeDeSol {...base} isLoading />);

    expect(container.textContent).toBe('');
  });
});
