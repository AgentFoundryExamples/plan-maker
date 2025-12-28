import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@/styles/global.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/layout/AppLayout';
import NotFoundPage from '@/pages/NotFoundPage';
import PlanDetailPage from '@/pages/PlanDetailPage';
import PlannerInputPage from '@/pages/PlannerInputPage';
import PlansListPage from '@/pages/PlansListPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <PlannerInputPage />,
      },
      {
        path: 'plans',
        element: <PlansListPage />,
      },
      {
        path: 'plans/:id',
        element: <PlanDetailPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default App;
