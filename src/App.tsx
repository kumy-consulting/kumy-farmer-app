import { useEffect, useState, type FunctionComponent } from 'react';

import { RouterProvider } from 'react-router-dom';

import { router } from '@/shared/routes';
import { useAuthStore } from '@/shared/stores/authStore';

const App: FunctionComponent = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void useAuthStore
      .getState()
      .initialize()
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <RouterProvider router={router} />;
};

export default App;
