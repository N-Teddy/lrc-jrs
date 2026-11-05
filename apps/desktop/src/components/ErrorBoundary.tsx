import { ErrorService } from '@jrs/client-core';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppCrashFallback } from './AppCrashFallback';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error | null, reset: () => void) => ReactNode;
  onCatch?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log crash details for developer / monitoring diagnostics
    console.error(
      '[LRC JRS Global ErrorBoundary] Uncaught runtime crash:',
      error,
      errorInfo,
    );

    // Forward React component crash to Sentry & telemetry reporters
    ErrorService.reportError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
      extra: {
        errorBoundary: 'GlobalErrorBoundary',
      },
    });

    if (this.props.onCatch) {
      try {
        this.props.onCatch(error, errorInfo);
      } catch (handlerErr) {
        console.error(
          '[LRC JRS Global ErrorBoundary] Error in onCatch handler:',
          handlerErr,
        );
      }
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <AppCrashFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
