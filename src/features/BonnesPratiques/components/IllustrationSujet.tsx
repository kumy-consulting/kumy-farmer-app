import type { FunctionComponent, ReactNode } from 'react';

import type { SujetId } from '../bonnesPratiques.content';

/**
 * Les six illustrations des bonnes pratiques.
 *
 * Un parti pris : ce ne sont pas six pictogrammes sans lien, mais **six coupes
 * de la même parcelle**. Même ligne de sol à la même hauteur, mêmes horizons,
 * même lumière — seul change ce qui se passe dessus ou dessous. Mises en liste,
 * elles se lisent comme une seule terre qu'on apprend à connaître, ce que la
 * page raconte précisément. Six vignettes empruntées à six univers auraient dit
 * l'inverse.
 *
 * Vectorielles, et non photographiques : l'app se charge sur des réseaux
 * guinéens et s'utilise hors ligne. Six photos pèseraient plus que tout le
 * reste de l'écran, et il faudrait en détenir les droits.
 *
 * Toutes les couleurs sortent des rampes du thème (`src/theme/colors.ts`) :
 * la terre vient de la rampe `warning`, qui porte déjà les ocres de l'app.
 */

// Terre volontairement pale : elle situe la scene, elle n'est pas le sujet.
// La premiere passe utilisait les tons satures de la rampe, et le brun ecrasait
// ce qui poussait dessus.
const TERRE_CLAIRE = '#FFF4E0'; // warning 95
const TERRE = '#FFD89E'; // warning 80
const TERRE_PROFONDE = '#E0A43A'; // warning 60
const VERT = '#018675'; // primary 50
const POUSSE = '#41B782'; // le vert de la marque
const EAU = '#55BCA9'; // primary 70
const ENCRE = '#374B46'; // secondary 30

/** Ligne de sol commune. Toutes les scènes la partagent, c'est ce qui les relie. */
const SOL_Y = 42;

/**
 * Les trois horizons, du plus superficiel au plus profond.
 *
 * Volontairement fins et pales : la terre situe la scene, elle n'est pas le
 * sujet. Une premiere version employait les tons satures de la rampe et le brun
 * ecrasait ce qui poussait dessus.
 *
 * `laboure` ondule la surface. En coupe, un labour n'est pas une serie d'arcs
 * suspendus au-dessus du champ — c'est la terre elle-meme qui prend du relief.
 * Les billons sont des arcs explicites : une chaine `q...t...` alternait de part
 * et d'autre de la ligne et le relief s'annulait. Drapeau de balayage a 0, car
 * l'axe y descend en SVG et un 1 enverrait les billons sous terre.
 */
const Horizons: FunctionComponent<{ arrondi?: boolean; laboure?: boolean }> = ({ arrondi = true, laboure = false }) => (
  <>
    <path
      d={
        laboure ? `M4 ${SOL_Y}a7 7 0 0 0 14 0a7 7 0 0 0 14 0a7 7 0 0 0 14 0a7 7 0 0 0 14 0v5H4z` : `M4 ${SOL_Y}h56v5H4z`
      }
      // Les billons prennent le ton median : en creme palissime ils se
      // confondaient avec le ciel de la vignette et le relief ne se voyait pas.
      fill={laboure ? TERRE : TERRE_CLAIRE}
    />
    <path d={`M4 ${SOL_Y + 5}h56v5H4z`} fill={TERRE} />
    <path
      d={arrondi ? `M4 ${SOL_Y + 10}h56v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z` : `M4 ${SOL_Y + 10}h56v4H4z`}
      fill={TERRE_PROFONDE}
    />
  </>
);

/** Enveloppe commune : même cadrage, même fond, pour les six. */
const Scene: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <>
    <rect x="4" y="10" width="56" height="32" rx="4" fill="#EDF3EA" />
    {children}
  </>
);

const SCENES: Record<SujetId, ReactNode> = {
  // Le sol vu en coupe, et la carotte qu'on en retire : c'est littéralement le
  // geste de l'etude de sol.
  sol: (
    <>
      <Scene>
        <Horizons />
      </Scene>
      <g>
        <rect
          x="38"
          y="18"
          width="12"
          height="30"
          rx="6"
          fill="#FFFFFF"
          stroke={ENCRE}
          strokeOpacity="0.55"
          strokeWidth="1.2"
        />
        <path d="M39.2 38h9.6v6.8a4.8 4.8 0 0 1-9.6 0z" fill={TERRE_PROFONDE} />
        <path d="M39.2 31h9.6v7h-9.6z" fill={TERRE} />
        <path d="M39.2 24h9.6v7h-9.6z" fill={TERRE_CLAIRE} />
      </g>
    </>
  ),

  // La surface travaillee en sillons, vue en perspective.
  parcelle: (
    <>
      <Scene>
        <Horizons laboure />
      </Scene>
    </>
  ),

  // Trois silhouettes differentes sur la meme terre : choisir, c'est comparer.
  cultures: (
    <>
      <Scene>
        <Horizons />
      </Scene>
      <g stroke={VERT} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d={`M17 ${SOL_Y}v-8`} />
        <path d={`M32 ${SOL_Y}v-13`} />
        <path d={`M47 ${SOL_Y}v-6`} />
      </g>
      <ellipse cx="13" cy="31" rx="4.5" ry="3.4" fill={POUSSE} />
      <ellipse cx="21" cy="31" rx="4.5" ry="3.4" fill={POUSSE} />
      <path d="M32 29c-6-1-8-5-8-8 4 0 7 2 8 8z" fill={VERT} />
      <path d="M32 29c6-1 8-5 8-8-4 0-7 2-8 8z" fill={POUSSE} />
      <ellipse cx="47" cy="36" rx="6" ry="4" fill={POUSSE} />
    </>
  ),

  // La goutte, puis le front d'humidite qui descend jusqu'aux racines : c'est
  // sous terre que l'arrosage se joue, pas au-dessus.
  eau: (
    <>
      <Scene>
        <Horizons />
      </Scene>
      <path d={`M32 ${SOL_Y}c-9 0-13 5-13 9s4 7 13 7 13-3 13-7-4-9-13-9z`} fill={EAU} opacity="0.45" />
      <path d={`M32 ${SOL_Y}v10m0 0-3-3m3 3 3-3`} stroke={VERT} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M32 16c4 5 6 8 6 10.5a6 6 0 0 1-12 0C26 24 28 21 32 16z" fill={EAU} />
    </>
  ),

  // Les granules en surface, et le halo de diffusion autour de la racine.
  engrais: (
    <>
      <Scene>
        <Horizons />
      </Scene>
      <ellipse cx="32" cy={SOL_Y + 8} rx="13" ry="8" fill={POUSSE} opacity="0.35" />
      <path d={`M32 ${SOL_Y}v10m0-4-4 4m4-8 4 4`} stroke={VERT} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <g fill={ENCRE} opacity="0.75">
        <circle cx="21" cy={SOL_Y - 1} r="1.8" />
        <circle cx="26" cy={SOL_Y - 2.5} r="1.8" />
        <circle cx="38" cy={SOL_Y - 2.5} r="1.8" />
        <circle cx="43" cy={SOL_Y - 1} r="1.8" />
      </g>
      <path d={`M32 ${SOL_Y}v-12`} stroke={VERT} strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="27" cy="27" rx="4.5" ry="3.2" fill={POUSSE} />
      <ellipse cx="37" cy="27" rx="4.5" ry="3.2" fill={VERT} />
    </>
  ),

  // La feuille sous surveillance : la couronne pointillee est le rayon de
  // couverture d'une station, deja la signature de l'ecran d'attente et du
  // demarrage. Ici elle dit « on regarde », ce qu'est la prevention.
  ravageurs: (
    <>
      <Scene>
        <Horizons />
      </Scene>
      <circle
        cx="32"
        cy="26"
        r="14"
        fill="none"
        stroke={VERT}
        strokeOpacity="0.5"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="0.1 4.4"
      />
      <path d="M34 36c-9-2-13-9-13-16 8-1 15 3 17 8 1.5 3 1 6-4 8z" fill={POUSSE} />
      <path d="M21 20c7 4 11 9 13 16" stroke={VERT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="27" cy="25" r="2.1" fill="#8C5000" />
      <circle cx="32" cy="30" r="1.6" fill="#8C5000" />
    </>
  ),
};

interface IllustrationSujetProps {
  sujet: SujetId;
  taille?: number;
}

export const IllustrationSujet: FunctionComponent<IllustrationSujetProps> = ({ sujet, taille = 56 }) => (
  <svg
    width={taille}
    height={taille}
    viewBox="0 0 64 64"
    aria-hidden
    focusable="false"
    style={{ flexShrink: 0, display: 'block' }}
  >
    {SCENES[sujet]}
  </svg>
);
