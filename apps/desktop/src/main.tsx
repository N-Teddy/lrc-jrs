import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components';
import { initSentry } from './core/sentry';
import { applyZoom, getInitialZoom } from './hooks/use-zoom-shortcuts';
import './index.css';

// Restore user-configured UI zoom scale before initial render
applyZoom(getInitialZoom());

// Initialize Sentry error tracking for desktop runtime
initSentry();

// Ensure process.env and NODE_ENV are explicitly available in desktop runtime
if (typeof window !== 'undefined') {
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const nodeEnv = isDev ? 'development' : 'production';
  const win = window as any;
  win.process = win.process || {};
  win.process.env = win.process.env || {};
  win.process.env.NODE_ENV = nodeEnv;
  win.__DEV__ = isDev;

  if (isDev) {
    document.title = 'LRC JRS (Dev) - Youth Fellowship Portal';
  } else {
    // Production tamper & inspection protection: disable context menu & devtools key shortcuts
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'U')
      ) {
        e.preventDefault();
      }
    });
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
