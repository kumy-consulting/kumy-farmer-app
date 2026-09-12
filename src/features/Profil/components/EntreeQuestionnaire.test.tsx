import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EntreeQuestionnaire } from './EntreeQuestionnaire';

describe('EntreeQuestionnaire', () => {
  it('invite quand rien n’a été répondu', () => {
    render(<EntreeQuestionnaire marqueur={{ step: 0, completedAt: null }} onOuvrir={vi.fn()} />);
    expect(screen.getByText('Compléter mon profil')).toBeDefined();
  });

  it('dit l’avancement en cours de route', () => {
    render(<EntreeQuestionnaire marqueur={{ step: 2, completedAt: null }} onOuvrir={vi.fn()} />);
    expect(screen.getByText(/2 étapes sur 3/)).toBeDefined();
  });

  it('reste ouvrable une fois complété, pour corriger', async () => {
    const onOuvrir = vi.fn();
    render(
      <EntreeQuestionnaire marqueur={{ step: 3, completedAt: '2026-08-28T09:12:00.000Z' }} onOuvrir={onOuvrir} />,
    );
    expect(screen.getByText('Profil complété')).toBeDefined();
    await userEvent.click(screen.getByRole('button'));
    expect(onOuvrir).toHaveBeenCalledTimes(1);
  });
});
