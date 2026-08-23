import type { FunctionComponent } from 'react';

import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { Navigate, useNavigate } from 'react-router-dom';

import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import {
  Eyebrow,
  Medallion,
  PhoneChip,
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

      <Eyebrow>Compte existant</Eyebrow>

      <Title>Vous avez déjà un compte</Title>

      <Subtitle sx={{ mb: 2 }}>
        Ce numéro est déjà rattaché à un compte Kumy. Connectez-vous avec votre code confidentiel.
      </Subtitle>

      <PhoneChip sx={{ mb: 3.5 }}>{formatE164ForDisplay(phone)}</PhoneChip>

      <PrimaryButton onClick={handleConnexion}>Me connecter</PrimaryButton>

      <TextLink
        onClick={() => {
          reset();
          navigate(ROUTES_INSCRIPTION.telephone);
        }}
        sx={{ mt: 1.5, color: 'rgba(55,75,70,0.62)' }}
      >
        Utiliser un autre numéro
      </TextLink>
    </OnboardingLayout>
  );
};
