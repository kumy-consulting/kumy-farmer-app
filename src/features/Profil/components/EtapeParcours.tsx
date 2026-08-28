import type { FunctionComponent } from 'react';

import { Stack } from '@mui/material';

import type { ReferentialItem } from '@/features/Onboarding/onboarding.api';

import { TRANCHES_EXPERIENCE } from '../questionnaire.content';
import {
  ChampListe,
  ChampNombre,
  ChampTexte,
  ChoixOuiNon,
  TitreSection,
  type EtapeProps,
} from './ChampsQuestionnaire';

const TRANCHES_OPTIONS: ReferentialItem[] = TRANCHES_EXPERIENCE.map(({ valeur, libelle }) => ({
  id: String(valeur),
  name: libelle,
}));

/**
 * Étape 2 : parcours agricole et accès au financement. Le nom de la
 * coopérative et l'année d'adhésion ne se posent qu'à un membre déclaré — la
 * question resterait sans objet sinon.
 */
export const EtapeParcours: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => (
  <Stack spacing={3} sx={{ width: '100%', alignItems: 'center' }}>
    <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
      <TitreSection>Expériences et parcours</TitreSection>

      <ChampListe
        label="Depuis combien de temps cultivez-vous ?"
        value={reponses.farmingExperience !== undefined ? String(reponses.farmingExperience) : ''}
        options={TRANCHES_OPTIONS}
        onChange={(id) => setReponses({ farmingExperience: Number(id) })}
        obligatoire
        erreur={erreurs.farmingExperience}
        placeholder="Sélectionnez une tranche"
      />

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
          />

          <ChampNombre
            label="Année d’adhésion"
            value={reponses.anneeAdhesion}
            onChange={(value) => setReponses({ anneeAdhesion: value })}
            erreur={erreurs.anneeAdhesion}
            min={1900}
            max={new Date().getFullYear()}
          />
        </>
      )}

      <ChampTexte
        label="Formations reçues"
        value={reponses.formations ?? ''}
        onChange={(value) => setReponses({ formations: value })}
        erreur={erreurs.formations}
        multiline
        placeholder="Ex. formation en agroécologie, gestion de coopérative…"
      />
    </Stack>

    <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
      <TitreSection>Accès au financement</TitreSection>

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
      />
    </Stack>
  </Stack>
);
