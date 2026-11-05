import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

export interface SentryErrorContext {
  method?: string;
  url?: string;
  path?: string;
  ip?: string;
  body?: unknown;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  user?: {
    userId?: string;
    role?: string;
    townCode?: string;
    email?: string;
  };
  extra?: Record<string, unknown>;
}

@Injectable()
// biome-ignore lint/complexity/noStaticOnlyClass: Centralized static utility service
export class SentryService {
  private static readonly logger = new Logger('SentryService');
  private static isInitialized = false;

  /**
   * Initializes Sentry using process.env or provided DSN.
   * Safe to call multiple times; will only initialize once if DSN is valid.
   */
  static init(): void {
    if (SentryService.isInitialized) return;

    const dsn =
      process.env.SENTRY_DSN ||
      process.env.SENTRY_BACKEND_DSN ||
      process.env.SENTRY_SERVER_DSN;

    if (!dsn || dsn.trim() === '') {
      SentryService.logger.log(
        'SENTRY_DSN is not configured. Real-time remote error tracking is in standby mode.',
      );
      return;
    }

    try {
      const environment =
        process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
      const release =
        process.env.SENTRY_RELEASE ||
        process.env.npm_package_version ||
        '0.0.1';

      Sentry.init({
        dsn,
        environment,
        release,
        sampleRate: 1.0, // Capture 100% of errors
        tracesSampleRate: 0.1, // Sample 10% of transactions to respect free tier
        beforeSend(event) {
          // Automatic data scrubbing for sensitive credentials & PII
          if (event.request?.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
            delete event.request.headers['x-auth-token'];
          }
          return event;
        },
      });

      SentryService.isInitialized = true;
      SentryService.logger.log(
        `Sentry initialized successfully [env: ${environment}, release: ${release}]`,
      );
    } catch (err) {
      SentryService.logger.warn('Failed to initialize Sentry:', err);
    }
  }

  /**
   * Recursively sanitizes data to scrub sensitive properties like passwords or tokens
   */
  static sanitize(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => SentryService.sanitize(item));
    }

    const SENSITIVE_KEY_REGEX =
      /password|token|secret|authorization|cookie|otp|pin|credentials/i;
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = SentryService.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Captures an exception with sanitized request and user metadata
   */
  static captureException(
    exception: unknown,
    context?: SentryErrorContext,
  ): string | undefined {
    if (!SentryService.isInitialized) {
      return undefined;
    }

    try {
      return Sentry.captureException(exception, (scope) => {
        if (context?.user) {
          scope.setUser({
            id: context.user.userId,
            email: context.user.email,
            role: context.user.role,
            townCode: context.user.townCode,
          } as Sentry.User);
        }

        if (context?.method && (context?.url || context?.path)) {
          scope.setTag('http.method', context.method);
          scope.setTag('http.url', context.url || context.path);
        }

        if (context?.user?.role) {
          scope.setTag('user.role', context.user.role);
        }
        if (context?.user?.townCode) {
          scope.setTag('user.town', context.user.townCode);
        }

        if (context?.body) {
          scope.setExtra('request.body', SentryService.sanitize(context.body));
        }
        if (context?.params) {
          scope.setExtra('request.params', context.params);
        }
        if (context?.query) {
          scope.setExtra('request.query', context.query);
        }
        if (context?.extra) {
          for (const [k, v] of Object.entries(context.extra)) {
            scope.setExtra(k, v);
          }
        }

        return scope;
      });
    } catch (err) {
      SentryService.logger.warn('Failed to forward exception to Sentry:', err);
      return undefined;
    }
  }

  /**
   * Captures an informational or warning message to Sentry
   */
  static captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    extra?: Record<string, unknown>,
  ): string | undefined {
    if (!SentryService.isInitialized) return undefined;

    try {
      return Sentry.captureMessage(message, {
        level,
        extra,
      });
    } catch {
      return undefined;
    }
  }
}
