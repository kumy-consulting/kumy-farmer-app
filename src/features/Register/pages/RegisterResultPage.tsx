import { useCallback, useEffect, useRef, useState, type FunctionComponent } from 'react';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { CheckCircleIcon } from '@/features/Onboarding/components/OnboardingIcons';
import { registerApi } from '@/features/Register/register.api';
import { ROUTES_INSCRIPTION } from '@/features/Register/register.routing';
import { useRegisterStore } from '@/features/Register/register.store';
import { ApiRequestError } from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/authStore';
import { error as errorPalette, neutral, primary } from '@/theme/colors';

/** Le compte existe (la création a réussi) mais la connexion qui suit a échoué. */
const MESSAGE_CONNEXION_APRES_CREATION =
  'Votre compte a bien été créé, mais la connexion a échoué. Réessayez : nous allons à nouveau tenter de vous connecter.';

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
  // Le prénom est recopié ici avant que le store ne soit vidé : l'écran de
  // succès salue l'agriculteur par son prénom, et il ne reste plus rien à lire
  // dans le store une fois le parcours consommé.
  const [prenom, setPrenom] = useState<string | null>(null);

  // Des refs, pas de l'état : elles ne doivent déclencher aucun rendu, et
  // doivent survivre intactes à la double invocation de StrictMode.
  //
  // `creationReussie` mémorise que le jeton a déjà été consommé avec succès :
  // toute tentative suivante (bouton « Réessayer » après un échec de
  // connexion, ou double montage en dev) doit sauter `creerCompte` et ne
  // rejouer que la connexion — rejouer la création est certain d'échouer, le
  // jeton étant à usage unique côté serveur.
  //
  // `enVol` empêche qu'une deuxième exécution démarre pendant qu'une première
  // est encore en cours : c'est ce qui protège du double montage StrictMode
  // (mount → cleanup → mount, synchrone) et d'un double clic sur « Réessayer ».
  const creationReussie = useRef(false);
  const enVol = useRef(false);

  const creer = useCallback(async () => {
    if (enVol.current) return;

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

    enVol.current = true;
    setEnCours(true);
    setErreur(null);
    try {
      if (!creationReussie.current) {
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
        creationReussie.current = true;
      }
      await useAuthStore.getState().login(phone, pin);
      // Le parcours est fini : le jeton est dépensé et le code confidentiel n'a
      // plus à traîner en mémoire. Sans ce vidage, un retour matériel Android
      // ramènerait à l'écran du code confidentiel, et le valider à nouveau
      // rejouerait `creerCompte` avec un jeton déjà consommé — on annoncerait
      // une vérification expirée à quelqu'un qui a désormais un compte.
      setPrenom(profil.firstName);
      reset();
    } catch (echec) {
      // Le compte peut exister alors même que la connexion échoue (un simple
      // aléa réseau entre les deux appels suffit) : dire au fermier que la
      // création a échoué serait faux, et « Réessayer » ne pourrait de toute
      // façon plus rejouer une création déjà réussie.
      setErreur(creationReussie.current ? MESSAGE_CONNEXION_APRES_CREATION : messageErreur(echec));
    } finally {
      setEnCours(false);
      enVol.current = false;
    }
  }, [phone, registrationToken, pin, profil, adresse, reset]);

  useEffect(() => {
    void creer();
    // Une seule tentative au montage ; le bouton « Réessayer » rappelle `creer`.
    // Les refs `enVol` / `creationReussie` protègent cette invocation contre le
    // double montage de StrictMode (dev uniquement) — pas ce tableau de
    // dépendances, qui reste volontairement vide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le prénom local survit au vidage du store : une fois le compte créé, un
  // `phone` absent ne signifie plus « arrivée directe sur l'URL ».
  if (!phone && prenom === null) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

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
        Bienvenue {prenom}, votre compte Kumy est prêt.
      </Typography>

      <Button
        size="large"
        variant="contained"
        onClick={() => navigate('/', { replace: true })}
        sx={{ maxWidth: 395, width: '100%', mt: 4 }}
      >
        Accéder à Kumy
      </Button>
    </Box>
  );
};
