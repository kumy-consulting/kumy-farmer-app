import type { FunctionComponent } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { fr, plural } from './domainesVisuals';

/** Totaux affichés dans la carte — dérivés des domaines (voir DomainesPage). */
export interface DomainesTotals {
  parcels: number;
  hectares: number;
  /**
   * Aire de chaque parcelle connue, en hectares — leur somme est la surface
   * exploitée, leurs proportions dessinent le parcellaire.
   *
   * `null` quand la végétation n'a pas pu être chargée : on ignore alors la
   * part exploitée, on ne la sait pas nulle, et afficher « 0 % » mentirait.
   */
  parcelAreas: number[] | null;
  alerts: number;
}

interface DomainesStatBarProps {
  totals: DomainesTotals;
}

/**
 * Au-delà de ce nombre de parcelles, les segments et leurs jours deviennent
 * plus fins que le trait : la bande retombe alors sur un remplissage continu,
 * qui dit toujours la proportion sans prétendre montrer le découpage.
 */
const MAX_SEGMENTS = 24;

/**
 * Le parcellaire : la bande de terre et son découpage réel.
 *
 * C'est le seul endroit de la carte où l'on prend un risque graphique, et il se
 * justifie par la donnée. Une barre de progression ordinaire dirait « 78 % ».
 * Ici la longueur totale est le domaine, la part pleine est ce qui est exploité,
 * **et cette part est fendue aux vraies proportions des parcelles** — chaque
 * segment a la largeur de son aire. On lit d'un coup combien de terre est en
 * production, en combien de morceaux, et s'ils sont réguliers ou non.
 *
 * Les aires viennent de `/farms/vegetation`, déjà appelé au chargement de la
 * page : le dessin ne coûte aucune requête.
 *
 * Les jours entre segments laissent voir le rail : ce sont des limites de
 * parcelle, pas des séparateurs décoratifs. La part pleine garde sa largeur
 * exacte quoi qu'il arrive — les segments se répartissent *à l'intérieur*
 * d'elle, si bien qu'une parcelle minuscule reste visible sans fausser le
 * rapport d'ensemble.
 */
const Parcellaire: FunctionComponent<{ ratio: number | null; areas: number[] }> = ({ ratio, areas }) => {
  const segments = areas.filter((a) => a > 0);
  const detaille = segments.length > 0 && segments.length <= MAX_SEGMENTS;

  return (
    <Box
      sx={{
        mt: '10px',
        // Même épaisseur que la barre de répartition de l'accueil : c'est le
        // même objet — une longueur partagée — et deux épaisseurs pour un même
        // signe obligent à réapprendre à le lire d'un écran à l'autre.
        height: 6,
        borderRadius: 999,
        overflow: 'hidden',
        // Pas de filet intérieur à cette échelle : sur 6 px, un trait de 1 px
        // occupe un tiers de la hauteur du rail et le teinte au lieu de le
        // cerner.
        background: ratio == null ? 'transparent' : 'rgba(1,134,117,0.13)',
        border: ratio == null ? '1px dashed rgba(1,134,117,0.32)' : 'none',
      }}
    >
      {ratio != null && ratio > 0 && (
        <Box
          sx={{
            width: `${Math.max(3, Math.min(100, ratio * 100))}%`,
            height: '100%',
            borderRadius: 999,
            overflow: 'hidden',
            display: 'flex',
            gap: '2px',
            background: detaille ? 'none' : '#018675',
          }}
        >
          {detaille &&
            segments.map((area, i) => (
              <Box
                key={i}
                sx={{ flex: `${area} 1 0`, minWidth: '2px', height: '100%', background: '#018675' }}
              />
            ))}
        </Box>
      )}
    </Box>
  );
};

/**
 * La carte de synthèse de l'onglet Domaines.
 *
 * Elle a d'abord été une rangée de quatre chiffres de même corps — parcelles,
 * hectares, NDVI moyen, alertes. Quatre grandeurs sans rapport, présentées comme
 * si elles se comparaient, et aucune hiérarchie : l'œil n'avait nulle part où se
 * poser. Trois décisions l'ont remplacée :
 *
 * 1. **La terre est le titre.** « Vos domaines », ce sont des hectares. La
 *    surface exploitée passe donc en tête, au corps d'un titre, et le reste
 *    devient ce qu'il est : du contexte.
 * 2. **Le pourcentage légende la bande au lieu de la doubler.** Il occupait une
 *    case à lui, en face d'une bande qui disait déjà la même chose ; il est
 *    maintenant posé au bout de la ligne de titre, là où il qualifie ce qu'on
 *    vient de lire.
 * 3. **Les alertes cessent d'être une statistique.** « 28 » en noir entre deux
 *    autres nombres noirs se lisait comme une décoration. En pied de carte, avec
 *    sa pastille et le ton d'erreur — celui déjà retenu pour les retards sur
 *    l'accueil —, c'est un avertissement. À zéro, la phrase change et le rouge
 *    disparaît : « aucune alerte » est une bonne nouvelle, pas un compteur vide.
 */
export const DomainesStatBar: FunctionComponent<DomainesStatBarProps> = ({ totals }) => {
  const areas = totals.parcelAreas ?? [];
  const exploitee = totals.parcelAreas == null ? null : areas.reduce((s, a) => s + a, 0);
  const ratio = exploitee == null || totals.hectares <= 0 ? null : Math.min(1, exploitee / totals.hectares);

  return (
    <Box
      sx={{
        padding: '13px 14px 12px',
        borderRadius: '18px',
        // Blanc franc, comme toutes les cartes de l'app. Le dégradé faisait de
        // cette carte-ci un cas particulier sans que rien ne le justifie.
        background: '#FFFFFF',
        border: '1px solid rgba(55,75,70,0.07)',
        boxShadow: '0 6px 18px rgba(1,134,117,0.06)',
      }}
    >
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1.5}>
        <Typography sx={{ minWidth: 0, color: '#5C5F5E', fontSize: '13.5px', fontWeight: 500 }} noWrap>
          <Box
            component="span"
            sx={{
              fontFamily: "'Ubuntu', sans-serif",
              fontSize: '22px',
              fontWeight: 700,
              color: '#1A1C1B',
              letterSpacing: '-0.015em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {exploitee == null ? `${fr(totals.hectares)} ha` : `${fr(exploitee)} ha`}
          </Box>{' '}
          {exploitee == null ? 'au total · part exploitée inconnue' : `exploités sur ${fr(totals.hectares)}`}
        </Typography>

        <Typography
          sx={{
            flexShrink: 0,
            fontFamily: "'Ubuntu', sans-serif",
            fontSize: '16px',
            fontWeight: 700,
            color: ratio == null ? '#8F9291' : '#016557',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {ratio == null ? '—' : `${Math.round(ratio * 100)} %`}
        </Typography>
      </Stack>

      <Parcellaire ratio={ratio} areas={areas} />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mt: '11px', pt: '10px', borderTop: '1px solid rgba(1,134,117,0.10)' }}
      >
        <Typography sx={{ fontSize: '12.5px', color: '#5C5F5E' }} noWrap>
          {plural(totals.parcels, 'parcelle')}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
          {totals.alerts > 0 && (
            <Box aria-hidden sx={{ width: 6, height: 6, borderRadius: '50%', background: '#BA1A1A', flexShrink: 0 }} />
          )}
          <Typography
            sx={{
              fontSize: '12.5px',
              fontWeight: totals.alerts > 0 ? 700 : 400,
              color: totals.alerts > 0 ? '#BA1A1A' : '#5C5F5E',
            }}
            noWrap
          >
            {totals.alerts > 0 ? plural(totals.alerts, 'alerte') : 'Aucune alerte'}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};
