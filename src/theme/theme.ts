import { createTheme } from '@mui/material/styles';

import { primary, secondary, error, neutral, warning, tokens } from './colors';

/**
 * Thème MUI Kumy — copie fidèle du design system de la PWA ingénieur
 * (`agripilot-pwa`). Toute évolution du design system doit rester synchronisée
 * entre les deux apps (cible à terme : package partagé `@agripilot/core`).
 *
 * Module augmentation MUI.
 * - Les `PaletteColor` (primary, secondary, error, warning, info, success) sont
 *   étendues d'un index numérique pour exposer la tonal palette complète
 *   (ex : `theme.palette.primary[50]`, `theme.palette.secondary[90]`).
 * - Un champ `tokens` sémantique M3 est ajouté sur `palette`.
 */
declare module '@mui/material/styles' {
  interface PaletteColor {
    [tone: number]: string;
  }
  interface SimplePaletteColorOptions {
    [tone: number]: string;
  }
  interface Palette {
    neutral: { [tone: number]: string };
    tokens: typeof tokens;
  }
  interface PaletteOptions {
    neutral?: { [tone: number]: string };
    tokens?: typeof tokens;
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      ...primary,
      main: primary[50],
      light: primary[60],
      dark: primary[40],
      contrastText: primary[100],
    },
    secondary: {
      ...secondary,
      main: secondary[30],
      light: secondary[50],
      dark: secondary[20],
      contrastText: primary[100],
    },
    error: {
      ...error,
      main: error[40],
      light: error[80],
      dark: error[20],
      contrastText: primary[100],
    },
    warning: {
      ...warning,
      main: warning[50],
      light: warning[80],
      dark: warning[30],
      contrastText: primary[100],
    },
    info: {
      ...primary,
      main: primary[50],
      light: primary[70],
      dark: primary[40],
      contrastText: primary[100],
    },
    success: {
      ...primary,
      main: primary[40],
      light: primary[60],
      dark: primary[30],
      contrastText: primary[100],
    },
    neutral,
    tokens,
    text: {
      primary: neutral[10],
      secondary: neutral[40],
      disabled: neutral[70],
    },
    background: {
      default: neutral[99],
      paper: primary[100],
    },
    divider: neutral[80],
  },
  typography: {
    fontFamily: '"Ubuntu", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.6 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.75 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57 },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43 },
    button: {
      fontSize: '0.9375rem',
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'none',
    },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.66 },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      textTransform: 'uppercase',
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 6px 12px rgba(0, 0, 0, 0.1)',
    '0px 8px 16px rgba(0, 0, 0, 0.12)',
    '0px 10px 20px rgba(0, 0, 0, 0.14)',
    '0px 12px 24px rgba(0, 0, 0, 0.16)',
    '0px 14px 28px rgba(0, 0, 0, 0.18)',
    '0px 16px 32px rgba(0, 0, 0, 0.2)',
    '0px 18px 36px rgba(0, 0, 0, 0.22)',
    '0px 20px 40px rgba(0, 0, 0, 0.24)',
    '0px 22px 44px rgba(0, 0, 0, 0.26)',
    '0px 24px 48px rgba(0, 0, 0, 0.28)',
    '0px 26px 52px rgba(0, 0, 0, 0.3)',
    '0px 28px 56px rgba(0, 0, 0, 0.32)',
    '0px 30px 60px rgba(0, 0, 0, 0.34)',
    '0px 32px 64px rgba(0, 0, 0, 0.36)',
    '0px 34px 68px rgba(0, 0, 0, 0.38)',
    '0px 36px 72px rgba(0, 0, 0, 0.4)',
    '0px 38px 76px rgba(0, 0, 0, 0.42)',
    '0px 40px 80px rgba(0, 0, 0, 0.44)',
    '0px 42px 84px rgba(0, 0, 0, 0.46)',
    '0px 44px 88px rgba(0, 0, 0, 0.48)',
    '0px 46px 92px rgba(0, 0, 0, 0.5)',
    '0px 48px 96px rgba(0, 0, 0, 0.52)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
          },
          '&:focus': { outline: 'none' },
          '&:focus-visible': { outline: 'none' },
        },
        contained: {
          '&:hover': {
            boxShadow: `0px 4px 12px ${primary[40]}4D`,
          },
        },
        sizeLarge: {
          padding: '12px 32px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 12 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${neutral[90]}`,
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          padding: '6px 12px',
          '&.Mui-selected': { color: primary[50] },
          '&:focus': { outline: 'none' },
          '&:focus-visible': { outline: 'none' },
        },
        label: {
          fontSize: '0.75rem',
          '&.Mui-selected': { fontSize: '0.75rem' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
});
