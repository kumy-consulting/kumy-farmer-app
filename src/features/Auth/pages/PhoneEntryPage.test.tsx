import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PhoneEntryPage } from './PhoneEntryPage';

describe('PhoneEntryPage', () => {
  it('ramène à l’écran de bienvenue, même sans historique de navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/phone-entry']}>
        <Routes>
          <Route path="/auth/phone-entry" element={<PhoneEntryPage />} />
          <Route path="/welcome" element={<p>Bienvenue sur Kumy</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: /bienvenue/i }));

    expect(screen.getByText('Bienvenue sur Kumy')).toBeDefined();
  });
});
