import { useCallback, useEffect, useState, type FunctionComponent } from 'react';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { CheckCircleIcon } from '@/features/Onboarding/components/OnboardingIcons';
import { registerApi } from '@/features/Register/register.api';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';
import { error as errorPalette, neutral, primary } from '@/theme/colors';

/** Traduit l'échec de création en une phrase qui dit quoi faire. */
function messageErreur(erreur: unknown): string {
  if (!(erreur instanceof ApiRequestError)) {
    return 'La création du compte a échoué. Vérifiez votre connexion et réessayez.';
  }
  switch (erreur.status) {
    case 400:
      return 'Votre vérification a expiré. Recommencez depuis votre numéro de téléphone.';
    case 403:
      return 'Ce compte est suspendu. Contactez le support Kumy.';
    case 409:
      return 'Un compte existe déjà pour ce numéro. Connectez-vous avec votre code confidentiel.';
    default:
      return 'La création du compte a échoué. Réessayez dans un instant.';
  }
}

/**
 * Dernier écran : il crée le compte, puis ouvre la session.
 *
 * `POST /auth/phone/register` n'établit aucune session — il pose le code
 * confidentiel comme mot de passe Firebase. On se connecte donc ensuite avec
 * ces mêmes identifiants, comme le fait déjà le parcours par invitation.
 */
export const RegisterResultPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const { phone, registrationToken, profil, adresse, pin, reset } = useRegisterStore();

  const [enCours, setEnCours] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const creer = useCallback(async () => {
    if (
      !phone ||
      !registrationToken ||
      !pin ||
      !profil.birthDate ||
      !adresse.regionId ||
      !adresse.prefectureId ||
      !adresse.sousPrefectureId
    ) {
      setEnCours(false);
      setErreur('Votre inscription est incomplète. Recommencez depuis votre numéro.');
      return;
    }

    setEnCours(true);
    setErreur(null);
    try {
      await registerApi.creerCompte({
        registrationToken,
        firstName: profil.firstName,
        lastName: profil.lastName,
        birthDate: profil.birthDate,
        regionId: adresse.regionId,
        prefectureId: adresse.prefectureId,
        sousPrefectureId: adresse.sousPrefectureId,
        pin,
      });
      await useAuthStore.getState().login(phone, pin);
    } catch (echec) {
      setErreur(messageErreur(echec));
    } finally {
      setEnCours(false);
    }
  }, [phone, registrationToken, pin, profil, adresse]);

  useEffect(() => {
    void creer();
    // Une seule tentative au montage ; le bouton « Réessayer » rappelle `creer`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!phone) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  if (enCours) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 3,
        }}
      >
        <CircularProgress sx={{ color: primary[50] }} />
        <Typography sx={{ mt: 2, color: neutral[50] }}>Création de votre compte…</Typography>
      </Box>
    );
  }

  if (erreur) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          px: 3,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: errorPalette[40], mb: 2 }}>
          Inscription impossible
        </Typography>
        <Typography sx={{ fontSize: 14, color: neutral[50], mb: 3, maxWidth: 280 }}>
          {erreur}
        </Typography>
        <Button
          size="large"
          variant="contained"
          onClick={() => void creer()}
          sx={{ maxWidth: 395, width: '100%' }}
        >
          Réessayer
        </Button>
        <Button
          size="large"
          onClick={() => {
            reset();
            navigate(ROUTES_INSCRIPTION.telephone, { replace: true });
          }}
          sx={{ maxWidth: 395, width: '100%', mt: 1, color: neutral[50] }}
        >
          Recommencer l’inscription
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        px: 3,
        pb: 3,
      }}
    >
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: primary[98],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          '@keyframes scaleIn': {
            from: { transform: 'scale(0.5)', opacity: 0 },
            to: { transform: 'scale(1)', opacity: 1 },
          },
          animation: 'scaleIn 0.5s ease',
        }}
      >
        <CheckCircleIcon />
      </Box>

      <Typography sx={{ fontSize: 24, fontWeight: 700, color: neutral[10], mb: 1.5 }}>
        Compte créé !
      </Typography>
      <Typography sx={{ fontSize: 14, color: neutral[50], lineHeight: 1.5, maxWidth: 280, mb: 4 }}>
        Bienvenue {profil.firstName}, votre compte Kumy est prêt.
      </Typography>

      <Button
        size="large"
        variant="contained"
        onClick={() => {
          reset();
          navigate('/', { replace: true });
        }}
        sx={{ maxWidth: 395, width: '100%', mt: 4 }}
      >
        Accéder à Kumy
      </Button>
    </Box>
  );
};
