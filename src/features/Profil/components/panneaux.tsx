import { useCallback, useEffect, useRef, useState, type FunctionComponent } from 'react';

import HolidayVillageRoundedIcon from '@mui/icons-material/HolidayVillageRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import { Stack } from '@mui/material';

import { ErrorBanner } from '@/features/Onboarding/components/ErrorBanner';
import { onboardingApi, type ReferentialItem } from '@/features/Onboarding/onboarding.api';
import { TextLink } from '@/features/Onboarding/onboarding.styled';
import { registerApi } from '@/features/Register/register.api';

import {
  CULTURES_COURANTES,
  FONCIERS,
  NIVEAUX_EDUCATION,
  SITUATIONS_MATRIMONIALES,
  TRANCHES_EXPERIENCE,
} from '../questionnaire.content';
import { ChampListe, ChampNombre, ChampTexte, ChoixMultiple, ChoixOuiNon, type EtapeProps } from './ChampsQuestionnaire';

/**
 * Le questionnaire, découpé en panneaux d'écran plutôt qu'en trois longs
 * formulaires.
 *
 * **Pourquoi.** Les dix-sept questions ne tiennent pas en trois écrans : sur un
 * Android de 640 px, une étape complète en réclamait presque le double, d'où le
 * défilement. Or défiler dans un formulaire coûte cher au public visé — une
 * main tient le téléphone, l'autre non ; on perd de vue le bouton, on saute une
 * question sans la voir. Un panneau = un groupe de questions qui tient d'un
 * seul tenant, sans jamais défiler.
 *
 * **Ce qui ne change pas.** Le serveur continue de raisonner en trois étapes :
 * `PATCH /farmers/me/profil` n'est appelé qu'au dernier panneau de chaque
 * étape, avec exactement le corps que `versCorpsEtape` construisait déjà. Aucun
 * champ ne traverse une frontière d'étape — c'est la règle à tenir si l'on
 * réarrange encore ces panneaux, sinon le corps envoyé ne correspond plus à
 * l'étape déclarée.
 *
 * Le rail de `ModaleInvitationProfil` (« 3 étapes · Vous, Parcours,
 * Exploitation ») reste donc vrai : trois étapes, huit écrans.
 */

const NIVEAUX_OPTIONS: ReferentialItem[] = NIVEAUX_EDUCATION.map(({ valeur, libelle }) => ({
  id: valeur,
  name: libelle,
}));

const SITUATIONS_OPTIONS: ReferentialItem[] = SITUATIONS_MATRIMONIALES.map(({ valeur, libelle }) => ({
  id: valeur,
  name: libelle,
}));

const TRANCHES_OPTIONS: ReferentialItem[] = TRANCHES_EXPERIENCE.map(({ valeur, libelle }) => ({
  id: String(valeur),
  name: libelle,
}));

const FONCIERS_OPTIONS: ReferentialItem[] = FONCIERS.map(({ valeur, libelle }) => ({ id: valeur, name: libelle }));

/**
 * Espacement commun aux champs d'un panneau.
 *
 * Plus serré que les 12 px d'origine : un panneau ne porte plus que deux ou
 * trois questions d'un même sujet, là où il fallait auparavant séparer six
 * champs enchaînés sur une seule étape. C'est aussi ce qui fait tenir le pire
 * cas — le plus petit écran, un panneau laissé entièrement vide, une erreur
 * sous chacun de ses champs.
 */
const Groupe: FunctionComponent<{ children: React.ReactNode }> = ({ children }) => (
  <Stack sx={{ width: '100%', alignItems: 'center', gap: 'clamp(10px, 2vh, 24px)' }}>
    {children}
  </Stack>
);

// ---------------------------------------------------------------------------
// Étape 1 — Vous
// ---------------------------------------------------------------------------

export const PanneauIdentite: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => (
  <Groupe>
    <ChampTexte
      label="Nom complet"
      value={reponses.nomComplet ?? ''}
      onChange={(value) => setReponses({ nomComplet: value })}
      obligatoire
      erreur={erreurs.nomComplet}
    />

    <ChampTexte
      label="Date de naissance"
      value={reponses.dateNaissance ?? ''}
      onChange={(value) => setReponses({ dateNaissance: value })}
      type="date"
      obligatoire
      erreur={erreurs.dateNaissance}
    />

    <ChoixOuiNon
      label="Genre"
      value={reponses.genre === 'male' ? true : reponses.genre === 'female' ? false : undefined}
      onChange={(estHomme) => setReponses({ genre: estHomme ? 'male' : 'female' })}
      obligatoire
      erreur={erreurs.genre}
      libelleOui="Homme"
      libelleNon="Femme"
    />
  </Groupe>
);

/**
 * Éducation, situation matrimoniale, enfants : ce qui situe la personne, par
 * opposition à ce qui l'identifie.
 *
 * Le niveau d'éducation a quitté le panneau d'identité pour venir ici. C'était
 * le seul panneau à quatre champs des huit, et le seul qui débordait encore sur
 * un écran de 320 px de haut — trois et trois tiennent partout, et « niveau
 * d'éducation » se lit aussi bien à côté de la situation qu'à côté du nom.
 */
export const PanneauFamille: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => (
  <Groupe>
    <ChampListe
      label="Niveau d’éducation"
      value={reponses.niveauEducation ?? ''}
      options={NIVEAUX_OPTIONS}
      onChange={(id) => setReponses({ niveauEducation: id })}
      obligatoire
      erreur={erreurs.niveauEducation}
      placeholder="Sélectionnez un niveau"
    />

    <ChampListe
      label="Situation matrimoniale"
      value={reponses.situationMatrimoniale ?? ''}
      options={SITUATIONS_OPTIONS}
      onChange={(id) => setReponses({ situationMatrimoniale: id })}
      erreur={erreurs.situationMatrimoniale}
      placeholder="Sélectionnez une situation"
    />

    <ChampNombre
      label="Nombre d’enfants"
      value={reponses.nombreEnfants}
      onChange={(value) => setReponses({ nombreEnfants: value })}
      erreur={erreurs.nombreEnfants}
      min={0}
      entier
    />
  </Groupe>
);

// ---------------------------------------------------------------------------
// Étape 2 — Parcours
// ---------------------------------------------------------------------------

export const PanneauExperience: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => (
  <Groupe>
    <ChampListe
      label="Depuis combien de temps cultivez-vous ?"
      value={reponses.farmingExperience !== undefined ? String(reponses.farmingExperience) : ''}
      options={TRANCHES_OPTIONS}
      onChange={(id) => setReponses({ farmingExperience: Number(id) })}
      obligatoire
      erreur={erreurs.farmingExperience}
      placeholder="Sélectionnez une tranche"
    />

    <ChampTexte
      label="Formations reçues"
      value={reponses.formations ?? ''}
      onChange={(value) => setReponses({ formations: value })}
      erreur={erreurs.formations}
      multiline
      placeholder="Ex. formation en agroécologie, gestion de coopérative…"
      maxLength={500}
    />
  </Groupe>
);

/**
 * Le nom de la coopérative et l'année d'adhésion ne se posent qu'à un membre
 * déclaré — la question resterait sans objet sinon. C'est aussi ce qui autorise
 * ce panneau à n'afficher qu'une seule question la plupart du temps : il en
 * porte trois pour ceux que ça concerne.
 */
export const PanneauCooperative: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => (
  <Groupe>
    <ChoixOuiNon
      label="Membre d’une coopérative ?"
      value={reponses.estMembreCooperative}
      onChange={(value) => setReponses({ estMembreCooperative: value })}
      obligatoire
      erreur={erreurs.estMembreCooperative}
    />

    {reponses.estMembreCooperative === true && (
      <>
        <ChampTexte
          label="Nom de la coopérative"
          value={reponses.nomCooperative ?? ''}
          onChange={(value) => setReponses({ nomCooperative: value })}
          erreur={erreurs.nomCooperative}
          maxLength={120}
        />

        <ChampNombre
          label="Année d’adhésion"
          value={reponses.anneeAdhesion}
          onChange={(value) => setReponses({ anneeAdhesion: value })}
          erreur={erreurs.anneeAdhesion}
          min={1900}
          max={new Date().getFullYear()}
          entier
        />
      </>
    )}
  </Groupe>
);

export const PanneauFinancement: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => (
  <Groupe>
    <ChoixOuiNon
      label="Compte de crédit rural ?"
      value={reponses.compteCreditRural}
      onChange={(value) => setReponses({ compteCreditRural: value })}
      obligatoire
      erreur={erreurs.compteCreditRural}
    />

    <ChampTexte
      label="Équipements utilisés"
      value={reponses.equipements ?? ''}
      onChange={(value) => setReponses({ equipements: value })}
      erreur={erreurs.equipements}
      multiline
      placeholder="Ex. tracteur, motopompe, kit d’irrigation…"
      maxLength={500}
    />
  </Groupe>
);

// ---------------------------------------------------------------------------
// Étape 3 — Exploitation
// ---------------------------------------------------------------------------

/**
 * La cascade région → préfecture → sous-préfecture, seule sur son écran.
 *
 * Les trois listes forment une seule idée — où se trouve la terre — et se
 * répondent d'affilée : les séparer ferait perdre le fil. Elles gardent la
 * mécanique de `RegisterAddressPage` : mêmes tickets de course pour ignorer une
 * réponse devenue obsolète si l'agriculteur change de région pendant un
 * chargement encore en vol.
 *
 * L'effet de restauration au montage porte plus qu'avant : ce panneau se
 * démonte dès qu'on avance vers « Votre exploitation », et doit donc savoir
 * recharger ses listes quand on y revient par « Précédent ».
 */
export const PanneauZone: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => {
  const [regions, setRegions] = useState<ReferentialItem[]>([]);
  const [prefectures, setPrefectures] = useState<ReferentialItem[]>([]);
  const [sousPrefectures, setSousPrefectures] = useState<ReferentialItem[]>([]);
  const [erreurChargement, setErreurChargement] = useState(false);

  const demandePrefectures = useRef(0);
  const demandeSousPrefectures = useRef(0);

  const chargerRegions = useCallback(async () => {
    setErreurChargement(false);
    try {
      setRegions(await onboardingApi.getRegions());
    } catch {
      setErreurChargement(true);
    }
  }, []);

  // Ce que le formulaire portait au montage, figé une fois pour toutes : sert
  // à restaurer les listes du bas quand le dossier arrive déjà rempli (retour
  // sur ce panneau, ou reprise après une étape déjà validée côté serveur).
  const reponsesAuMontage = useRef(reponses);

  useEffect(() => {
    const restaurer = async () => {
      await chargerRegions();

      const { regionId, prefectureId } = reponsesAuMontage.current;
      if (!regionId) return;

      const ticketPrefectures = ++demandePrefectures.current;
      const ticketSousPrefectures = ++demandeSousPrefectures.current;
      try {
        const items = await onboardingApi.getPrefectures(regionId);
        if (ticketPrefectures !== demandePrefectures.current) return;
        setPrefectures(items);

        if (!prefectureId) return;
        const sous = await registerApi.getSousPrefectures(prefectureId);
        if (ticketSousPrefectures !== demandeSousPrefectures.current) return;
        setSousPrefectures(sous);
      } catch {
        if (ticketPrefectures !== demandePrefectures.current) return;
        setErreurChargement(true);
      }
    };

    void restaurer();
  }, [chargerRegions]);

  const handleRegion = async (id: string) => {
    setReponses({ regionId: id, prefectureId: undefined, sousPrefectureId: undefined });
    setPrefectures([]);
    setSousPrefectures([]);
    setErreurChargement(false);
    const ticket = ++demandePrefectures.current;
    // Une sous-préfecture encore en vol pour l'ancienne préfecture ne doit pas
    // non plus pouvoir s'appliquer une fois la région changée.
    demandeSousPrefectures.current += 1;
    try {
      const items = await onboardingApi.getPrefectures(id);
      if (ticket !== demandePrefectures.current) return;
      setPrefectures(items);
    } catch {
      if (ticket !== demandePrefectures.current) return;
      setErreurChargement(true);
    }
  };

  const handlePrefecture = async (id: string) => {
    setReponses({ prefectureId: id, sousPrefectureId: undefined });
    setSousPrefectures([]);
    setErreurChargement(false);
    const ticket = ++demandeSousPrefectures.current;
    try {
      const items = await registerApi.getSousPrefectures(id);
      if (ticket !== demandeSousPrefectures.current) return;
      setSousPrefectures(items);
    } catch {
      if (ticket !== demandeSousPrefectures.current) return;
      setErreurChargement(true);
    }
  };

  return (
    <Groupe>
      <ChampListe
        label="Région"
        value={reponses.regionId ?? ''}
        options={regions}
        onChange={(id) => void handleRegion(id)}
        obligatoire
        erreur={erreurs.regionId}
        placeholder="Sélectionnez votre région"
        icon={<PublicRoundedIcon />}
      />

      <ChampListe
        label="Préfecture"
        value={reponses.prefectureId ?? ''}
        options={prefectures}
        onChange={(id) => void handlePrefecture(id)}
        disabled={!reponses.regionId}
        obligatoire
        erreur={erreurs.prefectureId}
        placeholder="Sélectionnez votre préfecture"
        icon={<LocationCityRoundedIcon />}
      />

      <ChampListe
        label="Sous-préfecture"
        value={reponses.sousPrefectureId ?? ''}
        options={sousPrefectures}
        onChange={(id) => setReponses({ sousPrefectureId: id })}
        disabled={!reponses.prefectureId}
        obligatoire
        erreur={erreurs.sousPrefectureId}
        placeholder="Sélectionnez votre sous-préfecture"
        icon={<HolidayVillageRoundedIcon />}
      />

      {erreurChargement && (
        <ErrorBanner mb={0}>
          Impossible de charger la liste. Vérifiez votre connexion.{' '}
          <TextLink
            onClick={() => void chargerRegions()}
            sx={{ p: 0, minWidth: 0, fontSize: 12.75, verticalAlign: 'baseline' }}
          >
            Réessayer
          </TextLink>
        </ErrorBanner>
      )}
    </Groupe>
  );
};

export const PanneauTerre: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => (
  <Groupe>
    <ChampNombre
      label="Superficie cultivée"
      value={reponses.hectares}
      onChange={(value) => setReponses({ hectares: value })}
      obligatoire
      erreur={erreurs.hectares}
      suffixe="ha"
      min={0}
      max={10000}
    />

    <ChampListe
      label="Régime foncier"
      value={reponses.foncier ?? ''}
      options={FONCIERS_OPTIONS}
      onChange={(id) => setReponses({ foncier: id })}
      obligatoire
      erreur={erreurs.foncier}
      placeholder="Sélectionnez un régime"
    />
  </Groupe>
);

export const PanneauCultures: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => (
  <Groupe>
    <ChoixMultiple
      label="Cultures principales"
      value={reponses.primaryCrops ?? []}
      onChange={(value) => setReponses({ primaryCrops: value })}
      obligatoire
      erreur={erreurs.primaryCrops}
      suggestions={CULTURES_COURANTES}
      maxItems={15}
      maxLongueurItem={40}
    />
  </Groupe>
);
