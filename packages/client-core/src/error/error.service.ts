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
  /**
   * Extract normalized error code, message, and details from any error object
   */
  static extractErrorInfo(error: unknown): ExtractedErrorInfo {
    if (error instanceof ApiError) {
      return {
        statusCode: error.statusCode,
        errorCode: error.errorCode,
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

      return {
        statusCode: error.response?.status || 500,
        errorCode:
          data?.errorCode ||
          (error.code === 'ERR_NETWORK' ? ErrorCode.NETWORK_ERROR : undefined),
        message,
        details: data?.details,
      };
    }

    if (error instanceof Error) {
      return {
        statusCode: 500,
        message: error.message,
      };
    }

    if (typeof error === 'string') {
      return {
        statusCode: 400,
        message: error,
      };
    }

    return {
      statusCode: 500,
      message: 'An unexpected error occurred',
    };
  }

  /**
   * Centralized error handler that localizes the error using i18n and triggers a toast notification
   */
  static handle(error: unknown, options?: HandleErrorOptions): string {
    const { errorCode, message, details } =
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
      } else {
        localizedMessage = message;
      }
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
