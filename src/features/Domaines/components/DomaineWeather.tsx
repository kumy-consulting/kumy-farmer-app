import type { FunctionComponent } from 'react';

import PublicRounded from '@mui/icons-material/PublicRounded';
import SensorsOffRounded from '@mui/icons-material/SensorsOffRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { FarmForecast, FarmLiveStation, FarmStationLive } from '../domaines.types';
import { M } from './meteo/meteoFormat';
import { PrevisionHeures } from './meteo/PrevisionHeures';
import { PrevisionJours } from './meteo/PrevisionJours';
import { StationKitCard } from './meteo/StationKitCard';

interface DomaineWeatherProps {
  liveStation: FarmLiveStation | null;
  /**
   * Prévision du domaine, ou `null` quand l'API n'a rien à donner : pas encore
   * calculée (404), route fermée au rôle (403 sur une API antérieure à son
   * ouverture au FARMER), ou appel impossible hors ligne.
   */
  forecast: FarmForecast | null;
}

/**
 * Vrai si le kit a déjà donné signe de vie.
 *
 * Un kit peut être assigné à un domaine sans avoir jamais émis : l'API le
 * renvoie alors avec `lastSeen` nul et un `live` vide, et sa carte n'affiche
 * que des tirets. `rainfall24h` ne compte pas comme une preuve de vie — c'est
 * un cumul calculé par le serveur, qui vaut 0 même quand rien n'a été mesuré.
 */
const aDejaEmis = (s: FarmStationLive): boolean => {
  const { live } = s;
  return Boolean(
    s.lastSeen ||
      live.temperature ||
      live.humidity ||
      live.pressure ||
      live.windSpeed ||
      live.windDir ||
      live.rainfall ||
      live.rainRate,
  );
};

/** Bandeau léger tenant la place de la carte : pas de kit, ou un kit muet. */
const SansMesures: FunctionComponent<{ variant: 'absente' | 'muette' }> = ({ variant }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      p: '16px',
      mb: 2,
      borderRadius: '16px',
      background: 'rgba(1,134,117,0.05)',
      border: '1px dashed rgba(1,134,117,0.22)',
      '& svg': { fontSize: 24, color: '#8F9291' },
    }}
  >
    <SensorsOffRounded />
    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 13.5,
        fontWeight: 500,
        color: 'rgba(55,75,70,0.72)',
      }}
    >
      {variant === 'absente'
        ? 'Aucune station météo installée sur ce domaine. La météo par capteur apparaîtra ici une fois le kit posé.'
        : 'Aucune mesure reçue de ce domaine. La météo par capteur apparaîtra ici dès que le kit émettra.'}
    </Typography>
  </Box>
);

/** Provenance de la prévision, dite seulement quand aucun capteur ne la cale. */
const EstimationGlobale: FunctionComponent = () => (
  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5 }}>
    <PublicRounded sx={{ fontSize: 15, color: M.inkMute }} />
    <Typography sx={{ fontSize: 11.5, color: M.inkMute, lineHeight: 1.35 }}>
      Prévision issue d&apos;un modèle météo global, sans capteur sur place.
    </Typography>
  </Stack>
);

/**
 * Onglet « Météos » du détail domaine : ce que mesure le kit, puis ce qui est
 * annoncé.
 *
 * Les deux sources sont indépendantes — un domaine peut avoir une prévision sans
 * kit (elle retombe alors sur la maille régionale) comme un kit sans prévision
 * (aucune parcelle n'a encore été calculée). Chaque bloc s'affiche donc pour son
 * propre compte, sans jamais laisser d'encart vide à la place de l'autre.
 */
export const DomaineWeather: FunctionComponent<DomaineWeatherProps> = ({
  liveStation,
  forecast,
}) => {
  const station = liveStation?.station ?? null;
  const kitVivant = station != null && aDejaEmis(station);
  const estimation = forecast?.resolvedFrom.source === 'cell';

  return (
    <Box sx={{ px: 2, py: 2.5 }}>
      {kitVivant && station ? (
        <StationKitCard station={station} />
      ) : (
        <SansMesures variant={station ? 'muette' : 'absente'} />
      )}

      {forecast && forecast.daily5d.length > 0 && <PrevisionJours days={forecast.daily5d} />}
      {forecast && forecast.todayHourly.length > 0 && (
        <PrevisionHeures hours={forecast.todayHourly} />
      )}
      {forecast && estimation && <EstimationGlobale />}
    </Box>
  );
};
