import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { BackButton } from '@/shared/components/BackButton';

import { BlocScore } from './components/BlocScore';
import { demoScore } from './monEspace.demo';

/**
 * ⚠️ MAQUETTE — les données viennent de `monEspace.demo`.
 *
 * Le détail du score, ouvert depuis la tuile de « Mon espace ».
 *
 * La tuile porte le nombre ; cette page porte **ce qui le compose**. Un score
 * global seul est un jugement : on le subit. Les six piliers, avec leur poids et
 * leur phrase d'explication, le rendent actionnable — on y lit ce qui pèse, ce
 * qui va, et sur quoi agir en premier.
 *
 * Les piliers sont triés du plus faible au plus fort, comme les critères du
 * crédit : ce qui manque se lit d'abord.
 *
 * L'endpoint qui l'alimentera est déjà ouvert au rôle FARMER et n'est appelé
 * nulle part :
 *   GET /scoring/farmers/:id
 */
export const MonScorePage: FunctionComponent = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)',
        px: 2.5,
        pt: 'max(calc(env(safe-area-inset-top, 0px) + 14px), 46px)',
        pb: 4,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.25 }}>
        <BackButton onClick={() => navigate('/mon-espace')} label="Retour à Mon espace" />
        <Typography
          component="h1"
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: '0.005em',
            color: '#1A1C1B',
            minWidth: 0,
            m: 0,
          }}
          noWrap
        >
          Mon score
        </Typography>
      </Stack>

      <BlocScore score={demoScore} sansTitre />

      {/* À quoi sert ce nombre. Sans cette note, l'agriculteur voit une note
          scolaire sans savoir qui la lit ni ce qu'elle lui ouvre — et il ne
          peut pas la contester non plus. */}
      <Box
        sx={{
          mt: 2.5,
          p: 2,
          borderRadius: '16px',
          background: 'rgba(1,134,117,0.055)',
          border: '1px solid rgba(1,134,117,0.16)',
        }}
      >
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: '#1A1C1B' }}>
          À quoi sert ce score
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#374B46', lineHeight: 1.5, mt: 0.5 }}>
          Il résume votre dossier pour les organismes de financement : plus il monte, plus le montant que vous pouvez
          demander augmente. Il se recalcule tout seul à mesure que vous suivez vos campagnes.
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', lineHeight: 1.5, mt: 0.9 }}>
          Une note vous semble injuste ? Signalez-la à votre technicien : lui seul peut faire corriger les données de
          votre dossier.
        </Typography>
      </Box>
    </Box>
  );
};
