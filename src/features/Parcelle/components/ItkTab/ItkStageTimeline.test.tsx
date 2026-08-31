import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ItkStageTimeline } from './ItkStageTimeline';
import type { ItkStage } from '../../parcelle.types';

afterEach(() => vi.useRealTimers());

const stade = (p: Partial<ItkStage> & Pick<ItkStage, 'stageCode' | 'status'>): ItkStage => ({
  stageName: 'Phase végétative',
  order: 1,
  expectedStart: '2026-08-16',
  expectedEnd: '2026-09-20',
  dayStart: 10,
  dayEnd: 45,
  description: '',
  critical: false,
  tasks: { mandatory: [], recommended: [] },
  risks: [],
  ...p,
});

const STADES: ItkStage[] = [
  stade({ stageCode: 'germ', status: 'delayed', stageName: 'Germination-Levée', expectedStart: '2026-08-06', expectedEnd: '2026-08-16' }),
  stade({ stageCode: 'veg', status: 'inProgress' }),
  stade({ stageCode: 'flo', status: 'upcoming', stageName: 'Floraison', expectedStart: '2026-09-20', expectedEnd: '2026-10-30' }),
];

describe('ItkStageTimeline', () => {
  it('affiche les dates du stade, pas des J+', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-22T10:00:00Z'));
    render(<ItkStageTimeline stages={STADES} selectedStageCode="veg" onSelectStage={() => {}} />);

    expect(screen.getByText('06 AOÛT – 16 AOÛT')).toBeDefined();
    expect(screen.getByText('16 AOÛT – 20 SEPT.')).toBeDefined();
    expect(screen.queryByText(/^J\+/)).toBeNull();
  });

  it('offre une navigation au clavier de part et d’autre de la frise', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-22T10:00:00Z'));
    render(<ItkStageTimeline stages={STADES} selectedStageCode="veg" onSelectStage={() => {}} />);

    expect(screen.getByLabelText('Stades précédents')).toBeDefined();
    expect(screen.getByLabelText('Stades suivants')).toBeDefined();
  });

  it('laisse lire son numéro au stade en cours, au lieu de le masquer', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-22T10:00:00Z'));
    render(<ItkStageTimeline stages={STADES} selectedStageCode="veg" onSelectStage={() => {}} />);

    // Le stade en cours est le 2e : son numéro doit être visible.
    expect(screen.getByText('2')).toBeDefined();
  });

  it('ne rend rien sans stade', () => {
    const { container } = render(<ItkStageTimeline stages={[]} selectedStageCode={undefined} onSelectStage={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
