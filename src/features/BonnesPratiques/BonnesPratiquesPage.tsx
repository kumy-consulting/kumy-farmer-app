import type { FunctionComponent } from 'react';

import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { BackButton } from '@/shared/components/BackButton';

import { SUJETS, TELEPHONE_CONSEILLER, TELEPHONE_CONSEILLER_AFFICHE, type Sujet } from './bonnesPratiques.content';
import { IllustrationSujet } from './components/IllustrationSujet';

/**
 * Un intervalle élastique : il prend la place disponible jusqu'à `max`, et se
 * referme à zéro quand elle manque. Même ressort que sur l'écran d'attente.
 */
const Ressort: FunctionComponent<{ max: number }> = ({ max }) => (
  <Box aria-hidden sx={{ flex: '1 1 0', minHeight: 0, maxHeight: `${max}px` }} />
);

/**
 * Une tuile de sujet : l'illustration, le titre, une accroche de trois mots.
 *
 * L'accroche n'est pas le `resume` de la maquette : celui-ci reformulait le
 * titre en plus long — « Bien gérer l'eau » / « Optimiser l'utilisation de
 * l'eau pour des cultures saines » — et deux à trois lignes par tuile faisaient
 * déborder la page. L'accroche, elle, nomme l'angle du sujet en quelques mots :
 * ce qu'on regarde, ou quand on agit.
 *
 * L'illustration se mesure en `vh` : sur un petit téléphone elle rend 42 px, et
 * ces dix pixels rendus par tuile sont exactement ce qui permet à l'accroche de
 * tenir sans défilement.
 */
const TuileSujet: FunctionComponent<{ sujet: Sujet }> = ({ sujet }) => (
  <Stack
    component="li"
    alignItems="center"
    sx={{
      flex: '1 1 0',
      minWidth: 0,
      px: 1,
      py: 'clamp(6px, 1.2vh, 24px)',
      borderRadius: '18px',
      background: '#FFFFFF',
      border: '1px solid rgba(55,75,70,0.08)',
    }}
  >
    <Box
      aria-hidden
      sx={{
        width: 'clamp(38px, 6vh, 54px)',
        height: 'clamp(38px, 6vh, 54px)',
        '& svg': { width: '100%', height: '100%' },
      }}
    >
      <IllustrationSujet sujet={sujet.id} />
    </Box>

    <Typography
      sx={{
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        color: '#1A1C1B',
        lineHeight: 1.25,
        textAlign: 'center',
        mt: 0.6,
      }}
    >
      {sujet.titre}
    </Typography>

    <Typography
      sx={{
        fontSize: 11.5,
        fontWeight: 500,
        color: '#5C5F5E',
        lineHeight: 1.3,
        textAlign: 'center',
        mt: 0.35,
      }}
    >
      {sujet.accroche}
    </Typography>
  </Stack>
);

/**
 * Les bonnes pratiques agricoles.
 *
 * Six sujets, et rien de plus : pas de bandeau photographique, pas d'appel à
 * « commencer avec Kumy ». La maquette portait les deux, mais elle décrivait une
 * page de découverte destinée à quelqu'un qui ne s'est pas encore inscrit.
 * L'agriculteur qui arrive ici a un compte : lui proposer de commencer serait
 * lui parler comme à un inconnu.
 *
 * Les tuiles ne s'ouvrent pas. Une flèche promet une page, et cette page
 * demanderait des conseils agronomiques — à quelle dose fertiliser, quels
 * ravageurs surveiller — que seuls les agronomes Kumy peuvent écrire sans
 * risque. Le jour où ce texte existe, la flèche et la route se posent d'un coup.
 * D'ici là, le conseil se demande à un humain, en bas de page.
 *
 * **La page tient dans un écran, sans défilement.** D'où la grille de deux
 * colonnes plutôt qu'une liste : six lignes à résumé faisaient neuf cents
 * pixels de contenu pour sept cent quatre-vingt-dix d'écran. La grille montre
 * aussi les six illustrations à leur taille — ce sont six coupes de la MÊME
 * parcelle, et côte à côte elles se lisent enfin comme une seule terre.
 */
export const BonnesPratiquesPage: FunctionComponent = () => {
  const navigate = useNavigate();

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
      {/* Même tête que l'écran d'attente d'où l'on vient : même dégradé, même
          formule de safe-area. L'agriculteur doit sentir qu'il a ouvert une
          porte de l'app, pas atterri sur une brochure.

          Le sous-titre de la maquette — « Des conseils pratiques pour des
          décisions éclairées » — est tombé avec les résumés, et pour la même
          raison : le titre le dit déjà, en mieux. */}
      <Box
        sx={{
          flex: 'none',
          padding: 'max(calc(env(safe-area-inset-top, 0px) + 8px), 26px) 24px clamp(8px, 1.8vh, 24px)',
          color: '#EAF7F1',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 'clamp(6px, 1.4vh, 18px)' }}>
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
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 'clamp(19px, 5.2vw, 23px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.22,
            color: '#FFFFFF',
          }}
        >
          Mieux connaître sa terre, mieux cultiver, mieux produire.
        </Typography>
      </Box>

      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          background: '#FFFFFF',
          borderRadius: '26px 26px 0 0',
          px: 2,
          pt: 'clamp(10px, 1.6vh, 26px)',
          pb: 'max(env(safe-area-inset-bottom, 0px), clamp(10px, 1.6vh, 20px))',
        }}
      >
        <Ressort max={26} />

        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(6px, 1.2vh, 20px)',
          }}
        >
          {SUJETS.map((sujet) => (
            <TuileSujet key={sujet.id} sujet={sujet} />
          ))}
        </Box>

        <Ressort max={96} />

        {/* Le seul geste de la page. Il appelle le même numéro que l'écran
            d'attente : deux numéros pour un même besoin, ce serait deux choses
            à retenir pour l'agriculteur, et une de trop à tenir à jour. */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            flex: 'none',
            mt: 'clamp(7px, 1.2vh, 18px)',
            p: 'clamp(8px, 1.2vh, 16px)',
            borderRadius: '18px',
            background: 'rgba(1,134,117,0.07)',
            border: '1px solid rgba(1,134,117,0.16)',
          }}
        >
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: '#00443A',
                lineHeight: 1.3,
              }}
            >
              Besoin d’un conseil ?
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#4E635D', lineHeight: 1.4, mt: 0.15 }}>
              Un conseiller Kumy répond au {TELEPHONE_CONSEILLER_AFFICHE}.
            </Typography>
          </Box>

          <Box
            component="a"
            href={`tel:${TELEPHONE_CONSEILLER}`}
            aria-label="Parler à un conseiller"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              flexShrink: 0,
              minHeight: 44,
              px: 1.75,
              borderRadius: '999px',
              background: '#018675',
              color: '#FFFFFF',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 13.5,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              '&:active': { background: '#006B5D' },
              '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
            }}
          >
            <CallOutlinedIcon sx={{ fontSize: 18 }} />
            Appeler
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};
