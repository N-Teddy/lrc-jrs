import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Ensure process.env and NODE_ENV are explicitly available in desktop runtime
if (typeof window !== 'undefined') {
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const nodeEnv = isDev ? 'development' : 'production';
  const win = window as any;
  win.process = win.process || {};
  win.process.env = win.process.env || {};
  win.process.env.NODE_ENV = nodeEnv;
  win.__DEV__ = isDev;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
