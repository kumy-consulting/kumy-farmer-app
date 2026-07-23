import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DomainAlert } from '../dashboard.types';
import { ActivitiesSection } from './ActivitiesSection';
import { AlertCard } from './AlertCard';
import { AlertsSection } from './AlertsSection';

const criticalAlert: DomainAlert = {
  id: 'x',
  domainName: 'Domaine Test',
  severity: 'critical',
  type: 'drought',
  message: 'Sol très sec',
  createdAt: new Date().toISOString(),
};

describe('AlertCard', () => {
  it('rend le domaine, le message et expose la sévérité', () => {
    render(<AlertCard alert={criticalAlert} />);

    expect(screen.getByText('Domaine Test')).toBeDefined();
    expect(screen.getByText('Sol très sec')).toBeDefined();
    expect(screen.getByRole('button').getAttribute('data-severity')).toBe('critical');
  });
});

describe('états vides', () => {
  it('AlertsSection affiche un message quand il n’y a aucune alerte', () => {
    render(<AlertsSection alerts={[]} />);
    expect(screen.getByText(/Aucune alerte/)).toBeDefined();
  });

  it('ActivitiesSection affiche un message quand il n’y a aucune activité', () => {
    render(<ActivitiesSection activities={[]} />);
    expect(screen.getByText(/Aucune activité/)).toBeDefined();
  });
});
