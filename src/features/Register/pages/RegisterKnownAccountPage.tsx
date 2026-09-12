import type { FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { Box, Stack, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import {
  Medallion,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';

/**
 * Le numéro porte déjà un compte en service. Rien à créer : on le dit, et on
 * ouvre la porte de la connexion avec le numéro déjà vérifié — l'agriculteur
 * n'a plus qu'à taper son code.
 *
 * **Le numéro est le sujet de l'écran, pas un rappel.** Il portait le même
 * habit que sur l'écran du code et sur celui du PIN — une pastille teinte
 * discrète — alors qu'il y sert de rappel et qu'ici il EST la nouvelle : c'est
 * ce numéro-là qui a déjà un compte. Il passe donc en pastille blanche, à
 * l'encre, précédé de la coche de sa vérification.
 *
 * **Trois phrases disaient la même chose.** Sourcil « COMPTE EXISTANT », titre
 * « Vous avez déjà un compte », sous-titre « Ce numéro est déjà rattaché à un
 * compte Kumy » : la nouvelle était annoncée trois fois avant qu'on propose
 * quoi que ce soit. Le sourcil part — il n'y a pas de progression à repérer sur
 * cette branche, elle s'arrête ici — et le sous-titre dit maintenant ce que
 * personne ne disait : la vérification vient d'avoir lieu, il ne reste que le
 * code.
 */
export const RegisterKnownAccountPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const phone = useRegisterStore((s) => s.phone);
  const reset = useRegisterStore((s) => s.reset);

  if (!phone) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const handleConnexion = () => {
    reset();
    navigate('/auth/pin-entry', { state: { phone } });
  };

  return (
    <OnboardingLayout>
      <Medallion>
        <HowToRegRoundedIcon />
      </Medallion>

      <Title sx={{ mb: 2 }}>Vous avez déjà un compte</Title>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.1}
        sx={{
          px: 1.75,
          py: 1,
          borderRadius: 999,
          background: '#FFFFFF',
          border: '1px solid rgba(55,75,70,0.07)',
          boxShadow: '0 6px 18px rgba(1,134,117,0.10)',
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(140deg, #018675 0%, #016557 100%)',
            '& svg': { fontSize: 13, color: '#FFFFFF' },
          }}
        >
          <CheckRounded />
        </Box>
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: '#1A1C1B',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatE164ForDisplay(phone)}
        </Typography>
      </Stack>

      <Subtitle sx={{ mt: 1.5, mb: 3.5 }}>
        Ce numéro vient d’être vérifié : il ne reste que votre code confidentiel.
      </Subtitle>

      <PrimaryButton onClick={handleConnexion}>Me connecter</PrimaryButton>

      <TextLink
        onClick={() => {
          reset();
          navigate(ROUTES_INSCRIPTION.telephone);
        }}
        sx={{ mt: 1.5, color: '#5C5F5E' }}
      >
        Utiliser un autre numéro
      </TextLink>
    </OnboardingLayout>
  );
};
