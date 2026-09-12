import type { FunctionComponent } from 'react';

import CheckRounded from '@mui/icons-material/CheckRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { formatE164ForDisplay } from '@/features/Auth/phone.util';
import { CarteBonnesPratiques } from '@/features/Home/components/CarteBonnesPratiques';
import { CarteEtudeDeSol } from '@/features/Home/components/CarteEtudeDeSol';
import { initiales } from '@/features/Home/initiales';
import { useEtudeDeSol } from '@/features/Home/useEtudeDeSol';
import { useAuthStore } from '@/shared/stores/authStore';
import { SUPPORT_TEL_HREF, SUPPORT_TELEPHONE_LOCAL } from '@/shared/support';
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

/**
 * Intervalle entre deux étapes du rail, en variable CSS.
 *
 * Le trait qui relie les pastilles se cale dessus (`calc(-1 * … - 2px)`) : les
 * deux valeurs doivent bouger ensemble, sinon le trait s'arrête avant la
 * pastille suivante ou la dépasse. Une variable les tient liées, y compris
 * quand la requête média l'élargit sur les grands téléphones.
 */
const PAS_RAIL = 'var(--pas-rail)';

/**
 * Un intervalle élastique.
 *
 * Il absorbe le surplus d'un grand écran jusqu'à `max`, et se referme à zéro
 * dès que la place manque — c'est ce qui distingue un ressort d'une marge. Une
 * requête média faisait l'inverse : au-dessus d'un seuil, elle ajoutait une
 * hauteur fixe que l'écran n'avait pas forcément, et le dernier bouton passait
 * sous la ligne de flottaison.
 */
const Ressort: FunctionComponent<{ max: number }> = ({ max }) => (
  <Box aria-hidden sx={{ flex: '1 1 0', minHeight: 0, maxHeight: `${max}px` }} />
);

/**
 * La pastille du rail : franchie, en cours, ou pas encore.
 *
 * L'étape en cours porte la pousse de la marque plutôt qu'un point vert. C'est
 * le seul ornement de l'écran, et il dit quelque chose de juste : ce qui est en
 * train de se passer, c'est Kumy qui vient. Les deux autres états restent des
 * signes nus — une coche pour ce qui est acquis, un anneau pour ce qui attend.
 */
const Marqueur: FunctionComponent<{ etat: EtatEtape }> = ({ etat }) => (
  <Box
    aria-hidden
    sx={{
      position: 'relative',
      zIndex: 1,
      width: etat === 'encours' ? 26 : 18,
      height: etat === 'encours' ? 26 : 18,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background: etat === 'fait' ? 'linear-gradient(140deg, #018675 0%, #016557 100%)' : '#FFFFFF',
      border:
        etat === 'fait'
          ? 'none'
          : etat === 'encours'
            ? '1.5px solid rgba(1,134,117,0.45)'
            : '1.5px solid rgba(1,134,117,0.26)',
      boxShadow: etat === 'encours' ? '0 0 0 5px rgba(1,134,117,0.10)' : 'none',
      '& svg': { fontSize: 12, color: '#FFFFFF' },
    }}
  >
    {etat === 'fait' && <CheckRounded />}
    {/* Balise `img` native plutôt qu'un `Box component="img"` : changer la
        balise hôte d'un composant émotion sous React fait boucler `removeChild`
        dans le navigateur. */}
    {etat === 'encours' && <img src="/logo-mark.svg" alt="" width={15} height={15} style={{ display: 'block' }} />}
  </Box>
);

/**
 * Le seul écran d'un compte auto-inscrit que personne n'a encore adopté.
 *
 * Sans domaine ni technicien, le tableau de bord n'aurait rien à montrer et les
 * quatre onglets mèneraient à des écrans vides. Un écran qui explique la suite
 * vaut mieux que quatre qui ne disent rien.
 *
 * **Il se lit à la première ouverture comme à la vingtième.** Il répond à une
 * question qui se repose chaque matin : où en est mon compte. D'où un rail
 * plutôt qu'une liste de promesses — la première étape est cochée, la deuxième
 * porte la position de l'agriculteur, les deux dernières attendent. Le trait
 * est plein derrière ce qui est franchi et pointillé devant ce qui reste : la
 * ligne dit alors la distance, pas seulement l'ordre.
 *
 * **Il tient dans un écran, sans défilement.** Trois cartes blanches flottant
 * sur un fond pâle réclamaient une centaine de pixels en marges, ombres et
 * intervalles ; une feuille unique, divisée par un filet, loge le même contenu
 * et se lit plus calmement. La hauteur est distribuée en `flex` plutôt
 * qu'accumulée : la feuille prend ce qui reste sous la tête, le pied est poussé
 * en bas, et les intervalles respirent en `clamp` selon la taille du téléphone.
 */
export const BienvenuePage: FunctionComponent = () => {
  const nomComplet = useAuthStore((s) => s.user?.displayName);
  const prenom = nomComplet?.split(' ')[0];
  const telephone = useAuthStore((s) => s.user?.phone);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const etudeDeSol = useEtudeDeSol();

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
      {/* La tête de l'accueil, reprise telle quelle : cet écran ne ressemble pas
          à l'accueil, il le remplace tant que l'exploitation n'existe pas, et il
          doit donc en porter l'identité. */}
      <Box
        sx={{
          flex: 'none',
          padding: 'max(calc(env(safe-area-inset-top, 0px) + 10px), 34px) 24px clamp(10px, 1.8vh, 22px)',
          color: '#EAF7F1',
        }}
      >
        {/* La salutation situe, elle n'informe pas : petite capitale, comme sur
            l'accueil. La hiérarchie tient au corps et à la graisse, jamais à un
            texte plus pâle — sur ce vert, chaque cran d'opacité sous 0,96 passe
            sous le seuil de contraste, et un gris clair ne se lit pas en plein
            soleil.

            Le profil l'accompagne : c'est la même personne, donc la même ligne.
            La déconnexion, elle, ferme l'écran en bas — deux gestes de nature
            opposée n'ont rien à faire côte à côte, l'un ouvre son dossier,
            l'autre quitte l'application. */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.25}
          sx={{ mb: 0.25, minHeight: 34 }}
        >
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
            {prenom ? `Bonjour ${prenom}` : 'Bonjour'}
          </Typography>

          {/* Les initiales plutôt qu'une silhouette : c'est SON dossier, et le
              jeton le dit sans un mot de plus. Le libellé reste quand même —
              un rond seul se devine, il ne se lit pas. */}
          <Box
            component="button"
            type="button"
            onClick={() => navigate('/mon-espace/informations')}
            sx={{
              appearance: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              flexShrink: 0,
              minHeight: 34,
              pl: 0.5,
              pr: 1.35,
              border: '1px solid rgba(255,255,255,0.30)',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.12)',
              font: 'inherit',
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: 12.5,
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              '&:active': { background: 'rgba(255,255,255,0.2)' },
              '&:focus-visible': { outline: '2px solid #FFFFFF', outlineOffset: 2 },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 24,
                height: 24,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(255,255,255,0.22)',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              {initiales(nomComplet) || <PersonRounded sx={{ fontSize: 14 }} />}
            </Box>
            Mon profil
          </Box>
        </Stack>

        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 'clamp(21px, 5.8vw, 25px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.18,
            color: '#FFFFFF',
            mb: 0.5,
          }}
        >
          Votre exploitation reste à ouvrir
        </Typography>

        <Typography sx={{ fontSize: 13, fontWeight: 500, lineHeight: 1.45 }}>
          Un technicien Kumy vient tracer vos parcelles avec vous, sur le terrain.
        </Typography>
      </Box>

      {/* La feuille : tout ce qui reste sous la tête, d'un seul tenant. */}
      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          // La mise en page est calculée pour tenir sans défiler, jusqu'aux
          // 360 × 640. En dessous — ou si un jour une section s'allonge — la
          // feuille défile de quelques pixels : rogner un bouton serait pire
          // que de le faire descendre.
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          background: '#FFFFFF',
          borderRadius: '26px 26px 0 0',
          px: 2.5,
          pt: 'clamp(14px, 2.2vh, 28px)',
          // Coussin sous la dernière commande : la déconnexion ne doit jamais
          // toucher le bord, ni la barre de gestes du téléphone.
          pb: 'max(env(safe-area-inset-bottom, 0px), clamp(8px, 1.4vh, 20px))',
          // Le pas du rail respire avec la hauteur de l'écran, et redescend à
          // sa valeur serrée sous 700 px : là, chaque pixel sert à faire tenir
          // le dernier bouton. Un seuil qui RETIRE de l'espace là où il manque
          // ne peut pas provoquer de débordement — l'inverse, si.
          '--pas-rail': 'clamp(9px, 2.1vh, 24px)',
          '@media (max-height: 700px)': { '--pas-rail': '9px' },
        }}
      >
        {/* Le contenu part du haut, le pied s'ancre en bas, et le surplus d'un
            grand téléphone tombe entre les deux — là où il sépare deux choses
            de nature différente : ce que Kumy propose, et comment le joindre ou
            partir. Centré, ce surplus ouvrait une bande blanche sous la tête ;
            réparti, il déliait les voisins ; posé sous le dernier objet, il
            laissait la feuille s'arrêter au milieu de l'écran. */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
          {/* Le rail ne démarre pas au ras du bord haut de la feuille : ce
              ressort lui donne de l'air quand l'écran en a, et se referme
              quand il n'en a pas. */}
          <Ressort max={22} />

          <Stack sx={{ gap: PAS_RAIL, flex: 'none' }}>
            {ETAPES.map((etape, index) => {
              const dernier = index === ETAPES.length - 1;
              const franchi = etape.etat === 'fait';
              const encours = etape.etat === 'encours';

              return (
                <Stack key={etape.texte} direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                  <Box
                    aria-hidden
                    sx={{
                      position: 'relative',
                      width: 26,
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {!dernier && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: encours ? 26 : 22,
                          bottom: `calc(-1 * ${PAS_RAIL} - 2px)`,
                          width: '1.5px',
                          // Plein pour la distance parcourue, pointillé pour celle
                          // qui reste : le trait porte l'information, il ne relie
                          // pas seulement des pastilles.
                          background: franchi
                            ? 'rgba(1,134,117,0.55)'
                            : 'repeating-linear-gradient(to bottom, rgba(1,134,117,0.30) 0 3px, transparent 3px 7px)',
                        }}
                      />
                    )}
                    <Marqueur etat={etape.etat} />
                  </Box>

                  <Box sx={{ minWidth: 0, mt: encours ? '3px' : '-1px' }}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: encours ? 700 : 500,
                        color: encours ? '#1A1C1B' : '#5C5F5E',
                        lineHeight: 1.4,
                      }}
                    >
                      {etape.texte}
                    </Typography>

                    {encours && telephone && (
                      <Typography sx={{ fontSize: 12.5, color: '#8F9291', mt: 0.25 }}>
                        Il appellera le {formatE164ForDisplay(telephone)}.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              );
            })}
          </Stack>

          <Ressort max={30} />

          {/* Le rail dit ce qui arrivera sans que l'agriculteur fasse rien. Sous le
            filet commence ce qu'il peut faire, lui : demander une étude — elle
            engage Kumy envers lui —, puis lire. */}
          <Box
            sx={{
              mt: 'clamp(10px, 2vh, 28px)',
              mb: 'clamp(9px, 1.8vh, 24px)',
              height: '1px',
              background: 'linear-gradient(90deg, rgba(1,134,117,0.22), rgba(1,134,117,0.03))',
            }}
          />

          <CarteEtudeDeSol
            requestedAt={etudeDeSol.requestedAt}
            isLoading={etudeDeSol.isLoading}
            isSending={etudeDeSol.isSending}
            error={etudeDeSol.error}
            demander={() => void etudeDeSol.demander()}
          />

          <Ressort max={20} />

          <CarteBonnesPratiques onOuvrir={() => navigate('/bonnes-pratiques')} />

          <Ressort max={44} />
        </Box>

        {/* Le pied : où joindre Kumy, puis les deux commandes du compte. Elles
            ferment l'écran plutôt qu'elles ne l'ouvrent — on y va quand on a
            fini de lire. La déconnexion garde son rouge pâle : elle n'est pas
            destructrice — on revient avec son numéro et son code — mais ce
            n'est pas anodin non plus, et un objet vert de plus l'aurait rendue
            aussi ordinaire que « Demander une étude de sol ». */}
        <Box
          sx={{
            flex: 'none',
            pt: 'clamp(8px, 1.4vh, 26px)',
          }}
        >
          <Typography sx={{ textAlign: 'center', fontSize: 12.5, color: '#5C5F5E' }}>
            Pour plus d&apos;infos, contactez-nous au{' '}
            <Box
              component="a"
              href={SUPPORT_TEL_HREF}
              sx={{
                display: 'inline-block',
                px: 0.85,
                py: 0.35,
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
              {SUPPORT_TELEPHONE_LOCAL}
            </Box>
          </Typography>

          {/* Seule commande du pied : quitter. Rouge pâle — se déconnecter
              n'est pas destructeur, on revient avec son numéro et son code,
              mais ce n'est pas anodin, et un objet vert de plus l'aurait rendue
              aussi ordinaire que « Demander une étude de sol ». Largeur du
              contenu, pas de la colonne : elle ferme l'écran, elle ne le
              domine pas. */}
          <Stack alignItems="center" sx={{ mt: 'clamp(7px, 1.2vh, 16px)' }}>
            <Box
              component="button"
              type="button"
              onClick={() => void logout()}
              sx={{
                appearance: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                minHeight: 'clamp(40px, 6vh, 46px)',
                px: 2.5,
                border: '1px solid rgba(186,26,26,0.18)',
                borderRadius: '14px',
                background: 'linear-gradient(180deg, #FDEDED 0%, #FBDDDD 100%)',
                font: 'inherit',
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 13.5,
                fontWeight: 700,
                color: error[40],
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'filter 0.2s ease',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                '& svg': { fontSize: 18 },
                '&:active': { filter: 'brightness(0.97)' },
                '&:focus-visible': { outline: `2px solid ${error[40]}`, outlineOffset: 3 },
              }}
            >
              <LogoutRounded />
              Se déconnecter
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
