import { useState, type FunctionComponent } from 'react';

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { CountryCodeSelector } from '@/features/Auth/components/CountryCodeSelector';
import { PhoneNumberInput } from '@/features/Auth/components/PhoneNumberInput';
import { isValidGuineaNumber, toE164 } from '@/features/Auth/phone.util';
import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import {
  Eyebrow,
  FieldCapsule,
  HelpRow,
  Medallion,
  PrimaryButton,
  Subtitle,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { registerApi } from '@/features/Register/register.api';
import { MESSAGE_PLAFOND_SMS } from '@/features/Register/register.messages';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { ApiRequestError } from '@/shared/api/client';
import { BackButton } from '@/shared/components/BackButton';

/**
 * Premier écran de l'inscription autonome : le numéro, et rien d'autre.
 *
 * « Suivant » déclenche l'envoi du code. La réponse est la même pour un numéro
 * connu et pour un numéro inconnu — c'est voulu, et c'est la mesure qui ferme
 * l'énumération des inscrits.
 */
export const RegisterPhonePage: FunctionComponent = () => {
  const navigate = useNavigate();
  const setPhone = useRegisterStore((s) => s.setPhone);
  const reset = useRegisterStore((s) => s.reset);

  const [numeroLocal, setNumeroLocal] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const estValide = isValidGuineaNumber(numeroLocal);

  const handleContinue = async () => {
    if (!estValide || envoiEnCours) return;
    const phone = toE164(numeroLocal);
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      const { resendAfter } = await registerApi.demanderCode(phone);
      // Un numéro neuf repart d'un état propre : le parcours peut avoir été
      // abandonné en cours de route.
      reset();
      setPhone(phone);
      navigate(ROUTES_INSCRIPTION.code, { state: { resendAfter } });
    } catch (echec) {
      // Le délai d'une minute entre deux envois n'est pas une erreur — l'API
      // répond 200 avec le `resendAfter` restant. Un 429 ne dit donc qu'une
      // chose : le plafond horaire est atteint, et parler de connexion ici
      // enverrait le fermier réparer un réseau qui marche.
      setErreur(
        echec instanceof ApiRequestError && echec.status === 429
          ? MESSAGE_PLAFOND_SMS
          : 'Impossible d’envoyer le code. Vérifiez votre connexion et réessayez.',
      );
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <OnboardingLayout>
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <BackButton onClick={() => navigate('/welcome')} label="Retour à l’accueil" />
      </Box>

      <CollapseOnKeyboard>
        <Medallion>
          <CallOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Créer un compte</Eyebrow>

      <Title>Votre numéro de téléphone</Title>

      <Subtitle>Nous vous enverrons un code à 6 chiffres pour le vérifier</Subtitle>

      <FieldCapsule sx={{ mb: 1.75 }}>
        <CountryCodeSelector countryCode="+224" />
        <PhoneNumberInput value={numeroLocal} onChange={setNumeroLocal} placeholder="622 20 13 62" />
      </FieldCapsule>

      <CollapseOnKeyboard>
        <HelpRow sx={{ mb: 3.5 }}>
          Pays : <Box component="span">Guinée</Box> · Format local à 9 chiffres
        </HelpRow>
      </CollapseOnKeyboard>

      {erreur && <ErrorBanner mb={2}>{erreur}</ErrorBanner>}

      <PrimaryButton
        onClick={() => void handleContinue()}
        disabled={!estValide || envoiEnCours}
        endIcon={envoiEnCours ? undefined : <ArrowForwardRoundedIcon sx={{ fontSize: 20 }} />}
      >
        {envoiEnCours ? <CircularProgress size={22} color="inherit" /> : 'Suivant'}
      </PrimaryButton>
    </OnboardingLayout>
  );
};
