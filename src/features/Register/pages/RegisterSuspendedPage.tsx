import type { FunctionComponent } from 'react';

import LockPersonRoundedIcon from '@mui/icons-material/LockPersonRounded';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  Eyebrow,
  HelpRow,
  Medallion,
  OutlinedButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';

/** Le numéro du support, affiché en clair : c'est la seule issue depuis cet écran. */
const SUPPORT_TELEPHONE = '+224 622 20 13 62';

/**
 * Un compte suspendu mérite son propre écran. L'envoyer se connecter le
 * heurterait à un refus qu'il ne saurait pas interpréter, et l'inviter à
 * s'inscrire lui promettrait un compte qu'il ne pourra pas obtenir.
 */
export const RegisterSuspendedPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const reset = useRegisterStore((s) => s.reset);

  return (
    <OnboardingLayout>
      <Medallion>
        <LockPersonRoundedIcon />
      </Medallion>

      <Eyebrow>Compte suspendu</Eyebrow>

      <Title>Ce compte est suspendu</Title>

      <Subtitle sx={{ mb: 2.5 }}>
        L’accès à ce numéro a été suspendu. Seul le support Kumy peut le rétablir — l’inscription ne
        le remplacera pas.
      </Subtitle>

      <HelpRow sx={{ mb: 3.5 }}>
        Support : <Box component="span">{SUPPORT_TELEPHONE}</Box>
      </HelpRow>

      <OutlinedButton
        onClick={() => {
          reset();
          navigate(ROUTES_INSCRIPTION.telephone);
        }}
      >
        Utiliser un autre numéro
      </OutlinedButton>
    </OnboardingLayout>
  );
};
