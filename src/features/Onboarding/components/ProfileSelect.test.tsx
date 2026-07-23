import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ProfileSelect } from './ProfileSelect';

const options = [
  { id: 'r1', name: 'Kindia' },
  { id: 'r2', name: 'Boké' },
];

describe('ProfileSelect', () => {
  it('rend les options et renvoie id + name à la sélection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ProfileSelect label="Région" value="" options={options} onChange={onChange} placeholder="Choisir" />);

    await user.click(screen.getByLabelText('Région'));
    await user.click(screen.getByRole('option', { name: 'Boké' }));

    expect(onChange).toHaveBeenCalledWith('r2', 'Boké');
  });

  it('est désactivé quand disabled est vrai', () => {
    render(
      <ProfileSelect label="Préfecture" value="" options={[]} onChange={vi.fn()} disabled placeholder="Choisir" />,
    );

    expect(screen.getByLabelText('Préfecture').getAttribute('aria-disabled')).toBe('true');
  });
});
