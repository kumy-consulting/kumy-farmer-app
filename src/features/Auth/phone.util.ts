/** Utilitaires téléphone Guinée (9 chiffres locaux, indicatif +224). */

export function unformat(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidGuineaNumber(local9: string): boolean {
  return unformat(local9).length === 9;
}

/** `622201362` → `622 20 13 62` (affichage saisie). */
export function formatPhoneNumber(value: string): string {
  const d = unformat(value).slice(0, 9);
  const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 7), d.slice(7, 9)];
  return parts.filter(Boolean).join(' ');
}

/** Assemble l'E.164 : indicatif + 9 chiffres locaux. */
export function toE164(local9: string, dialCode = '224'): string {
  return `+${unformat(dialCode)}${unformat(local9).slice(0, 9)}`;
}

/** `+224622201362` → `+224 622 20 13 62`. */
export function formatE164ForDisplay(e164: string): string {
  const m = /^\+(\d{1,4})(\d{9})$/.exec(e164);
  if (!m) return e164;
  const [, cc, n] = m;
  return `+${cc} ${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
}
