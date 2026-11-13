import type { FunctionComponent, ReactNode } from 'react';

import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import CompostOutlined from '@mui/icons-material/CompostOutlined';
import PestControlOutlined from '@mui/icons-material/PestControlOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import WaterDropOutlined from '@mui/icons-material/WaterDropOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { Pousse, Tuile } from '@/features/Home/components/carteAttente';
import { carteSx, ENCRE, ENCRE_DOUCE, FEUILLE, MENTHE, VERT, VERT_PROFOND } from '@/features/Home/components/carteAttente.styles';
import { BackButton } from '@/shared/components/BackButton';

import { SUJETS, TELEPHONE_CONSEILLER, type Sujet, type SujetId } from './bonnesPratiques.content';

const ICONES: Record<Exclude<SujetId, 'sol'>, ReactNode> = {
  parcelle: <PlaceOutlined />,
  cultures: <Pousse />,
  eau: <WaterDropOutlined />,
  engrais: <CompostOutlined />,
  ravageurs: <PestControlOutlined />,
};

/**
 * L'étude de sol, posée en tête : c'est le premier sujet dans le temps — on
 * connaît sa terre avant de la préparer — et le seul que l'agriculteur peut
 * déjà demander depuis l'accueil.
 *
 * Le bandeau est la même parcelle en coupe que sur la carte « Étude de sol » de
 * l'accueil : trois pousses sur trois horizons, aux mêmes ocres.
 */
const SujetEnTete: FunctionComponent<{ sujet: Sujet }> = ({ sujet }) => (
  <Box component="article" sx={carteSx}>
    <Box aria-hidden sx={{ background: MENTHE }}>
      <Typography
        sx={{
          px: 2,
          pt: 1.25,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: VERT_PROFOND,
        }}
      >
        Avant de semer
      </Typography>
      <Stack direction="row" justifyContent="center" alignItems="flex-end" spacing={4.5} sx={{ color: VERT_PROFOND }}>
        <Box sx={{ mb: '-3px' }}>
          <Pousse taille={22} />
        </Box>
        <Box sx={{ mb: '-3px' }}>
          <Pousse taille={30} />
        </Box>
        <Box sx={{ mb: '-3px' }}>
          <Pousse taille={22} />
        </Box>
      </Stack>
      <Box sx={{ height: 9, background: '#FBE3BF' }} />
      <Box sx={{ height: 9, background: '#F5C88A' }} />
      <Box sx={{ height: 9, background: '#E0A43A' }} />
    </Box>

    <Box sx={{ px: 2, pt: 1.5, pb: 1.75 }}>
      <Typography
        component="h2"
        sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 17, fontWeight: 700, color: ENCRE, lineHeight: 1.3 }}
      >
        {sujet.titre}
      </Typography>
      <Typography sx={{ fontSize: 13, color: ENCRE_DOUCE, mt: 0.35, lineHeight: 1.45 }}>{sujet.accroche}</Typography>
    </Box>
  </Box>
);

/** Une ligne de la saison : l'icône, le titre, l'angle du sujet en quelques mots. */
const LigneSujet: FunctionComponent<{ sujet: Sujet; icone: ReactNode; dernier: boolean }> = ({
  sujet,
  icone,
  dernier,
}) => (
  <Stack
    component="li"
    direction="row"
    alignItems="center"
    spacing={1.75}
    sx={{ px: 2, py: 1.5, borderBottom: dernier ? 0 : '1px solid rgba(20,35,30,0.07)' }}
  >
    <Tuile>{icone}</Tuile>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="h3"
        sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 15, fontWeight: 700, color: ENCRE, lineHeight: 1.3 }}
      >
        {sujet.titre}
      </Typography>
      <Typography sx={{ fontSize: 13, color: ENCRE_DOUCE, mt: 0.2, lineHeight: 1.4 }}>{sujet.accroche}</Typography>
    </Box>
  </Stack>
);

/**
 * Les bonnes pratiques agricoles.
 *
 * Un sujet en tête, puis les cinq autres dans l'ordre où ils arrivent dans la
 * saison : préparer, choisir, arroser, fertiliser, protéger. La liste se lit
 * comme un calendrier, pas comme un sommaire.
 *
 * **Les sujets ne s'ouvrent pas, et rien ne le laisse croire.** Ni chevron ni
 * flèche : une flèche promet une page, et cette page demanderait des conseils
 * agronomiques — à quelle dose fertiliser, quels ravageurs surveiller — que
 * seuls les agronomes Kumy peuvent écrire sans risque. Le jour où ce texte
 * existe, les chevrons et la route se posent ensemble. D'ici là, le conseil se
 * demande à un humain : c'est la barre du bas, toujours à portée de pouce.
 */
export const BonnesPratiquesPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const [enTete, ...saison] = SUJETS;

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'linear-gradient(155deg, #0E7A67 0%, #0C6E5C 50%, #0A6152 100%)',
      }}
    >
      {/* Même tête que l'écran d'attente d'où l'on vient : l'agriculteur doit
          sentir qu'il a ouvert une porte de l'app, pas atterri sur une
          brochure. */}
      <Box
        sx={{
          flex: 'none',
          padding: 'max(calc(env(safe-area-inset-top, 0px) + 8px), 26px) 24px 22px',
          color: '#FFFFFF',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <BackButton onClick={() => navigate('/')} label="Retour à l’accueil" />
          <Typography
            noWrap
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              minWidth: 0,
            }}
          >
            Les bonnes pratiques
          </Typography>
        </Stack>

        <Typography
          component="h1"
          sx={{
            mt: 2,
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 'clamp(20px, 5.6vw, 24px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.22,
          }}
        >
          Mieux connaître sa terre, mieux cultiver, mieux produire.
        </Typography>
      </Box>

      {/* La feuille : la liste défile, la barre de conseil reste en bas. */}
      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: FEUILLE,
          borderRadius: '26px 26px 0 0',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', px: 2, pt: 2, pb: 2 }}>
          <SujetEnTete sujet={enTete} />

          <Typography
            component="h2"
            sx={{ mt: 2.75, mb: 1.25, px: 0.5, fontFamily: "'Ubuntu', sans-serif", fontSize: 15.5, fontWeight: 700, color: ENCRE }}
          >
            Au fil de la saison
          </Typography>

          <Box component="ol" sx={{ ...carteSx, listStyle: 'none', m: 0, p: 0 }}>
            {saison.map((sujet, i) => (
              <LigneSujet
                key={sujet.id}
                sujet={sujet}
                icone={ICONES[sujet.id as Exclude<SujetId, 'sol'>]}
                dernier={i === saison.length - 1}
              />
            ))}
          </Box>
        </Box>

        {/* Le seul geste de la page. Il appelle le même numéro que l'écran
            d'attente : deux numéros pour un même besoin, ce serait deux choses
            à retenir pour l'agriculteur, et une de trop à tenir à jour. */}
        <Box
          sx={{
            flex: 'none',
            px: 2,
            pt: 1.5,
            pb: 'max(env(safe-area-inset-bottom, 0px), 14px)',
            borderTop: '1px solid rgba(20,35,30,0.08)',
            background: FEUILLE,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ pl: 2, pr: 1, py: 1, borderRadius: '18px', background: MENTHE }}
          >
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14.5, fontWeight: 700, color: '#00443A' }}>
                Besoin d’un conseil ?
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: '#4E635D', mt: 0.1 }}>Un conseiller Kumy répond</Typography>
            </Box>

            <Box
              component="a"
              href={`tel:${TELEPHONE_CONSEILLER}`}
              aria-label="Appeler un conseiller Kumy"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                flexShrink: 0,
                minHeight: 48,
                px: 2.25,
                borderRadius: '999px',
                background: `linear-gradient(140deg, ${VERT} 0%, ${VERT_PROFOND} 100%)`,
                color: '#FFFFFF',
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                '& svg': { fontSize: 19 },
                '&:active': { filter: 'brightness(0.95)' },
                '&:focus-visible': { outline: `2px solid ${VERT_PROFOND}`, outlineOffset: 2 },
              }}
            >
              <CallOutlinedIcon aria-hidden />
              Appeler
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
