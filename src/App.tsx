import { type FunctionComponent } from 'react';

import { RouterProvider } from 'react-router-dom';

import { router } from '@/shared/routes';

const App: FunctionComponent = () => {
  return <RouterProvider router={router} />;
};

export default App;
