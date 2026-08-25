import type { FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import { Box, Button, Stack, Typography } from '@mui/material';

import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import { useAuthStore } from '@/shared/stores/authStore';
import { neutral } from '@/theme/colors';

/** Le numéro du support, le même que celui de l'écran « compte suspendu ». */
const SUPPORT_TELEPHONE = '+224 622 20 13 62';

type EtatEtape = 'fait' | 'encours' | 'avenir';

interface Etape {
  texte: string;
  etat: EtatEtape;
}

/**
 * Le chemin entre un compte vide et une exploitation suivie, avec la position
 * de l'agriculteur dessus.
 *
 * La première étape est la sienne, et elle est cochée : c'est ce qui fait la
 * différence entre une liste de promesses et un parcours commencé.
 */
const ETAPES: readonly Etape[] = [
  { texte: 'Votre compte est créé', etat: 'fait' },
  { texte: 'Un technicien Kumy vous contacte', etat: 'encours' },
  { texte: 'Vous tracez ensemble vos domaines et vos parcelles', etat: 'avenir' },
  { texte: 'Vos conseils, vos alertes et votre calendrier s’affichent ici', etat: 'avenir' },
];

/** La pastille du rail : franchie, en cours, ou pas encore. */
const Marqueur: FunctionComponent<{ etat: EtatEtape }> = ({ etat }) => (
  <Box
    aria-hidden
    sx={{
      position: 'relative',
      zIndex: 1,
      width: 20,
      height: 20,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background:
        etat === 'fait' ? 'linear-gradient(140deg, #018675 0%, #016557 100%)' : '#FFFFFF',
      border:
        etat === 'fait'
          ? 'none'
          : etat === 'encours'
            ? '2px solid #018675'
            : '1.5px solid rgba(1,134,117,0.28)',
      boxShadow: etat === 'encours' ? '0 0 0 4px rgba(1,134,117,0.12)' : 'none',
      '& svg': { fontSize: 13, color: '#FFFFFF' },
    }}
  >
    {etat === 'fait' && <CheckRounded />}
    {/* Un anneau vide se lit comme une case à cocher qu'on aurait oublié de
        cocher. Le point plein au centre dit « vous êtes ici », et c'est la
        seule chose que cet écran a vraiment à dire. */}
    {etat === 'encours' && (
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#018675' }} />
    )}
  </Box>
);

/**
 * Le seul écran d'un compte auto-inscrit que personne n'a encore adopté.
 *
 * Sans domaine ni technicien, le tableau de bord n'aurait rien à montrer et les
 * quatre onglets mèneraient à des écrans vides. Un écran qui explique la suite
 * vaut mieux que quatre qui ne disent rien.
 *
 * **Il se lit à la première ouverture comme à la vingtième.** C'est là que
 * l'ancienne version se trompait : « Bienvenue Ibrahima ! » sous un logo de
 * 96 px est juste un jour et périmé le lendemain, alors que rien n'a bougé.
 * L'écran répond donc à une question qui, elle, se repose chaque matin : où en
 * est mon compte. D'où un rail plutôt qu'une liste de promesses — la première
 * étape est cochée, la deuxième porte la position de l'agriculteur, et les
 * deux dernières attendent.
 *
 * Le numéro sur lequel le technicien appellera est écrit noir sur blanc : c'est
 * la seule chose que l'agriculteur peut vérifier lui-même, et une erreur de
 * chiffre expliquerait un silence que rien d'autre n'explique.
 */
export const BienvenuePage: FunctionComponent = () => {
  const prenom = useAuthStore((s) => s.user?.displayName?.split(' ')[0]);
  const telephone = useAuthStore((s) => s.user?.phone);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 6,
        background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        {/* Un bonjour, pas un « bienvenue » : le premier se redit tous les
            jours, le second vieillit dès la deuxième ouverture. */}
        {prenom && (
          <Typography sx={{ fontSize: 13, color: '#5C5F5E', mb: 0.5 }}>Bonjour {prenom}</Typography>
        )}

        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 25,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            color: '#1A1C1B',
            mb: 1,
          }}
        >
          Votre exploitation reste à ouvrir
        </Typography>

        <Typography sx={{ fontSize: 14, color: 'rgba(55,75,70,0.7)', lineHeight: 1.55, mb: 3 }}>
          Votre compte existe, mais il ne contient encore aucune parcelle. C’est un technicien Kumy
          qui les trace avec vous, sur le terrain.
        </Typography>

        <Box
          sx={{
            p: 2.25,
            borderRadius: '22px',
            background: '#FFFFFF',
            border: '1px solid rgba(55,75,70,0.07)',
            boxShadow: '0 10px 26px rgba(1,134,117,0.10)',
          }}
        >
          {ETAPES.map((etape, index) => {
            const dernier = index === ETAPES.length - 1;
            // Le trait déjà parcouru est plein, celui qui reste est pâle : le
            // rail dit alors la distance, pas seulement l'ordre.
            const franchi = etape.etat === 'fait';

            return (
              <Stack key={etape.texte} direction="row" spacing={1.6} sx={{ minWidth: 0 }}>
                <Box
                  aria-hidden
                  sx={{
                    position: 'relative',
                    width: 20,
                    flexShrink: 0,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {!dernier && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 18,
                        bottom: -4,
                        width: franchi ? '1.5px' : '1px',
                        background: franchi ? 'rgba(1,134,117,0.55)' : 'rgba(1,134,117,0.20)',
                      }}
                    />
                  )}
                  <Marqueur etat={etape.etat} />
                </Box>

                <Box sx={{ minWidth: 0, pb: dernier ? 0 : 2.25, mt: '-1px' }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: etape.etat === 'encours' ? 700 : 500,
                      color: etape.etat === 'encours' ? '#1A1C1B' : '#5C5F5E',
                      lineHeight: 1.45,
                    }}
                  >
                    {etape.texte}
                  </Typography>

                  {etape.etat === 'encours' && telephone && (
                    <Typography sx={{ fontSize: 12.5, color: '#8F9291', mt: 0.35 }}>
                      Il appellera le {formatE164ForDisplay(telephone)}.
                    </Typography>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Box>

        {/* Une issue, pas un pied de page : sans elle, un agriculteur que
            personne ne rappelle n'a rien à faire de cet écran. */}
        <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 2.5, lineHeight: 1.5 }}>
          Sans nouvelles, appelez Kumy au{' '}
          <Box
            component="a"
            href={`tel:${SUPPORT_TELEPHONE.replace(/\s/g, '')}`}
            sx={{
              color: '#016557',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2, borderRadius: 4 },
            }}
          >
            {SUPPORT_TELEPHONE}
          </Box>
          .
        </Typography>

        <Button
          onClick={() => void logout()}
          sx={{ mt: 2.5, ml: -1, color: neutral[50], fontSize: 13, textTransform: 'none' }}
        >
          Se déconnecter
        </Button>
      </Box>
    </Box>
  );
};
