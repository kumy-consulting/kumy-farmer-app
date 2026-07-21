import type { FunctionComponent } from 'react';

import { Box } from '@mui/material';

import { neutral, primary } from '@/theme/colors';

interface OnboardingStepperProps {
  current: number;
  total?: number;
}

export const OnboardingStepper: FunctionComponent<OnboardingStepperProps> = ({ current, total = 2 }) => (
  <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center', mb: 3 }}>
    {Array.from({ length: total }).map((_, index) => (
      <Box
        key={index}
        sx={{
          height: 4,
          borderRadius: '2px',
          width: index === current ? 28 : 16,
          bgcolor: index <= current ? primary[50] : neutral[80],
          transition: 'all 0.3s ease',
        }}
      />
    ))}
  </Box>
);
