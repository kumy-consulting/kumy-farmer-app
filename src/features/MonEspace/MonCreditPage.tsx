import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { BackButton } from '@/shared/components/BackButton';

import { BlocCredit } from './components/BlocCredit';
import { demoEligibilite, demoProfil } from './monEspace.demo';

/**
 * ⚠️ MAQUETTE — les données viennent de `monEspace.demo`.
 *
 * Le détail du crédit, ouvert depuis la tuile de « Mon espace ».
 *
 * La tuile porte le montant ; cette page porte **ce qui le détermine** : les
 * critères remplis, ceux qui manquent, et la valeur constatée à côté de chacun.
 * C'est le deuxième niveau de la divulgation progressive — « pourquoi ce
 * chiffre, et comment le faire monter ».
 *
 * Aucun bouton « Demander un crédit ». Aucun endpoint de demande n'est ouvert au
 * rôle FARMER, et un bouton mort sur un écran d'argent est la pire promesse que
 * puisse faire ce produit. La page dit à qui s'adresser, ce qui est vrai et
 * actionnable dès aujourd'hui.
 *
 * L'endpoint qui l'alimentera est déjà ouvert au rôle FARMER et n'est appelé
 * nulle part :
 *   GET /scoring/farmers/:id/credit-eligibility
 */
export const MonCreditPage: FunctionComponent = () => {
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
          Mon crédit
        </Typography>
      </Stack>

      <BlocCredit eligibilite={demoEligibilite} sansTitre onVoirScore={() => navigate('/mon-espace/score')} />

      {/* Ce que l'agriculteur peut faire de ce chiffre. Sans cette sortie, la
          page se termine sur une évaluation qu'il ne peut ni contester ni
          utiliser — et c'est son technicien qui monte les dossiers. */}
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
          Pour déposer une demande
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#374B46', lineHeight: 1.5, mt: 0.5 }}>
          Parlez-en à votre technicien lors de sa prochaine visite : c’est lui qui monte le dossier avec vous et le
          transmet à l’organisme de financement.
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', lineHeight: 1.5, mt: 0.9 }}>
          Coopérative de rattachement : {demoProfil.cooperative}
        </Typography>
      </Box>
    </Box>
  );
};
