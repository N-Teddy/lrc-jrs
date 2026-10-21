import React, { Component, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/plus-jakarta-sans';
import App from './App';
import './index.css';
import { I18nProvider } from './i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in Intake application:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAF7F2',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            color: '#23201E',
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              backgroundColor: '#ffffff',
              border: '1px solid #E6DFD5',
              borderRadius: '24px',
              padding: '32px 24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fff2ee',
                color: '#b85028',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                margin: '0 auto 16px',
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '0 0 8px',
                color: '#23201E',
              }}
            >
              Something went wrong loading the intake page
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: '#5c554f',
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              An unexpected error occurred while loading this view. Please try
              reloading the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#b85028',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <I18nProvider>
          <App />
        </I18nProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
