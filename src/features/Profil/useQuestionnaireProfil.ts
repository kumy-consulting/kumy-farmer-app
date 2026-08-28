import { useCallback, useEffect, useState } from 'react';

import { profilApi } from './profil.api';
import type { ProfilLu, ReponsesQuestionnaire } from './profil.types';

/** Étape à afficher — jamais 0, la première étape non répondue est la 1. */
type Etape = 1 | 2 | 3;

export interface QuestionnaireProfilState {
  reponses: ReponsesQuestionnaire;
  setReponses: (partiel: Partial<ReponsesQuestionnaire>) => void;
  etapeCourante: Etape;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  envoyerEtape: (step: Etape) => Promise<boolean>;
  termine: boolean;
}

/** Traduit le dossier lu depuis l'API vers les réponses à plat du formulaire. */
function versReponses(profil: ProfilLu): ReponsesQuestionnaire {
  const { questionnaire, address } = profil;
  const anneeAdhesion = questionnaire.cooperative?.joinDate
    ? Number(questionnaire.cooperative.joinDate.slice(0, 4))
    : undefined;

  return {
    nomComplet: profil.displayName,
    dateNaissance: questionnaire.dateOfBirth,
    genre: questionnaire.gender,
    niveauEducation: questionnaire.educationLevel,
    situationMatrimoniale: questionnaire.maritalStatus,
    nombreEnfants: questionnaire.childrenCount,
    farmingExperience: questionnaire.farmingExperience,
    // Convention du moteur de score : `cooperative` n'existe que pour un
    // membre. Son absence ne dit pas « non membre » pour autant — tant que
    // l'agriculteur n'a rien répondu, on laisse la question ouverte.
    estMembreCooperative: questionnaire.cooperative ? true : undefined,
    nomCooperative: questionnaire.cooperative?.name,
    anneeAdhesion,
    compteCreditRural: questionnaire.hasCreditRuralAccount,
    formations: questionnaire.declaredTrainings,
    equipements: questionnaire.declaredEquipment,
    regionId: address.regionId,
    prefectureId: address.prefectureId,
    sousPrefectureId: address.sousPrefectureId,
    hectares: questionnaire.cultivatedHectares,
    primaryCrops: questionnaire.primaryCrops,
    foncier: questionnaire.declaredLandTenure,
  };
}

/** Construit le corps `PATCH /farmers/me/profil` d'UNE étape — jamais les autres. */
function versCorpsEtape(step: Etape, reponses: ReponsesQuestionnaire): Record<string, unknown> {
  const corps: Record<string, unknown> = { step };

  if (step === 1) {
    if (reponses.nomComplet) {
      const mots = reponses.nomComplet.trim().split(/\s+/);
      corps.firstName = mots[0];
      corps.lastName = mots.slice(1).join(' ');
    }
    if (reponses.dateNaissance !== undefined) corps.dateOfBirth = reponses.dateNaissance;
    if (reponses.genre !== undefined) corps.gender = reponses.genre;
    if (reponses.niveauEducation !== undefined) corps.educationLevel = reponses.niveauEducation;
    if (reponses.situationMatrimoniale !== undefined) corps.maritalStatus = reponses.situationMatrimoniale;
    if (reponses.nombreEnfants !== undefined) corps.childrenCount = reponses.nombreEnfants;
  }

  if (step === 2) {
    if (reponses.farmingExperience !== undefined) corps.farmingExperience = reponses.farmingExperience;
    if (reponses.estMembreCooperative !== undefined) {
      corps.cooperative = reponses.estMembreCooperative
        ? {
            isMember: true,
            ...(reponses.nomCooperative ? { name: reponses.nomCooperative } : {}),
            ...(reponses.anneeAdhesion ? { joinDate: `${reponses.anneeAdhesion}-01-01` } : {}),
          }
        : { isMember: false };
    }
    if (reponses.compteCreditRural !== undefined) corps.hasCreditRuralAccount = reponses.compteCreditRural;
    if (reponses.formations !== undefined) corps.declaredTrainings = reponses.formations;
    if (reponses.equipements !== undefined) corps.declaredEquipment = reponses.equipements;
  }

  if (step === 3) {
    if (reponses.regionId !== undefined) corps.regionId = reponses.regionId;
    if (reponses.prefectureId !== undefined) corps.prefectureId = reponses.prefectureId;
    if (reponses.sousPrefectureId !== undefined) corps.sousPrefectureId = reponses.sousPrefectureId;
    if (reponses.hectares !== undefined) corps.cultivatedHectares = reponses.hectares;
    if (reponses.primaryCrops !== undefined) corps.primaryCrops = reponses.primaryCrops;
    if (reponses.foncier !== undefined) corps.declaredLandTenure = reponses.foncier;
  }

  return corps;
}

/**
 * État et écriture du questionnaire de profil en trois étapes.
 *
 * Charge le dossier au montage pour préremplir les réponses et reprendre à
 * l'étape suivant celle déjà validée. `envoyerEtape` n'expédie que les champs
 * de l'étape demandée : un échec réseau à la troisième ne doit pas emporter
 * les douze réponses précédentes.
 */
export function useQuestionnaireProfil(): QuestionnaireProfilState {
  const [reponses, setReponsesState] = useState<ReponsesQuestionnaire>({});
  const [etapeCourante, setEtapeCourante] = useState<Etape>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termine, setTermine] = useState(false);

  useEffect(() => {
    let actif = true;

    profilApi
      .lireProfil()
      .then((profil) => {
        if (!actif) return;
        setReponsesState(versReponses(profil));
        setEtapeCourante(Math.min(profil.profileSurvey.step + 1, 3) as Etape);
        setTermine(profil.profileSurvey.completedAt !== null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (actif) setIsLoading(false);
      });

    return () => {
      actif = false;
    };
  }, []);

  const setReponses = useCallback((partiel: Partial<ReponsesQuestionnaire>) => {
    setReponsesState((precedent) => ({ ...precedent, ...partiel }));
  }, []);

  const envoyerEtape = useCallback(
    async (step: Etape): Promise<boolean> => {
      setIsSending(true);
      setError(null);
      try {
        const corps = versCorpsEtape(step, reponses);
        const marqueur = await profilApi.envoyerEtape(corps);
        setTermine(marqueur.completedAt !== null);
        return true;
      } catch {
        setError("Envoi impossible pour l'instant. Réessayez dans un moment.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [reponses],
  );

  return { reponses, setReponses, etapeCourante, isLoading, isSending, error, envoyerEtape, termine };
}
