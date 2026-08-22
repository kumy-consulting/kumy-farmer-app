import { useEffect, useState, type FunctionComponent } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { RouterProvider } from 'react-router-dom';

import { router } from '@/shared/routes';
import { hideNativeSplash } from '@/shared/services/nativeShell';
import { useAuthStore } from '@/shared/stores/authStore';

const App: FunctionComponent = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void useAuthStore
      .getState()
      .initialize()
      .finally(() => {
        setReady(true);
        // Le splash natif reste affiché jusqu'ici (`autoHide: false`) : le
        // masquer plus tôt découvrirait le loader #kumy-preboot d'index.html,
        // soit deux écrans d'attente à la suite.
        void hideNativeSplash();
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
