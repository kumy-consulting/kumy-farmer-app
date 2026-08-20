import { useState, type FunctionComponent, type ReactNode } from 'react';

import EditOffRounded from '@mui/icons-material/EditOffRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { ProfilAgriculteur } from '../monEspace.types';
import { Card, Donnee, SectionTitle, Sourcil } from './espaceUi';

interface BlocInformationsProps {
  profil: ProfilAgriculteur;
}

const SEXE: Record<ProfilAgriculteur['sexe'], string> = { male: 'Homme', female: 'Femme' };

/** Ne laisse voir que les quatre derniers caractères : « ••••••••4721 ». */
const masque = (valeur: string): string => `${'•'.repeat(Math.max(0, valeur.length - 4))}${valeur.slice(-4)}`;

/** Grille de deux colonnes : les faits courts s'apparient, les longs traversent. */
const Grille: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 1.9 }}>{children}</Box>
);

/**
 * Les informations personnelles de l'agriculteur — une fiche de registre, pas
 * un tableau de quatorze lignes.
 *
 * Trois décisions portent l'écran :
 *
 * 1. **Des rubriques, pas une liste.** État civil, pièce d'identité, contact,
 *    localisation sont quatre registres différents ; les fondre dans une seule
 *    carte oblige à tout parcourir pour vérifier un numéro.
 * 2. **La localisation est une descente, pas quatre lignes.** Un village est
 *    *dans* une sous-préfecture, elle-même dans une préfecture : l'emboîtement
 *    est l'information. Un rail et des pastilles qui s'éteignent le disent ;
 *    quatre lignes côte à côte le perdent.
 * 3. **L'écran est en lecture seule, et le dit franchement.** Aucun endpoint
 *    d'écriture n'est ouvert au rôle FARMER : la note finale nomme la
 *    contrainte et la personne qui peut, elle, corriger.
 */
export const BlocInformations: FunctionComponent<BlocInformationsProps> = ({ profil }) => {
  const [idVisible, setIdVisible] = useState(false);

  const echelons = [
    { rang: 'Village', valeur: profil.village },
    { rang: 'Sous-préfecture', valeur: profil.sousPrefecture },
    { rang: 'Préfecture', valeur: profil.prefecture },
    { rang: 'Région', valeur: profil.region },
  ];

  return (
    <Stack spacing={3}>
      {/* — État civil — */}
      <Box>
        <SectionTitle>État civil</SectionTitle>
        <Card pad={2.25}>
          <Grille>
            <Donnee label="Nom complet" value={profil.nomComplet} pleineLargeur />
            <Donnee label="Âge" value={profil.age} />
            <Donnee label="Sexe" value={SEXE[profil.sexe]} />
            {profil.situationFamiliale && (
              <Donnee label="Situation familiale" value={profil.situationFamiliale} pleineLargeur />
            )}
            <Donnee label="Instruction" value={profil.niveauInstruction} />
            {/* L'expérience est une qualification de la personne, pas une donnée
                de parcellaire : sa place est ici, à côté de l'instruction. */}
            <Donnee label="Expérience agricole" value={`${profil.anneesExperience} ans`} />
          </Grille>
        </Card>
      </Box>

      {/* — Pièce d'identité — */}
      {profil.pieceIdentite && (
        <Box>
          <SectionTitle>Pièce d’identité</SectionTitle>
          <Box
            sx={{
              borderRadius: '18px',
              background: 'rgba(1,134,117,0.055)',
              border: '1px solid rgba(1,134,117,0.16)',
              p: 2.25,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
              <Typography
                sx={{
                  fontFamily: "'Ubuntu', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: idVisible ? '0.04em' : '0.09em',
                  color: '#1A1C1B',
                  minWidth: 0,
                  overflowWrap: 'anywhere',
                }}
              >
                {idVisible ? profil.pieceIdentite : masque(profil.pieceIdentite)}
              </Typography>

              <Stack
                component="button"
                type="button"
                direction="row"
                alignItems="center"
                spacing={0.6}
                onClick={() => setIdVisible((visible) => !visible)}
                aria-pressed={idVisible}
                sx={{
                  appearance: 'none',
                  flexShrink: 0,
                  font: 'inherit',
                  cursor: 'pointer',
                  height: 40,
                  px: 1.4,
                  my: '-8px',
                  mr: '-6px',
                  borderRadius: 999,
                  border: '1px solid rgba(1,101,87,0.28)',
                  background: '#FFFFFF',
                  color: '#016557',
                  '&:active': { background: '#F0FBF7' },
                  '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
                }}
              >
                {idVisible ? (
                  <VisibilityOffRounded sx={{ fontSize: 17 }} />
                ) : (
                  <VisibilityRounded sx={{ fontSize: 17 }} />
                )}
                <Typography component="span" sx={{ fontSize: 13, fontWeight: 700, color: 'inherit' }}>
                  {idVisible ? 'Masquer' : 'Afficher'}
                </Typography>
              </Stack>
            </Stack>

            <Typography sx={{ fontSize: 12, color: '#5C5F5E', mt: 1.1, lineHeight: 1.45 }}>
              {idVisible
                ? 'Refermez-la avant de poser le téléphone.'
                : 'Masquée par défaut, au cas où le téléphone change de mains.'}
            </Typography>
          </Box>
        </Box>
      )}

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

      {/* — Localisation, du village vers la région — */}
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
            Votre encadreur est le seul à pouvoir la modifier. Signalez-lui l’information à corriger.
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
};
