import type { FunctionComponent, ReactNode } from 'react';

import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Box, MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { styled } from '@mui/material/styles';

import type { ReferentialItem } from '@/features/Onboarding/onboarding.api';

interface ProfileSelectProps {
  label: string;
  value: string;
  options: ReferentialItem[];
  onChange: (id: string, name: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Icône sémantique de tête (globe, ville…), cohérente avec le champ date. */
  icon?: ReactNode;
}

/**
 * Select habillé « capsule teal » cohérent avec `FieldCapsule` du design system
 * onboarding (radius 18, fond blanc dégradé, focus glow teal, police Ubuntu).
 */
const CapsuleSelect = styled(Select)({
  width: '100%',
  maxWidth: 395,
  borderRadius: 18,
  fontFamily: "'Ubuntu', sans-serif",
  fontSize: 15,
  fontWeight: 600,
  color: 'rgba(20,40,35,0.92)',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,251,247,0.96) 100%)',
  boxShadow: '0 6px 20px rgba(1,134,117,0.08), 0 1px 0 rgba(255,255,255,0.85) inset',
  transition: 'all 0.25s ease',
  '& .MuiSelect-select': {
    padding: '15px 18px',
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiSelect-icon': {
    color: 'rgba(1,101,87,0.55)',
    right: 14,
  },
  '& fieldset': {
    borderColor: 'rgba(55,75,70,0.08)',
    borderWidth: 1,
    borderRadius: 18,
  },
  '&:hover fieldset': {
    borderColor: 'rgba(1,134,117,0.28)',
  },
  '&.Mui-focused fieldset': {
    borderColor: 'rgba(1,134,117,0.38)',
    borderWidth: 1,
  },
  '&.Mui-focused': {
    boxShadow:
      '0 10px 28px rgba(1,134,117,0.18), 0 0 0 4px rgba(1,134,117,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
  },
  '&.Mui-disabled': {
    background: 'rgba(240,242,238,0.7)',
    color: 'rgba(55,75,70,0.35)',
    boxShadow: 'none',
  },
});

/**
 * La liste déroulante, habillée comme la capsule qui l'ouvre.
 *
 * Elle arrivait avec le panneau blanc par défaut de MUI, posé sur un écran qui
 * parle partout le même vocabulaire — dégradé nacré, rayon 16, ombre teal. Elle
 * se lisait comme un artefact du navigateur tombé sur la page.
 *
 * Surtout, **on ne voyait pas sa propre réponse** : `Mui-selected` ne pose
 * qu'un lavis gris à 8 %, invisible sur un téléphone en plein soleil. Or on
 * rouvre une liste au moins autant pour vérifier ce qu'on a répondu que pour en
 * changer. D'où la coche et le teal : la réponse déjà donnée se retrouve d'un
 * coup d'œil, sans avoir à relire les six lignes.
 */
const menuSx = {
  mt: 0.75,
  borderRadius: '18px',
  // Opaque, sans alpha : la capsule peut se permettre un fond translucide,
  // elle est posée sur la page. Une liste flotte AU-DESSUS du formulaire — le
  // moindre pourcent de transparence y laissait lire les champs du dessous à
  // travers les intitulés.
  backgroundColor: '#FFFFFF',
  backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBF7 100%)',
  border: '1px solid rgba(1,134,117,0.14)',
  boxShadow: '0 18px 40px rgba(1,50,40,0.16), 0 2px 10px rgba(1,134,117,0.06)',
  // Les listes d'adresse comptent parfois des dizaines de sous-préfectures :
  // la liste se plafonne et défile, avec la barre fine de la PWA.
  maxHeight: 'min(44vh, 360px)',
  scrollbarWidth: 'thin',
  '&::-webkit-scrollbar': { width: 4 },
  '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(1,134,117,0.22)', borderRadius: 2 },
  '& .MuiList-root': { padding: '6px' },
  '& .MuiMenuItem-root': {
    minHeight: 52,
    borderRadius: '12px',
    padding: '10px 12px',
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: 15,
    color: 'rgba(20,40,35,0.86)',
    gap: '10px',
    '&:hover': { background: 'rgba(1,134,117,0.06)' },
    // Le focus se dit par un liseré, jamais par un fond. À l'ouverture, MUI
    // pose `Mui-focusVisible` sur la première ligne : lui donner le même fond
    // teal que `Mui-selected` la faisait passer pour une réponse déjà donnée,
    // sur un champ pourtant obligatoire et encore vide. Le fond plein reste
    // réservé à la seule ligne réellement choisie.
    '&.Mui-focusVisible': {
      background: 'transparent',
      boxShadow: 'inset 0 0 0 2px rgba(1,134,117,0.38)',
    },
    '&.Mui-selected': {
      background: 'rgba(1,134,117,0.10)',
      color: '#016557',
      fontWeight: 700,
      '&:hover': { background: 'rgba(1,134,117,0.14)' },
      // Choisie ET focalisée : le fond reste, le liseré se superpose.
      '&.Mui-focusVisible': { background: 'rgba(1,134,117,0.10)' },
    },
  },
} as const;

const LeadingIcon = styled(Box, { shouldForwardProp: (prop) => prop !== 'muted' })<{ muted?: boolean }>(
  ({ muted }) => ({
    display: 'flex',
    alignItems: 'center',
    marginRight: 12,
    color: muted ? 'rgba(55,75,70,0.30)' : '#016557',
    '& svg': { fontSize: 21 },
  }),
);

export const ProfileSelect: FunctionComponent<ProfileSelectProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder,
  icon,
}) => {
  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const id = event.target.value as string;
    const match = options.find((option) => option.id === id);
    onChange(id, match?.name ?? '');
  };

  return (
    <CapsuleSelect
      value={value}
      onChange={handleChange}
      disabled={disabled}
      displayEmpty
      SelectDisplayProps={{ 'aria-label': label }}
      MenuProps={{
        slotProps: { paper: { sx: menuSx } },
        // Sous la capsule plutôt que par-dessus : on garde sous les yeux le
        // libellé de la question pendant qu'on choisit.
        anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
        transformOrigin: { vertical: 'top', horizontal: 'left' },
      }}
      renderValue={(selected) => {
        const id = selected as string;
        const isPlaceholder = !id;
        const text = isPlaceholder ? (placeholder ?? label) : (options.find((o) => o.id === id)?.name ?? '');
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            {icon && <LeadingIcon muted={disabled || isPlaceholder}>{icon}</LeadingIcon>}
            <Box
              component="span"
              sx={{
                color: isPlaceholder ? 'rgba(55,75,70,0.42)' : undefined,
                fontWeight: isPlaceholder ? 400 : 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {text}
            </Box>
          </Box>
        );
      }}
    >
      {options.map((option) => (
        <MenuItem key={option.id} value={option.id}>
          <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
            {option.name}
          </Box>
          {/* `aria-hidden` : l'état sélectionné est déjà porté par
              `aria-selected` de l'option. Sans ça, la coche s'ajouterait au nom
              accessible et « Boké » deviendrait introuvable par son intitulé. */}
          {option.id === value && <CheckRoundedIcon aria-hidden sx={{ fontSize: 19, color: '#016557' }} />}
        </MenuItem>
      ))}
    </CapsuleSelect>
  );
};
