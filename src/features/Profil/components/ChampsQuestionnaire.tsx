import { useState, type ChangeEvent, type FunctionComponent, type KeyboardEvent, type ReactNode } from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Box, Chip, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { ProfileSelect } from '@/features/Onboarding/components/ProfileSelect';
import type { ReferentialItem } from '@/features/Onboarding/onboarding.api';

import type { ReponsesQuestionnaire } from '../profil.types';

/**
 * Briques de saisie du questionnaire de profil, habillées comme
 * `ProfileSelect` (@/features/Onboarding/components/ProfileSelect) : capsule
 * radius 18, fond blanc dégradé, glow vert `#016557` au focus, police Ubuntu.
 *
 * Convention commune : un champ obligatoire porte une astérisque dans son
 * libellé, un facultatif n'en porte pas — c'est `obligatoire` qui décide,
 * jamais le texte du `label` lui-même.
 */

// Métriques reprises telles quelles du wizard de tracé d'`agripilot-pwa`
// (`ParcelName.styles.ts`, `SelectSoilType.styles.ts`) : capsule de 60 px de
// haut, rayon 16, ombre teal discrète, halo de focus à 4 px. Les deux apps
// visent le même geste — répondre debout, dans un champ, d'une seule main — et
// n'ont aucune raison d'avoir deux tailles de champ différentes.
const CAPSULE_BACKGROUND = 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,251,247,0.95) 100%)';
const CAPSULE_SHADOW = '0 2px 10px rgba(1,134,117,0.06), 0 1px 0 rgba(255,255,255,0.8) inset';
const CAPSULE_FOCUS_SHADOW = '0 6px 20px rgba(1,134,117,0.16), 0 0 0 4px rgba(1,134,117,0.10)';
export const CAPSULE_RAYON = '16px';
/**
 * Hauteur de capsule : les 60 px de la PWA sur un écran normal, ramenés à 52 px
 * quand la fenêtre est courte. Un chiffre fixe obligerait à choisir entre une
 * cible confortable et un panneau qui déborde sur les petits Android.
 */
export const CAPSULE_HAUTEUR = 'clamp(48px, 7.4vh, 60px)';

const Libelle = styled(Typography)({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(55,75,70,0.72)',
  marginBottom: 6,
});

// Serré : trois erreurs simultanées sur un écran de 568 px de haut — un
// panneau entier laissé vide — sont le seul cas qui débordait encore.
const TexteErreur = styled(Typography)({
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.25,
  color: '#B3261E',
  marginTop: 3,
});

/** `TextField` habillé « capsule teal », partagé par `ChampTexte` et `ChampNombre`. */
const CapsuleTextField = styled(TextField)({
  width: '100%',
  maxWidth: 395,
  '& .MuiOutlinedInput-root': {
    borderRadius: CAPSULE_RAYON,
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    color: 'rgba(20,40,35,0.92)',
    background: CAPSULE_BACKGROUND,
    boxShadow: CAPSULE_SHADOW,
    transition: 'all 0.2s ease',
    // 60 px pleins sur une ligne simple ; un multiligne garde le même rembourrage
    // horizontal mais suit ses lignes.
    '& input': { padding: '0 16px', height: CAPSULE_HAUTEUR, boxSizing: 'border-box' },
    '& textarea': { padding: '2px 0' },
    '&.MuiInputBase-multiline': { padding: '14px 16px' },
    '& fieldset': { borderColor: 'rgba(55,75,70,0.10)', borderWidth: 1, borderRadius: CAPSULE_RAYON },
    '&:hover fieldset': { borderColor: 'rgba(1,134,117,0.30)' },
    '&.Mui-focused fieldset': { borderColor: '#018675', borderWidth: 1 },
    '&.Mui-focused': { boxShadow: CAPSULE_FOCUS_SHADOW },
  },
  '& .MuiInputBase-input::placeholder': { color: 'rgba(55,75,70,0.5)', opacity: 1, fontStyle: 'italic' },
});

/** Ligne des deux boutons radio de `ChoixOuiNon`. */
const RangeeChoix = styled(Stack)({
  flexDirection: 'row',
  gap: 10,
  width: '100%',
  maxWidth: 395,
});

/**
 * Une option de `ChoixOuiNon`, habillée comme la `soilCard` du wizard de tracé
 * de la PWA : même rayon 18, même liseré `1.5px #018675` une fois choisie, même
 * lueur radiale en coin. Choisir se voit alors à la carte entière, pas à un
 * simple fond plein — et la cible fait 56 px de haut au lieu de 44.
 */
const BoutonChoix = styled(Box, { shouldForwardProp: (prop) => prop !== 'selectionne' })<{ selectionne?: boolean }>(
  ({ selectionne }) => ({
    position: 'relative',
    flex: 1,
    minHeight: 'clamp(50px, 7vh, 56px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 14px',
    borderRadius: 18,
    overflow: 'hidden',
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: 15,
    fontWeight: selectionne ? 700 : 500,
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
    color: selectionne ? '#016557' : 'rgba(20,40,35,0.78)',
    border: selectionne ? '1.5px solid #018675' : '1px solid rgba(55,75,70,0.08)',
    background: selectionne
      ? 'linear-gradient(135deg, rgba(1,134,117,0.08) 0%, rgba(1,134,117,0.02) 100%)'
      : CAPSULE_BACKGROUND,
    boxShadow: selectionne
      ? '0 10px 24px rgba(1,134,117,0.16), 0 1px 0 rgba(255,255,255,0.6) inset'
      : CAPSULE_SHADOW,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      width: 120,
      height: 120,
      pointerEvents: 'none',
      background: selectionne
        ? 'radial-gradient(circle at top right, rgba(1,134,117,0.14), transparent 60%)'
        : 'radial-gradient(circle at top right, rgba(1,134,117,0.04), transparent 60%)',
    },
    '&:active': { transform: 'scale(0.985)' },
    '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:active': { transform: 'none' } },
    '&:focus-visible': { boxShadow: '0 0 0 3px rgba(1,134,117,0.22)' },
  }),
);

/** Puce de `ChoixMultiple`, sélectionnée (teinte teal) ou non (contour clair). */
const PuceChoix = styled(Chip, { shouldForwardProp: (prop) => prop !== 'selectionnee' })<{ selectionnee?: boolean }>(
  ({ selectionnee }) => ({
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    borderRadius: 999,
    height: 36,
    color: selectionnee ? '#FFFFFF' : 'rgba(20,40,35,0.75)',
    background: selectionnee ? 'linear-gradient(135deg, #018675 0%, #016557 100%)' : 'rgba(255,255,255,0.85)',
    border: selectionnee ? '1px solid transparent' : '1px solid rgba(55,75,70,0.12)',
    boxShadow: selectionnee ? '0 4px 12px rgba(1,101,87,0.22)' : '0 1px 4px rgba(55,75,70,0.05)',
    '&:hover': {
      background: selectionnee ? 'linear-gradient(135deg, #018675 0%, #016557 100%)' : 'rgba(1,134,117,0.08)',
    },
  }),
);

/** Fabrique le libellé « Label » ou « Label * », un seul nœud de texte. */
function texteLibelle(label: string, obligatoire?: boolean): string {
  return obligatoire ? `${label} *` : label;
}

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
  /** Reflète le `@MaxLength` du DTO serveur — un 400 évité vaut mieux qu'un 400 traduit. */
  maxLength?: number;
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
  maxLength,
}) => (
  <Box sx={{ width: '100%', maxWidth: 395 }}>
    <Libelle>{texteLibelle(label, obligatoire)}</Libelle>
    <CapsuleTextField
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      error={Boolean(erreur)}
      fullWidth
      slotProps={{
        htmlInput: { 'aria-label': label, maxLength },
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
  /** Le serveur valide `@IsInt()` sur ce champ : une décimale saisie ici recevrait un 400. */
  entier?: boolean;
}

/** Touches qui introduiraient une décimale ou une notation scientifique. */
const TOUCHES_DECIMALES = ['.', ',', 'e', 'E'];

export const ChampNombre: FunctionComponent<ChampNombreProps> = ({
  label,
  value,
  onChange,
  obligatoire = false,
  erreur,
  suffixe,
  min,
  max,
  entier = false,
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const brut = event.target.value;
    if (brut === '') {
      onChange(undefined);
      return;
    }
    const nombre = Number(brut);
    if (Number.isNaN(nombre)) return;
    // Un filet en plus du blocage à la frappe : couvre le collage et la
    // saisie via les flèches du champ number, que `onKeyDown` ne voit pas.
    if (entier && !Number.isInteger(nombre)) return;
    onChange(nombre);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (entier && TOUCHES_DECIMALES.includes(event.key)) event.preventDefault();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 395 }}>
      <Libelle>{texteLibelle(label, obligatoire)}</Libelle>
      <CapsuleTextField
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={entier ? handleKeyDown : undefined}
        error={Boolean(erreur)}
        fullWidth
        slotProps={{
          htmlInput: { min, max, step: entier ? 1 : undefined, inputMode: 'numeric', 'aria-label': label },
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
  /** Reflète `@ArrayMaxSize` côté serveur — au-delà, une nouvelle entrée est ignorée. */
  maxItems?: number;
  /** Reflète `@MaxLength` par entrée côté serveur. */
  maxLongueurItem?: number;
}

export const ChoixMultiple: FunctionComponent<ChoixMultipleProps> = ({
  label,
  value,
  onChange,
  obligatoire = false,
  erreur,
  suggestions = [],
  maxItems,
  maxLongueurItem,
}) => {
  const [ajout, setAjout] = useState('');
  const plafondAtteint = maxItems !== undefined && value.length >= maxItems;

  const basculer = (item: string) => {
    // Désélectionner reste toujours possible même au plafond ; seul l'ajout est bloqué.
    if (!value.includes(item) && plafondAtteint) return;
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  };

  const ajouterLibre = () => {
    const texte = ajout.trim().slice(0, maxLongueurItem);
    if (!texte || value.includes(texte) || plafondAtteint) {
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
          disabled={plafondAtteint}
          slotProps={{ htmlInput: { 'aria-label': `Ajouter à ${label}`, maxLength: maxLongueurItem } }}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            ajouterLibre();
          }}
        />
        <IconButton
          onClick={ajouterLibre}
          disabled={plafondAtteint}
          aria-label={`Valider l’ajout à ${label}`}
          sx={{ color: '#016557' }}
        >
          <AddRoundedIcon />
        </IconButton>
      </Stack>
      {erreur && <TexteErreur role="alert">{erreur}</TexteErreur>}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// EtapeProps
// ---------------------------------------------------------------------------

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
// Les trois étapes du questionnaire en ont toutes besoin — d'où sa place ici,
// au même endroit que `ChampTexte` et consorts, plutôt que dans l'une des
// étapes elles-mêmes. Le libellé visible ET l'`aria-label` du contrôle
// portent le même texte : `ProfileSelect` transmet `label` en `aria-label`,
// donc c'est ce qui associe vraiment le texte au select pour un lecteur
// d'écran — un `Typography` posé à côté ne l'aurait pas fait.

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
  <Box
    sx={{
      width: '100%',
      maxWidth: 395,
      // `ProfileSelect` n'expose pas de `sx` : la capsule est alignée ici sur
      // celle des champs texte (60 px, rayon 16), et seulement ici —
      // `RegisterAddressPage` et l'onboarding gardent la leur. Le doublement
      // `&&` fait passer la règle devant celle du composant stylé.
      '&& .MuiSelect-select': {
        padding: '0 16px',
        height: CAPSULE_HAUTEUR,
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
      },
      '&& .MuiOutlinedInput-notchedOutline, && fieldset': { borderRadius: CAPSULE_RAYON },
      '&& .MuiInputBase-root, && .MuiSelect-select': { borderRadius: CAPSULE_RAYON },
    }}
  >
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
