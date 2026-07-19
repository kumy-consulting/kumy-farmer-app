/**
 * Kumy Design Tokens — Material Design 3 Tonal Palettes.
 * Source de vérité unique pour toutes les couleurs de l'application.
 * Palette de marque Kumy (vert agricole #018675), partagée avec la suite AgriPilot.
 */

export const primary = {
  0: '#000000',
  5: '#001410',
  10: '#00201B',
  15: '#002C25',
  20: '#003730',
  25: '#00443A',
  30: '#005046',
  35: '#005D51',
  40: '#006B5D',
  50: '#018675',
  60: '#35A18F',
  70: '#55BCA9',
  80: '#72D8C4',
  90: '#93F4E0',
  95: '#B6FFEE',
  98: '#E5FFF7',
  99: '#F3FFFA',
  100: '#FFFFFF',
} as const;

export const secondary = {
  0: '#000000',
  5: '#021411',
  10: '#0B1F1B',
  15: '#162925',
  20: '#203430',
  25: '#2B3F3B',
  30: '#374B46',
  35: '#425651',
  40: '#4E635D',
  50: '#667B76',
  60: '#80958F',
  70: '#9AB0AA',
  80: '#B5CBC5',
  90: '#D1E7E1',
  95: '#DFF6EF',
  98: '#E7FEF7',
  99: '#F3FFFA',
  100: '#FFFFFF',
} as const;

export const error = {
  0: '#000000',
  5: '#2D0001',
  10: '#410002',
  15: '#540003',
  20: '#690005',
  25: '#7E0007',
  30: '#93000A',
  35: '#A80710',
  40: '#BA1A1A',
  50: '#DE3730',
  60: '#FF5449',
  70: '#FF897D',
  80: '#FFB4AB',
  90: '#FFDAD6',
  95: '#FFEDEA',
  98: '#FFF8F7',
  99: '#FFFBFF',
  100: '#FFFFFF',
} as const;

/**
 * Palette neutre M3 (dérivée pour harmoniser les gris/textes).
 * Alignée sur les teintes chaudes du thème primary (hue vert-gris).
 */
export const neutral = {
  0: '#000000',
  5: '#0F1211',
  10: '#1A1C1B',
  15: '#242726',
  20: '#2F3130',
  25: '#3A3C3B',
  30: '#454746',
  35: '#505352',
  40: '#5C5F5E',
  50: '#757876',
  60: '#8F9291',
  70: '#AAADAB',
  80: '#C6C9C7',
  90: '#E2E3E1',
  95: '#F0F1EF',
  98: '#F9FAF7',
  99: '#FCFDFA',
  100: '#FFFFFF',
} as const;

/**
 * Warning : couleurs agricoles (safran/ambre), calibrées pour l'accessibilité
 * (AA sur fond clair).
 */
export const warning = {
  10: '#2E1500',
  20: '#4A2800',
  30: '#6B3C00',
  40: '#8C5000',
  50: '#C68A1A',
  60: '#E0A43A',
  70: '#F0BE6A',
  80: '#FFD89E',
  90: '#FFE8C2',
  95: '#FFF4E0',
  98: '#FFF8EC',
} as const;

/**
 * Tokens sémantiques M3 (light theme).
 * Consommés via `theme.palette.tokens.*` après module augmentation dans theme.ts.
 */
export const tokens = {
  // Primary
  primary: primary[50],
  onPrimary: primary[100],
  primaryContainer: primary[90],
  onPrimaryContainer: primary[10],

  // Secondary
  secondary: secondary[30],
  onSecondary: primary[100],
  secondaryContainer: secondary[90],
  onSecondaryContainer: secondary[10],

  // Error
  error: error[40],
  onError: primary[100],
  errorContainer: error[90],
  onErrorContainer: error[10],

  // Warning (alertes agricoles)
  warning: warning[50],
  onWarning: primary[100],
  warningContainer: warning[95],
  onWarningContainer: warning[10],

  // Success (alias primary dark pour cohérence)
  success: primary[40],
  onSuccess: primary[100],
  successContainer: primary[90],
  onSuccessContainer: primary[10],

  // Info
  info: primary[50],
  onInfo: primary[100],
  infoContainer: primary[95],
  onInfoContainer: primary[10],

  // Surfaces & background
  background: neutral[99],
  onBackground: neutral[10],
  surface: primary[100],
  onSurface: neutral[10],
  surfaceVariant: neutral[95],
  onSurfaceVariant: neutral[40],
  surfaceDim: neutral[90],
  surfaceBright: neutral[99],

  // Outlines
  outline: neutral[50],
  outlineVariant: neutral[80],

  // Scrim / overlay
  scrim: neutral[0],
  shadow: neutral[0],
} as const;

export type ColorToken = keyof typeof tokens;
