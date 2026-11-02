import type { FunctionComponent } from 'react';

interface KumySproutProps {
  /** Taille en px (carré). */
  size?: number;
  /** Couleur de la tige + feuille principale. */
  color?: string;
  /** Couleur de la seconde feuille (dégradé léger). Par défaut = `color`. */
  accent?: string;
  className?: string;
}

/**
 * Pousse Kumy — deux feuilles + tige, dérivée du logo de marque. Icône signature
 * de l'onglet « Domaines » (dock) réutilisée partout où l'on évoque les
 * parcelles/cultures, pour une identité visuelle cohérente.
 */
export const KumySprout: FunctionComponent<KumySproutProps> = ({
  size = 30,
  color = '#F7F4E9',
  accent,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 22V10.5" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
    <path d="M11.6 13.4C7.9 13.4 5.4 11 5.4 6.6c4 0 6.2 2.6 6.2 6.8Z" fill={color} />
    <path d="M12.4 11.4c3.4 0 5.9-2.3 5.9-6.4-3.7 0-5.9 2.6-5.9 6.4Z" fill={accent ?? color} />
  </svg>
);
