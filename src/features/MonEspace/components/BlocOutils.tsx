import type { FunctionComponent, ReactNode } from 'react';

import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import { Box, Stack, Typography } from '@mui/material';

import type { EligibiliteCredit, ScoreAgriculteur } from '../monEspace.types';
import { SectionTitle } from './espaceUi';

interface BlocOutilsProps {
  eligibilite: EligibiliteCredit;
  score: ScoreAgriculteur;
  onOuvrir?: (outil: 'credit' | 'score' | 'marche') => void;
}

const surface = {
  appearance: 'none',
  border: '1px solid rgba(55,75,70,0.07)',
  font: 'inherit',
  textAlign: 'left',
  borderRadius: '18px',
  background: '#FFFFFF',
  boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
  minHeight: 44,
  '&:focus-visible': { outline: '2px solid #016557', outlineOffset: 2 },
} as const;

const Pastille: FunctionComponent<{ teinte: string; taille?: number; children: ReactNode }> = ({
  teinte,
  taille = 42,
  children,
}) => (
  <Box
    aria-hidden
    sx={{
      flexShrink: 0,
      width: taille,
      height: taille,
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: teinte,
      '& svg': { fontSize: taille * 0.55, color: '#FFFFFF' },
    }}
  >
    {children}
  </Box>
);

/**
 * Le versant économique de l'exploitation, réuni en une seule entrée.
 *
 * Le nom du bloc n'est pas « Mes outils » : aucune de ces trois choses ne sert à
 * cultiver — l'onglet Domaines couvre le technique. Elles portent l'argent et la
 * réputation : emprunter, être bien noté, vendre.
 *
 * **La surface suit la valeur.** Le crédit prend toute la largeur et affiche son
 * montant au corps d'un titre : c'est le chiffre le plus utile du produit, il
 * n'a rien à faire en sous-titre de 12 px. Le score suit, réel mais dérivé. La
 * vente ferme la marche, réduite à une ligne : elle n'existe pas encore, et lui
 * donner la plus grande carte — ce qu'elle avait — revenait à faire de la
 * fonction absente l'élément le plus voyant de l'écran.
 */
export const BlocOutils: FunctionComponent<BlocOutilsProps> = ({ eligibilite, score, onOuvrir }) => (
  <Box>
    <SectionTitle>Financement et marché</SectionTitle>

    <Stack spacing={1.25}>
      <Stack
        component="button"
        type="button"
        onClick={() => onOuvrir?.('credit')}
        sx={{ ...surface, cursor: 'pointer', p: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
          <Pastille teinte="linear-gradient(140deg, #018675 0%, #016557 100%)">
            <AccountBalanceWalletRounded />
          </Pastille>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14.5, fontWeight: 700, color: '#1A1C1B' }}>
              Mon crédit
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.1 }}>
              {eligibilite.eligible ? 'Vous pouvez demander jusqu’à' : 'Montant atteignable'}
            </Typography>
          </Box>
          <ChevronRightRounded sx={{ fontSize: 20, color: 'rgba(55,75,70,0.35)', flexShrink: 0 }} />
        </Stack>
        <Typography
          sx={{
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#016557',
            mt: 1.25,
          }}
        >
          {eligibilite.montantMaxFormate}
        </Typography>
      </Stack>

      <Stack
        component="button"
        type="button"
        direction="row"
        alignItems="center"
        spacing={1.5}
        onClick={() => onOuvrir?.('score')}
        sx={{ ...surface, cursor: 'pointer', p: 2 }}
      >
        <Pastille teinte="linear-gradient(140deg, #E0A22B 0%, #B87914 100%)">
          <EmojiEventsRounded />
        </Pastille>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14.5, fontWeight: 700, color: '#1A1C1B' }}>
            Mon score
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: '#5C5F5E', mt: 0.1 }}>
            {score.scoreGlobal}/100 · grade {score.grade} · 6 piliers
          </Typography>
        </Box>
        <ChevronRightRounded sx={{ fontSize: 20, color: 'rgba(55,75,70,0.35)', flexShrink: 0 }} />
      </Stack>

      {/* Aucun endpoint de place de marché n'existe : une ligne discrète annonce
          l'à-venir. Pas de chevron — il n'y a rien à ouvrir. */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ ...surface, background: 'rgba(255,255,255,0.55)', boxShadow: 'none', p: 1.5 }}
      >
        <Pastille teinte="rgba(110,140,168,0.45)" taille={34}>
          <StorefrontRounded />
        </Pastille>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 600, color: '#5C5F5E' }}>
            Vendre ma récolte
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#8F9291', mt: 0.1 }}>
            Bientôt — acheteurs et prix de la campagne
          </Typography>
        </Box>
      </Stack>
    </Stack>
  </Box>
);
