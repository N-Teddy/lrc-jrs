import { ErrorCode, type SuccessCode } from '@jrs/shared';
import axios from 'axios';
import { ApiError } from '../http/api-error';
import { i18n } from '../i18n/i18n';
import { toast } from '../toast/toast.context';

export interface HandleErrorOptions {
  silent?: boolean;
  customMessage?: string;
  duration?: number;
  title?: string;
}

export interface ExtractedErrorInfo {
  statusCode: number;
  errorCode?: string;
  message: string;
  details?: Record<string, unknown>;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Centralized static utility service
export class ErrorService {
  private static lastNetworkErrorTime = 0;
  private static readonly NETWORK_ERROR_THROTTLE_MS = 6000;

  /**
   * Reset the network error throttle window (e.g. when network requests resume successfully)
   */
  static resetNetworkErrorThrottle(): void {
    ErrorService.lastNetworkErrorTime = 0;
  }

  /**
   * Determine if an error message or code represents an unhandled network or connectivity failure
   */
  static isRawNetworkError(message?: string, errorCode?: string): boolean {
    if (errorCode === ErrorCode.NETWORK_ERROR || errorCode === 'ERR_NETWORK') {
      return true;
    }
    if (!message) return false;
    const lower = message.toLowerCase();
    return (
      lower.includes('network error') ||
      lower.includes('err_network') ||
      lower.includes('failed to fetch') ||
      lower.includes('network request failed') ||
      lower.includes('econnrefused') ||
      lower.includes('etimedout') ||
      lower.includes('timeout of') ||
      lower.includes('econnaborted') ||
      lower.includes('unknown network error')
    );
  }

  /**
   * Determine if an error represents an internal server crash or 500 status code
   */
  static isRawServerError(message?: string, statusCode?: number): boolean {
    if (statusCode && statusCode >= 500) return true;
    if (!message) return false;
    const lower = message.toLowerCase();
    return (
      lower.includes('request failed with status code 500') ||
      lower.includes('internal server error') ||
      lower.includes('err_internal_server')
    );
  }

  /**
   * Extract normalized error code, message, and details from any error object
   */
  static extractErrorInfo(error: unknown): ExtractedErrorInfo {
    if (error instanceof ApiError) {
      let code = error.errorCode;
      if (!code && ErrorService.isRawNetworkError(error.message, code)) {
        code = ErrorCode.NETWORK_ERROR;
      } else if (
        !code &&
        ErrorService.isRawServerError(error.message, error.statusCode)
      ) {
        code = ErrorCode.INTERNAL_SERVER_ERROR;
      }
      return {
        statusCode: error.statusCode,
        errorCode: code,
        message: error.message,
        details: error.details,
      };
    }

    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | {
            errorCode?: string;
            message?: string | string[];
            details?: Record<string, unknown>;
          }
        | undefined;

      const rawMsg = data?.message;
      const message = Array.isArray(rawMsg)
        ? rawMsg.join(', ')
        : rawMsg || error.message || 'Unknown network error';

      const isNetwork =
        !error.response ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        ErrorService.isRawNetworkError(message, data?.errorCode);

      const statusCode = error.response?.status || (isNetwork ? 0 : 500);
      const isServerCrash = !isNetwork && statusCode >= 500;

      const errorCode =
        data?.errorCode ||
        (isNetwork
          ? ErrorCode.NETWORK_ERROR
          : isServerCrash
            ? ErrorCode.INTERNAL_SERVER_ERROR
            : undefined);

      return {
        statusCode,
        errorCode,
        message,
        details: data?.details,
      };
    }

    if (error instanceof Error) {
      const isNetwork = ErrorService.isRawNetworkError(error.message);
      return {
        statusCode: isNetwork ? 0 : 500,
        errorCode: isNetwork
          ? ErrorCode.NETWORK_ERROR
          : ErrorCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }

    if (typeof error === 'string') {
      const isNetwork = ErrorService.isRawNetworkError(error);
      return {
        statusCode: isNetwork ? 0 : 400,
        errorCode: isNetwork ? ErrorCode.NETWORK_ERROR : undefined,
        message: error,
      };
    }

    return {
      statusCode: 500,
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
    };
  }

  /**
   * Centralized error handler that localizes the error using i18n and triggers a toast notification
   */
  static handle(error: unknown, options?: HandleErrorOptions): string {
    const { statusCode, errorCode, message, details } =
      ErrorService.extractErrorInfo(error);

    let localizedMessage = options?.customMessage;

    if (!localizedMessage) {
      if (errorCode) {
        // Look up translation in errors namespace
        const translation = i18n.t(`errors:${errorCode}`, {
          defaultValue: message,
          ...(details || {}),
        });
        localizedMessage =
          translation !== `errors:${errorCode}` ? translation : message;
      }

      // Safeguard: Never display raw technical error messages in the user toast
      if (
        !localizedMessage ||
        ErrorService.isRawNetworkError(localizedMessage, errorCode)
      ) {
        localizedMessage = i18n.t(`errors:${ErrorCode.NETWORK_ERROR}`, {
          defaultValue:
            'Network connection error. Please verify your internet connection.',
        });
      } else if (
        ErrorService.isRawServerError(localizedMessage, statusCode) ||
        localizedMessage.toLowerCase().includes('axioserror')
      ) {
        localizedMessage = i18n.t(`errors:${ErrorCode.INTERNAL_SERVER_ERROR}`, {
          defaultValue: 'A server error occurred. Please try again later.',
        });
      }
    }

    const isNetwork =
      errorCode === ErrorCode.NETWORK_ERROR ||
      ErrorService.isRawNetworkError(message, errorCode) ||
      ErrorService.isRawNetworkError(localizedMessage);

    if (isNetwork) {
      const now = Date.now();
      if (
        now - ErrorService.lastNetworkErrorTime <
        ErrorService.NETWORK_ERROR_THROTTLE_MS
      ) {
        // A network error toast was already shown recently; suppress concurrent duplicates
        return localizedMessage;
      }
      ErrorService.lastNetworkErrorTime = now;
    }

    if (!options?.silent) {
      toast.error(localizedMessage, {
        duration: options?.duration ?? 5000,
        title: options?.title,
      });
    }

    return localizedMessage;
  }

  /**
   * Centralized success handler that localizes the success code and triggers a success toast
   */
  static handleSuccess(
    codeOrMessage: SuccessCode | string,
    options?: {
      title?: string;
      duration?: number;
      params?: Record<string, string | number>;
    },
  ): string {
    const translation = i18n.t(`success:${codeOrMessage}`, {
      defaultValue: codeOrMessage,
      ...(options?.params || {}),
    });

    const localizedMessage =
      translation !== `success:${codeOrMessage}` ? translation : codeOrMessage;

    toast.success(localizedMessage, {
      duration: options?.duration ?? 4000,
      title: options?.title,
    });

    return localizedMessage;
  }
}
