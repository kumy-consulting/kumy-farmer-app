import type { FunctionComponent, ReactNode } from 'react';

import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
}

export const EmptyState: FunctionComponent<EmptyStateProps> = ({ icon, message }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      p: '16px 16px',
      borderRadius: '18px',
      background: 'rgba(1,134,117,0.05)',
      border: '1px dashed rgba(1,134,117,0.22)',
      '& svg': { fontSize: 24, color: '#35A18F' },
    }}
  >
    {icon}
    <Typography sx={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 13.5, fontWeight: 500, color: 'rgba(55,75,70,0.72)' }}>
      {message}
    </Typography>
  </Box>
);
