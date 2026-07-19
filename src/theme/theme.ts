import { createTheme } from '@mui/material/styles';

import { primary, secondary, error, neutral, warning, tokens } from './colors';

/**
 * Module augmentation MUI.
 * - Les `PaletteColor` sont étendues d'un index numérique pour exposer la tonal
 *   palette complète (ex : `theme.palette.primary[50]`).
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
    h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01562em' },
    h2: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.6 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.75 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57 },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43 },
    button: { fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.75, textTransform: 'none' },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.66 },
    overline: { fontSize: '0.75rem', fontWeight: 500, lineHeight: 2.66, textTransform: 'uppercase' },
  },
  spacing: 8,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)' },
          '&:focus': { outline: 'none' },
          '&:focus-visible': { outline: 'none' },
        },
        sizeLarge: { padding: '12px 32px', fontSize: '1rem' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)' },
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
        root: { borderTop: `1px solid ${neutral[90]}`, height: 64 },
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
