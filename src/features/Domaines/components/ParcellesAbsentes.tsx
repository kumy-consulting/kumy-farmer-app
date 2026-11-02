import type { FunctionComponent } from 'react';

import { Box, Typography } from '@mui/material';

/**
 * L'état vide de la liste des parcelles d'un domaine.
 *
 * Il ne prend pas la forme habituelle — icône dans un rond gris, titre, phrase,
 * le tout centré dans du vide. Cette forme-là ne dit rien du sujet et laisse la
 * moitié de la feuille inoccupée, ce qui donne à l'écran l'air cassé plutôt que
 * vide.
 *
 * Ici l'état vide prend **la place et la taille exactes de la carte qui
 * manque** : mêmes marges, même rayon, même vignette de 68 px que `ParcelCard`.
 * Le lecteur voit la silhouette de ce qui devrait s'y trouver, à l'endroit où
 * ça se trouvera.
 *
 * Dans la vignette, le contour de parcelle est en pointillés : le domaine
 * existe — sa limite est dessinée sur la carte, derrière la feuille — mais son
 * découpage intérieur n'a pas encore été relevé. C'est exactement l'état décrit.
 *
 * Le texte nomme la personne et le geste, avec le mot employé partout ailleurs
 * dans l'app — carnet de parcelle, fiche personnelle, réglages : un rôle ne
 * change pas de nom d'un écran à l'autre.
 */
export const ParcellesAbsentes: FunctionComponent = () => (
  <Box
    sx={{
      mx: 2,
      mb: 1.25,
      p: 1.25,
      display: 'flex',
      gap: 1.5,
      alignItems: 'center',
      borderRadius: '14px',
      background: '#FFFFFF',
      border: '1px solid #E2E3E1',
    }}
  >
    <Box
      aria-hidden
      sx={{
        flexShrink: 0,
        width: 68,
        height: 68,
        borderRadius: '10px',
        border: '1px solid #E2E3E1',
        background: 'rgba(1,134,117,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box component="svg" viewBox="0 0 48 44" sx={{ width: 44, height: 40, display: 'block' }}>
        {/* Une parcelle est un quadrilatère irrégulier, pas un carré : la forme
            doit se reconnaître comme un bout de terrain. */}
        <Box
          component="path"
          d="M7 15 L23 5 L42 12 L37 35 L13 39 Z"
          sx={{
            fill: 'rgba(1,134,117,0.10)',
            stroke: '#35A18F',
            strokeWidth: 1.8,
            strokeDasharray: '4 3.5',
            strokeLinejoin: 'round',
          }}
        />
      </Box>
    </Box>

    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14.5, fontWeight: 700, color: '#1A1C1B' }}>
        Aucune parcelle tracée
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', lineHeight: 1.5, mt: 0.4 }}>
        Votre technicien les trace avec vous, sur le terrain. Elles apparaissent ici après sa visite.
      </Typography>
    </Box>
  </Box>
);
