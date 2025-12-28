import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import { getSafeEnvConfig } from '@/api/env';

// Validate environment configuration on startup
const envConfig = getSafeEnvConfig();

if (!envConfig) {
  console.warn(
    'Environment configuration is missing or invalid. ' +
      'Please check .env file and ensure all required variables are set. ' +
      'See .env.example for reference.'
  );
}

/**
 * Create a QueryClient instance for React Query.
 *
 * DESIGN DECISION: The QueryClient is created at module scope (outside the React tree)
 * to prevent recreation on hot module reload during development. This is the recommended
 * pattern for client-side React applications.
 *
 * For SSR or testing environments that require fresh instances per request/test:
 * - SSR: Create the QueryClient inside a factory function or per-request
 * - Testing: Use a fresh QueryClient in each test's render wrapper
 *
 * See: https://tanstack.com/query/latest/docs/react/guides/advanced-ssr
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
