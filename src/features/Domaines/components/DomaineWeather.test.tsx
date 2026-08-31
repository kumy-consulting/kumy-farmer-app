import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FarmForecast, FarmLiveStation, ForecastDay, ForecastHour } from '../domaines.types';
import { DomaineWeather } from './DomaineWeather';

/** 27 août 2026, 14 h 30 : « aujourd'hui » et « maintenant » de tous ces tests. */
const MAINTENANT = new Date(2026, 7, 27, 14, 30);

const mesure = (value: number, unit: string): { value: number; unit: string; at: string | null } => ({
  value,
  unit,
  at: MAINTENANT.toISOString(),
});

const station: FarmLiveStation = {
  station: {
    id: 's1',
    stationId: 'KMY-WE-2606-00001-K',
    label: null,
    online: true,
    status: 'active',
    lastSeen: MAINTENANT.toISOString(),
    batteryLevel: 87,
    signalStrength: 22,
    live: {
      temperature: mesure(26, '°C'),
      humidity: mesure(92, '%'),
      pressure: mesure(1014, 'hPa'),
      windSpeed: mesure(2, 'km/h'),
      windDir: { value: 135, label: 'SE', at: MAINTENANT.toISOString() },
      rainRate: mesure(0.2, 'mm/h'),
      rainfall24h: { valueMm: 0, windowHours: 24, at: MAINTENANT.toISOString() },
    },
  },
};

const conf = (value: number | null): { value: number | null; confidence: number; tier: 'c1' } => ({
  value,
  confidence: 0.9,
  tier: 'c1',
});

const jour = (date: string, tmax: number, probGt1mm: number): ForecastDay => ({
  date,
  tmin: conf(23),
  tmax: conf(tmax),
  tavg: conf(27),
  humidity: conf(90),
  windMax: conf(13.7),
  windGust: conf(18),
  solar: conf(18),
  etp: conf(4),
  rain: {
    probGt1mm,
    probGt10mm: 0.4,
    probGt20mm: 0.1,
    expectedMm: 6,
    p10Mm: 0,
    p90Mm: 18,
    spreadMm: 9,
    confidence: 0.5,
    tier: 'c3',
  },
});

const heure = (h: number, temp: number, rainRisk: number): ForecastHour => ({
  ts: Math.floor(new Date(2026, 7, 27, h, 0).getTime() / 1000),
  temp: conf(temp),
  humidity: conf(90),
  wind: conf(3),
  windGust: conf(5),
  solar: conf(12),
  rainRisk: conf(rainRisk),
  regime: 'humide',
});

const forecast: FarmForecast = {
  resolvedFrom: {
    source: 'station',
    track: 'A',
    stationId: 'KMY-WE-2606-00001-K',
    distanceM: 120,
    cellId: '9.6_-13.5',
  },
  daily5d: [jour('2026-08-27', 30, 0.97), jour('2026-08-28', 30, 1), jour('2026-08-29', 30, 1)],
  todayHourly: [heure(14, 28, 0.25), heure(15, 29, 0.47), heure(16, 30, 0.74)],
  overallConfidence: { daily: 0.82, hourly: 0.6 },
};

describe('DomaineWeather', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: MAINTENANT, shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche les mesures du kit puis les prévisions', () => {
    render(<DomaineWeather liveStation={station} forecast={forecast} />);

    expect(screen.getByText('KMY-WE-2606-00001-K')).toBeDefined();
    expect(screen.getByText('En direct')).toBeDefined();
    expect(screen.getByText('26.0 °C')).toBeDefined();
    expect(screen.getByText('92 %')).toBeDefined();
    expect(screen.getByText('2 km/h')).toBeDefined();
    expect(screen.getByText('dir. SE')).toBeDefined();
    expect(screen.getByText('0.0 mm')).toBeDefined();

    expect(screen.getByText(/Prévision 5 jours/i)).toBeDefined();
    expect(screen.getByText("Aujourd'hui")).toBeDefined();
    expect(screen.getByText('ven. 28')).toBeDefined();
    expect(screen.getByText(/heure par heure/i)).toBeDefined();
    expect(screen.getByText('Maintenant')).toBeDefined();
  });

  it('reste lisible pour l’agriculteur : ni pression, ni confiance, ni provenance', () => {
    render(<DomaineWeather liveStation={station} forecast={forecast} />);

    expect(screen.queryByText(/Pression/i)).toBeNull();
    expect(screen.queryByText(/1014/)).toBeNull();
    expect(screen.queryByText(/confiance/i)).toBeNull();
    expect(screen.queryByText(/Station IoT/i)).toBeNull();
  });

  it('affiche les prévisions même sans kit posé', () => {
    render(<DomaineWeather liveStation={{ station: null }} forecast={forecast} />);

    expect(screen.getByText(/Aucune station météo installée/)).toBeDefined();
    expect(screen.getByText(/Prévision 5 jours/i)).toBeDefined();
  });

  it('masque le bloc prévision quand elle n’est pas disponible', () => {
    render(<DomaineWeather liveStation={station} forecast={null} />);

    expect(screen.getByText('KMY-WE-2606-00001-K')).toBeDefined();
    expect(screen.queryByText(/Prévision 5 jours/i)).toBeNull();
    expect(screen.queryByText(/heure par heure/i)).toBeNull();
  });

  it('masque la bande horaire seule quand le jour n’a aucune heure', () => {
    render(
      <DomaineWeather liveStation={station} forecast={{ ...forecast, todayHourly: [] }} />,
    );

    expect(screen.getByText(/Prévision 5 jours/i)).toBeDefined();
    expect(screen.queryByText(/heure par heure/i)).toBeNull();
  });

  it('masque la carte d’un kit qui n’a jamais rien envoyé', () => {
    // Un kit peut être assigné au domaine sans avoir jamais émis : l'API le
    // renvoie alors avec `lastSeen: null` et `live` vide — et un `rainfall24h`
    // à 0, qui n'est qu'un cumul calculé côté serveur, pas une mesure. La carte
    // n'affichait que des tirets et un faux « 0.0 mm ».
    const muet: FarmLiveStation = {
      station: {
        ...station.station!,
        label: 'Test Biro',
        online: false,
        lastSeen: null,
        live: { rainfall24h: { valueMm: 0, windowHours: 24, at: MAINTENANT.toISOString() } },
      },
    };
    render(<DomaineWeather liveStation={muet} forecast={forecast} />);

    expect(screen.queryByText('Test Biro')).toBeNull();
    expect(screen.queryByText('0.0 mm')).toBeNull();
    expect(screen.getByText(/Aucune mesure reçue/)).toBeDefined();
    expect(screen.getByText(/Prévision 5 jours/i)).toBeDefined();
  });

  it('garde la carte d’un kit qui a déjà émis, même sans mesure du moment', () => {
    const vide: FarmLiveStation = {
      station: { ...station.station!, online: false, live: {} },
    };
    render(<DomaineWeather liveStation={vide} forecast={forecast} />);

    expect(screen.getByText('KMY-WE-2606-00001-K')).toBeDefined();
    expect(screen.queryByText(/Aucune mesure reçue/)).toBeNull();
  });

  it('dit que la prévision est une estimation globale quand aucun capteur ne la cale', () => {
    const maille: FarmForecast = {
      ...forecast,
      resolvedFrom: { ...forecast.resolvedFrom, source: 'cell', stationId: null, distanceM: null },
    };
    render(<DomaineWeather liveStation={{ station: null }} forecast={maille} />);

    expect(screen.getByText(/modèle météo global/i)).toBeDefined();
  });

  it('tait la mention d’estimation quand la prévision est calée sur la station', () => {
    render(<DomaineWeather liveStation={station} forecast={forecast} />);

    expect(screen.queryByText(/modèle météo global/i)).toBeNull();
  });

  it('signale un kit hors ligne sans masquer ses dernières mesures', () => {
    const horsLigne: FarmLiveStation = {
      station: {
        ...station.station!,
        online: false,
        lastSeen: new Date(2026, 7, 7, 18, 15).toISOString(),
      },
    };
    render(<DomaineWeather liveStation={horsLigne} forecast={forecast} />);

    expect(screen.getByText('Hors ligne')).toBeDefined();
    expect(screen.getByText(/Dernière donnée il y a 20 j · 7 août à 18:15/)).toBeDefined();
    expect(screen.getByText('26.0 °C')).toBeDefined();
  });
});
