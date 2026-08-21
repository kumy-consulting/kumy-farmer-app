import type { FunctionComponent } from 'react';

import CellTowerRounded from '@mui/icons-material/CellTowerRounded';
import SatelliteAltRounded from '@mui/icons-material/SatelliteAltRounded';
import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';

import { formatSurvenu } from '../home.echeance';
import type { HomeWeather } from '../useHomeFeed';

interface HomeHeaderProps {
  firstName: string;
  weather: HomeWeather | null;
  onWeatherClick: (farmId: string) => void;
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
  padding: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 48px) 24px 16px',
  // #0E7A67 est le vert le plus clair qui tienne : au-delà (#107F6B), même une
  // encre totalement opaque tombe sous les 4,5:1 du petit texte — mesuré, pas
  // estimé. Éclaircir jusque-là a coûté la mise à plat des opacités : sur ce
  // fond, chaque cran d'opacité en dessous de ~0,96 passe sous le seuil. La
  // hiérarchie repose donc sur le corps, la graisse et la casse, jamais sur un
  // texte plus pâle — ce qui vaut mieux de toute façon en plein soleil.
  background: 'linear-gradient(155deg, #0E7A67 0%, #0C6E5C 50%, #0A6152 100%)',
  color: '#EAF7F1',
  // Bandeau à bord franc, sans arrondi ni ombre portée. La carte météo qu'il
  // contient a déjà ses angles ; deux rayons emboîtés faisaient un cadre dans un
  // cadre. Et une ombre de 28 px sous un bord droit donne un bloc qui flotte —
  // ici le changement de couleur suffit à séparer l'en-tête du contenu.
});

/** Première lettre en capitale — `dayjs` rend « ven. », l'étiquette veut « Ven. ». */
const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Ce que la carte annonce en tête — et qui doit être vrai.
 *
 * Trois sources se succèdent, du plus fiable au plus lointain : le kit posé sur
 * le domaine, l'estimation satellite qui prend le relais sans kit, et rien du
 * tout. Chacune se nomme, parce qu'un chiffre de température ne vaut pas la
 * même chose selon d'où il vient — et qu'un agriculteur sans kit doit
 * comprendre d'où sort le nombre qu'il lit.
 */
const sourceDe = (weather: HomeWeather): { sourcil: string; valeur: string; note: string } => {
  if (weather.hasKit) {
    return {
      sourcil: weather.online ? 'Kit météo · en direct' : 'Kit météo · hors ligne',
      valeur: weather.tempC !== null ? `${Math.round(weather.tempC)}°` : '—',
      // `formatSurvenu` et non un relatif nu : un relevé de deux jours annoncé
      // « il y a 2 j » ne dit pas de quel jour on parle, et c'est précisément la
      // fraîcheur qu'on cherche à juger ici.
      note: weather.observedAt ? `Relevé ${formatSurvenu(weather.observedAt).toLowerCase()}` : 'Dernier relevé inconnu',
    };
  }

  const moyenne = weather.climate?.avgTempC;
  if (moyenne === null || moyenne === undefined) {
    return { sourcil: 'Météo', valeur: '—', note: 'Pas de kit sur ce domaine' };
  }
  return {
    sourcil: 'Estimation satellite',
    valeur: `${Math.round(moyenne)}°`,
    note: 'Moyenne des 7 derniers jours',
  };
};

const Sourcil = styled(Typography)({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#4E635D',
  lineHeight: 1.2,
});

/** Une mesure du kit : son nom au-dessus, sa valeur en dessous. */
const Mesure: FunctionComponent<{ nom: string; valeur: string }> = ({ nom, valeur }) => (
  <Box sx={{ minWidth: 0 }}>
    <Sourcil sx={{ color: '#5C5F5E', letterSpacing: '0.1em' }}>{nom}</Sourcil>
    <Typography
      sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14.5, fontWeight: 700, color: '#1A1C1B', mt: 0.25 }}
    >
      {valeur}
    </Typography>
  </Box>
);

export const HomeHeader: FunctionComponent<HomeHeaderProps> = ({ firstName, weather, onWeatherClick }) => {
  const source = weather ? sourceDe(weather) : null;
  // Sans date de relevé, on ne sait pas de quand datent ces mesures : les
  // afficher comme un état les fait passer pour actuelles. Le kit hors ligne
  // dont la dernière remontée est inconnue n'a rien à annoncer.
  const mesures = weather?.hasKit && weather.observedAt
    ? [
        weather.mesures.humidite !== null ? { nom: 'Humidité', valeur: `${Math.round(weather.mesures.humidite)} %` } : null,
        weather.mesures.vent !== null ? { nom: 'Vent', valeur: `${Math.round(weather.mesures.vent)} km/h` } : null,
        weather.mesures.pluie24h !== null
          ? { nom: 'Pluie 24 h', valeur: `${weather.mesures.pluie24h.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} mm` }
          : null,
      ].filter((m): m is { nom: string; valeur: string } => m !== null)
    : [];

  return (
    <Header>
      <Typography
        sx={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: '#EAF7F1',
          mb: 1.5,
        }}
      >
        {capitalize(dayjs().format('ddd D MMMM'))} · Bonjour, {firstName}
      </Typography>

      {weather && source && (
        <Box
          component="button"
          type="button"
          onClick={() => onWeatherClick(weather.farmId)}
          sx={{
            appearance: 'none',
            font: 'inherit',
            textAlign: 'left',
            width: '100%',
            display: 'block',
            cursor: 'pointer',
            border: 0,
            p: 1.75,
            borderRadius: '18px',
            // Une carte claire, et non une puce translucide : sur ce vert, aucun
            // gris ne tient les 4,5:1, si bien qu'une puce ne pouvait porter
            // qu'une seule ligne de texte opaque. Le fond clair rend toute la
            // hiérarchie typographique disponible — sourcil, lieu, mesures.
            background: '#FFFFFF',
            boxShadow: '0 8px 22px rgba(0,40,32,0.18)',
            '&:active': { background: '#FAFDFB' },
            '&:focus-visible': { outline: '2px solid #FFFFFF', outlineOffset: 3 },
          }}
        >
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.6}>
                {/* Le pictogramme dit d'où vient le chiffre : relais pour le kit
                    posé sur le domaine, satellite pour le contexte climatique. */}
                {weather.hasKit ? (
                  <CellTowerRounded sx={{ fontSize: 13, color: '#4E635D' }} />
                ) : (
                  <SatelliteAltRounded sx={{ fontSize: 13, color: '#4E635D' }} />
                )}
                <Sourcil noWrap>{source.sourcil}</Sourcil>
              </Stack>

              <Typography
                sx={{
                  fontFamily: "'Ubuntu', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#1A1C1B',
                  lineHeight: 1.25,
                  mt: 0.35,
                }}
                noWrap
              >
                {weather.farmName}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.15 }} noWrap>
                {source.note}
              </Typography>
            </Box>

            <Typography
              sx={{
                flexShrink: 0,
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: '#016557',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {source.valeur}
              {/* L'unité ne suit que s'il y a une valeur : « —C » n'est pas une
                  température manquante, c'est une faute de frappe. */}
              {source.valeur !== '—' && (
                <Box component="span" sx={{ fontSize: 13, fontWeight: 700, ml: '1px' }}>
                  C
                </Box>
              )}
            </Typography>
          </Stack>

          {mesures.length > 0 && (
            <Stack
              direction="row"
              spacing={0}
              sx={{
                mt: 1.5,
                pt: 1.25,
                borderTop: '1px solid rgba(55,75,70,0.10)',
                '& > *': { flex: 1 },
              }}
            >
              {mesures.map((mesure) => (
                <Mesure key={mesure.nom} nom={mesure.nom} valeur={mesure.valeur} />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Header>
  );
};
