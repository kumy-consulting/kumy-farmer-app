import type { FunctionComponent } from 'react';

import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CellTowerRounded from '@mui/icons-material/CellTowerRounded';
import SatelliteAltRounded from '@mui/icons-material/SatelliteAltRounded';
import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';

import { formatRelative } from '../formatRelative';
import type { HomeRecap, HomeWeather } from '../useHomeFeed';
import { HealthGauge } from './HealthGauge';

interface HomeHeaderProps {
  firstName: string;
  weather: HomeWeather | null;
  recap: HomeRecap | null;
  /** Comptes d'alertes tels que la section les affiche. */
  alerts: { fresh: number; stale: number };
  onWeatherClick: (farmId: string) => void;
  onRecapClick: () => void;
}

/**
 * En-tête de l'accueil : un bulletin d'état, pas une page de bienvenue.
 *
 * L'état de l'exploitation tient la plus grosse typo parce que c'est la réponse
 * à la question qu'on se pose en ouvrant l'app. La salutation redevient une
 * étiquette — elle situe, elle n'informe pas — et les deux sources de détail
 * (le kit, les chiffres) deviennent deux rangées jumelles, tapables.
 */
const Header = styled(Box)({
  position: 'relative',
  overflow: 'hidden',
  // `max()` plutôt qu'une somme : sur un téléphone à encoche la safe-area
  // commande (env + 12), et le plancher de 52 px protège les contextes qui
  // ignorent `env()` — navigateur de bureau, aperçu en cadre — où l'étiquette
  // passerait sinon sous l'encoche. Le plancher ne coûte rien sur mobile.
  padding: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 52px) 24px 20px',
  // #0E7A67 est le vert le plus clair qui tienne : au-delà (#107F6B), même une
  // encre totalement opaque tombe sous les 4,5:1 du petit texte — mesuré, pas
  // estimé. Éclaircir jusque-là a coûté la mise à plat des opacités : sur ce
  // fond, chaque cran d'opacité en dessous de ~0,96 passe sous le seuil. La
  // hiérarchie repose donc sur le corps, la graisse et la casse, jamais sur un
  // texte plus pâle — ce qui vaut mieux de toute façon en plein soleil.
  background: 'linear-gradient(155deg, #0E7A67 0%, #0C6E5C 50%, #0A6152 100%)',
  borderBottomLeftRadius: 26,
  borderBottomRightRadius: 26,
  color: '#EAF7F1',
  boxShadow: '0 12px 28px rgba(0,40,32,0.24)',
});

/**
 * La mesure du kit : une pilule, parce qu'elle est vivante et datée — elle
 * change toute la journée, contrairement au reste de l'en-tête.
 */
const KitPill = styled('button')({
  all: 'unset',
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  maxWidth: '100%',
  cursor: 'pointer',
  padding: '6px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.18)',
  border: '1px solid rgba(234,247,241,0.45)',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 12.5,
  fontWeight: 600,
  color: '#EAF7F1',
  whiteSpace: 'nowrap',
  '&:active': { background: 'rgba(255,255,255,0.22)' },
  '&:focus-visible': { outline: '2px solid #93F4E0', outlineOffset: 2 },
  '& svg': { fontSize: 16, flexShrink: 0 },
});

/**
 * L'exploitation en chiffres : traitée comme l'identité du domaine — une
 * référence cadastrale en petites capitales — et non comme une entrée de menu.
 */
const HoldingLine = styled('button')({
  all: 'unset',
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  maxWidth: '100%',
  cursor: 'pointer',
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#EAF7F1',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '&:active': { color: '#FFFFFF' },
  '&:focus-visible': { outline: '2px solid #93F4E0', outlineOffset: 3, borderRadius: 4 },
  '& svg': { fontSize: 15, flexShrink: 0, opacity: 0.65 },
});

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** Fraîcheur compacte : « 4 min » plutôt que « il y a 4 min ». */
const age = (iso: string): string => formatRelative(iso).replace(/^il y a /, '');

/**
 * Ce que la puce dit après le nom du domaine.
 *
 * Avec un kit, c'est une mesure instantanée et on l'affiche comme telle. Sans
 * kit, il n'existe aucune mesure « maintenant » : on montre le contexte
 * climatique satellite, en nommant sa fenêtre — « 24° moy. 7 j » — plutôt que de
 * le maquiller en relevé. L'ancienne mention « météo régionale estimée »
 * annonçait une estimation que l'écran ne montrait jamais : aucune température,
 * aucune source, une promesse en l'air.
 */
const kitReading = (weather: HomeWeather): string => {
  if (weather.hasKit) {
    const parts = [
      weather.tempC !== null ? `${Math.round(weather.tempC)}°` : null,
      weather.online ? 'en direct' : 'hors ligne',
      weather.observedAt ? age(weather.observedAt) : null,
    ].filter(Boolean);
    return parts.length ? ` · ${parts.join(' · ')}` : '';
  }

  const avg = weather.climate?.avgTempC;
  if (avg === null || avg === undefined) return ' · pas de kit sur ce domaine';
  return ` · ${Math.round(avg)}° moy. 7 j`;
};

export const HomeHeader: FunctionComponent<HomeHeaderProps> = ({
  firstName,
  weather,
  recap,
  alerts,
  onWeatherClick,
  onRecapClick,
}) => (
  <Header>
    <Typography
      sx={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.13em',
        textTransform: 'uppercase',
        color: '#EAF7F1',
        mb: 1.75,
      }}
    >
      {capitalize(dayjs().format('ddd D MMMM'))} · Bonjour, {firstName}
    </Typography>

    {recap ? (
      <HealthGauge health={recap.health} fresh={alerts.fresh} stale={alerts.stale} />
    ) : (
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
        Votre exploitation
      </Typography>
    )}

    <Stack spacing={1.25} alignItems="flex-start" sx={{ mt: 2.25 }}>
      {weather && (
        <KitPill type="button" onClick={() => onWeatherClick(weather.farmId)} sx={{ alignSelf: 'center' }}>
          {/* Le pictogramme dit d'où vient le chiffre : relais pour le kit posé sur
              le domaine, satellite pour le contexte climatique qui prend le relais
              quand il n'y a pas de kit. */}
          {weather.hasKit ? <CellTowerRounded /> : <SatelliteAltRounded />}
          <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {weather.farmName}
          </Box>
          <Box component="span" sx={{ flexShrink: 0, opacity: 0.88 }}>
            {kitReading(weather)}
          </Box>
        </KitPill>
      )}

      {recap && (
        <HoldingLine type="button" onClick={onRecapClick}>
          {recap.domains} domaines · {recap.parcels} parcelles ·{' '}
          {recap.areaHa.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ha
          <ArrowForwardRounded />
        </HoldingLine>
      )}
    </Stack>
  </Header>
);
