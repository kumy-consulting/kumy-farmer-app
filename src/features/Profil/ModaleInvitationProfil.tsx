import type { FunctionComponent } from 'react';

import { Box, Dialog, Slide, Typography, useMediaQuery } from '@mui/material';

interface ModaleInvitationProfilProps {
  ouverte: boolean;
  onFermer: () => void;
  onCompleter: () => void;
}

// Relient le dialogue à son titre et à sa phrase pour les lecteurs d'écran —
// sans eux, un `Dialog` MUI s'annonce sans nom (« dialogue »), premier de l'app.
const TITRE_ID = 'modale-invitation-profil-titre';
const DESCRIPTION_ID = 'modale-invitation-profil-description';

/** Les trois étapes du questionnaire, dans leur ordre de parcours — voir `QuestionnaireProfilPage`. */
const ETAPES = 'Vous, Parcours, Exploitation';

/**
 * L'invitation à compléter le profil, proposée une fois par session.
 *
 * Première modale de l'app : `Dialog` de MUI porte le piège de focus et la
 * fermeture au clavier (Échap) plutôt qu'un composant maison qui les
 * réinventerait mal.
 *
 * **Feuille par le bas sur téléphone, carte centrée à partir de `sm`.** Une
 * modale centrée pose son bouton principal vers 57 % de la hauteur, là où le
 * pouce d'une main qui tient l'appareil n'arrive pas ; la feuille le ramène au
 * bord bas. L'habillage — poignée, surface `#FCFDFA → #F5F9F4`, ombre portée
 * vers le haut — est repris tel quel de `DraggableBottomSheet`, déjà en place
 * sur les écrans domaine et parcelle, pour ne pas introduire une deuxième
 * grammaire de feuille.
 *
 * **Le rail d'étapes est la seule pièce ajoutée.** « 3 étapes · Vous, Parcours,
 * Exploitation » n'est pas un ornement : le questionnaire *est* une séquence
 * ordonnée de trois écrans, et `EntreeQuestionnaire` parle déjà en « étapes sur
 * 3 ». Nommer les trois transforme une demande ouverte — « complétez votre
 * profil », combien de temps ? — en une tâche finie, qu'on peut jauger avant
 * d'accepter.
 *
 * **Sans pastille d'icône.** Un pictogramme de personne ne dit rien que
 * « Complétez votre profil » ne dise déjà, et il laissait une rangée presque
 * vide en haut de la feuille. Le titre ouvre donc directement, comme dans
 * `DraggableBottomSheet`.
 *
 * La phrase, elle, est figée au mot près : aucune promesse chiffrée, aucun
 * « améliorez votre score ».
 */
export const ModaleInvitationProfil: FunctionComponent<ModaleInvitationProfilProps> = ({
  ouverte,
  onFermer,
  onCompleter,
}) => {
  // `prefers-reduced-motion` respecté (spec, §Écrans) : neutralise la montée de
  // la feuille, sans toucher aux transitions `filter` des boutons, qui suivent
  // déjà la même préférence via leur propre media query.
  const mouvementReduit = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <Dialog
      open={ouverte}
      onClose={onFermer}
      transitionDuration={mouvementReduit ? 0 : undefined}
      aria-labelledby={TITRE_ID}
      aria-describedby={DESCRIPTION_ID}
      slots={{ transition: Slide }}
      slotProps={{
        transition: { direction: 'up' },
        // Scrim teinté du vert sombre de l'app plutôt que le noir par défaut :
        // l'écran d'accueil derrière est vert, un voile neutre le grise.
        // Pas de `backdrop-filter` — un flou plein écran fait saccader la
        // montée de la feuille sur les Android d'entrée de gamme.
        backdrop: { sx: { backgroundColor: 'rgba(6, 32, 27, 0.55)' } },
        paper: {
          sx: {
            m: 0,
            width: '100%',
            maxWidth: { xs: '100%', sm: 384 },
            borderRadius: { xs: '26px 26px 0 0', sm: '26px' },
            background: 'linear-gradient(180deg, #FCFDFA 0%, #F5F9F4 100%)',
            boxShadow: '0 -10px 30px rgba(1, 50, 40, 0.16), 0 -1px 0 rgba(255,255,255,0.95) inset',
            fontFamily: "'Ubuntu', sans-serif",
            overflow: 'hidden',
          },
        },
      }}
      sx={{ '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } } }}
    >
      {/* Poignée : même barre que `DraggableBottomSheet`, purement indicative
          ici — la feuille ne se traîne pas, elle se ferme par « Plus tard »,
          Échap ou le scrim. Retirée à partir de `sm`, où la modale redevient
          une carte centrée : une poignée y promettrait un glissement qui
          n'existe pas. */}
      <Box aria-hidden sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', pt: 1.25 }}>
        <Box
          sx={{
            width: 44,
            height: 4,
            borderRadius: 999,
            background:
              'linear-gradient(90deg, rgba(1,134,117,0.45) 0%, rgba(1,134,117,0.65) 50%, rgba(1,134,117,0.45) 100%)',
            boxShadow: '0 1px 2px rgba(1,134,117,0.18)',
          }}
        />
      </Box>

      <Box
        sx={{
          px: 'clamp(20px, 5.5vw, 26px)',
          pt: { xs: 2.25, sm: 3 },
          pb: { xs: 'max(calc(env(safe-area-inset-bottom, 0px) + 14px), 22px)', sm: '22px' },
        }}
      >
        <Typography
          id={TITRE_ID}
          component="h2"
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 21,
            fontWeight: 700,
            color: '#1A1C1B',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          Complétez votre profil
        </Typography>

        <Typography id={DESCRIPTION_ID} sx={{ mt: 1, fontSize: 14.5, color: '#5C5F5E', lineHeight: 1.5 }}>
          Ces réponses nous aident à mieux vous accompagner, et comptent dans votre AgriScore.
        </Typography>

        {/* Le rail. `flexWrap` plutôt qu'une ligne unique : sur un écran de
            320 px, « Vous, Parcours, Exploitation » passe à la ligne au lieu
            de déborder ou de rétrécir la pastille. */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            mt: 2,
            px: 1.5,
            py: 1.25,
            borderRadius: '16px',
            // Un cran plus vert que `EntreeQuestionnaire` (#F2F7F4) : sur la
            // feuille, qui descend elle-même vers #F5F9F4, la teinte d'origine
            // se confondait avec le fond et le rail disparaissait.
            background: '#EEF6F2',
            border: '1px solid rgba(1,134,117,0.20)',
          }}
        >
          <Box
            component="span"
            sx={{
              flexShrink: 0,
              px: 1.15,
              py: 0.4,
              borderRadius: 999,
              background: 'linear-gradient(140deg, #018675 0%, #016557 100%)',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            3 étapes
          </Box>
          <Typography component="span" sx={{ fontSize: 12.5, color: '#3A3C3B', lineHeight: 1.4 }}>
            {ETAPES}
          </Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={onCompleter}
          sx={{
            appearance: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: 52,
            mt: 2.25,
            px: 2.5,
            border: 0,
            borderRadius: '16px',
            background: 'linear-gradient(140deg, #018675 0%, #016557 100%)',
            boxShadow: '0 6px 16px rgba(1,134,117,0.26)',
            font: 'inherit',
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'filter 0.2s ease, transform 0.2s ease',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            '&:active': { filter: 'brightness(0.96)', transform: 'scale(0.988)' },
            '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 3 },
          }}
        >
          Compléter mon profil
        </Box>

        <Box
          component="button"
          type="button"
          onClick={onFermer}
          sx={{
            appearance: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: 46,
            mt: 0.75,
            px: 2.5,
            border: 0,
            borderRadius: '14px',
            background: 'transparent',
            font: 'inherit',
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: '#5C5F5E',
            cursor: 'pointer',
            '&:active': { background: 'rgba(1,134,117,0.06)' },
            '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 3 },
          }}
        >
          Plus tard
        </Box>
      </Box>
    </Dialog>
  );
};
