import type { FunctionComponent, ReactNode } from 'react';

import EditOffRounded from '@mui/icons-material/EditOffRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { ProfilAgriculteur } from '../monEspace.types';
import { Card, Donnee, SectionTitle, Sourcil } from './espaceUi';

interface BlocInformationsProps {
  profil: ProfilAgriculteur;
}

/** Grille de deux colonnes : les faits courts s'apparient, les longs traversent. */
const Grille: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 1.9 }}>{children}</Box>
);

/**
 * La fiche de l'agriculteur — une fiche de registre, pas un tableau de quatorze
 * lignes.
 *
 * Trois décisions portent l'écran :
 *
 * 1. **Aucune donnée personnelle n'est affichée, ni même chargée.** Âge, sexe,
 *    situation familiale, instruction, expérience et numéro de pièce d'identité
 *    ont quitté `ProfilAgriculteur` : le téléphone d'un agriculteur change de
 *    mains, se prête, se perd, et rien de ce que l'écran ne sert pas ne mérite
 *    d'y descendre. Restent l'identité, le contact et le lieu — ce qui sert à se
 *    reconnaître et à se joindre.
 * 2. **La localisation est une descente, pas cinq lignes.** L'adresse est *dans*
 *    un village, lui-même dans une sous-préfecture, elle-même dans une
 *    préfecture : l'emboîtement est l'information. Un rail et des pastilles qui
 *    s'éteignent le disent ; cinq lignes côte à côte le perdent. L'adresse tient
 *    la tête du rail parce qu'elle en est le degré le plus fin — on n'arrive pas
 *    chez quelqu'un avec le nom d'une préfecture.
 * 3. **L'écran est en lecture seule, et le dit franchement.** Aucun endpoint
 *    d'écriture n'est ouvert au rôle FARMER : la note finale nomme la
 *    contrainte et la personne qui peut, elle, corriger.
 */
export const BlocInformations: FunctionComponent<BlocInformationsProps> = ({ profil }) => {
  // L'adresse est facultative : sans elle, le rail reprend simplement au
  // village, et c'est le village qui porte la pastille pleine.
  const echelons = [
    ...(profil.adresse ? [{ rang: 'Adresse', valeur: profil.adresse }] : []),
    { rang: 'Village', valeur: profil.village },
    { rang: 'Sous-préfecture', valeur: profil.sousPrefecture },
    { rang: 'Préfecture', valeur: profil.prefecture },
    { rang: 'Région', valeur: profil.region },
  ];

  return (
    <Stack spacing={3}>
      {/* — Identité — */}
      <Box>
        <SectionTitle>Identité</SectionTitle>
        <Card pad={2.25}>
          <Grille>
            <Donnee label="Nom complet" value={profil.nomComplet} pleineLargeur />
            <Donnee label="Code agriculteur" value={profil.code} pleineLargeur />
          </Grille>
        </Card>
      </Box>

      {/* — Contact — */}
      <Box>
        <SectionTitle>Contact</SectionTitle>
        <Card pad={2.25}>
          <Grille>
            <Donnee label="Téléphone" value={profil.telephone} pleineLargeur />
            {profil.telephoneSecondaire && (
              <Donnee label="Autre téléphone" value={profil.telephoneSecondaire} pleineLargeur />
            )}
          </Grille>
        </Card>
      </Box>

      {/* — Localisation, de l'adresse vers la région — */}
      <Box>
        <SectionTitle>Localisation</SectionTitle>
        <Card pad={2.25}>
          {echelons.map((echelon, index) => {
            const premier = index === 0;
            const dernier = index === echelons.length - 1;

            return (
              <Stack key={echelon.rang} direction="row" spacing={1.6} sx={{ minWidth: 0 }}>
                <Box
                  aria-hidden
                  sx={{ position: 'relative', width: 12, flexShrink: 0, display: 'flex', justifyContent: 'center' }}
                >
                  {!dernier && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 20,
                        bottom: -2,
                        width: '1px',
                        background: 'rgba(1,134,117,0.22)',
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      mt: premier ? '5px' : '6px',
                      width: premier ? 10 : 7,
                      height: premier ? 10 : 7,
                      borderRadius: '50%',
                      background: premier ? '#018675' : 'transparent',
                      border: premier ? 'none' : '1.5px solid rgba(1,134,117,0.42)',
                      boxShadow: premier ? '0 0 0 4px rgba(1,134,117,0.12)' : 'none',
                    }}
                  />
                </Box>

                <Box sx={{ minWidth: 0, pb: dernier ? 0 : 1.9 }}>
                  <Typography
                    sx={{
                      fontFamily: "'Ubuntu', sans-serif",
                      fontSize: premier ? 16.5 : 15,
                      fontWeight: premier ? 700 : 600,
                      color: '#1A1C1B',
                      lineHeight: 1.25,
                      // L'adresse est une phrase, pas un toponyme : elle doit
                      // pouvoir passer à la ligne sans déborder de la carte.
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {echelon.valeur}
                  </Typography>
                  <Box sx={{ mt: 0.15 }}>
                    <Sourcil>{echelon.rang}</Sourcil>
                  </Box>
                </Box>
              </Stack>
            );
          })}
        </Card>
      </Box>

      {/* — Ce que l'écran ne permet pas, dit avant qu'on le cherche — */}
      <Stack
        direction="row"
        spacing={1.4}
        sx={{
          borderRadius: '16px',
          background: 'rgba(55,75,70,0.05)',
          border: '1px solid rgba(55,75,70,0.08)',
          p: 1.75,
        }}
      >
        <EditOffRounded sx={{ fontSize: 19, color: '#5C5F5E', flexShrink: 0, mt: '1px' }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#374B46', lineHeight: 1.35 }}>
            Cette fiche est en lecture seule
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.35, lineHeight: 1.45 }}>
            Votre technicien est le seul à pouvoir la modifier. Signalez-lui l’information à corriger.
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
};
