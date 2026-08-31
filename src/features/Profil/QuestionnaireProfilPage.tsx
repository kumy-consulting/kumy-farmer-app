import { useEffect, useState, type FunctionComponent } from 'react';

import AgricultureRoundedIcon from '@mui/icons-material/AgricultureRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import TerrainRoundedIcon from '@mui/icons-material/TerrainRounded';
import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { BackButton } from '@/shared/components/BackButton';

import {
  NOMS_ETAPES,
  PANNEAUX,
  estDernierDeSonEtape,
  premierPanneauDe,
  progressionDansEtape,
  type NumeroEtape,
} from './components/parcoursPanneaux';
import type { ReponsesQuestionnaire } from './profil.types';
import { useQuestionnaireProfil } from './useQuestionnaireProfil';

/** Étape serveur — jamais 0, la première étape non répondue est la 1. */
type Etape = NumeroEtape;

/**
 * Champs obligatoires par étape, tels que le serveur les attend. Chaque panneau
 * valide déjà les siens ; cette table est le filet posé juste avant l'envoi,
 * qui rattrape le cas d'une reprise arrivée au milieu d'une étape avec un champ
 * antérieur resté vide.
 */
const OBLIGATOIRES: Record<Etape, (keyof ReponsesQuestionnaire)[]> = {
  1: ['nomComplet', 'dateNaissance', 'genre', 'niveauEducation'],
  2: ['farmingExperience', 'estMembreCooperative', 'compteCreditRural'],
  3: ['regionId', 'prefectureId', 'sousPrefectureId', 'hectares', 'primaryCrops', 'foncier'],
};

/** Valide une liste de champs — sans elle, on écrirait une étape incomplète et le marqueur avancerait à tort. */
function valider(champs: (keyof ReponsesQuestionnaire)[], reponses: ReponsesQuestionnaire): Record<string, string> {
  const manquants: Record<string, string> = {};
  for (const champ of champs) {
    const valeur = reponses[champ];
    const vide =
      valeur === undefined || valeur === null || valeur === '' || (Array.isArray(valeur) && valeur.length === 0);
    if (vide) manquants[champ] = 'Cette réponse est nécessaire.';
  }
  return manquants;
}

/**
 * Le rail d'avancement : trois segments nommés, celui de l'étape courante
 * rempli au prorata des panneaux déjà passés.
 *
 * Remplace les pastilles « 1 — 2 — 3 ». Elles ne disaient qu'un rang ; ces
 * segments disent aussi de quoi chaque étape parle, avec les mots exacts que
 * l'invitation (`ModaleInvitationProfil`) a promis : Vous, Parcours,
 * Exploitation. Et parce qu'une étape tient en plusieurs écrans, un numéro figé
 * aurait donné l'impression de ne pas avancer d'un écran à l'autre — la barre
 * qui se remplit, elle, bouge à chaque « Suivant ».
 */
const RailEtapes: FunctionComponent<{ etape: Etape; progression: number }> = ({ etape, progression }) => (
  <Stack
    direction="row"
    spacing={1}
    role="group"
    aria-label={`Étape ${etape} sur 3 : ${NOMS_ETAPES[etape]}`}
    sx={{ width: '100%' }}
  >
    {([1, 2, 3] as const).map((numero) => {
      const remplissage = numero < etape ? 1 : numero === etape ? progression : 0;
      return (
        <Box key={numero} aria-hidden sx={{ flex: '1 1 0', minWidth: 0 }}>
          <Box sx={{ height: 4, borderRadius: 999, background: 'rgba(55,75,70,0.10)', overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${remplissage * 100}%`,
                borderRadius: 999,
                background: 'linear-gradient(90deg, #018675 0%, #016557 100%)',
                transition: 'width 0.35s ease',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            />
          </Box>
          <Typography
            noWrap
            sx={{
              mt: 0.7,
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 'clamp(9.5px, 2.7vw, 10.5px)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: numero <= etape ? '#016557' : 'rgba(55,75,70,0.42)',
            }}
          >
            {NOMS_ETAPES[numero]}
          </Typography>
        </Box>
      );
    })}
  </Stack>
);

/** Un visage par étape — la personne, le parcours agricole, la terre. */
const ICONES_ETAPES: Record<Etape, typeof PersonRounded> = {
  1: PersonRounded,
  2: AgricultureRoundedIcon,
  3: TerrainRoundedIcon,
};

/**
 * Le médaillon d'`agripilot-pwa` (`ParcelName.styles.ts`) : disque nacré,
 * halo teal, anneau pointillé qui tourne très lentement.
 *
 * Il ne paraît qu'au-dessus de 760 px de haut, et disparaît dès qu'un message
 * d'erreur s'affiche — exactement comme la PWA le retire quand le clavier
 * s'ouvre : il occupe la place qui reste, et cette place appartient d'abord à
 * ce qu'il y a à corriger. Une image ne doit jamais pousser hors de l'écran la
 * phrase qui dit quoi réparer.
 * Une icône par étape plutôt qu'une par panneau — huit images pour huit écrans
 * seraient de la décoration ; trois donnent un visage à chaque étape.
 */
const MedaillonEtape: FunctionComponent<{ etape: Etape }> = ({ etape }) => {
  const Icone = ICONES_ETAPES[etape];
  return (
    <Box
      aria-hidden
      sx={{
        flex: 'none',
        alignSelf: 'center',
        display: 'none',
        '@media (min-height: 760px)': { display: 'flex' },
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        mt: 'clamp(10px, 2vh, 22px)',
width: 'min(176px, 20.5vh)',
        aspectRatio: '1 / 1',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-14%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(1,134,117,0.22) 0%, rgba(1,134,117,0.06) 45%, transparent 72%)',
          filter: 'blur(6px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '-4%',
          borderRadius: '50%',
          border: '1px dashed rgba(1,134,117,0.28)',
          animation: 'medaillonRotation 70s linear infinite',
        },
        '@keyframes medaillonRotation': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        '@media (prefers-reduced-motion: reduce)': { '&::after': { animation: 'none' } },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: 'radial-gradient(circle at 30% 25%, #FFFFFF 0%, #F7FBF6 55%, #EEF4EA 100%)',
          border: '1px solid rgba(1,134,117,0.18)',
          boxShadow:
            '0 18px 40px rgba(1,134,117,0.22), 0 2px 0 rgba(255,255,255,0.9) inset, 0 -20px 40px rgba(1,134,117,0.05) inset',
          '& svg': { fontSize: 'min(68px, 8vh)', color: '#018675', opacity: 0.9 },
        }}
      >
        <Icone />
      </Box>
    </Box>
  );
};

/**
 * Le bouton d'action principal — « Suivant » aux deux premières étapes,
 * « Enregistrer » à la troisième : la fin du parcours ne se nomme pas comme
 * une étape de plus.
 */
const BoutonPrincipal: FunctionComponent<{ derniere: boolean; disabled: boolean; onClick: () => void }> = ({
  derniere,
  disabled,
  onClick,
}) => (
  <Box
    component="button"
    type="button"
    disabled={disabled}
    onClick={onClick}
    sx={{
      flex: '1 1 0',
      minHeight: 56,
      border: 'none',
      borderRadius: '16px',
      fontFamily: "'Ubuntu', sans-serif",
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: '0.02em',
      color: '#FFFFFF',
      background: 'linear-gradient(135deg, #018675 0%, #016557 100%)',
      boxShadow: '0 8px 20px rgba(1,134,117,0.32), 0 1px 0 rgba(255,255,255,0.2) inset',
      cursor: disabled ? 'default' : 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      '&:active': { transform: 'scale(0.985)' },
      '&:disabled': {
        background: 'rgba(1,134,117,0.16)',
        color: 'rgba(1,134,117,0.55)',
        boxShadow: 'none',
      },
      '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
    }}
  >
    {derniere ? 'Enregistrer' : 'Suivant'}
  </Box>
);

/**
 * L'écran de confirmation promis par la spec (§Écrans) : « un écran de
 * confirmation sobre, puis retour à l'accueil. » Sobre veut dire sobre — une
 * coche, une phrase qui accuse réception, un bouton. Reprend le vocabulaire
 * visuel de `CarteEtudeDeSol` (état « Demande envoyée ») plutôt que d'inventer
 * une deuxième façon de dire « c'est fait » dans la même app.
 */
const ConfirmationEnvoi: FunctionComponent<{ onRetour: () => void }> = ({ onRetour }) => (
  <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ flex: '1 1 auto', textAlign: 'center' }}>
    <Box
      aria-hidden
      sx={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(1,134,117,0.10)',
        '& svg': { fontSize: 28, color: '#016557' },
      }}
    >
      <CheckCircleRoundedIcon />
    </Box>

    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 17.5, fontWeight: 700, color: '#1A1C1B' }}>
      Merci, votre profil est enregistré
    </Typography>
    <Typography sx={{ fontSize: 13.5, color: '#5C5F5E', lineHeight: 1.5, maxWidth: 300 }}>
      Ces informations nous aident à mieux vous accompagner.
    </Typography>

    <Box
      component="button"
      type="button"
      onClick={onRetour}
      sx={{
        mt: 1.5,
        minHeight: 48,
        minWidth: 220,
        px: 3,
        border: 'none',
        borderRadius: '999px',
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 14.5,
        fontWeight: 700,
        color: '#FFFFFF',
        background: 'linear-gradient(135deg, #018675 0%, #016557 100%)',
        cursor: 'pointer',
        '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
      }}
    >
      Retour à l’accueil
    </Box>
  </Stack>
);

/**
 * Le questionnaire de profil en trois étapes.
 *
 * Vit hors d'`AppLayout` (voir `src/shared/routes/index.tsx`) : c'est
 * justement le compte encore sans domaine — celui pour qui `AppLayout` rend
 * l'écran d'attente à la place de l'`Outlet` — que ce questionnaire vise en
 * premier.
 *
 * La validation locale précède l'envoi : sans elle, on écrirait une étape
 * incomplète côté serveur et le marqueur `profileSurvey.step` avancerait à
 * tort, empêchant l'agriculteur de revenir compléter ce qu'il a manqué.
 */
export const QuestionnaireProfilPage: FunctionComponent = () => {
  const navigate = useNavigate();
  const {
    reponses,
    setReponses,
    etapeCourante,
    isLoading,
    isSending,
    error,
    echecChargement,
    rechargerProfil,
    envoyerEtape,
  } = useQuestionnaireProfil();
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  // `etapeCourante` du hook ne bouge qu'au chargement (reprise) ; entre les
  // deux, l'écran garde son propre curseur de panneau pour avancer/reculer.
  const [indexPanneau, setIndexPanneau] = useState(0);
  const [etapeAlignee, setEtapeAlignee] = useState(false);
  // Masque le message d'échec du hook quand l'agriculteur revient en arrière :
  // sans ça, la bannière « Envoi impossible » resterait affichée sur un panneau
  // sans plus aucun rapport avec ce qu'elle commente. Le hook ne pose pas de
  // setter public sur `error` (il le remet à zéro lui-même au prochain
  // `envoyerEtape`) — cet effet resynchronise donc l'écran à chaque changement
  // réel du message, pour ne pas rester désynchronisé après.
  const [erreurMasquee, setErreurMasquee] = useState(false);
  // Passe à `true` une fois l'étape 3 envoyée avec succès — remplace tout
  // l'écran par `ConfirmationEnvoi` plutôt que de naviguer directement.
  const [confirme, setConfirme] = useState(false);

  useEffect(() => {
    setErreurMasquee(false);
  }, [error]);

  // Reprise : on rouvre au premier panneau de l'étape que le serveur attend.
  if (!isLoading && !etapeAlignee) {
    setIndexPanneau(premierPanneauDe(etapeCourante));
    setEtapeAlignee(true);
  }

  const panneau = PANNEAUX[indexPanneau];
  const derniereEtape = panneau.etape === 3;
  const envoiIci = estDernierDeSonEtape(indexPanneau);

  const precedent = () => {
    setErreurs({});
    setErreurMasquee(true);
    setIndexPanneau((i) => Math.max(0, i - 1));
  };

  const suivant = async () => {
    // Ce panneau d'abord : on ne reproche à l'agriculteur que ce qu'il a sous
    // les yeux. Les champs des panneaux suivants ne sont pas encore posés.
    const manquants = valider(panneau.obligatoires, reponses);
    setErreurs(manquants);
    if (Object.keys(manquants).length > 0) return;

    // Au milieu d'une étape, rien ne part sur le réseau : on avance d'un écran.
    if (!envoiIci) {
      setErreurMasquee(true);
      setIndexPanneau((i) => i + 1);
      return;
    }

    // Dernier panneau de l'étape : filet sur l'étape entière avant l'envoi.
    const manquantsEtape = valider(OBLIGATOIRES[panneau.etape], reponses);
    if (Object.keys(manquantsEtape).length > 0) {
      setErreurs(manquantsEtape);
      // Le champ vide est resté derrière : on y ramène plutôt que de bloquer
      // sur un écran qui ne le montre pas.
      setIndexPanneau(premierPanneauDe(panneau.etape));
      return;
    }

    const envoye = await envoyerEtape(panneau.etape);
    if (!envoye) return; // le hook a posé le message ; le panneau ne bouge pas
    if (derniereEtape) setConfirme(true);
    else setIndexPanneau((i) => i + 1);
  };

  const Panneau = panneau.Composant;
  // Le médaillon et la phrase d'intention cèdent la place à ce qu'il faut lire
  // ou réparer : les erreurs de champ, qui ajoutent une ligne rouge sous chaque
  // question, et le bandeau de chargement raté, qui occupe le haut de l'écran.
  // Dans les deux cas la place libérée sert à quelque chose — c'est la
  // difference avec la version precedente, ou un simple echec d'envoi les
  // effaçait tous les deux pour ne laisser qu’un trou.
  const aCorriger = Object.keys(erreurs).length > 0 || echecChargement;
  // Tout état où l'écran annonce une panne, bandeau d'envoi raté compris.
  const enEchec = aCorriger || Boolean(error && !erreurMasquee);

  if (confirme) {
    return (
      <Box
        sx={{
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(155deg, #0E7A67 0%, #0C6E5C 50%, #0A6152 100%)',
        }}
      >
        <Box
          sx={{
            flex: '1 1 auto',
            display: 'flex',
            mt: 'clamp(48px, 16vh, 120px)',
            background: '#FFFFFF',
            borderRadius: '26px 26px 0 0',
            px: 3,
            pb: 'max(env(safe-area-inset-bottom, 0px), 24px)',
          }}
        >
          <ConfirmationEnvoi onRetour={() => navigate('/')} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        px: 3,
        pt: 'max(calc(env(safe-area-inset-top, 0px) + 10px), 22px)',
        pb: 'max(env(safe-area-inset-bottom, 0px), 18px)',
        // La surface du wizard de tracé d'`agripilot-pwa` : une seule page
        // claire, et deux lueurs radiales fixes — teal en haut à droite, sable
        // en bas à gauche — qui donnent de la profondeur sans rien ajouter à
        // lire. Elle remplace la tête vert foncé et sa feuille blanche : ce
        // découpage laissait deux vides, l'un vert au-dessus de la feuille,
        // l'autre blanc à l'intérieur, qu'aucun contenu ne venait remplir.
        background: 'linear-gradient(180deg, #FAFBF8 0%, #F4F7F2 50%, #EEF3EA 100%)',
        '&::after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(1200px 600px at 100% 0%, rgba(1,134,117,0.06), transparent 60%), radial-gradient(900px 500px at 0% 100%, rgba(210,180,140,0.08), transparent 60%)',
        },
        '& > *': { position: 'relative', zIndex: 1 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 'none' }}>
        <BackButton onClick={() => navigate('/')} label="Retour à l’accueil" />
        {/* L'œilleton de la PWA : filet dégradé, 10,5 px, capitales espacées. */}
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 18,
              height: 2,
              borderRadius: 1,
              background: 'linear-gradient(90deg, transparent, #018675)',
            }}
          />
          <Typography
            noWrap
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#016557',
              minWidth: 0,
            }}
          >
            Mon profil
          </Typography>
        </Stack>
      </Stack>

      {Object.keys(erreurs).length === 0 && <MedaillonEtape etape={panneau.etape} />}

      <Box sx={{ flex: 'none', mt: 'clamp(14px, 2.4vh, 26px)' }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 'clamp(20px, 5.6vw, 24px)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
            color: 'rgba(20,40,35,0.95)',
          }}
        >
          {panneau.titre}
        </Typography>
        {/* La phrase qui explique cède la place à celle qui dit quoi corriger,
            pour TOUT échec — le médaillon, lui, ne cède qu'aux erreurs de champ
            et au chargement raté. C'est le bon partage : sur un petit écran les
            deux phrases ne tiennent pas ensemble, et à ce moment-là seule la
            seconde compte ; tandis que retirer aussi le médaillon pour une
            seule ligne rouge ne ferait que creuser l'écran. */}
        {!enEchec && (
          <Typography
            sx={{
              mt: 0.75,
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 13,
              lineHeight: 1.45,
              color: 'rgba(55,75,70,0.68)',
            }}
          >
            {panneau.sousTitre}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 'none', mt: 'clamp(14px, 2.4vh, 24px)' }}>
        <RailEtapes etape={panneau.etape} progression={progressionDansEtape(indexPanneau)} />
      </Box>

      {/* L'échec de LECTURE se pose au-dessus des champs, pas sous le bouton :
          il n'explique pas un geste, il explique pourquoi le formulaire est
          vide. Le lire après avoir parcouru des champs vides arriverait trop
          tard. Et il porte sa propre réparation — retoucher « Suivant »
          enverrait, ce qui ne recharge rien. */}
      {echecChargement && !isLoading && (
        <Stack
          role="alert"
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{
            flex: 'none',
            mt: 'clamp(12px, 2vh, 20px)',
            px: 1.75,
            py: 1.25,
            borderRadius: '16px',
            background: 'rgba(179,38,30,0.06)',
            border: '1px solid rgba(179,38,30,0.18)',
          }}
        >
          <Typography sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: '#8C1912', lineHeight: 1.4 }}>
            {error}
          </Typography>
          <Box
            component="button"
            type="button"
            onClick={rechargerProfil}
            sx={{
              flexShrink: 0,
              minHeight: 40,
              px: 2,
              border: '1px solid rgba(179,38,30,0.28)',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.75)',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 13.5,
              fontWeight: 700,
              color: '#8C1912',
              cursor: 'pointer',
              '&:focus-visible': { outline: '2px solid #8C1912', outlineOffset: 2 },
            }}
          >
            Réessayer
          </Box>
        </Stack>
      )}

      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          mt: 'clamp(12px, 2.2vh, 28px)',
        }}
      >
        {isLoading ? (
          <Typography sx={{ textAlign: 'center', color: 'rgba(55,75,70,0.6)' }}>Chargement…</Typography>
        ) : (
          <Panneau reponses={reponses} setReponses={setReponses} erreurs={erreurs} />
        )}
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ flex: 'none', pt: 2 }}>
        {indexPanneau > 0 && (
          <Box
            component="button"
            type="button"
            onClick={precedent}
            disabled={isSending}
            sx={{
              flex: '0 0 auto',
              minWidth: 108,
              minHeight: 56,
              borderRadius: '16px',
              border: '1px solid rgba(55,75,70,0.14)',
              background: 'rgba(255,255,255,0.7)',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: 'rgba(20,40,35,0.72)',
              cursor: isSending ? 'default' : 'pointer',
              '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
            }}
          >
            Précédent
          </Box>
        )}
        <BoutonPrincipal
          derniere={derniereEtape && envoiIci}
          disabled={isSending || isLoading}
          onClick={() => void suivant()}
        />
      </Stack>

      {/* Sous le bouton, pas au-dessus (spec, cas limites) : l'échec suit le
          geste qui l'a déclenché plutôt que de précéder le contenu qu'il commente. */}
      {error && !echecChargement && !erreurMasquee && (
        <Typography
          role="alert"
          sx={{ flex: 'none', mt: 1.25, fontSize: 13, fontWeight: 600, color: '#B3261E', textAlign: 'center' }}
        >
          {error}
        </Typography>
      )}

      {/* Pourquoi on demande tout ça, une seule fois, au premier écran : on peut
          arriver ici par « Mes informations » sans jamais avoir vu l'invitation
          qui le disait. Elle cède dès que l'écran annonce une panne — d'envoi
          comme de lecture : une réassurance sur la confidentialité n'est pas ce
          qui mérite les dernières lignes quand quelque chose vient d'échouer. */}
      {indexPanneau === 0 && !enEchec && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.6}
          sx={{ flex: 'none', mt: 1.25, color: 'rgba(55,75,70,0.5)' }}
        >
          <LockRoundedIcon aria-hidden sx={{ fontSize: 12.5 }} />
          <Typography sx={{ fontSize: 11.5, color: 'inherit' }}>Vos réponses restent confidentielles</Typography>
        </Stack>
      )}
    </Box>
  );
};
