import { useState, type FunctionComponent } from 'react';

import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { PinDisplay } from '@/features/Auth/components/PinDisplay';
import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import { OnboardingStepper } from '@/features/Onboarding/components/OnboardingStepper';
import {
  Eyebrow,
  Medallion,
  PhoneChip,
  PrimaryButton,
  Subtitle,
  TextLink,
  Title,
} from '@/features/Onboarding/onboarding.styled';
import { CollapseOnKeyboard, OnboardingLayout } from '@/features/Onboarding/OnboardingLayout';
import { registerApi } from '@/features/Register/register.api';
import { MESSAGE_PLAFOND_SMS } from '@/features/Register/register.messages';
import { ecranApresVerification, ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { useResendCountdown } from '@/features/Register/useResendCountdown';
import { ApiRequestError } from '@/shared/api/client';
import { BackButton } from '@/shared/components/BackButton';

const DELAI_RENVOI_PAR_DEFAUT = 60;

/**
 * Le code reçu par SMS. C'est ici que le parcours bifurque : la vérification
 * rapporte le statut du compte, et l'aiguillage — une fonction pure, testée à
 * part — décide de l'écran suivant.
 */
export const RegisterCodePage: FunctionComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = useRegisterStore((s) => s.phone);
  const setVerification = useRegisterStore((s) => s.setVerification);

  const delaiInitial =
    (location.state as { resendAfter?: number } | null)?.resendAfter ?? DELAI_RENVOI_PAR_DEFAUT;

  const [code, setCode] = useState('');
  const [clavierOuvert, setClavierOuvert] = useState(false);
  const [verificationEnCours, setVerificationEnCours] = useState(false);
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const { secondesRestantes, relancer } = useResendCountdown(delaiInitial);

  // Arrivée directe sur l'URL, sans numéro en mémoire : rien à vérifier.
  if (!phone) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  const handleVerifier = async () => {
    if (code.length !== 6 || verificationEnCours) return;
    setVerificationEnCours(true);
    setErreur(null);
    try {
      const { registrationToken, account } = await registerApi.verifierCode(phone, code);
      setVerification(registrationToken, account);
      navigate(ecranApresVerification(account.statut));
    } catch {
      setCode('');
      setErreur('Ce code est incorrect ou a expiré. Vérifiez-le, ou demandez-en un nouveau.');
    } finally {
      setVerificationEnCours(false);
    }
  };

  const handleRenvoyer = async () => {
    if (secondesRestantes > 0 || renvoiEnCours) return;
    setRenvoiEnCours(true);
    setErreur(null);
    try {
      const { resendAfter } = await registerApi.demanderCode(phone);
      relancer(resendAfter);
      setCode('');
    } catch (echec) {
      // Idem qu'au premier écran : seul le plafond horaire produit un 429, le
      // délai d'une minute passant par une réponse 200.
      setErreur(
        echec instanceof ApiRequestError && echec.status === 429
          ? MESSAGE_PLAFOND_SMS
          : 'Impossible de renvoyer le code. Vérifiez votre connexion.',
      );
    } finally {
      setRenvoiEnCours(false);
    }
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
        <BackButton
          onClick={() => navigate(ROUTES_INSCRIPTION.telephone)}
          label="Changer de numéro"
        />
      </Box>

      <OnboardingStepper current={0} total={4} />

      <CollapseOnKeyboard>
        <Medallion>
          <SmsOutlinedIcon />
        </Medallion>
      </CollapseOnKeyboard>

      <Eyebrow>Vérification</Eyebrow>

      <Title>Entrez le code reçu</Title>

      <Subtitle sx={{ mb: 1.5 }}>Un code à 6 chiffres vient de vous être envoyé par SMS</Subtitle>

      <PhoneChip sx={{ mb: 3 }}>{formatE164ForDisplay(phone)}</PhoneChip>

      <PinDisplay
        pin={code}
        maxLength={6}
        onChange={(valeur) => {
          setCode(valeur);
          if (erreur) setErreur(null);
        }}
        onFocusChange={setClavierOuvert}
        inputLabel="Code de vérification"
      />

      {erreur && <ErrorBanner mb={2}>{erreur}</ErrorBanner>}

      <PrimaryButton
        onClick={() => void handleVerifier()}
        disabled={code.length !== 6 || verificationEnCours}
        sx={{ mt: 1 }}
      >
        {verificationEnCours ? <CircularProgress size={22} color="inherit" /> : 'Vérifier'}
      </PrimaryButton>

      {/* Le compte à rebours porte l'attente : un bouton qui reste actif et
          échoue en silence ne dirait rien de l'intervalle imposé. */}
      <TextLink
        onClick={() => void handleRenvoyer()}
        disabled={secondesRestantes > 0 || renvoiEnCours}
        sx={{ mt: 1.5, color: 'rgba(55,75,70,0.62)' }}
      >
        {secondesRestantes > 0 ? `Renvoyer le code (${secondesRestantes} s)` : 'Renvoyer le code'}
      </TextLink>
    </OnboardingLayout>
  );
};
