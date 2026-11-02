import { create } from 'zustand';

interface InvitationProfilState {
  /**
   * Un seul booléen, jamais persisté : fermer la modale la tait jusqu'à la
   * prochaine ouverture de l'app (rechargement complet), la relancer la
   * repropose. Le stocker sur disque referait remonter une modale fermée par
   * l'agriculteur au milieu de sa session.
   */
  dejaProposee: boolean;
  marquerProposee: () => void;
}

export const useInvitationProfilStore = create<InvitationProfilState>((set) => ({
  dejaProposee: false,
  marquerProposee: () => set({ dejaProposee: true }),
}));
