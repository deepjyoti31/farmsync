import React from 'react';
import { createRoot } from 'react-dom/client';
import SetupRequired from './components/common/SetupRequired';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);

const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

if (isConfigured) {
  // App is imported dynamically because creating the Supabase client throws
  // when credentials are missing.
  import('./App.tsx').then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
} else {
  root.render(<SetupRequired />);
}
