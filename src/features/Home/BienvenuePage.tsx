import type { FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import { Box, Stack, Typography } from '@mui/material';

import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import { CarteEtudeDeSol } from '@/features/Home/components/CarteEtudeDeSol';
import { useEtudeDeSol } from '@/features/Home/useEtudeDeSol';
import { useAuthStore } from '@/shared/stores/authStore';
import { SUPPORT_TEL_HREF, SUPPORT_TELEPHONE } from '@/shared/support';
import { error } from '@/theme/colors';

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
  const etudeDeSol = useEtudeDeSol();

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)',
      }}
    >
      {/* Le bandeau de l'accueil, repris tel quel — même dégradé, même encre,
          même formule de safe-area. Cet écran ne se contente pas de ressembler
          à l'accueil : il le remplace tant que l'exploitation n'existe pas, et
          il doit donc en porter la tête. Sans lui, l'écran flottait au milieu
          d'un vide pâle, sans un gramme d'identité — le logo que j'avais retiré
          était illisible, mais il occupait cette fonction-là.

          Bord franc, ni arrondi ni ombre : le changement de couleur suffit à
          séparer la tête du contenu, et la carte qui suit a déjà ses angles. */}
      <Box
        sx={{
          padding: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 48px) 24px 22px',
          background: 'linear-gradient(155deg, #0E7A67 0%, #0C6E5C 50%, #0A6152 100%)',
          color: '#EAF7F1',
        }}
      >
        {/* La salutation situe, elle n'informe pas : petite capitale, comme sur
            l'accueil. La hiérarchie tient au corps et à la graisse, jamais à un
            texte plus pâle — sur ce vert, chaque cran d'opacité sous 0,96 passe
            sous le seuil de contraste, et de toute façon un gris clair ne se lit
            pas en plein soleil. */}
        {prenom && (
          <Typography
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              mb: 0.75,
            }}
          >
            Bonjour {prenom}
          </Typography>
        )}

        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 25,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            color: '#FFFFFF',
            mb: 1,
          }}
        >
          Votre exploitation reste à ouvrir
        </Typography>

        <Typography sx={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5 }}>
          Un technicien Kumy vient tracer vos parcelles avec vous, sur le terrain.
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, pt: 2.5, pb: 5 }}>
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

        {/* L'étude de sol est le seul geste offert sur cet écran d'attente :
            tout le reste s'y raconte au futur. Elle vient donc après le rail,
            dans sa propre carte — pas entre deux étapes, où elle passerait pour
            une promesse de plus alors qu'elle demande une action. */}
        <CarteEtudeDeSol
          requestedAt={etudeDeSol.requestedAt}
          isLoading={etudeDeSol.isLoading}
          isSending={etudeDeSol.isSending}
          error={etudeDeSol.error}
          demander={() => void etudeDeSol.demander()}
        />

        {/* Le pied se centre, seul bloc de l'écran à ne pas suivre le bord
            gauche : ce n'est plus de l'information à lire mais deux gestes à
            faire, et les poser au centre les détache de la colonne au lieu de
            les y laisser flotter mal alignés.

            « Sans nouvelles, appelez Kumy » présupposait le silence de Kumy —
            l'écran s'excusait d'avance. Une question ouverte invite au même
            appel sans annoncer une panne. */}
        <Stack alignItems="center" sx={{ mt: 3.5 }}>
          <Typography sx={{ fontSize: 13, color: '#5C5F5E', lineHeight: 2 }}>
            Une question ?{' '}
            <Box
              component="a"
              href={SUPPORT_TEL_HREF}
              sx={{
                display: 'inline-block',
                px: 0.9,
                py: 0.5,
                borderRadius: '9px',
                background: 'rgba(1,134,117,0.09)',
                color: '#016557',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                '&:active': { background: 'rgba(1,134,117,0.16)' },
                '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
              }}
            >
              {SUPPORT_TELEPHONE}
            </Box>
          </Typography>

          {/* Même objet que le bouton de déconnexion de Mon espace : rouge pâle,
              700, 14 de rayon. Se déconnecter n'est pas destructeur — on revient
              avec son numéro et son code — mais ce n'est pas anodin non plus, et
              un lien gris de la même couleur que le texte voisin ne disait ni
              l'un ni l'autre. Il ne prend pas toute la largeur, lui : là-bas il
              occupe seul sa section, ici il ferme un écran d'attente et n'a rien
              à y dominer. */}
          <Box
            component="button"
            type="button"
            onClick={() => void logout()}
            sx={{
              appearance: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              mt: 2.5,
              minHeight: 44,
              px: 2.5,
              border: '1px solid rgba(186,26,26,0.16)',
              borderRadius: '14px',
              background: 'linear-gradient(180deg, #FDEDED 0%, #FBDDDD 100%)',
              font: 'inherit',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: error[40],
              cursor: 'pointer',
              transition: 'filter 0.2s ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              '&:active': { filter: 'brightness(0.97)' },
              '&:focus-visible': { outline: `2px solid ${error[40]}`, outlineOffset: 3 },
            }}
          >
            Se déconnecter
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};
