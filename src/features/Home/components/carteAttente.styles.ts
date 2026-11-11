/**
 * Le vocabulaire commun des cartes de l'écran d'attente.
 *
 * Une carte blanche sur une feuille à peine teintée : la feuille sépare les
 * cartes sans filet, et chaque carte porte une seule chose à lire ou à faire.
 * Quand une carte propose un geste, il occupe toute sa largeur en bas, comme
 * une bande : on vise une bande au pouce, pas un bouton posé au milieu.
 */
export const ENCRE = '#1A1C1B';
export const ENCRE_DOUCE = '#5C5F5E';
export const VERT = '#018675';
export const VERT_PROFOND = '#016557';
export const MENTHE = '#E3F4EE';
export const FEUILLE = '#F5F7F5';

export const carteSx = {
  background: '#FFFFFF',
  borderRadius: '18px',
  border: '1px solid rgba(20,35,30,0.06)',
  boxShadow: '0 1px 2px rgba(20,35,30,0.05), 0 6px 18px rgba(20,35,30,0.05)',
  overflow: 'hidden',
} as const;

/**
 * La bande d'action au pied d'une carte.
 *
 * Pleine quand c'est LE geste de l'écran, claire quand un autre passe avant :
 * deux bandes vertes l'une sous l'autre ne disent plus laquelle faire d'abord.
 */
export const bandeSx = (variante: 'pleine' | 'claire', occupe = false) =>
  ({
    appearance: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 52,
    px: 2.5,
    border: 0,
    borderTop: variante === 'claire' ? '1px solid rgba(20,35,30,0.08)' : 0,
    borderRadius: 0,
    // Vert plein assourdi pendant l'envoi plutôt qu'un vert transparent : le
    // libellé blanc doit rester lisible au moment précis où il change.
    background:
      variante === 'claire'
        ? '#FFFFFF'
        : occupe
          ? '#5FA598'
          : `linear-gradient(140deg, ${VERT} 0%, ${VERT_PROFOND} 100%)`,
    font: 'inherit',
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: variante === 'claire' ? 14.5 : 15,
    fontWeight: 700,
    color: variante === 'claire' ? VERT_PROFOND : '#FFFFFF',
    cursor: occupe ? 'default' : 'pointer',
    transition: 'filter 0.2s ease, background-color 0.2s ease',
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
    '&:active': occupe ? {} : variante === 'claire' ? { background: '#F2F7F5' } : { filter: 'brightness(0.95)' },
    '&:focus-visible': {
      outline: `2px solid ${variante === 'claire' ? VERT_PROFOND : '#FFFFFF'}`,
      outlineOffset: -4,
    },
  }) as const;
