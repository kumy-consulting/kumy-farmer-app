import type { FunctionComponent } from 'react';

import PersonRounded from '@mui/icons-material/PersonRounded';
import { Box, Dialog, Stack, Typography } from '@mui/material';

interface ModaleInvitationProfilProps {
  ouverte: boolean;
  onFermer: () => void;
  onCompleter: () => void;
}

/**
 * L'invitation à compléter le profil, proposée une fois par session.
 *
 * Première modale de l'app : `Dialog` de MUI porte le piège de focus et la
 * fermeture au clavier (Échap) plutôt qu'un composant maison qui les
 * réinventerait mal. L'habillage — rayon, vert de marque, Ubuntu — reprend
 * celui des cartes de l'accueil (`CarteEtudeDeSol`) pour ne pas introduire un
 * second langage visuel.
 *
 * La phrase est figée au mot près : aucune promesse chiffrée, aucun
 * « améliorez votre score ».
 */
export const ModaleInvitationProfil: FunctionComponent<ModaleInvitationProfilProps> = ({
  ouverte,
  onFermer,
  onCompleter,
}) => (
  <Dialog
    open={ouverte}
    onClose={onFermer}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: '24px',
        p: 'clamp(20px, 5vw, 28px)',
        fontFamily: "'Ubuntu', sans-serif",
      },
    }}
  >
    <Stack spacing={1.5} alignItems="flex-start">
      <Box
        aria-hidden
        sx={{
          width: 40,
          height: 40,
          borderRadius: '13px',
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(1,134,117,0.10)',
          '& svg': { fontSize: 22, color: '#016557' },
        }}
      >
        <PersonRounded />
      </Box>

      <Typography
        sx={{
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: '#1A1C1B',
          lineHeight: 1.3,
        }}
      >
        Complétez votre profil
      </Typography>

      <Typography sx={{ fontSize: 14.5, color: '#5C5F5E', lineHeight: 1.5 }}>
        Ces réponses nous aident à mieux vous accompagner, et comptent dans votre AgriScore.
      </Typography>

      <Stack sx={{ width: '100%', mt: 1 }} spacing={1}>
        <Box
          component="button"
          type="button"
          onClick={onCompleter}
          sx={{
            appearance: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: 48,
            px: 2.5,
            border: 0,
            borderRadius: '14px',
            background: 'linear-gradient(140deg, #018675 0%, #016557 100%)',
            font: 'inherit',
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 14.5,
            fontWeight: 700,
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'filter 0.2s ease',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            '&:active': { filter: 'brightness(0.96)' },
            '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 3 },
          }}
        >
          Compléter mon profil
        </Box>

        <Box
          component="button"
          type="button"
          onClick={onFermer}
          sx={{
            appearance: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: 44,
            px: 2.5,
            border: 0,
            borderRadius: '14px',
            background: 'transparent',
            font: 'inherit',
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: '#5C5F5E',
            cursor: 'pointer',
            '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 3 },
          }}
        >
          Plus tard
        </Box>
      </Stack>
    </Stack>
  </Dialog>
);
