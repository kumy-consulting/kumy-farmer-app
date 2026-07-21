import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PinDisplay } from './PinDisplay';

describe('PinDisplay', () => {
  it('rend 6 cellules', () => {
    const { container } = render(<PinDisplay pin="" onChange={vi.fn()} />);
    expect(container.querySelectorAll('[data-pin-cell]').length).toBe(6);
  });
});
