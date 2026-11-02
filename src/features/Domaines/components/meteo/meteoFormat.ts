import { neutral, primary } from '@/theme/colors';

/**
 * Formatage et dérivations d'affichage de l'onglet Météos.
 *
 * Portage allégé de `agripilot-pwa/src/features/Meteo/utils/meteoFormat.ts` :
 * l'app agriculteur n'affiche ni les paliers de confiance (c1–c4), ni la
 * provenance de la prévision, donc tout ce qui les sert est resté là-bas.
 */

/** Palette de l'onglet, adossée aux tokens de marque plutôt qu'à des littéraux. */
export const M = {
  ink: neutral[10],
  inkSoft: neutral[30],
  inkMute: neutral[40],
  hair: neutral[90],
  paper: '#FFFFFF',
  paperTile: '#F5F8F6',
  green: primary[50],
  greenDeep: primary[40],
  red: '#B71C1C',
  sky: '#1E88E5',
} as const;

export function fmtTemp(v: number | null | undefined): string {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—';
  return `${Math.round(v)}°`;
}

/** Une probabilité arrive entre 0 et 1 ; elle s'affiche en pourcentage. */
export function fmtPct(x: number | null | undefined): string {
  if (typeof x !== 'number' || Number.isNaN(x)) return '—';
  return `${Math.round(x * 100)} %`;
}

export function fmtNum(v: number | null | undefined, unit: string, digits = 0): string {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—';
  return `${v.toFixed(digits)} ${unit}`;
}

const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

const MOIS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/**
 * 'YYYY-MM-DD' → « ven. 28 ». La date est lue en UTC : parsée en heure locale,
 * elle reculerait d'un jour sous tout fuseau à l'ouest de Greenwich.
 */
export function fmtDayShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${JOURS[d.getUTCDay()]} ${d.getUTCDate()}`;
}

/** `ts` est un epoch en SECONDES (convention du producteur), pas en ms. */
export function fmtHour(ts: number): string {
  const d = new Date(ts * 1000);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getHours()}h`;
}

/** ISO → « 7 août à 18:15 » (heure locale). */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MOIS[d.getMonth()]} à ${hh}:${mm}`;
}

/** ISO → « il y a 5 min » / « il y a 20 j ». Dit la fraîcheur d'un kit. */
export function fmtAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const sec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return "à l'instant";
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export type SkyKind = 'sun' | 'partly' | 'rain' | 'storm';

/**
 * Le serveur ne dit pas « il fera beau » : il donne des probabilités de pluie.
 * L'icône de ciel s'en déduit, sans rien inventer de plus.
 */
export function deriveSky(rain: { probGt1mm: number; probGt20mm: number }): SkyKind {
  if (rain.probGt20mm >= 0.3) return 'storm';
  if (rain.probGt1mm >= 0.5) return 'rain';
  if (rain.probGt1mm >= 0.2) return 'partly';
  return 'sun';
}

/** Vrai si la date 'YYYY-MM-DD' est celle d'aujourd'hui (heure locale). */
export function isToday(iso: string): boolean {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return iso === `${now.getFullYear()}-${m}-${d}`;
}

/** Vrai si l'horodatage (epoch SECONDES) tombe dans l'heure en cours. */
export function isCurrentHour(ts: number): boolean {
  const now = new Date();
  const d = new Date(ts * 1000);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate() &&
    d.getHours() === now.getHours()
  );
}
