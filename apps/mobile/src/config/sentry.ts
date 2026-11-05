import { type ErrorReportContext, ErrorService } from '@jrs/client-core';

interface SentryDsnComponents {
  publicKey: string;
  host: string;
  projectId: string;
}

function parseDsn(dsn?: string): SentryDsnComponents | null {
  if (!dsn?.startsWith('http')) return null;
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const host = url.host;
    const pathParts = url.pathname.split('/').filter(Boolean);
    const projectId = pathParts[pathParts.length - 1];

    if (!publicKey || !host || !projectId) return null;
    return { publicKey, host, projectId };
  } catch {
    return null;
  }
}

let activeUser: {
  id?: string;
  email?: string;
  role?: string;
  townCode?: string;
} | null = null;

export function setMobileSentryUser(
  user?: {
    id?: string;
    email?: string;
    role?: string;
    townCode?: string;
  } | null,
): void {
  activeUser = user || null;
}

/**
 * Initializes error tracking for the mobile app via Sentry HTTP store ingestion.
 * Works seamlessly in Expo Go, Dev Client, and standalone builds with 0 native dependencies.
 */
export function initMobileSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const components = parseDsn(dsn);

  if (!components) {
    console.log(
      '[Sentry Mobile] EXPO_PUBLIC_SENTRY_DSN not configured. Mobile error tracking in local mode.',
    );
    return;
  }

  const { publicKey, host, projectId } = components;
  const storeUrl = `https://${host}/api/${projectId}/store/`;

  async function sendToSentry(error: unknown, context?: ErrorReportContext) {
    try {
      const err = error instanceof Error ? error : new Error(String(error));
      const eventId =
        Math.random().toString(36).substring(2) + Date.now().toString(36);

      const payload = {
        event_id: eventId,
        timestamp: new Date().toISOString().replace('Z', ''),
        platform: 'javascript',
        level: 'error',
        logger: 'mobile',
        release: '0.0.4',
        environment: __DEV__ ? 'development' : 'production',
        exception: {
          values: [
            {
              type: err.name || 'Error',
              value: err.message || 'Unknown Mobile Error',
              stacktrace: err.stack
                ? {
                    frames: err.stack.split('\n').map((line) => ({
                      function: line.trim(),
                    })),
                  }
                : undefined,
            },
          ],
        },
        tags: {
          platform: 'react-native',
          screen: context?.screen,
          userRole: context?.userRole || activeUser?.role,
          townHub: context?.townHub || activeUser?.townCode,
          ...(context?.tags || {}),
        },
        user: activeUser
          ? { id: activeUser.id, email: activeUser.email }
          : undefined,
        extra: {
          componentStack: context?.componentStack,
          details: context?.details,
          statusCode: context?.statusCode,
          errorCode: context?.errorCode,
          ...(context?.extra || {}),
        },
      };

      await fetch(storeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=lrc-mobile/0.0.4, sentry_key=${publicKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (sendErr) {
      console.warn(
        '[Sentry Mobile] Failed to transmit error to Sentry:',
        sendErr,
      );
    }
  }

  // Register with ErrorService in client-core
  ErrorService.registerReporter((error, context) => {
    sendToSentry(error, context);
  });

  // Attach global unhandled JS error handler in React Native
  const globalErrorUtils = (
    globalThis as unknown as {
      ErrorUtils?: {
        getGlobalHandler: () => unknown;
        setGlobalHandler: (fn: unknown) => void;
      };
    }
  ).ErrorUtils;
  if (globalErrorUtils) {
    const originalHandler = globalErrorUtils.getGlobalHandler();
    globalErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      sendToSentry(error, { extra: { isFatal } });
      if (typeof originalHandler === 'function') {
        originalHandler(error, isFatal);
      }
    });
  }

  console.log('[Sentry Mobile] Ingestion reporter active');
}
