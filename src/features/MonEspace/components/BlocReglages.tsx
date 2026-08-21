import { useState, type FunctionComponent, type ReactNode } from 'react';

import CloudOffRounded from '@mui/icons-material/CloudOffRounded';
import MapRounded from '@mui/icons-material/MapRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import TaskAltRounded from '@mui/icons-material/TaskAltRounded';
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
 * Deux réserves honnêtes, portées ici pour ne pas être perdues au branchement :
 *
 * - **Le mode hors ligne est réellement local.** Dexie est déjà la source de
 *   vérité de l'app ; couper le réseau est une décision côté client, elle ne
 *   demande aucune API.
 * - **Les notifications, non.** Les SMS partent du serveur (LAfricaMobile), et
 *   aucun endpoint de préférences n'est ouvert au rôle FARMER. Ces deux bascules
 *   ne feront donc rien tant qu'un `PATCH` de préférences n'existera pas : dans
 *   la maquette elles montrent l'intention, en production elles mentiraient.
 *
 * Deux bascules plutôt qu'une seule « notifications » : recevoir une alerte de
 * ravageur la nuit et recevoir un rappel de consigne ne se décident pas
 * ensemble.
 */
export const BlocReglages: FunctionComponent = () => {
  const [alertes, setAlertes] = useState(true);
  const [consignes, setConsignes] = useState(true);
  const [horsLigne, setHorsLigne] = useState(false);

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
          icone={<TaskAltRounded />}
          titre="Consignes de mon technicien"
          detail="Nouvelles consignes et retards"
          controle={
            <Switch
              checked={consignes}
              onChange={(event) => setConsignes(event.target.checked)}
              inputProps={{ 'aria-label': 'Consignes de mon technicien' }}
              sx={bascule}
            />
          }
        />
        <Ligne
          icone={<CloudOffRounded />}
          titre="Mode hors ligne"
          detail={horsLigne ? 'Vos actions partiront à la reconnexion' : 'Travailler sans réseau'}
          controle={
            <Switch
              checked={horsLigne}
              onChange={(event) => setHorsLigne(event.target.checked)}
              inputProps={{ 'aria-label': 'Mode hors ligne' }}
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
