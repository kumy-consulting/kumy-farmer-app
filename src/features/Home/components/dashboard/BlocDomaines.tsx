import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import type { EtatDomaines } from '../../home.dashboard.types';
import { SectionHeader } from '../SectionHeader';
import { TON_GRAVITE } from './dashboardTons';
import { Carte, LienVoir, Pastille } from './dashboardVisuals';

interface BlocDomainesProps {
  domaines: EtatDomaines;
  onVoirDomaines: () => void;
}

/**
 * Au-delà, une cellule par domaine devient plus fine que son jour : la barre
 * passe alors en segments proportionnels, qui disent encore la répartition sans
 * prétendre qu'on peut compter.
 */
const MAX_CELLULES = 24;

/** Pire d'abord : c'est l'ordre de lecture de tout l'écran. */
const ETATS = [
  { cle: 'critique' as const, champ: 'critiques' as const, un: 'critique', plusieurs: 'critiques' },
  { cle: 'attention' as const, champ: 'aSurveiller' as const, un: 'à surveiller', plusieurs: 'à surveiller' },
  { cle: 'normal' as const, champ: 'normaux' as const, un: 'normal', plusieurs: 'normaux' },
];

/**
 * De « mon exploitation demande une attention » à « lequel de mes domaines » (§7).
 *
 * Le bloc ne liste pas les domaines un à un : à huit, la liste occupe l'écran
 * sans rien décider, et l'onglet Domaines porte déjà ce détail — c'est le
 * deuxième niveau de la divulgation progressive (§16).
 *
 * **Une cellule par domaine**, et non une barre empilée lissée. Trois domaines
 * font trois cases qu'on peut compter du regard ; vingt en font vingt, plus
 * fines, dont la répartition reste lisible. Le rapport se voit avant de se lire,
 * et c'est exactement ce que deux lignes de compteurs ne donnaient pas : savoir
 * si « 1 critique » pèse sur trois domaines ou sur trente.
 *
 * C'est le même dispositif que le parcellaire de l'onglet Domaines — une bande
 * dont les divisions sont réelles — donc rien de neuf à apprendre.
 */
export const BlocDomaines: FunctionComponent<BlocDomainesProps> = ({ domaines, onVoirDomaines }) => {
  const presents = ETATS.map((etat) => ({ ...etat, n: domaines[etat.champ] })).filter((etat) => etat.n > 0);
  const detaille = domaines.total > 0 && domaines.total <= MAX_CELLULES;

  return (
    <div>
      {/* Le compte vit dans l'en-tête : le panneau d'état l'annonce déjà avec la
          surface, et le répéter mot pour mot deux blocs plus bas ne dit rien de
          neuf. Ici, l'information est la répartition. */}
      <SectionHeader title="Mes domaines" count={domaines.total} />
      <Carte pad={2}>
        <Box
          role="img"
          aria-label={`Répartition de vos ${domaines.total} domaines : ${presents
            .map((etat) => `${etat.n} ${etat.n > 1 ? etat.plusieurs : etat.un}`)
            .join(', ')}`}
          // Un filet, pas une barre : la bande ne mesure rien qu'on doive lire
          // en épaisseur, elle ne fait que partager une longueur. Le jour passe à
          // 2 px avec elle — à 3 px, il pesait autant que la case qu'il sépare.
          sx={{ display: 'flex', gap: '2px', height: 6, borderRadius: 999, overflow: 'hidden' }}
        >
          {presents.flatMap((etat) =>
            detaille
              ? // Une case par domaine : elles se comptent.
                Array.from({ length: etat.n }, (_, i) => (
                  <Box
                    key={`${etat.cle}-${i}`}
                    sx={{ flex: '1 1 0', minWidth: 2, background: TON_GRAVITE[etat.cle].pastille }}
                  />
                ))
              : [
                  <Box
                    key={etat.cle}
                    sx={{ flex: `${etat.n} 1 0`, minWidth: 2, background: TON_GRAVITE[etat.cle].pastille }}
                  />,
                ],
          )}
        </Box>

        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '6px 16px', mt: 1.5 }}>
          {presents.map((etat) => (
            <Stack key={etat.cle} direction="row" alignItems="center" spacing={0.75}>
              <Pastille couleur={TON_GRAVITE[etat.cle].pastille} taille={8} />
              <Typography sx={{ fontSize: 13.5, color: '#374B46' }}>
                <Box component="strong" sx={{ fontWeight: 700, color: '#1A1C1B' }}>
                  {etat.n}
                </Box>{' '}
                {etat.n > 1 ? etat.plusieurs : etat.un}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <LienVoir onClick={onVoirDomaines}>Voir mes domaines</LienVoir>
      </Carte>
    </div>
  );
};
