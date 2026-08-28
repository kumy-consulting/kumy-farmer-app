import { useEffect, useRef, useState } from 'react';

import { useCompteNouveau } from '@/features/Home/useCompteNouveau';

import { useInvitationProfilStore } from './invitationProfil.store';
import { profilApi } from './profil.api';

const DELAI_MS = 5_000;

/**
 * Décide si l'invitation à compléter le profil doit apparaître, et quand.
 *
 * Elle attend cinq secondes après l'arrivée avant de s'ouvrir — le temps de
 * laisser l'agriculteur regarder son tableau de bord avant de lui demander
 * quoi que ce soit — et ne se propose jamais si un domaine est déjà tracé, si
 * le questionnaire est déjà terminé, ou si elle a déjà été montrée une fois
 * dans la session.
 *
 * La lecture du profil et la minuterie sont deux choses indépendantes : la
 * minuterie démarre dès que le statut du compte est connu, et se contente de
 * consulter au bout de cinq secondes ce que la lecture — lancée en parallèle —
 * a trouvé entre-temps. La faire dépendre d'un état mis à jour par cette
 * lecture obligerait à réarmer la minuterie après coup, et retarderait
 * l'ouverture d'autant.
 */
export function useInvitationProfil(): { ouverte: boolean; fermer: () => void } {
  const { aDesDomaines, isLoading } = useCompteNouveau();
  const dejaProposee = useInvitationProfilStore((s) => s.dejaProposee);
  const marquerProposee = useInvitationProfilStore((s) => s.marquerProposee);
  const [ouverte, setOuverte] = useState(false);
  const termineRef = useRef<boolean | null>(null);

  useEffect(() => {
    let actif = true;
    profilApi
      .lireProfil()
      .then((profil) => {
        if (actif) termineRef.current = profil.profileSurvey.completedAt !== null;
      })
      // Une lecture qui rate ne doit pas déclencher une invitation à l'aveugle.
      .catch(() => {
        if (actif) termineRef.current = true;
      });
    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || aDesDomaines || dejaProposee) return;

    const minuterie = window.setTimeout(() => {
      if (termineRef.current === false) {
        setOuverte(true);
        marquerProposee();
      }
    }, DELAI_MS);

    // Quitter l'accueil avant la fin du délai annule l'invitation : elle
    // remonterait sinon par-dessus l'écran suivant.
    return () => window.clearTimeout(minuterie);
  }, [isLoading, aDesDomaines, dejaProposee, marquerProposee]);

  return { ouverte, fermer: () => setOuverte(false) };
}
