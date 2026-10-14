import type { ApiErrorResponse, ApiResponse } from '@jrs/shared';
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { IStorageAdapter } from '../storage/storage.interface';
import { ApiError } from './api-error';

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

  public setBaseUrl(url: string): void {
    this.instance.defaults.baseURL = url.replace(/\/$/, '');
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
          const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

          if (originalRequest && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;
            try {
              const refreshToken =
                await this.storage.getItem('jrs_refresh_token');
              if (refreshToken) {
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
                  await this.storage.setItem(
                    'jrs_access_token',
                    newTokens.accessToken,
                  );
                  if (newTokens.refreshToken) {
                    await this.storage.setItem(
                      'jrs_refresh_token',
                      newTokens.refreshToken,
                    );
                  }

                  originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                  return this.instance(originalRequest);
                }
              }
            } catch {
              // Refresh token revoked or expired
            }
          }

          await this.storage.removeItem('jrs_access_token');
          await this.storage.removeItem('jrs_refresh_token');
          await this.storage.removeItem('jrs_user');
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
        }

        throw new ApiError(
          status || 500,
          errBody?.error || error.name || 'HttpError',
          errBody?.message || error.message || 'Unknown network error',
          errBody?.path,
        );
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
