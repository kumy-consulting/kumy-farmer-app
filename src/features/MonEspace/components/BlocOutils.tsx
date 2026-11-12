import type { FunctionComponent, ReactNode } from 'react';

import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import { Box, Stack, Typography } from '@mui/material';

import { SectionTitle } from './espaceUi';

/**
 * Surface en attente : le même cadre que les cartes actives, mais posé au
 * blanc à 55 % et sans ombre portée. Rien ne se soulève ici, donc rien ne
 * projette d'ombre — c'est le signal le plus honnête qu'il n'y a pas de geste
 * à faire.
 */
const surfaceEnAttente = {
  border: '1px solid rgba(55,75,70,0.07)',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.55)',
  p: 1.75,
} as const;

/** Teinte unique des trois pastilles : le bloc entier est au même état. */
const TEINTE_EN_ATTENTE = 'rgba(110,140,168,0.42)';

const Pastille: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Box
    aria-hidden
    sx={{
      flexShrink: 0,
      width: 38,
      height: 38,
      borderRadius: '13px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: TEINTE_EN_ATTENTE,
      '& svg': { fontSize: 21, color: '#FFFFFF' },
    }}
  >
    {children}
  </Box>
);

/**
 * L'étiquette qui prend la place du chevron. Le chevron promettait un écran
 * derrière la carte ; l'étiquette dit qu'il arrive. Elle est lue par les
 * lecteurs d'écran — c'est elle, et non le gris, qui porte l'information.
 */
const Bientot: FunctionComponent = () => (
  <Typography
    component="span"
    sx={{
      flexShrink: 0,
      px: 1,
      py: 0.35,
      borderRadius: 999,
      background: 'rgba(55,75,70,0.08)',
      fontFamily: "'Ubuntu', sans-serif",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#6E7271',
      lineHeight: 1.4,
    }}
  >
    Bientôt
  </Typography>
);

const Ligne: FunctionComponent<{ icone: ReactNode; titre: string; detail: string }> = ({ icone, titre, detail }) => (
  <Stack sx={surfaceEnAttente}>
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
      <Pastille>{icone}</Pastille>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700, color: '#5C5F5E' }}>
          {titre}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#8F9291', mt: 0.1 }}>{detail}</Typography>
      </Box>
      <Bientot />
    </Stack>
  </Stack>
);

/**
 * Le versant économique de l'exploitation, réuni en une seule entrée.
 *
 * Le nom du bloc n'est pas « Mes outils » : aucune de ces trois choses ne sert à
 * cultiver — l'onglet Domaines couvre le technique. Elles portent l'argent et la
 * réputation : emprunter, être bien noté, vendre.
 *
 * **Les trois sont annoncées, aucune n'est ouverte.** Le crédit et le score
 * s'appuient sur des endpoints de scoring qui ne sont pas encore branchés, la
 * place de marché n'existe pas. Tant que c'est vrai, les trois lignes partagent
 * un seul état : surface éteinte, pastille grise, étiquette « Bientôt » à la
 * place du chevron, et plus rien à cliquer — un chevron qui ouvre un écran de
 * données fictives ment sur ce que le produit sait faire aujourd'hui.
 *
 * **Et aucun chiffre.** Les valeurs de maquette étaient encore affichées ici :
 * « 5 500 000 GNF » de potentiel de crédit et « 68/100 · grade B », identiques
 * pour tout agriculteur, et même pas cohérentes avec le jeu de démonstration qui
 * les portait. L'étiquette « Bientôt » qualifie la disponibilité de la fonction,
 * pas la véracité du nombre : en face du nom de l'agriculteur, un montant en
 * francs guinéens se lit comme le sien. Les lignes disent donc ce que chaque
 * fonction donnera, et rien de chiffré tant que le scoring ne tourne pas.
 *
 * Rouvrir le bloc = brancher les endpoints, rendre les lignes cliquables,
 * retirer l'étiquette. Dans cet ordre : la valeur vient de l'API, ou elle ne
 * s'affiche pas.
 */
export const BlocOutils: FunctionComponent = () => (
  <Box>
    <SectionTitle>Financement et marché</SectionTitle>

    <Stack spacing={1.25}>
      <Ligne
        icone={<AccountBalanceWalletRounded />}
        titre="Mon potentiel de crédit"
        detail="Le montant que votre exploitation peut porter"
      />

      <Ligne
        icone={<EmojiEventsRounded />}
        titre="Mon score"
        detail="Votre note et les six piliers qui la composent"
      />

      <Ligne
        icone={<StorefrontRounded />}
        titre="Vendre ma récolte"
        detail="Acheteurs et prix de la campagne"
      />
    </Stack>
  </Box>
);
