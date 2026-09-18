import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { AppErrorBoundary } from './app/AppErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Application root element is missing.');

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
