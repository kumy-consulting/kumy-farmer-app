import { useEffect, useState, type FunctionComponent } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { frFR } from '@mui/x-date-pickers/locales';
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
    // `adapterLocale` ne traduit que les dates elles-mêmes — noms de mois, ordre
    // des champs. Les mots de l'interface des sélecteurs (« JJ/MM/AAAA », les
    // boutons de la boîte de dialogue, les libellés de navigation) viennent d'un
    // second paquet, qu'il faut passer explicitement : sans lui, un agriculteur
    // guinéen lit « DD/MM/YYYY » sous « Date de naissance ».
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale="fr"
      localeText={frFR.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <RouterProvider router={router} />
    </LocalizationProvider>
  );
};

export default App;
