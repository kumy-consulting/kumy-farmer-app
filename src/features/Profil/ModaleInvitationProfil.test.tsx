import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ModaleInvitationProfil } from './ModaleInvitationProfil';

describe('ModaleInvitationProfil', () => {
  it('porte la phrase validée, sans promesse chiffrée', () => {
    render(<ModaleInvitationProfil ouverte onFermer={vi.fn()} onCompleter={vi.fn()} />);
    expect(
      screen.getByText(/Ces réponses nous aident à mieux vous accompagner, et comptent dans votre AgriScore\./),
    ).toBeDefined();
    expect(screen.queryByText(/améliorez/i)).toBeNull();
  });

  it('offre deux gestes : compléter, ou plus tard', async () => {
    const onCompleter = vi.fn();
    const onFermer = vi.fn();
    render(<ModaleInvitationProfil ouverte onFermer={onFermer} onCompleter={onCompleter} />);

    await userEvent.click(screen.getByRole('button', { name: /Compléter mon profil/ }));
    expect(onCompleter).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /Plus tard/ }));
    expect(onFermer).toHaveBeenCalledTimes(1);
  });
});
