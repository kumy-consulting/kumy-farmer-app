import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FunctionComponent,
  type ReactNode,
} from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import { registerApi } from '@/features/Register/register.api';
import { MESSAGE_SERVICE_INDISPONIBLE_INSCRIPTION } from '@/features/Register/register.messages';
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
    case 503:
      // Panne transitoire de la lecture du compte Firebase Auth (reprise d'un
      // compte préparé par un partenaire) : le jeton d'inscription est déjà
      // consommé, mais rien n'indique que la saisie de l'agriculteur soit en
      // cause — un texte de « création échouée » raconterait un mensonge.
      return MESSAGE_SERVICE_INDISPONIBLE_INSCRIPTION;
    default:
      return 'La création du compte a échoué. Réessayez dans un instant.';
  }
}

/**
 * Le fond du parcours, posé explicitement.
 *
 * Sans lui, l'écran laissait voir le fond de `index.html` — le crème de l'écran
 * de démarrage. Le dernier écran de l'inscription changeait donc de couleur
 * pour lui seul, après six écrans sur le dégradé menthe.
 */
const Fond: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Box
    sx={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      px: 3,
      py: 4,
      background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)',
    }}
  >
    {children}
  </Box>
);

/** Une rubrique de la carte remise : le libellé en capitales, la valeur dessous. */
const Cle: FunctionComponent<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <Box sx={{ textAlign: 'left' }}>
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color: '#5C5F5E',
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

/** Ce que l'écran garde du parcours avant que le store ne soit vidé. */
interface CarteRemise {
  prenom: string;
  nomComplet: string;
  phone: string;
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
  // Nom et numéro sont recopiés ici avant que le store ne soit vidé : l'écran
  // remet à l'agriculteur les deux clés de son compte, et il ne reste plus rien
  // à lire dans le store une fois le parcours consommé.
  const [carte, setCarte] = useState<CarteRemise | null>(null);

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
      setCarte({
        prenom: profil.firstName,
        nomComplet: `${profil.firstName} ${profil.lastName}`.trim(),
        phone,
      });
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

  // La carte locale survit au vidage du store : une fois le compte créé, un
  // `phone` absent ne signifie plus « arrivée directe sur l'URL ».
  if (!phone && carte === null) return <Navigate to={ROUTES_INSCRIPTION.telephone} replace />;

  if (enCours) {
    return (
      <Fond>
        <CircularProgress sx={{ color: primary[50] }} />
        <Typography sx={{ mt: 2, color: neutral[50] }}>Création de votre compte…</Typography>
      </Fond>
    );
  }

  if (erreur) {
    return (
      <Fond>
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
      </Fond>
    );
  }

  const initiales = carte
    ? carte.nomComplet
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((mot) => mot[0]?.toUpperCase() ?? '')
        .join('')
    : '';

  return (
    <Fond>
      <Typography
        sx={{
          fontFamily: "'Ubuntu', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: '#1A1C1B',
          mb: 0.75,
        }}
      >
        C’est fait{carte ? `, ${carte.prenom}` : ''}.
      </Typography>
      <Typography sx={{ fontSize: 13.5, color: 'rgba(55,75,70,0.68)', maxWidth: 300, mb: 3 }}>
        Voici comment vous reviendrez.
      </Typography>

      {/* La carte que l'agriculteur a composée deux écrans plus tôt lui est
          rendue, tamponnée. Elle porte maintenant les deux clés de son compte :
          le numéro et le code. C'est le seul moment du parcours où les dire
          sert encore à quelque chose. */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 395,
          p: 2.25,
          borderRadius: '22px',
          background: '#FFFFFF',
          border: '1px solid rgba(55,75,70,0.07)',
          boxShadow: '0 10px 26px rgba(1,134,117,0.10)',
          '@keyframes remise': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'none' },
          },
          animation: 'remise 0.45s ease-out',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {/* Le tampon : la seule marque de succès de l'écran. Un disque de 100 px
            au-dessus d'un titre disait « ça a marché » une deuxième fois, en
            plus gros que ce qui a marché. */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -11,
            right: -6,
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(140deg, #018675 0%, #016557 100%)',
            boxShadow: '0 4px 12px rgba(1,134,117,0.35)',
            '& svg': { fontSize: 19, color: '#FFFFFF' },
          }}
        >
          <CheckRounded />
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.75}>
          <Box
            aria-hidden
            sx={{
              flexShrink: 0,
              width: 52,
              height: 52,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: '#FFFFFF',
              background: 'linear-gradient(140deg, #018675 0%, #016557 100%)',
              boxShadow: '0 0 0 5px rgba(1,134,117,0.09)',
            }}
          >
            {initiales}
          </Box>

          <Box sx={{ minWidth: 0, textAlign: 'left' }}>
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 'clamp(15px, 4.4vw, 19px)',
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
                color: '#1A1C1B',
                overflowWrap: 'anywhere',
              }}
            >
              {carte?.nomComplet}
            </Typography>
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#5C5F5E',
                mt: 0.2,
              }}
            >
              Carte d’agriculteur
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ height: '1px', background: 'rgba(55,75,70,0.10)', my: 2 }} />

        <Stack spacing={1.75}>
          <Cle label="Votre numéro">
            <Typography
              sx={{
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 16.5,
                fontWeight: 600,
                color: '#1A1C1B',
                mt: 0.2,
              }}
            >
              {carte ? formatE164ForDisplay(carte.phone) : ''}
            </Typography>
          </Cle>

          {/* Le code ne se réaffiche pas — il s'est choisi il y a trente
              secondes, le montrer n'apprendrait rien et le laisserait traîner à
              l'écran. Six points disent seulement sa longueur. */}
          <Cle label="Votre code">
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 0.7 }}>
              <Stack direction="row" spacing={0.75} aria-hidden>
                {Array.from({ length: 6 }, (_, rang) => (
                  <Box
                    key={rang}
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: 'rgba(1,134,117,0.55)',
                    }}
                  />
                ))}
              </Stack>
              <Typography sx={{ fontSize: 12.5, color: '#8F9291' }}>
                celui que vous venez de choisir
              </Typography>
            </Stack>
          </Cle>
        </Stack>
      </Box>

      {/* Aucun parcours de récupération n'existe encore : le dire ici, une fois,
          calmement, vaut mieux que le laisser découvrir devant un écran de
          connexion. */}
      <Typography
        sx={{ fontSize: 12.5, color: '#5C5F5E', maxWidth: 320, mt: 2, lineHeight: 1.5 }}
      >
        Gardez ce code en tête : personne ne peut le retrouver à votre place.
      </Typography>

      <Button
        size="large"
        variant="contained"
        onClick={() => navigate('/', { replace: true })}
        sx={{ maxWidth: 395, width: '100%', mt: 3 }}
      >
        Accéder à Kumy
      </Button>
    </Fond>
  );
};
