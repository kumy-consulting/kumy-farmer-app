import { useEffect, useRef, useState } from 'react';

import { useInvitationProfilStore } from './invitationProfil.store';
import { profilApi } from './profil.api';

const DELAI_MS = 5_000;

/**
 * Ce que `useInvitationProfil` a besoin de savoir sur le compte — fourni par
 * l'appelant (`AppLayout`) plutôt que relu ici via `useCompteNouveau`.
 *
 * `useCompteNouveau` porte un état local par instance, pas un store partagé :
 * l'appeler une deuxième fois ici referait partir `etatDuCompte` en double à
 * chaque montage. `AppLayout` l'appelle déjà pour son propre aiguillage —
 * cette information descend donc en prop plutôt que d'être relue.
 */
export interface CompteInvitationProfil {
  aDesDomaines: boolean;
  isLoading: boolean;
  /**
   * `pathname === '/'` au sens de l'appelant. `AppLayout` ne se démonte PAS
   * quand on change d'onglet (contrairement à ce que suppose le nettoyage de
   * la minuterie ci-dessous) : sans ce garde-fou, une échéance atteinte
   * pendant qu'on lit « Mes informations » ferait remonter la modale
   * par-dessus cet écran. Lu via une ref pour ne pas redémarrer la minuterie
   * à chaque changement d'onglet — seule sa valeur AU MOMENT de l'échéance
   * compte.
   */
  surAccueil: boolean;
}

/**
 * Décide si l'invitation à compléter le profil doit apparaître, et quand.
 *
 * Elle attend cinq secondes après l'arrivée avant de s'ouvrir — le temps de
 * laisser l'agriculteur regarder son tableau de bord avant de lui demander
 * quoi que ce soit — et ne se propose jamais si un domaine est déjà tracé, si
 * le questionnaire est déjà terminé, ou si elle a déjà été montrée une fois
 * dans la session.
 *
 * La minuterie et la lecture du profil partent en parallèle dès que le statut
 * du compte est connu, et c'est celle des deux qui finit en dernier qui
 * décide : si la réponse du serveur traîne au-delà des cinq secondes, elle
 * ouvre elle-même la modale en arrivant, au lieu de se faire ignorer par une
 * minuterie déjà passée. Un design où la minuterie ne se relirait qu'une
 * fois, à son échéance, perdrait l'invitation pour toute la session dès que
 * la lecture répond en retard.
 */
export function useInvitationProfil(compte: CompteInvitationProfil): { ouverte: boolean; fermer: () => void } {
  const { aDesDomaines, isLoading, surAccueil } = compte;
  const dejaProposee = useInvitationProfilStore((s) => s.dejaProposee);
  const marquerProposee = useInvitationProfilStore((s) => s.marquerProposee);
  const [ouverte, setOuverte] = useState(false);

  // Ref plutôt que dépendance d'effet : un changement d'onglet ne doit ni
  // redémarrer la minuterie, ni la relire avant son échéance — seule la
  // valeur au moment où `verifier` tranche compte.
  const surAccueilRef = useRef(surAccueil);
  useEffect(() => {
    surAccueilRef.current = surAccueil;
  }, [surAccueil]);

  useEffect(() => {
    if (isLoading || aDesDomaines || dejaProposee) return;

    let actif = true;
    let echeanceAtteinte = false;
    let termine: boolean | null = null;

    // Appelé par la minuterie ET par la réponse du serveur — l'un des deux
    // arrive forcément en second, et c'est celui-là qui doit décider.
    const verifier = () => {
      if (!actif || !echeanceAtteinte || termine !== false) return;
      // Ne pas interrompre un agriculteur qui a quitté l'accueil (promesse de
      // la spec) : `AppLayout` ne se démonte pas entre onglets, donc c'est ce
      // garde qui la tient désormais, pas le nettoyage d'effet ci-dessous.
      if (!surAccueilRef.current) return;
      setOuverte(true);
      marquerProposee();
    };

    profilApi
      .lireProfil()
      .then((profil) => {
        if (!actif) return;
        termine = profil.profileSurvey.completedAt !== null;
        verifier();
      })
      // Une lecture qui rate ne doit pas déclencher une invitation à l'aveugle.
      .catch(() => {
        if (actif) termine = true;
      });

    const minuterie = window.setTimeout(() => {
      echeanceAtteinte = true;
      verifier();
    }, DELAI_MS);

    // Quitter l'accueil avant la fin du délai annule l'invitation : elle
    // remonterait sinon par-dessus l'écran suivant.
    return () => {
      actif = false;
      window.clearTimeout(minuterie);
    };
  }, [isLoading, aDesDomaines, dejaProposee, marquerProposee]);

  return { ouverte, fermer: () => setOuverte(false) };
}
