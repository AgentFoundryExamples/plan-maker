import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { getSafeEnvConfig } from './api/env';

// Validate environment configuration on startup
const envConfig = getSafeEnvConfig();

if (!envConfig) {
  console.warn(
    'Environment configuration is missing or invalid. ' +
    'Please check .env file and ensure all required variables are set. ' +
    'See .env.example for reference.'
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
