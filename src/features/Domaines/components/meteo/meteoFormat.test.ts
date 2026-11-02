import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deriveSky, fmtAgo, fmtDateTime, fmtDayShort, fmtHour, fmtNum, fmtPct, fmtTemp, isCurrentHour, isToday } from './meteoFormat';

const rain = (probGt1mm: number, probGt20mm = 0): { probGt1mm: number; probGt20mm: number } => ({
  probGt1mm,
  probGt20mm,
});

describe('meteoFormat', () => {
  beforeEach(() => {
    // 27 août 2026, 14 h 30 locales — sert d'ancrage à « maintenant ».
    vi.useFakeTimers({ now: new Date(2026, 7, 27, 14, 30), shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formate une température au degré près et rend un tiret sans valeur', () => {
    expect(fmtTemp(29.4)).toBe('29°');
    expect(fmtTemp(null)).toBe('—');
  });

  it('formate une probabilité 0–1 en pourcentage', () => {
    expect(fmtPct(0.74)).toBe('74 %');
    expect(fmtPct(null)).toBe('—');
  });

  it('formate une mesure avec son unité et sa précision', () => {
    expect(fmtNum(26.04, '°C', 1)).toBe('26.0 °C');
    expect(fmtNum(92, '%', 0)).toBe('92 %');
    expect(fmtNum(undefined, 'km/h', 0)).toBe('—');
  });

  it('abrège un jour de prévision sans décalage de fuseau', () => {
    // La date arrive en 'YYYY-MM-DD' : parsée en local, un fuseau à l'ouest la
    // ferait reculer d'un jour. On la lit en UTC.
    expect(fmtDayShort('2026-08-28')).toBe('ven. 28');
  });

  it('lit un horodatage horaire en SECONDES, pas en millisecondes', () => {
    const ts = Math.floor(new Date(2026, 7, 27, 16, 0).getTime() / 1000);
    expect(fmtHour(ts)).toBe('16h');
  });

  it('dit depuis combien de temps remonte la dernière donnée du kit', () => {
    expect(fmtAgo(new Date(2026, 7, 27, 14, 25).toISOString())).toBe('il y a 5 min');
    expect(fmtAgo(new Date(2026, 7, 7, 18, 15).toISOString())).toBe('il y a 20 j');
    expect(fmtAgo(null)).toBe('—');
  });

  it('date la dernière donnée en clair', () => {
    expect(fmtDateTime(new Date(2026, 7, 7, 18, 15).toISOString())).toBe('7 août à 18:15');
    expect(fmtDateTime(null)).toBe('—');
  });

  it('déduit le ciel des probabilités de pluie', () => {
    expect(deriveSky(rain(0.05))).toBe('sun');
    expect(deriveSky(rain(0.2))).toBe('partly');
    expect(deriveSky(rain(0.5))).toBe('rain');
    expect(deriveSky(rain(0.9, 0.3))).toBe('storm');
  });

  it('reconnaît le jour courant et l’heure courante', () => {
    expect(isToday('2026-08-27')).toBe(true);
    expect(isToday('2026-08-28')).toBe(false);
    expect(isCurrentHour(Math.floor(new Date(2026, 7, 27, 14, 5).getTime() / 1000))).toBe(true);
    expect(isCurrentHour(Math.floor(new Date(2026, 7, 27, 15, 5).getTime() / 1000))).toBe(false);
  });
});
