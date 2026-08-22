import { useState, type FunctionComponent, type ReactNode } from 'react';

import MapRounded from '@mui/icons-material/MapRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import { Box, Stack, Switch, Typography } from '@mui/material';

import { Card, SectionTitle } from './espaceUi';

interface LigneProps {
  icone: ReactNode;
  titre: string;
  detail: string;
  last?: boolean;
  controle: ReactNode;
}

const Ligne: FunctionComponent<LigneProps> = ({ icone, titre, detail, last, controle }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.25}
    sx={{ py: 0.9, borderBottom: last ? 'none' : '1px solid rgba(55,75,70,0.08)', minHeight: 44 }}
  >
    <Box
      aria-hidden
      sx={{
        flexShrink: 0,
        width: 34,
        height: 34,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(1,134,117,0.10)',
        '& svg': { fontSize: 18, color: '#016557' },
      }}
    >
      {icone}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 600, color: '#1A1C1B' }}>
        {titre}
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.15, lineHeight: 1.4 }}>{detail}</Typography>
    </Box>
    <Box sx={{ flexShrink: 0 }}>{controle}</Box>
  </Stack>
);

const bascule = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#018675' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#018675' },
} as const;

/**
 * Réglages de l'application.
 *
 * Deux réglages seulement, et une réserve à porter jusqu'au branchement : les
 * SMS partent du serveur (LAfricaMobile) et aucun endpoint de préférences n'est
 * ouvert au rôle FARMER. La bascule des alertes ne fera donc rien tant qu'un
 * `PATCH` de préférences n'existera pas — dans la maquette elle montre
 * l'intention, en production elle mentirait.
 *
 * Ce qui a été retiré, et pourquoi :
 *
 * - **« Consignes de mon technicien ».** Une consigne est une instruction que
 *   l'agriculteur doit exécuter, pas une actualité : lui offrir de couper ces
 *   notifications, c'est lui offrir de rater son travail. Les alertes, elles,
 *   peuvent légitimement se taire la nuit.
 * - **« Mode hors ligne ».** L'app est déjà hors ligne par construction — Dexie
 *   est la source de vérité et la synchronisation se fait en arrière-plan dès
 *   que le réseau revient. Un interrupteur laissait croire qu'il fallait
 *   l'armer avant de partir au champ, alors que ne rien faire suffit.
 */
export const BlocReglages: FunctionComponent = () => {
  const [alertes, setAlertes] = useState(true);

  return (
    <Box>
      <SectionTitle>Réglages</SectionTitle>
      <Card>
        <Ligne
          icone={<NotificationsActiveRounded />}
          titre="Alertes sur mes parcelles"
          detail="Un SMS dès qu’une alerte arrive"
          controle={
            <Switch
              checked={alertes}
              onChange={(event) => setAlertes(event.target.checked)}
              inputProps={{ 'aria-label': 'Alertes sur mes parcelles' }}
              sx={bascule}
            />
          }
        />
        <Ligne
          last
          icone={<MapRounded />}
          titre="Cartes enregistrées"
          detail="12 Mo pour vos parcelles hors réseau"
          controle={
            <Box
              component="button"
              type="button"
              sx={{
                appearance: 'none',
                background: 'none',
                border: 0,
                font: 'inherit',
                cursor: 'pointer',
                fontFamily: "'Ubuntu', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: '#016557',
                minHeight: 44,
                px: 1,
                mr: -1,
                '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2, borderRadius: 6 },
              }}
            >
              Vider
            </Box>
          }
        />
      </Card>
    </Box>
  );
};
