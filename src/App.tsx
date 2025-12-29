import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@/styles/global.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/layout/AppLayout';
import NotFoundPage from '@/pages/NotFoundPage';
import PlannerInputPage from '@/pages/PlannerInputPage';
import PlansListPage from '@/pages/PlansListPage';
import { PlanAnswersProvider } from '@/state/planAnswersStore';
import { SubmissionMetadataProvider } from '@/state/submissionMetadataStore';

// Code-split the heavy PlanDetailPage to reduce initial bundle size
const PlanDetailPage = React.lazy(() => import('@/pages/PlanDetailPage'));

// Loading fallback component for code-split routes
const PageLoadingFallback: React.FC = () => (
  <div className="container">
    <div className="plans-skeleton" role="status" aria-label="Loading page">
      <div className="skeleton-card">
        <div className="skeleton-header">
          <div className="skeleton-id" />
          <div className="skeleton-status" />
        </div>
        <div className="skeleton-text" />
        <div className="skeleton-text" />
        <div className="skeleton-text" />
      </div>
    </div>
  </div>
);

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
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <PlanDetailPage />
          </Suspense>
        ),
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
      <SubmissionMetadataProvider>
        <PlanAnswersProvider>
          <RouterProvider router={router} />
        </PlanAnswersProvider>
      </SubmissionMetadataProvider>
    </ErrorBoundary>
  );
};

export default App;
