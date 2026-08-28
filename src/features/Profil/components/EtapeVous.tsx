import type { FunctionComponent } from 'react';

import { Stack } from '@mui/material';

import type { ReferentialItem } from '@/features/Onboarding/onboarding.api';

import { NIVEAUX_EDUCATION, SITUATIONS_MATRIMONIALES } from '../questionnaire.content';
import { ChampListe, ChampNombre, ChampTexte, ChoixOuiNon, TitreSection, type EtapeProps } from './ChampsQuestionnaire';

const NIVEAUX_OPTIONS: ReferentialItem[] = NIVEAUX_EDUCATION.map(({ valeur, libelle }) => ({
  id: valeur,
  name: libelle,
}));

const SITUATIONS_OPTIONS: ReferentialItem[] = SITUATIONS_MATRIMONIALES.map(({ valeur, libelle }) => ({
  id: valeur,
  name: libelle,
}));

/**
 * Étape 1 : qui répond. Le genre se pose en oui/non « Homme »/« Femme »
 * comme les autres bascules du questionnaire — pas de liste pour deux choix.
 */
export const EtapeVous: FunctionComponent<EtapeProps> = ({ reponses, setReponses, erreurs }) => (
  <Stack spacing={3} sx={{ width: '100%', alignItems: 'center' }}>
    <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
      <TitreSection>Informations personnelles</TitreSection>

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

      <ChampListe
        label="Niveau d’éducation"
        value={reponses.niveauEducation ?? ''}
        options={NIVEAUX_OPTIONS}
        onChange={(id) => setReponses({ niveauEducation: id })}
        obligatoire
        erreur={erreurs.niveauEducation}
        placeholder="Sélectionnez un niveau"
      />
    </Stack>

    <Stack spacing={1.75} sx={{ width: '100%', alignItems: 'center' }}>
      <TitreSection>Situation familiale</TitreSection>

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
      />
    </Stack>
  </Stack>
);
