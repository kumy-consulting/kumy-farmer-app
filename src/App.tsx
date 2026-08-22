import { useEffect, useState, type FunctionComponent } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { RouterProvider } from 'react-router-dom';

import { router } from '@/shared/routes';
import { dismissBootSplash } from '@/shared/services/bootSplash';
import { useAuthStore } from '@/shared/stores/authStore';

const App: FunctionComponent = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void useAuthStore
      .getState()
      .initialize()
      .finally(() => {
        setReady(true);
        dismissBootSplash();
      });
  }, []);

  if (!ready) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <RouterProvider router={router} />
    </LocalizationProvider>
  );
};

export default App;
