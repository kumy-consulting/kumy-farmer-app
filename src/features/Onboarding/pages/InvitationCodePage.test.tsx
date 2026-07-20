import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { InvitationCodePage } from './InvitationCodePage';

describe('InvitationCodePage', () => {
  it('affiche le champ de code et le bouton de validation', () => {
    render(
      <MemoryRouter>
        <InvitationCodePage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Code d'invitation")).toBeDefined();
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeDefined();
  });
});
