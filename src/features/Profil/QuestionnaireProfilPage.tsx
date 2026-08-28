import { useEffect, useState, type FunctionComponent } from 'react';

import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { BackButton } from '@/shared/components/BackButton';

import { EtapeExploitation } from './components/EtapeExploitation';
import { EtapeParcours } from './components/EtapeParcours';
import { EtapeVous } from './components/EtapeVous';
import type { ReponsesQuestionnaire } from './profil.types';
import { useQuestionnaireProfil } from './useQuestionnaireProfil';

/** Étape à afficher — jamais 0, la première étape non répondue est la 1. */
type Etape = 1 | 2 | 3;

/**
 * Champs obligatoires par étape. Vérifiée conforme aux astérisques posées par
 * la tâche 7 (`EtapeVous`, `EtapeParcours`, `EtapeExploitation`) : ne pas
 * modifier sans revérifier ces trois composants.
 */
const OBLIGATOIRES: Record<Etape, (keyof ReponsesQuestionnaire)[]> = {
  1: ['nomComplet', 'dateNaissance', 'genre', 'niveauEducation'],
  2: ['farmingExperience', 'estMembreCooperative', 'compteCreditRural'],
  3: ['regionId', 'prefectureId', 'sousPrefectureId', 'hectares', 'primaryCrops', 'foncier'],
};

/** Composant de l'étape à afficher, selon le numéro courant. */
const COMPOSANTS_ETAPES = {
  1: EtapeVous,
  2: EtapeParcours,
  3: EtapeExploitation,
} as const;

/** Valide localement une étape — sans elle, on écrirait une étape incomplète et le marqueur avancerait à tort. */
function valider(etape: Etape, reponses: ReponsesQuestionnaire): Record<string, string> {
  const manquants: Record<string, string> = {};
  for (const champ of OBLIGATOIRES[etape]) {
    const valeur = reponses[champ];
    const vide =
      valeur === undefined || valeur === null || valeur === '' || (Array.isArray(valeur) && valeur.length === 0);
    if (vide) manquants[champ] = 'Cette réponse est nécessaire.';
  }
  return manquants;
}

/** Une pastille du rail : son numéro, ou une coche une fois l'étape franchie. */
const Pastille: FunctionComponent<{ numero: Etape; franchie: boolean; courante: boolean }> = ({
  numero,
  franchie,
  courante,
}) => (
  <Stack
    aria-hidden
    alignItems="center"
    justifyContent="center"
    sx={{
      width: 30,
      height: 30,
      borderRadius: '50%',
      flexShrink: 0,
      fontFamily: "'Ubuntu', sans-serif",
      fontSize: 13.5,
      fontWeight: 700,
      color: franchie || courante ? '#016557' : 'rgba(234,247,241,0.55)',
      background: franchie || courante ? '#EAF7F1' : 'rgba(255,255,255,0.14)',
      border: courante ? '2px solid #EAF7F1' : '2px solid transparent',
    }}
  >
    {franchie ? <CheckRoundedIcon sx={{ fontSize: 17 }} /> : numero}
  </Stack>
);

/** Le trait qui relie deux pastilles — plein une fois l'étape d'avant franchie. */
const Trait: FunctionComponent<{ franchi: boolean }> = ({ franchi }) => (
  <Box
    aria-hidden
    sx={{ flex: '1 1 0', height: 2, background: franchi ? '#EAF7F1' : 'rgba(255,255,255,0.18)', mx: 0.5 }}
  />
);

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
      minHeight: 48,
      border: 'none',
      borderRadius: '999px',
      fontFamily: "'Ubuntu', sans-serif",
      fontSize: 14.5,
      fontWeight: 700,
      color: '#FFFFFF',
      background: 'linear-gradient(135deg, #018675 0%, #016557 100%)',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
    }}
  >
    {derniere ? 'Enregistrer' : 'Suivant'}
  </Box>
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
  const { reponses, setReponses, etapeCourante, isLoading, isSending, error, envoyerEtape } = useQuestionnaireProfil();
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  // `etapeCourante` du hook ne bouge qu'au chargement (reprise) ; entre les
  // deux, l'écran garde son propre curseur pour avancer/reculer localement.
  const [etapeAffichee, setEtapeAffichee] = useState<Etape>(1);
  const [etapeAlignee, setEtapeAlignee] = useState(false);
  // Masque le message d'échec du hook quand l'agriculteur revient en arrière :
  // sans ça, la bannière « Envoi impossible » de l'étape 2 resterait affichée
  // à l'étape 1, sans plus aucun rapport avec ce que montre l'écran. Le hook
  // ne pose pas de setter public sur `error` (il le remet à zéro lui-même au
  // prochain `envoyerEtape`) — cet effet resynchronise donc l'écran à chaque
  // changement réel du message, pour ne pas rester désynchronisé après.
  const [erreurMasquee, setErreurMasquee] = useState(false);

  useEffect(() => {
    setErreurMasquee(false);
  }, [error]);

  if (!isLoading && !etapeAlignee) {
    setEtapeAffichee(etapeCourante);
    setEtapeAlignee(true);
  }

  const precedent = () => {
    setErreurs({});
    setErreurMasquee(true);
    setEtapeAffichee((e) => Math.max(1, e - 1) as Etape);
  };

  const suivant = async () => {
    const manquants = valider(etapeAffichee, reponses);
    setErreurs(manquants);
    if (Object.keys(manquants).length > 0) return;

    const envoye = await envoyerEtape(etapeAffichee);
    if (!envoye) return; // le hook a posé le message ; l'étape ne bouge pas
    if (etapeAffichee === 3) navigate('/');
    else setEtapeAffichee((e) => (e + 1) as Etape);
  };

  const EtapeAffichee = COMPOSANTS_ETAPES[etapeAffichee];

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'linear-gradient(155deg, #0E7A67 0%, #0C6E5C 50%, #0A6152 100%)',
      }}
    >
      {/* Même tête que `/bonnes-pratiques` : même dégradé, même `BackButton`,
          même formule de safe-area. L'agriculteur doit sentir qu'il a ouvert
          une porte de l'app, pas un formulaire administratif. */}
      <Box
        sx={{
          flex: 'none',
          padding: 'max(calc(env(safe-area-inset-top, 0px) + 8px), 26px) 24px clamp(8px, 1.8vh, 24px)',
          color: '#EAF7F1',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 'clamp(6px, 1.4vh, 18px)' }}>
          <BackButton onClick={() => navigate('/')} label="Retour à l’accueil" />
          <Typography
            noWrap
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              minWidth: 0,
            }}
          >
            Mon profil
          </Typography>
        </Stack>

        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 'clamp(19px, 5.2vw, 23px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.22,
            color: '#FFFFFF',
          }}
        >
          Complétez vos informations
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'rgba(234,247,241,0.85)', lineHeight: 1.4, mt: 0.75 }}>
          Ces informations nous permettent de mieux vous accompagner avec des conseils adaptés à votre exploitation.
        </Typography>

        <Stack direction="row" alignItems="center" sx={{ mt: 'clamp(14px, 2.4vh, 26px)' }}>
          {([1, 2, 3] as const).map((numero, index) => (
            <Stack key={numero} direction="row" alignItems="center" sx={{ flex: numero === 3 ? 'none' : '1 1 0' }}>
              <Pastille numero={numero} franchie={numero < etapeAffichee} courante={numero === etapeAffichee} />
              {index < 2 && <Trait franchi={numero < etapeAffichee} />}
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          background: '#FFFFFF',
          borderRadius: '26px 26px 0 0',
          px: 2.5,
          pt: 'clamp(16px, 2.4vh, 28px)',
          pb: 'max(env(safe-area-inset-bottom, 0px), clamp(10px, 1.6vh, 20px))',
        }}
      >
        {isLoading ? (
          <Typography sx={{ textAlign: 'center', color: 'rgba(55,75,70,0.6)', mt: 4 }}>Chargement…</Typography>
        ) : (
          <EtapeAffichee reponses={reponses} setReponses={setReponses} erreurs={erreurs} />
        )}

        {error && !erreurMasquee && (
          <Typography
            role="alert"
            sx={{ mt: 2, fontSize: 13, fontWeight: 600, color: '#B3261E', textAlign: 'center' }}
          >
            {error}
          </Typography>
        )}

        <Stack direction="row" spacing={1.5} sx={{ mt: 'auto', pt: 3 }}>
          {etapeAffichee > 1 && (
            <Box
              component="button"
              type="button"
              onClick={precedent}
              disabled={isSending}
              sx={{
                flex: '1 1 0',
                minHeight: 48,
                borderRadius: '999px',
                border: '1px solid rgba(55,75,70,0.16)',
                background: 'transparent',
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 14.5,
                fontWeight: 700,
                color: 'rgba(20,40,35,0.78)',
                cursor: isSending ? 'default' : 'pointer',
                '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
              }}
            >
              Précédent
            </Box>
          )}
          <BoutonPrincipal
            derniere={etapeAffichee === 3}
            disabled={isSending || isLoading}
            onClick={() => void suivant()}
          />
        </Stack>

        <Typography sx={{ mt: 1.5, fontSize: 11.5, color: 'rgba(55,75,70,0.55)', textAlign: 'center' }}>
          Vos informations sont sécurisées et confidentielles
        </Typography>
      </Box>
    </Box>
  );
};
