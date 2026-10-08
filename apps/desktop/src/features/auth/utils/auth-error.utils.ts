import { ApiError } from '@jrs/client-core';

/**
 * Extracts a readable error message safely from an unknown error rejection.
 */
export function extractAuthErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.',
): string {
  if (!error) return fallbackMessage;

  if (error instanceof ApiError) {
    return error.message || fallbackMessage;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeAxios = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (typeof maybeAxios.response?.data?.message === 'string') {
      return maybeAxios.response.data.message;
    }
    if (typeof maybeAxios.message === 'string' && maybeAxios.message.trim()) {
      return maybeAxios.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * Checks whether an error signifies a 403 Forbidden / revoked account condition.
 */
export function isAuthRevokedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const errObj = error as {
    statusCode?: number;
    status?: number;
    response?: { status?: number; data?: { message?: string } };
    message?: string;
  };

  const status = errObj.statusCode || errObj.status || errObj.response?.status;
  if (status === 403) return true;

  const msg = errObj.response?.data?.message || errObj.message || '';
  return String(msg).toLowerCase().includes('revoked');
}

/**
 * Checks whether an error signifies an expired temporary credentials condition.
 */
export function isAuthTempExpiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const errObj = error as {
    statusCode?: number;
    status?: number;
    response?: { status?: number; data?: { message?: string } };
    message?: string;
  };

  const status = errObj.statusCode || errObj.status || errObj.response?.status;
  const msg = errObj.response?.data?.message || errObj.message || '';

  return status === 401 && String(msg).toLowerCase().includes('expired');
}
