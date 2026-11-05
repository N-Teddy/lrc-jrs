import { type ErrorReportContext, ErrorService } from '@jrs/client-core';
import * as Sentry from '@sentry/react';

let isInitialized = false;

/**
 * Initializes Sentry for the desktop application if VITE_SENTRY_DSN is configured.
 */
export function initSentry(): void {
  if (isInitialized) return;

  const dsn =
    import.meta.env.VITE_SENTRY_DSN || import.meta.env.VITE_SENTRY_FRONTEND_DSN;

  if (!dsn || dsn.trim() === '') {
    console.log(
      '[Sentry Desktop] VITE_SENTRY_DSN not configured. Error tracking in local mode.',
    );
    return;
  }

  try {
    const environment =
      import.meta.env.VITE_SENTRY_ENVIRONMENT ||
      import.meta.env.MODE ||
      'development';

    Sentry.init({
      dsn,
      environment,
      release: '0.0.4',
      sampleRate: 1.0,
      tracesSampleRate: 0.1, // Sample 10% of transactions to respect free quota
      beforeSend(event) {
        // Redact any sensitive tokens or cookies
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });

    isInitialized = true;
    console.log(`[Sentry Desktop] Initialized [env: ${environment}]`);

    // Register Sentry as a telemetry reporter in ErrorService
    ErrorService.registerReporter(
      (error: unknown, context?: ErrorReportContext) => {
        if (!isInitialized) return;

        Sentry.captureException(error, (scope) => {
          if (context?.screen) {
            scope.setTag('screen', context.screen);
          }
          if (context?.userRole) {
            scope.setTag('user.role', context.userRole);
          }
          if (context?.townHub) {
            scope.setTag('user.town', context.townHub);
          }
          if (context?.statusCode) {
            scope.setTag('http.status', String(context.statusCode));
          }
          if (context?.errorCode) {
            scope.setTag('error.code', context.errorCode);
          }
          if (context?.userId) {
            scope.setUser({ id: context.userId });
          }
          if (context?.componentStack) {
            scope.setExtra('componentStack', context.componentStack);
          }
          if (context?.details) {
            scope.setExtra('details', context.details);
          }
          if (context?.extra) {
            for (const [k, v] of Object.entries(context.extra)) {
              scope.setExtra(k, v);
            }
          }
          return scope;
        });
      },
    );

    // Capture unhandled global window errors
    window.addEventListener('error', (event) => {
      if (event.error) {
        Sentry.captureException(event.error);
      }
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason) {
        Sentry.captureException(event.reason);
      }
    });
  } catch (err) {
    console.warn('[Sentry Desktop] Initialization error:', err);
  }
}

/**
 * Updates Sentry user context when coordinator/member logs in
 */
export function setSentryUser(
  user?: {
    id?: string;
    role?: string;
    townCode?: string;
    email?: string;
  } | null,
): void {
  if (!isInitialized) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
    if (user.role) {
      Sentry.setTag('user.role', user.role);
    }
    if (user.townCode) {
      Sentry.setTag('user.town', user.townCode);
    }
  } else {
    Sentry.setUser(null);
  }
}
