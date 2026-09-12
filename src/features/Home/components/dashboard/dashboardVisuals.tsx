import type { FunctionComponent, ReactNode } from 'react';

import { Box, Typography } from '@mui/material';

import type { FeedIcon, Perimetre } from '../../home.feed.types';
import { feedIcon } from '../feedVisuals';
import { TONS_PASTILLE, type TonPastille } from './dashboardTons';

/** Pastille pleine — le signe qui accompagne un verdict, jamais seul. */
export const Pastille: FunctionComponent<{ couleur: string; taille?: number }> = ({ couleur, taille = 9 }) => (
  <Box
    aria-hidden
    sx={{ width: taille, height: taille, borderRadius: '50%', background: couleur, flexShrink: 0 }}
  />
);

/**
 * Où agir : « Domaine de Kaporo · Ananas Nord · Ananas » (§8, règle 2).
 *
 * Les trois niveaux ne sont pas toujours connus — une alerte de domaine n'a pas
 * de parcelle — et on n'affiche que ce qui existe : un séparateur suivi du vide
 * laisserait croire à une donnée manquante alors qu'elle est sans objet.
 */
export const LignePerimetre: FunctionComponent<{ perimetre: Perimetre }> = ({ perimetre }) => {
  const niveaux = [perimetre.domaine, perimetre.parcelle, perimetre.culture].filter(Boolean);
  if (niveaux.length === 0) return null;

  return (
    <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', lineHeight: 1.4, mt: 0.4 }}>
      {niveaux.join(' · ')}
    </Typography>
  );
};

/** Surface commune des blocs du tableau de bord. */
export const Carte: FunctionComponent<{ children: ReactNode; pad?: number }> = ({ children, pad = 2 }) => (
  <Box
    sx={{
      borderRadius: '18px',
      background: '#FFFFFF',
      border: '1px solid rgba(55,75,70,0.07)',
      boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
      p: pad,
    }}
  >
    {children}
  </Box>
);

/** Lien « Voir … → » — même verbe et même vert partout. */
export const LienVoir: FunctionComponent<{ children: ReactNode; onClick: () => void }> = ({
  children,
  onClick,
}) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    sx={{
      appearance: 'none',
      background: 'none',
      border: 0,
      p: 0,
      mt: 1.5,
      cursor: 'pointer',
      font: 'inherit',
      fontFamily: "'Ubuntu', sans-serif",
      fontSize: 13,
      fontWeight: 700,
      color: '#016557',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      minHeight: 32,
      '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2, borderRadius: 6 },
    }}
  >
    {children}
    <Box component="span" aria-hidden>
      →
    </Box>
  </Box>
);

/**
 * La pastille d'un élément à traiter.
 *
 * **C'est ici que se joue la différence entre une alerte et une action**, et
 * elle est de forme avant d'être de couleur : un carré arrondi plein pour une
 * alerte, un cercle contourné pour une action. Deux silhouettes qu'on
 * reconnaît sans lire, y compris de biais, y compris par quelqu'un qui
 * distingue mal les teintes — là où deux couleurs seules obligeraient à
 * comparer.
 *
 * Le pictogramme, lui, ne dit pas « alerte » : il dit *de quoi il s'agit* —
 * pluie, ravageur, irrigation, récolte. Un point d'exclamation générique aurait
 * occupé la même place sans rien apprendre.
 */
export const PastilleElement: FunctionComponent<{
  nature: 'alerte' | 'action';
  ton: TonPastille;
  icon: FeedIcon;
}> = ({ nature, ton, icon }) => {
  const teinte = TONS_PASTILLE[ton];
  const alerte = nature === 'alerte';

  return (
    <Box
      aria-hidden
      sx={{
        flexShrink: 0,
        width: 46,
        height: 46,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: alerte ? '15px' : '50%',
        background: alerte ? teinte.plein : teinte.pale,
        border: alerte ? 'none' : `2px solid ${teinte.anneau}`,
        boxShadow: alerte ? `0 5px 14px -4px ${teinte.halo}` : 'none',
        '& svg': { fontSize: alerte ? 23 : 22, color: alerte ? '#FFFFFF' : teinte.plein },
      }}
    >
      {feedIcon(icon)}
    </Box>
  );
};
