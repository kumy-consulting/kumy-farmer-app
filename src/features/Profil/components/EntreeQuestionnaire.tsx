import type { FunctionComponent } from 'react';

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { MarqueurQuestionnaire } from '../profil.types';

interface EntreeQuestionnaireProps {
  marqueur: MarqueurQuestionnaire;
  onOuvrir: () => void;
}

/** Nombre total d'étapes du questionnaire — voir `QuestionnaireProfilPage`. */
const NB_ETAPES = 3;

/**
 * La sous-ligne d'avancement : trois formulations pour trois états, jamais
 * un pourcentage. « 2 étapes sur 3 » se comprend d'un coup d'œil ; un
 * pourcentage obligerait à calculer ce qu'il reste à faire.
 */
function sousLigne(marqueur: MarqueurQuestionnaire): string {
  if (marqueur.completedAt !== null) return 'Vos réponses aident à mieux vous accompagner';
  if (marqueur.step > 0) return `${marqueur.step} étape${marqueur.step > 1 ? 's' : ''} sur ${NB_ETAPES}`;
  return 'Quelques questions pour affiner votre suivi';
}

/**
 * L'entrée permanente vers le questionnaire de profil, posée dans « Mes
 * informations ».
 *
 * Même forme que `CarteBonnesPratiques` : une rangée cliquable dans son
 * entier plutôt qu'un bouton isolé — viser une cible étroite au pouce, sur un
 * téléphone tenu d'une main dans un champ, ne va pas de soi.
 *
 * **Reste ouvrable une fois complété.** Le questionnaire n'est pas un geste
 * qu'on fait une fois pour toutes : une situation change (une nouvelle
 * cooperative, une parcelle de plus), et rien ne doit empêcher d'y revenir
 * corriger une réponse. D'où l'absence de coche finale qui figerait l'entrée.
 */
export const EntreeQuestionnaire: FunctionComponent<EntreeQuestionnaireProps> = ({ marqueur, onOuvrir }) => {
  const complete = marqueur.completedAt !== null;

  return (
    <Box
      component="button"
      type="button"
      onClick={onOuvrir}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        mt: 2,
        py: 'clamp(7px, 1vh, 10px)',
        px: 1.25,
        borderRadius: '16px',
        background: '#F2F7F4',
        border: '1px solid rgba(1,134,117,0.14)',
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit',
        '&:active': { background: '#E7F1EC' },
        '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(1,134,117,0.10)',
          color: '#016557',
        }}
      >
        <AssignmentIndRoundedIcon sx={{ fontSize: 24 }} />
      </Box>

      <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: '#1A1C1B',
            lineHeight: 1.3,
          }}
        >
          {complete ? 'Profil complété' : 'Compléter mon profil'}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.15, lineHeight: 1.4 }}>
          {sousLigne(marqueur)}
        </Typography>
      </Stack>

      <Box
        aria-hidden
        sx={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#018675',
          color: '#FFFFFF',
        }}
      >
        <ArrowForwardRoundedIcon sx={{ fontSize: 19 }} />
      </Box>
    </Box>
  );
};
