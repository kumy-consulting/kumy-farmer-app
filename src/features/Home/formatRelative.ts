import dayjs, { type Dayjs } from 'dayjs';

/**
 * Temps relatif court en français : « à l'instant », « il y a 2 h », « dans 3 j ».
 * `now` injectable pour des tests déterministes.
 */
export function formatRelative(iso: string, now: Dayjs = dayjs()): string {
  const diffMin = dayjs(iso).diff(now, 'minute'); // > 0 → futur
  const abs = Math.abs(diffMin);
  if (abs < 1) return "à l'instant";

  let value: number;
  let unit: string;
  if (abs < 60) {
    value = abs;
    unit = 'min';
  } else if (abs < 60 * 24) {
    value = Math.round(abs / 60);
    unit = 'h';
  } else {
    value = Math.round(abs / (60 * 24));
    unit = 'j';
  }

  return diffMin > 0 ? `dans ${value} ${unit}` : `il y a ${value} ${unit}`;
}
