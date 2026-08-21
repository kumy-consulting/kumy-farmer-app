import type { Gravite, Priorite } from '../../home.dashboard.types';

/**
 * Le vocabulaire visuel du tableau de bord.
 *
 * Un principe le tient : **le mot porte l'information, la couleur la confirme**.
 * Sur un téléphone d'entrée de gamme en plein soleil, quatre teintes ne se
 * distinguent pas de façon fiable — « Attention requise » et « Intervention
 * urgente », si. Les tons restent donc au nombre de trois, et ce sont les
 * libellés qui séparent les quatre niveaux.
 */

export interface Ton {
  pastille: string;
  fond: string;
  texte: string;
}

/**
 * Le panneau d'état — le seul endroit de l'accueil où la couleur couvre une
 * surface entière.
 *
 * Ailleurs elle ponctue ; ici elle *est* le message. Le bloc n'a qu'un travail,
 * répondre à « comment va mon exploitation », et la teinte du panneau y répond
 * avant qu'on ait lu un mot. Le lavis reste très pâle : c'est un tableau de
 * bord, pas un feu de signalisation, et l'encre sombre doit y tenir en plein
 * soleil.
 *
 * Les lavis sont **opaques** et non des alphas : posé à 6 % sur le dégradé vert
 * de la page, un rouge virait au beige — la teinte dépendait de ce qu'il y avait
 * derrière, donc du bloc au-dessus. Une couleur qui répond à une question ne
 * peut pas changer selon son voisinage.
 */
export const PANNEAU_GRAVITE: Record<Gravite, { lavis: string; bord: string; encre: string; barre: string }> = {
  normal: { lavis: '#EDF9F5', bord: 'rgba(1,134,117,0.20)', encre: '#005046', barre: '#018675' },
  surveiller: { lavis: '#FDF7EA', bord: 'rgba(198,138,26,0.26)', encre: '#6B3C00', barre: '#E0A43A' },
  attention: { lavis: '#FBF1DC', bord: 'rgba(198,138,26,0.36)', encre: '#6B3C00', barre: '#C68A1A' },
  critique: { lavis: '#FDF0EF', bord: 'rgba(186,26,26,0.26)', encre: '#93000A', barre: '#BA1A1A' },
};

export const TON_GRAVITE: Record<Gravite, Ton> = {
  normal: { pastille: '#018675', fond: 'rgba(1,134,117,0.10)', texte: '#005046' },
  surveiller: { pastille: '#E0A43A', fond: 'rgba(198,138,26,0.12)', texte: '#6B3C00' },
  attention: { pastille: '#C68A1A', fond: 'rgba(198,138,26,0.22)', texte: '#6B3C00' },
  critique: { pastille: '#BA1A1A', fond: 'rgba(186,26,26,0.10)', texte: '#93000A' },
};

/**
 * Les quatre états, dits en clair (§13).
 *
 * « Critique » seul ne dit pas quoi faire ; « Intervention urgente » si. Chaque
 * libellé est un verdict que l'on comprend sans connaître le système.
 */
export const LIBELLE_GRAVITE: Record<Gravite, string> = {
  normal: 'Situation normale',
  surveiller: 'À surveiller',
  attention: 'Attention requise',
  critique: 'Intervention urgente',
};

export const TON_PRIORITE: Record<Priorite, Ton> = {
  P0: TON_GRAVITE.critique,
  P1: TON_GRAVITE.attention,
  P2: TON_GRAVITE.surveiller,
  P3: TON_GRAVITE.normal,
};

/**
 * Tons des pastilles d'élément — trois, pas quatre.
 *
 * `pale` sert de fond aux pastilles d'action, `plein` de fond aux pastilles
 * d'alerte, `halo` d'ombre portée teintée. Une alerte critique doit se voir de
 * loin ; une consigne à faire ne doit pas crier.
 */
export const TONS_PASTILLE = {
  danger: { plein: '#BA1A1A', pale: 'rgba(186,26,26,0.13)', anneau: 'rgba(186,26,26,0.45)', halo: 'rgba(186,26,26,0.26)' },
  vigilance: { plein: '#C68A1A', pale: 'rgba(198,138,26,0.18)', anneau: 'rgba(198,138,26,0.52)', halo: 'rgba(198,138,26,0.28)' },
  calme: { plein: '#018675', pale: 'rgba(1,134,117,0.13)', anneau: 'rgba(1,134,117,0.42)', halo: 'rgba(1,134,117,0.22)' },
} as const;

export type TonPastille = keyof typeof TONS_PASTILLE;

/** La couleur suit l'urgence ; la forme, elle, suivra la nature. */
export const tonPastilleDe = (priorite: Priorite): TonPastille => {
  if (priorite === 'P0') return 'danger';
  if (priorite === 'P1') return 'vigilance';
  return 'calme';
};
