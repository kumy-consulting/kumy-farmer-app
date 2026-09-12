import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatPeriodeStade } from './itkPeriode';

afterEach(() => vi.useRealTimers());

const figerAu = (iso: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
};

describe('formatPeriodeStade', () => {
  it("omet l'année quand le stade tient dans l'année courante", () => {
    figerAu('2026-08-22T10:00:00Z');
    expect(formatPeriodeStade('2026-08-06', '2026-08-16')).toBe('06 AOÛT – 16 AOÛT');
  });

  it('abrège les mois longs comme le fait la locale française', () => {
    figerAu('2026-08-22T10:00:00Z');
    expect(formatPeriodeStade('2026-08-16', '2026-09-20')).toBe('16 AOÛT – 20 SEPT.');
  });

  it("porte l'année sur la fin quand le stade franchit le nouvel an", () => {
    figerAu('2026-12-01T10:00:00Z');
    expect(formatPeriodeStade('2026-12-20', '2027-01-10')).toBe('20 DÉC. – 10 JANV. 2027');
  });

  it("porte l'année aux deux bouts quand le stade n'est pas dans l'année courante", () => {
    figerAu('2026-08-22T10:00:00Z');
    expect(formatPeriodeStade('2025-03-04', '2025-04-12')).toBe('04 MARS 2025 – 12 AVR. 2025');
  });

  it('replie sur une seule date quand la fin manque', () => {
    figerAu('2026-08-22T10:00:00Z');
    expect(formatPeriodeStade('2026-08-06', '')).toBe('06 AOÛT');
  });

  it('ne rend rien plutôt que « Invalid Date » sur une entrée illisible', () => {
    figerAu('2026-08-22T10:00:00Z');
    expect(formatPeriodeStade('', '')).toBe('');
  });
});
