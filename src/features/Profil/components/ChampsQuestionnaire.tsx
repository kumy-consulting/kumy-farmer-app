import { useState, type ChangeEvent, type FunctionComponent, type KeyboardEvent, type ReactNode } from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Box, Chip, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Briques de saisie du questionnaire de profil, habillées comme
 * `ProfileSelect` (@/features/Onboarding/components/ProfileSelect) : capsule
 * radius 18, fond blanc dégradé, glow vert `#016557` au focus, police Ubuntu.
 *
 * Convention commune : un champ obligatoire porte une astérisque dans son
 * libellé, un facultatif n'en porte pas — c'est `obligatoire` qui décide,
 * jamais le texte du `label` lui-même.
 */

const CAPSULE_BACKGROUND = 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,251,247,0.96) 100%)';
const CAPSULE_SHADOW = '0 6px 20px rgba(1,134,117,0.08), 0 1px 0 rgba(255,255,255,0.85) inset';
const CAPSULE_FOCUS_SHADOW =
  '0 10px 28px rgba(1,134,117,0.18), 0 0 0 4px rgba(1,134,117,0.10), 0 1px 0 rgba(255,255,255,0.9) inset';

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

/** `TextField` habillé « capsule teal », partagé par `ChampTexte` et `ChampNombre`. */
const CapsuleTextField = styled(TextField)({
  width: '100%',
  maxWidth: 395,
  '& .MuiOutlinedInput-root': {
    borderRadius: 18,
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: 'rgba(20,40,35,0.92)',
    background: CAPSULE_BACKGROUND,
    boxShadow: CAPSULE_SHADOW,
    transition: 'all 0.25s ease',
    '& input, & textarea': { padding: '15px 18px' },
    '& fieldset': {
      borderColor: 'rgba(55,75,70,0.08)',
      borderWidth: 1,
      borderRadius: 18,
    },
    '&:hover fieldset': { borderColor: 'rgba(1,134,117,0.28)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(1,134,117,0.38)', borderWidth: 1 },
    '&.Mui-focused': { boxShadow: CAPSULE_FOCUS_SHADOW },
  },
});

/** Ligne des deux boutons radio de `ChoixOuiNon`. */
const RangeeChoix = styled(Stack)({
  flexDirection: 'row',
  gap: 8,
  width: '100%',
  maxWidth: 395,
  padding: 6,
  borderRadius: 18,
  background: CAPSULE_BACKGROUND,
  boxShadow: CAPSULE_SHADOW,
  border: '1px solid rgba(55,75,70,0.08)',
});

const BoutonChoix = styled(Box, { shouldForwardProp: (prop) => prop !== 'selectionne' })<{ selectionne?: boolean }>(
  ({ selectionne }) => ({
    flex: 1,
    textAlign: 'center',
    padding: '13px 16px',
    borderRadius: 14,
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: 14.5,
    fontWeight: 600,
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    transition: 'all 0.2s ease',
    color: selectionne ? '#FFFFFF' : 'rgba(20,40,35,0.72)',
    background: selectionne ? 'linear-gradient(135deg, #018675 0%, #016557 100%)' : 'rgba(255,255,255,0.6)',
    boxShadow: selectionne ? '0 6px 16px rgba(1,101,87,0.28)' : 'none',
    border: selectionne ? '1px solid transparent' : '1px solid rgba(55,75,70,0.12)',
    '&:focus-visible': {
      boxShadow: `${selectionne ? '0 6px 16px rgba(1,101,87,0.28), ' : ''}0 0 0 3px rgba(1,134,117,0.22)`,
    },
  }),
);

/** Puce de `ChoixMultiple`, sélectionnée (teinte teal) ou non (contour clair). */
const PuceChoix = styled(Chip, { shouldForwardProp: (prop) => prop !== 'selectionnee' })<{ selectionnee?: boolean }>(
  ({ selectionnee }) => ({
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 600,
    fontSize: 13.5,
    borderRadius: 999,
    height: 34,
    color: selectionnee ? '#FFFFFF' : 'rgba(20,40,35,0.75)',
    background: selectionnee ? 'linear-gradient(135deg, #018675 0%, #016557 100%)' : 'rgba(255,255,255,0.7)',
    border: selectionnee ? '1px solid transparent' : '1px solid rgba(55,75,70,0.14)',
    boxShadow: selectionnee ? '0 4px 12px rgba(1,101,87,0.22)' : 'none',
    '&:hover': {
      background: selectionnee ? 'linear-gradient(135deg, #018675 0%, #016557 100%)' : 'rgba(1,134,117,0.08)',
    },
  }),
);

const TitreStyled = styled(Typography)({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 15,
  fontWeight: 700,
  color: '#016557',
  letterSpacing: '0.005em',
});

/** Fabrique le libellé « Label » ou « Label * », un seul nœud de texte. */
function texteLibelle(label: string, obligatoire?: boolean): string {
  return obligatoire ? `${label} *` : label;
}

// ---------------------------------------------------------------------------
// TitreSection
// ---------------------------------------------------------------------------

interface TitreSectionProps {
  children: ReactNode;
}

/** Titre d'un groupe de champs à l'intérieur d'une étape (ex. « Situation familiale »). */
export const TitreSection: FunctionComponent<TitreSectionProps> = ({ children }) => (
  <TitreStyled>{children}</TitreStyled>
);

// ---------------------------------------------------------------------------
// ChampTexte
// ---------------------------------------------------------------------------

export interface ChampTexteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  obligatoire?: boolean;
  erreur?: string;
  placeholder?: string;
  /** `date` réutilise le même habillage capsule qu'un champ texte classique. */
  type?: 'text' | 'date';
  multiline?: boolean;
}

export const ChampTexte: FunctionComponent<ChampTexteProps> = ({
  label,
  value,
  onChange,
  obligatoire = false,
  erreur,
  placeholder,
  type = 'text',
  multiline = false,
}) => (
  <Box sx={{ width: '100%', maxWidth: 395 }}>
    <Libelle>{texteLibelle(label, obligatoire)}</Libelle>
    <CapsuleTextField
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      error={Boolean(erreur)}
      fullWidth
      slotProps={{
        htmlInput: { 'aria-label': label },
        inputLabel: type === 'date' ? { shrink: true } : undefined,
      }}
    />
    {erreur && <TexteErreur role="alert">{erreur}</TexteErreur>}
  </Box>
);

// ---------------------------------------------------------------------------
// ChampNombre
// ---------------------------------------------------------------------------

export interface ChampNombreProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  obligatoire?: boolean;
  erreur?: string;
  /** Unité affichée en fin de champ (ex. « ha »). */
  suffixe?: string;
  min?: number;
  max?: number;
}

export const ChampNombre: FunctionComponent<ChampNombreProps> = ({
  label,
  value,
  onChange,
  obligatoire = false,
  erreur,
  suffixe,
  min,
  max,
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const brut = event.target.value;
    if (brut === '') {
      onChange(undefined);
      return;
    }
    const nombre = Number(brut);
    if (!Number.isNaN(nombre)) onChange(nombre);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 395 }}>
      <Libelle>{texteLibelle(label, obligatoire)}</Libelle>
      <CapsuleTextField
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        error={Boolean(erreur)}
        fullWidth
        slotProps={{
          htmlInput: { min, max, inputMode: 'numeric', 'aria-label': label },
          input: suffixe ? { endAdornment: <InputAdornment position="end">{suffixe}</InputAdornment> } : undefined,
        }}
      />
      {erreur && <TexteErreur role="alert">{erreur}</TexteErreur>}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// ChoixOuiNon
// ---------------------------------------------------------------------------

export interface ChoixOuiNonProps {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  obligatoire?: boolean;
  erreur?: string;
  /** Libellés des deux boutons — « Oui »/« Non » par défaut, personnalisables (ex. « Homme »/« Femme »). */
  libelleOui?: string;
  libelleNon?: string;
}

export const ChoixOuiNon: FunctionComponent<ChoixOuiNonProps> = ({
  label,
  value,
  onChange,
  obligatoire = false,
  erreur,
  libelleOui = 'Oui',
  libelleNon = 'Non',
}) => {
  const activer = (choix: boolean) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onChange(choix);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 395 }}>
      <Libelle id={`${label}-libelle`}>{texteLibelle(label, obligatoire)}</Libelle>
      <RangeeChoix role="radiogroup" aria-label={label}>
        <BoutonChoix
          role="radio"
          tabIndex={0}
          aria-checked={value === true}
          selectionne={value === true}
          onClick={() => onChange(true)}
          onKeyDown={activer(true)}
        >
          {libelleOui}
        </BoutonChoix>
        <BoutonChoix
          role="radio"
          tabIndex={0}
          aria-checked={value === false}
          selectionne={value === false}
          onClick={() => onChange(false)}
          onKeyDown={activer(false)}
        >
          {libelleNon}
        </BoutonChoix>
      </RangeeChoix>
      {erreur && <TexteErreur role="alert">{erreur}</TexteErreur>}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// ChoixMultiple
// ---------------------------------------------------------------------------

export interface ChoixMultipleProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  obligatoire?: boolean;
  erreur?: string;
  /** Puces proposées d'emblée (ex. `CULTURES_COURANTES`) — l'agriculteur peut en ajouter d'autres. */
  suggestions?: readonly string[];
}

export const ChoixMultiple: FunctionComponent<ChoixMultipleProps> = ({
  label,
  value,
  onChange,
  obligatoire = false,
  erreur,
  suggestions = [],
}) => {
  const [ajout, setAjout] = useState('');

  const basculer = (item: string) => {
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  };

  const ajouterLibre = () => {
    const texte = ajout.trim();
    if (!texte || value.includes(texte)) {
      setAjout('');
      return;
    }
    onChange([...value, texte]);
    setAjout('');
  };

  // Puces saisies librement par l'agriculteur, absentes des suggestions —
  // affichées à la suite pour rester visibles et désélectionnables.
  const puceLibres = value.filter((item) => !suggestions.includes(item));

  return (
    <Box sx={{ width: '100%', maxWidth: 395 }}>
      <Libelle>{texteLibelle(label, obligatoire)}</Libelle>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {suggestions.map((item) => (
          <PuceChoix
            key={item}
            label={item}
            selectionnee={value.includes(item)}
            onClick={() => basculer(item)}
            aria-pressed={value.includes(item)}
          />
        ))}
        {puceLibres.map((item) => (
          <PuceChoix key={item} label={item} selectionnee onClick={() => basculer(item)} aria-pressed />
        ))}
      </Stack>
      <Stack direction="row" gap={1} sx={{ mt: 1.5, alignItems: 'center' }}>
        <CapsuleTextField
          value={ajout}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setAjout(event.target.value)}
          placeholder="Ajouter…"
          size="small"
          slotProps={{ htmlInput: { 'aria-label': `Ajouter à ${label}` } }}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            ajouterLibre();
          }}
        />
        <IconButton onClick={ajouterLibre} aria-label={`Valider l’ajout à ${label}`} sx={{ color: '#016557' }}>
          <AddRoundedIcon />
        </IconButton>
      </Stack>
      {erreur && <TexteErreur role="alert">{erreur}</TexteErreur>}
    </Box>
  );
};
