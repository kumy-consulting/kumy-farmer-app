import { useCallback, useEffect, useState, type FunctionComponent, type ReactNode } from 'react';

import MapRounded from '@mui/icons-material/MapRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import { Box, Stack, Switch, Typography } from '@mui/material';

import { mesurerTuiles, viderTuiles, type EtatTuiles } from '@/shared/services/tuilesCache';

import { monEspaceApi } from '../monEspace.api';
import { Card, SectionTitle } from './espaceUi';

interface BlocReglagesProps {
  /** `null` tant que le serveur n'a pas dit son état — la bascule reste inerte. */
  alertesSms: boolean | null;
  onAlertesSmsChangees: (sms: boolean) => void;
}

interface LigneProps {
  icone: ReactNode;
  titre: string;
  detail: string;
  /** Teinte le détail en rouge sourd : un échec ne peut pas ressembler à un sous-titre. */
  enEchec?: boolean;
  last?: boolean;
  controle: ReactNode;
}

const Ligne: FunctionComponent<LigneProps> = ({ icone, titre, detail, enEchec, last, controle }) => (
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
      <Typography sx={{ fontSize: 12.5, color: enEchec ? '#B3261E' : '#5C5F5E', mt: 0.15, lineHeight: 1.4 }}>
        {detail}
      </Typography>
    </Box>
    <Box sx={{ flexShrink: 0 }}>{controle}</Box>
  </Stack>
);

const bascule = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#018675' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#018675' },
} as const;

/** « 12,6 Mo », ou le nombre de tuiles quand le poids n'est pas lisible. */
function libelleDesTuiles(etat: EtatTuiles): string {
  if (etat.tuiles === 0) return 'Aucun fond de carte enregistré';

  if (etat.octets != null) {
    const mo = etat.octets / (1024 * 1024);
    const arrondi = mo >= 10 ? Math.round(mo) : Math.round(mo * 10) / 10;
    return `${arrondi.toLocaleString('fr-FR')} Mo pour vos parcelles hors réseau`;
  }

  return `${etat.tuiles.toLocaleString('fr-FR')} tuiles pour vos parcelles hors réseau`;
}

/**
 * Réglages de l'application.
 *
 * Deux réglages seulement, et tous deux agissent réellement : la bascule écrit
 * dans `users/{uid}.notificationSettings.sms` via
 * `PATCH /farmers/me/notification-settings`, et « Vider » supprime pour de bon
 * les fonds de carte gardés hors réseau.
 *
 * **L'écriture est optimiste, mais elle revient en arrière.** La bascule bouge
 * d'abord, l'appel part ensuite ; s'il échoue, elle reprend sa position et le
 * dit. Sans ce retour, un agriculteur croirait avoir coupé ses SMS alors qu'ils
 * continuent d'arriver — et le prochain SMS lui apprendrait que l'écran ment.
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
export const BlocReglages: FunctionComponent<BlocReglagesProps> = ({
  alertesSms,
  onAlertesSmsChangees,
}) => {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tuiles, setTuiles] = useState<EtatTuiles | null>(null);
  const [vidage, setVidage] = useState(false);

  const recompterLesTuiles = useCallback(() => {
    void mesurerTuiles().then(setTuiles);
  }, []);

  useEffect(recompterLesTuiles, [recompterLesTuiles]);

  const basculerLesAlertes = async (sms: boolean): Promise<void> => {
    const precedent = alertesSms;
    setErreur(null);
    setEnCours(true);
    onAlertesSmsChangees(sms);

    try {
      await monEspaceApi.majAlertesSms(sms);
    } catch {
      // Retour à l'état d'avant : la bascule ne doit jamais afficher un réglage
      // que le serveur n'a pas pris.
      if (precedent !== null) onAlertesSmsChangees(precedent);
      setErreur('Réglage non enregistré. Réessayez une fois connecté.');
    } finally {
      setEnCours(false);
    }
  };

  const vider = async (): Promise<void> => {
    setVidage(true);
    await viderTuiles();
    recompterLesTuiles();
    setVidage(false);
  };

  return (
    <Box>
      <SectionTitle>Réglages</SectionTitle>
      <Card>
        <Ligne
          icone={<NotificationsActiveRounded />}
          titre="Alertes sur mes parcelles"
          detail={erreur ?? 'Un SMS dès qu’une alerte arrive'}
          enEchec={erreur !== null}
          last={tuiles === null}
          controle={
            <Switch
              checked={alertesSms === true}
              disabled={alertesSms === null || enCours}
              onChange={(event) => void basculerLesAlertes(event.target.checked)}
              inputProps={{ 'aria-label': 'Alertes sur mes parcelles' }}
              sx={bascule}
            />
          }
        />
        {tuiles !== null && (
        <Ligne
          last
          icone={<MapRounded />}
          titre="Cartes enregistrées"
          detail={libelleDesTuiles(tuiles)}
          controle={
            <Box
              component="button"
              type="button"
              onClick={() => void vider()}
              disabled={vidage || tuiles.tuiles === 0}
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
                '&:disabled': { color: 'rgba(55,75,70,0.32)', cursor: 'default' },
                '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2, borderRadius: 6 },
              }}
            >
              {vidage ? 'Vidage…' : 'Vider'}
            </Box>
          }
        />
        )}
      </Card>
    </Box>
  );
};
