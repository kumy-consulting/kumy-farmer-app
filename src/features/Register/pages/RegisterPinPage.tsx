import { useState, type FunctionComponent } from 'react';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { PinDisplay } from '@/features/Auth/components/PinDisplay';
import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import {
  Eyebrow,
  Medallion,
  PrimaryButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { BackButton } from '@/shared/components/BackButton';

/**
 * Le code confidentiel, saisi puis confirmé.
 *
 * Deux saisies plutôt qu'une : ce code sera le seul moyen d'entrer, et il n'y
 * a pas encore de parcours de réinitialisation. Une faute de frappe non
 * détectée fermerait le compte le jour même de sa création.
 */
export const RegisterPinPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const registrationToken = useRegisterStore((s) => s.registrationToken);
  const setPin = useRegisterStore((s) => s.setPin);

  const [etape, setEtape] = useState<'saisie' | 'confirmation'>('saisie');
  const [premier, setPremier] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [clavierOuvert, setClavierOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!registrationToken) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const enConfirmation = etape === 'confirmation';
  const valeur = enConfirmation ? confirmation : premier;

  const handleValider = () => {
    if (valeur.length !== 6) return;
    if (!enConfirmation) {
      setEtape('confirmation');
      setErreur(null);
      return;
    }
    if (confirmation !== premier) {
      setConfirmation('');
      setErreur('Les deux codes ne correspondent pas. Recommencez la confirmation.');
      return;
    }
    setPin(premier);
    navigate(ROUTES_INSCRIPTION.resultat);
  };

  const handleRetour = () => {
    if (enConfirmation) {
      setEtape('saisie');
      setConfirmation('');
      setErreur(null);
      return;
    }
    navigate(ROUTES_INSCRIPTION.adresse);
  };

  return (
    <OnboardingLayout keyboardOpen={clavierOuvert}>
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <BackButton onClick={handleRetour} label="Retour" />
      </Box>

      <OnboardingStepper current={3} total={4} />

      <CollapseOnKeyboard>
        <Medallion>
          <LockOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Sécurité</Eyebrow>

      <Title>{enConfirmation ? 'Confirmez votre code' : 'Créez votre code secret'}</Title>

      <Subtitle sx={{ mb: 1.5 }}>
        {enConfirmation
          ? 'Saisissez à nouveau les 6 chiffres pour les confirmer'
          : 'Choisissez un code à 6 chiffres — il vous servira à vous connecter'}
      </Subtitle>

      <PinDisplay
        // La clé force un composant neuf entre les deux étapes : sans elle, la
        // confirmation hériterait de l'affichage de la première saisie.
        key={etape}
        pin={valeur}
        maxLength={6}
        onChange={(saisi) => {
          if (erreur) setErreur(null);
          if (enConfirmation) setConfirmation(saisi);
          else setPremier(saisi);
        }}
        onFocusChange={setClavierOuvert}
        inputLabel={enConfirmation ? 'Confirmation du code confidentiel' : 'Code confidentiel'}
      />

      {erreur && <ErrorBanner mb={2}>{erreur}</ErrorBanner>}

      <PrimaryButton onClick={handleValider} disabled={valeur.length !== 6} sx={{ mt: 1 }}>
        {enConfirmation ? 'Valider' : 'Continuer'}
      </PrimaryButton>
    </OnboardingLayout>
  );
};
