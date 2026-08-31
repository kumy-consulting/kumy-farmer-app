import type { FunctionComponent, ReactNode } from 'react';

import { Box, Skeleton, Stack, Typography } from '@mui/material';

import type { ProfilAgriculteur } from '../monEspace.types';
import { Card, Donnee, SectionTitle, Sourcil } from './espaceUi';

interface BlocInformationsProps {
  /** `null` hors session — il n'y a alors personne à afficher. */
  profil: ProfilAgriculteur | null;
  isLoading?: boolean;
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
 * 3. **L'écran est en lecture seule, sans le dire.** Aucun endpoint d'écriture
 *    n'est ouvert au rôle FARMER. Une note le rappelait en pied de fiche ; elle
 *    a été retirée. Rien ici ne ressemble à un champ ni à un bouton — annoncer
 *    qu'on ne peut pas modifier attirait l'attention sur une action que
 *    personne ne cherchait, et terminait l'écran sur ce qu'il refuse plutôt que
 *    sur ce qu'il montre.
 * 4. **Un champ vide ne s'affiche pas.** L'API rend les échelons qu'elle
 *    connaît ; ceux qui manquent au dossier sortent vides. Une ligne
 *    « Sous-préfecture » sans valeur, ou un « Non renseigné », donnerait à une
 *    lacune l'apparence d'une donnée — et enverrait l'agriculteur corriger ce
 *    qu'il croit être une erreur d'affichage.
 */
export const BlocInformations: FunctionComponent<BlocInformationsProps> = ({ profil, isLoading }) => {
  if (isLoading || !profil) {
    return <FicheEnAttente />;
  }

  // Chaque échelon est facultatif : le rail démarre au degré le plus fin que le
  // dossier connaisse, et c'est celui-là qui porte la pastille pleine.
  const echelons = [
    { rang: 'Adresse', valeur: profil.adresse ?? '' },
    { rang: 'Village', valeur: profil.village },
    { rang: 'Sous-préfecture', valeur: profil.sousPrefecture },
    { rang: 'Préfecture', valeur: profil.prefecture },
    { rang: 'Région', valeur: profil.region },
  ].filter((echelon) => echelon.valeur.trim() !== '');

  return (
    <Stack spacing={3}>
      {/* — Identité — */}
      <Box>
        <SectionTitle>Identité</SectionTitle>
        <Card pad={2.25}>
          <Grille>
            <Donnee label="Nom complet" value={profil.nomComplet} pleineLargeur />
            {profil.code && <Donnee label="Code agriculteur" value={profil.code} pleineLargeur />}
          </Grille>
        </Card>
      </Box>

      {/* — Contact — */}
      <Box>
        <SectionTitle>Contact</SectionTitle>
        <Card pad={2.25}>
          <Grille>
            {profil.telephone && <Donnee label="Téléphone" value={profil.telephone} pleineLargeur />}
            {profil.telephoneSecondaire && (
              <Donnee label="Autre téléphone" value={profil.telephoneSecondaire} pleineLargeur />
            )}
          </Grille>
        </Card>
      </Box>

      {/* — Localisation, de l'adresse vers la région — */}
      {echelons.length > 0 && (
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
      )}
    </Stack>
  );
};

/**
 * Le squelette reprend la découpe de la fiche — trois cartes, pas une barre de
 * progression : l'écran s'affiche à sa place définitive, puis se remplit.
 */
const FicheEnAttente: FunctionComponent = () => (
  <Stack spacing={3}>
    {[
      { titre: 'Identité', lignes: 2 },
      { titre: 'Contact', lignes: 1 },
      { titre: 'Localisation', lignes: 4 },
    ].map((section) => (
      <Box key={section.titre}>
        <SectionTitle>{section.titre}</SectionTitle>
        <Card pad={2.25}>
          <Stack spacing={1.9}>
            {Array.from({ length: section.lignes }, (_, rang) => (
              <Box key={rang}>
                <Skeleton width={96} height={12} sx={{ bgcolor: 'rgba(1,134,117,0.09)' }} />
                <Skeleton width={176} height={20} sx={{ bgcolor: 'rgba(1,134,117,0.09)' }} />
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>
    ))}
  </Stack>
);
