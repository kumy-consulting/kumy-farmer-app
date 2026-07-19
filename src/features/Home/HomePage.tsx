import { Box, Container, Paper, Stack, Typography } from '@mui/material';

/**
 * Écran d'accueil provisoire — point de départ de l'app agriculteur Kumy.
 * À remplacer par le vrai tableau de bord (mes cultures, alertes, météo).
 */
export function HomePage() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: (t) => `linear-gradient(180deg, ${t.palette.primary[99]} 0%, ${t.palette.primary[95]} 100%)`,
        pt: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        pb: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box component="img" src="/logo-kumy.svg" alt="Kumy" sx={{ width: 96, height: 96 }} />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h3" color="primary.dark" fontWeight={700}>
              Bienvenue sur Kumy
            </Typography>
            <Typography variant="body1" color="text.secondary">
              L&apos;application des agriculteurs. Vos cultures, vos alertes et votre météo, même hors connexion.
            </Typography>
          </Stack>
          <Paper elevation={2} sx={{ p: 2.5, width: '100%' }}>
            <Typography variant="overline" color="text.secondary">
              Projet initialisé
            </Typography>
            <Typography variant="body2" color="text.primary">
              Le squelette technique est en place (React · Vite · MUI · Capacitor · Dexie). Prochaine étape : extraire
              le socle partagé <code>@agripilot/core</code> et construire le premier parcours agriculteur.
            </Typography>
          </Paper>
          <Typography variant="caption" color="text.disabled">
            Kumy v{__APP_VERSION__} · build {__BUILD_SHA__}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
