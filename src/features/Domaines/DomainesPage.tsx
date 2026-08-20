import { useMemo, type FunctionComponent } from 'react';

import ReplayRounded from '@mui/icons-material/ReplayRounded';
import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { KumySprout } from '@/shared/components/KumySprout';
import { neutral, primary } from '@/theme/colors';

import { DomainCard } from './components/DomainCard';
import { DomainesSkeleton } from './components/DomainesSkeleton';
import { DomainesStatBar } from './components/DomainesStatBar';
import { parseArea } from './components/domainesVisuals';
import { useDomaines } from './useDomaines';

const Page = styled(Box)({
  minHeight: '100dvh',
  background: 'linear-gradient(180deg, #F3FFFA 0%, #F0F1EF 100%)',
});

/** Révélation en fondu montant (cohérente avec l'accueil). */
const Reveal = styled(Box)({
  animation: 'domIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both',
  '@keyframes domIn': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

/** Badge circulaire KumySprout, réutilisé par les états vide / erreur. */
const SproutBadge: FunctionComponent = () => (
  <Box
    sx={{
      width: 84,
      height: 84,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 30% 25%, #FFFFFF 0%, #EAF6F0 100%)',
      border: `1px solid ${primary[80]}`,
      boxShadow: '0 14px 30px rgba(1,134,117,0.18)',
    }}
  >
    <KumySprout size={42} color={primary[40]} accent={primary[50]} />
  </Box>
);

// L'espace du dock est déjà réservé par AppLayout ; on ajoute juste une marge.
const CONTENT_SX = {
  px: 2.5,
  pt: 'calc(env(safe-area-inset-top, 0px) + 20px)',
  pb: 3,
} as const;

/** En-tête de section : titre à barre d'accent + pastille compteur. */
const DomainesHeader: FunctionComponent<{ count: number }> = ({ count }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.75, minWidth: 0 }}>
    <Typography
      sx={{
        position: 'relative',
        pl: '12px',
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 16,
        fontWeight: 700,
        color: '#1A1C1B',
        lineHeight: '22px',
        letterSpacing: '-0.01em',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 3,
          bottom: 3,
          width: 3,
          borderRadius: '2px',
          background: 'linear-gradient(180deg, #018675 0%, #006B5D 100%)',
        },
      }}
    >
      Domaines
    </Typography>
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 22,
        height: 22,
        px: '6px',
        borderRadius: 999,
        fontFamily: "'Ubuntu', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.02em',
        background: 'rgba(1,134,117,0.14)',
        color: '#006B5D',
      }}
    >
      {count}
    </Box>
  </Stack>
);

export const DomainesPage: FunctionComponent = () => {
  const { domains, summary, isLoading, error, reload } = useDomaines();
  const navigate = useNavigate();

  const title = (
    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 24, fontWeight: 700, color: primary[20] }}>
      Vos domaines
    </Typography>
  );

  // Barre de synthèse dérivée des domaines chargés (source des cartes) : garantit
  // que l'en-tête colle aux cartes. L'endpoint /dashboard renvoyant parfois 0
  // parcelles / 0 alertes (bug d'agrégation), on ne l'utilise qu'en repli non-nul.
  const totals = useMemo(() => {
    const parcels = domains.reduce((s, d) => s + d.parcelsCount, 0);
    const alerts = domains.reduce((s, d) => s + d.alertCount, 0);
    const areaSum = domains.reduce((s, d) => s + d.area, 0);
    // Surface exploitée (découpée en parcelles) : la végétation renvoie une aire par
    // parcelle (chaîne, séparateur décimal variable selon la locale du backend).
    // Sans aucune parcelle connue on renvoie `null` plutôt que 0 — on ignore
    // alors la part cultivée, on ne la sait pas nulle.
    const vegParcels = domains.flatMap((d) => d.vegetationParcels);
    const parcelAreas = vegParcels.length ? vegParcels.map((p) => parseArea(p.area)) : null;

    return {
      parcels: summary?.totalParcels || parcels,
      hectares: summary?.totalArea || areaSum,
      parcelAreas,
      alerts: summary?.alerts.total || alerts,
    };
  }, [domains, summary]);

  if (isLoading) {
    return (
      // `key` distinct par branche : empêche React de réutiliser le sous-arbre
      // partagé (<Box CONTENT_SX>) d'une branche à l'autre. Sans ça, le passage
      // chargement → contenu réconcilie les enfants d'un même <Box> réutilisé et
      // provoque un removeChild au commit (nœuds animés Reveal).
      <Page key="dom-loading">
        <Box sx={CONTENT_SX}>
          <Box sx={{ mb: 2 }}>{title}</Box>
          <DomainesSkeleton />
        </Box>
      </Page>
    );
  }

  if (error) {
    return (
      <Page key="dom-error">
        <Box
          sx={{
            ...CONTENT_SX,
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Stack spacing={2} alignItems="center" maxWidth={320}>
            <SproutBadge />
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 20, fontWeight: 700, color: primary[20] }}>
              Chargement impossible
            </Typography>
            <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: neutral[50] }}>{error}</Typography>
            <Stack
              component="button"
              direction="row"
              alignItems="center"
              spacing={0.75}
              onClick={reload}
              sx={{
                // Resets ciblés et non `all: 'unset'` : dans un `sx`, MUI hisse
                // `color`/`background` comme system props et les émet AVANT les
                // déclarations littérales, que l'expansion de `all` efface
                // ensuite — le bouton perdait son vert et son texte blanc. Le
                // reset annulait aussi `display`, ce qui empilait l'icône
                // au-dessus du libellé.
                appearance: 'none',
                border: 0,
                font: 'inherit',
                textAlign: 'inherit',
                cursor: 'pointer',
                mt: 0.5,
                px: 2.5,
                py: 1,
                borderRadius: 999,
                background: primary[50],
                color: '#FFFFFF',
                '& svg': { fontSize: 18 },
                '&:active': { opacity: 0.85 },
              }}
            >
              <ReplayRounded />
              {/* `component="span"` : un <p> dans un <button> est invalide (Chrome
                  réorganise le DOM et casse la réconciliation React → removeChild). */}
              <Typography component="span" sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 14, fontWeight: 700 }}>
                Réessayer
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Page>
    );
  }

  if (domains.length === 0) {
    return (
      <Page key="dom-empty">
        <Box
          sx={{
            ...CONTENT_SX,
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Stack spacing={2} alignItems="center" maxWidth={320}>
            <SproutBadge />
            <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 22, fontWeight: 700, color: primary[20] }}>
              Aucun domaine pour l’instant
            </Typography>
            <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: neutral[50] }}>
              Votre encadreur enregistre vos domaines avec vous, sur le terrain. Ils apparaissent ici après sa visite.
            </Typography>
          </Stack>
        </Box>
      </Page>
    );
  }

  return (
    <Page key="dom-content">
      <Box sx={CONTENT_SX}>
        <Reveal>
          <Box sx={{ mb: 2 }}>{title}</Box>
          <DomainesStatBar totals={totals} />
        </Reveal>

        <Box sx={{ mt: 3 }}>
          <Reveal sx={{ animationDelay: '0.06s' }}>
            <DomainesHeader count={domains.length} />
          </Reveal>

          <Stack spacing={1.75}>
            {domains.map((domain, i) => (
              <Reveal key={domain.id} sx={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                <DomainCard
                  domain={domain}
                  onClick={() => navigate(`/domaines/${domain.id}`, { state: { name: domain.name } })}
                />
              </Reveal>
            ))}
          </Stack>
        </Box>
      </Box>
    </Page>
  );
};
