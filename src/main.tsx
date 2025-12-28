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

// Create a client for React Query
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
