import type { FunctionComponent, ReactNode } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { ProfileSelect } from '@/features/Onboarding/components/ProfileSelect';
import type { ReferentialItem } from '@/features/Onboarding/onboarding.api';

import type { ReponsesQuestionnaire } from '../profil.types';
import { NIVEAUX_EDUCATION, SITUATIONS_MATRIMONIALES } from '../questionnaire.content';
import { ChampNombre, ChampTexte, ChoixOuiNon, TitreSection } from './ChampsQuestionnaire';

/**
 * Signature commune aux trois étapes (figée pour la tâche 8) : l'écran
 * porteur possède les réponses, chaque étape ne fait que les lire et les
 * corriger via `setReponses`.
 */
export interface EtapeProps {
  reponses: ReponsesQuestionnaire;
  setReponses: (partiel: Partial<ReponsesQuestionnaire>) => void;
  erreurs: Record<string, string>;
}

// ---------------------------------------------------------------------------
// ChampListe
// ---------------------------------------------------------------------------
//
// `ProfileSelect` (@/features/Onboarding/components/ProfileSelect) rend la
// capsule mais pas le libellé ni l'astérisque : il n'a jamais eu à le faire,
// `RegisterAddressPage` place son propre `Typography` ailleurs dans la page.
// Ici les trois étapes en ont toutes besoin, habillé comme `ChampTexte` —
// défini une fois dans cette étape, réimporté par les deux autres plutôt que
// dupliqué. Le libellé visible ET l'`aria-label` du contrôle portent le même
// texte : `ProfileSelect` transmet `label` en `aria-label`, donc c'est ce qui
// associe vraiment le texte au select pour un lecteur d'écran — un
// `Typography` posé à côté ne l'aurait pas fait.

const Libelle = styled(Typography)({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 13.5,
  fontWeight: 600,
  color: 'rgba(55,75,70,0.75)',
  marginBottom: 6,
});

const TexteErreur = styled(Typography)({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  color: '#B3261E',
  marginTop: 4,
});

function texteLibelle(label: string, obligatoire?: boolean): string {
  return obligatoire ? `${label} *` : label;
}

export interface ChampListeProps {
  label: string;
  value: string;
  options: ReferentialItem[];
  onChange: (id: string, name: string) => void;
  obligatoire?: boolean;
  erreur?: string;
  disabled?: boolean;
  placeholder?: string;
  icon?: ReactNode;
}

export const ChampListe: FunctionComponent<ChampListeProps> = ({
  label,
  value,
  options,
  onChange,
  obligatoire = false,
  erreur,
  disabled = false,
  placeholder,
  icon,
}) => (
  <Box sx={{ width: '100%', maxWidth: 395 }}>
    <Libelle>{texteLibelle(label, obligatoire)}</Libelle>
    <ProfileSelect
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      icon={icon}
    />
    {erreur && <TexteErreur role="alert">{erreur}</TexteErreur>}
  </Box>
);

// ---------------------------------------------------------------------------
// EtapeVous
// ---------------------------------------------------------------------------

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
