import { useEffect, useRef, useState, type FunctionComponent, type ChangeEvent } from 'react';

import { Box, Stack } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

interface PinDisplayProps {
  pin: string;
  maxLength?: number;
  onChange: (pin: string) => void;
  /**
   * Notifie le parent du focus de l'input caché. Sert de détection « clavier
   * ouvert » fiable multi-plateforme (sur iOS le calcul viewport ne voit pas
   * toujours le clavier — le focus, si).
   */
  onFocusChange?: (focused: boolean) => void;
}

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const pop = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const PinCell = styled(Stack, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'filled',
})<{ active: boolean; filled: boolean }>(({ active, filled }) => ({
  position: 'relative',
  width: 46,
  height: 56,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  cursor: 'text',
  transition: 'transform 0.2s ease, box-shadow 0.25s ease, border-color 0.2s ease, background 0.2s ease',
  background: filled
    ? 'linear-gradient(135deg, #018675 0%, #016557 100%)'
    : active
      ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(246,251,246,0.98) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(250,251,247,0.94) 100%)',
  border: filled
    ? '1.5px solid transparent'
    : active
      ? '1.5px solid rgba(1,134,117,0.40)'
      : '1px solid rgba(55,75,70,0.10)',
  boxShadow: filled
    ? '0 8px 18px rgba(1,134,117,0.30), 0 1px 0 rgba(255,255,255,0.22) inset'
    : active
      ? '0 6px 14px rgba(1,134,117,0.14), 0 0 0 4px rgba(1,134,117,0.10), 0 1px 0 rgba(255,255,255,0.9) inset'
      : '0 2px 6px rgba(55,75,70,0.05), 0 1px 0 rgba(255,255,255,0.9) inset',
}));

// UN SEUL input caché, qui couvre toute la rangée de cellules. Robuste en
// WebView (Capacitor) : tap n'importe où → focus → clavier numérique s'ouvre,
// la frappe remplit le PIN complet, le retour arrière fonctionne nativement.
// (L'ancien pattern à 6 inputs séparés bloquait la saisie dans le WebView.)
const HiddenInput = styled('input')({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  cursor: 'text',
  // Empêche le zoom iOS sur focus et garde l'input hors écran visuellement.
  fontSize: 16,
  caretColor: 'transparent',
});

const Cursor = styled(Box)({
  width: 2,
  height: 22,
  borderRadius: 2,
  background: 'linear-gradient(180deg, #018675 0%, #016557 100%)',
  animation: `${blink} 1.1s ease-in-out infinite`,
});

const Dot = styled(Box)({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 2px 4px rgba(0,0,0,0.18), 0 0 0 2px rgba(255,255,255,0.25)',
  animation: `${pop} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`,
});

export const PinDisplay: FunctionComponent<PinDisplayProps> = ({ pin, maxLength = 6, onChange, onFocusChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    onChange(digits);
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <HiddenInput
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={maxLength}
        value={pin}
        onChange={handleChange}
        onFocus={() => {
          setFocused(true);
          onFocusChange?.(true);
        }}
        onBlur={() => {
          setFocused(false);
          onFocusChange?.(false);
        }}
        aria-label="Code secret"
      />
      <Stack direction="row" spacing={1.25} justifyContent="center" sx={{ mt: 1, mb: 2 }}>
        {Array.from({ length: maxLength }).map((_, index) => {
          const filled = index < pin.length;
          const active = focused && index === pin.length;
          return (
            <PinCell
              key={index}
              data-pin-cell
              active={active}
              filled={filled}
              onClick={() => inputRef.current?.focus()}
            >
              {filled ? <Dot /> : active ? <Cursor /> : null}
            </PinCell>
          );
        })}
      </Stack>
    </Box>
  );
};
