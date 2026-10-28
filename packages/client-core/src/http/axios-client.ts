import {
  type ApiErrorResponse,
  type ApiResponse,
  ErrorCode,
} from '@jrs/shared';
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ErrorService } from '../error/error.service';
import type { IStorageAdapter } from '../storage/storage.interface';
import { ApiError } from './api-error';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipToast?: boolean;
  }
}

export interface HttpServiceConfig {
  baseUrl: string;
  storage: IStorageAdapter;
  onUnauthorized?: () => void;
  getLanguage?: () => string;
}

export class HttpService {
  private instance: AxiosInstance;
  private activeTownId: string | null = null;
  private storage: IStorageAdapter;
  private onUnauthorized?: () => void;
  private getLanguage?: () => string;

  private refreshPromise: Promise<string | null> | null = null;
  private unauthorizedListeners: Set<() => void> = new Set();
  private tokenRefreshedListeners: Set<(token: string) => void> = new Set();

  constructor(config: HttpServiceConfig) {
    this.storage = config.storage;
    this.onUnauthorized = config.onUnauthorized;
    this.getLanguage = config.getLanguage;

    this.instance = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''),
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public getStorage(): IStorageAdapter {
    return this.storage;
  }

  public onUnauthorizedEvent(listener: () => void): () => void {
    this.unauthorizedListeners.add(listener);
    return () => {
      this.unauthorizedListeners.delete(listener);
    };
  }

  public onTokenRefreshed(listener: (token: string) => void): () => void {
    this.tokenRefreshedListeners.add(listener);
    return () => {
      this.tokenRefreshedListeners.delete(listener);
    };
  }

  public notifyUnauthorized(): void {
    if (this.onUnauthorized) {
      try {
        this.onUnauthorized();
      } catch {
        // ignore
      }
    }
    for (const listener of this.unauthorizedListeners) {
      try {
        listener();
      } catch {
        // ignore
      }
    }
  }

  public async refreshToken(): Promise<string | null> {
    return this.executeTokenRefresh();
  }

  private async executeTokenRefresh(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await this.storage.getItem('jrs_refresh_token');
        if (!refreshToken) {
          return null;
        }

        const refreshRes = await axios.post<{
          success: boolean;
          data?: { accessToken: string; refreshToken: string };
        }>(
          `${this.instance.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const newTokens = refreshRes.data?.data;
        if (newTokens?.accessToken) {
          await this.storage.setItem('jrs_access_token', newTokens.accessToken);
          if (newTokens.refreshToken) {
            await this.storage.setItem(
              'jrs_refresh_token',
              newTokens.refreshToken,
            );
          }
          for (const listener of this.tokenRefreshedListeners) {
            try {
              listener(newTokens.accessToken);
            } catch {
              // ignore
            }
          }
          return newTokens.accessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public setBaseUrl(url: string): void {
    this.instance.defaults.baseURL = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.instance.defaults.baseURL || '';
  }

  public setActiveTownId(townId: string | null): void {
    this.activeTownId = townId;
  }

  public getActiveTownId(): string | null {
    return this.activeTownId;
  }

  private setupInterceptors(): void {
    // Request Interceptor: Attach Token, Town ID, Language
    this.instance.interceptors.request.use(
      async (reqConfig: InternalAxiosRequestConfig) => {
        // Read auth token from storage
        const token = await this.storage.getItem('jrs_access_token');
        if (token && !reqConfig.headers.Authorization) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }

        // Attach Active Town context header
        if (this.activeTownId && !reqConfig.headers['x-town-id']) {
          reqConfig.headers['x-town-id'] = this.activeTownId;
        }

        // Attach Language header
        if (this.getLanguage && !reqConfig.headers['Accept-Language']) {
          reqConfig.headers['Accept-Language'] = this.getLanguage();
        }

        // Allow browser / axios to automatically set multipart/form-data boundary when sending FormData
        if (
          typeof FormData !== 'undefined' &&
          reqConfig.data instanceof FormData
        ) {
          delete reqConfig.headers['Content-Type'];
        }

        return reqConfig;
      },
      (error) => Promise.reject(error),
    );

    // Response Interceptor: Unwrap standardized ApiResponse and catch 401s
    this.instance.interceptors.response.use(
      (response) => {
        const body = response.data as ApiResponse<unknown>;
        // If wrapped in our standard backend envelope, unwrap the data
        if (
          body &&
          typeof body === 'object' &&
          body.success === true &&
          'data' in body
        ) {
          return body.data as never;
        }
        return response.data;
      },
      async (error) => {
        const status = error.response?.status;
        const errBody = error.response?.data as ApiErrorResponse | undefined;

        if (status === 401) {
          const originalRequest = error.config;
          const url = originalRequest?.url || '';

          // Only unauthenticated entry endpoints should bypass token refresh
          const isPublicAuthEndpoint =
            url.includes('/auth/login') ||
            url.includes('/auth/refresh') ||
            url.includes('/auth/forgot-password') ||
            url.includes('/auth/verify-reset-code') ||
            url.includes('/auth/reset-password') ||
            url.includes('/auth/complete-setup');

          // If the failed endpoint is an unauthenticated entry endpoint (e.g. invalid login password),
          // do NOT attempt refresh and do NOT treat it as a session termination.
          if (isPublicAuthEndpoint) {
            const isNetworkErr =
              !error.response ||
              error.code === 'ERR_NETWORK' ||
              error.code === 'ECONNABORTED' ||
              error.code === 'ETIMEDOUT' ||
              (error.message &&
                (error.message.toLowerCase().includes('network') ||
                  error.message.toLowerCase().includes('timeout') ||
                  error.message.toLowerCase().includes('failed to fetch')));

            const resolvedErrorCode =
              errBody?.errorCode ||
              (isNetworkErr
                ? ErrorCode.NETWORK_ERROR
                : status && status >= 500
                  ? ErrorCode.INTERNAL_SERVER_ERROR
                  : undefined);

            const apiError = new ApiError(
              status || (isNetworkErr ? 0 : 500),
              errBody?.error || error.name || 'HttpError',
              errBody?.message || error.message || 'Unknown network error',
              errBody?.path,
              resolvedErrorCode,
              errBody?.details,
            );
            if (!originalRequest?.skipToast) {
              ErrorService.handle(apiError);
            }
            throw apiError;
          }

          if (originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            const newAccessToken = await this.executeTokenRefresh();
            if (newAccessToken) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.instance(originalRequest);
            }
          }

          // If refresh failed or already retried on a protected route:
          // Session is officially terminated.
          await this.storage.removeItem('jrs_access_token');
          await this.storage.removeItem('jrs_refresh_token');
          await this.storage.removeItem('jrs_user');
          this.notifyUnauthorized();
        }

        const isNetworkErr =
          !error.response ||
          error.code === 'ERR_NETWORK' ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT' ||
          (error.message &&
            (error.message.toLowerCase().includes('network') ||
              error.message.toLowerCase().includes('timeout') ||
              error.message.toLowerCase().includes('failed to fetch')));

        const resolvedErrorCode =
          errBody?.errorCode ||
          (isNetworkErr
            ? ErrorCode.NETWORK_ERROR
            : status && status >= 500
              ? ErrorCode.INTERNAL_SERVER_ERROR
              : undefined);

        const apiError = new ApiError(
          status || (isNetworkErr ? 0 : 500),
          errBody?.error || error.name || 'HttpError',
          errBody?.message || error.message || 'Unknown network error',
          errBody?.path,
          resolvedErrorCode,
          errBody?.details,
        );

        if (!error.config?.skipToast) {
          ErrorService.handle(apiError);
        }

        throw apiError;
      },
    );
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config) as unknown as Promise<T>;
  }

  public post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.post(url, data, config) as unknown as Promise<T>;
  }

  public put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.put(url, data, config) as unknown as Promise<T>;
  }

  public patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.patch(url, data, config) as unknown as Promise<T>;
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config) as unknown as Promise<T>;
  }
}
