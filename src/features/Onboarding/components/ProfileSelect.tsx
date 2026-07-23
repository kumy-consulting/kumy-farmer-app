import type { FunctionComponent, ReactNode } from 'react';

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
        <MenuItem key={option.id} value={option.id} sx={{ fontFamily: "'Ubuntu', sans-serif" }}>
          {option.name}
        </MenuItem>
      ))}
    </CapsuleSelect>
  );
};
