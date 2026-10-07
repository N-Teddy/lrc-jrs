import type { ApiErrorResponse, ApiResponse } from '@jrs/shared';

export interface ClientConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string | string[],
    public readonly path?: string,
  ) {
    super(Array.isArray(message) ? message.join(', ') : message);
    this.name = 'ApiError';
  }
}

export class HttpClient {
  private baseUrl: string;
  private getToken?: () => string | null | Promise<string | null>;
  private onUnauthorized?: () => void;
  private activeTownId: string | null = null;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public setActiveTownId(townId: string | null): void {
    this.activeTownId = townId;
  }

  public getActiveTownId(): string | null {
    return this.activeTownId;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.getToken) {
      const token = await this.getToken();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    if (this.activeTownId && !headers.has('x-town-id')) {
      headers.set('x-town-id', this.activeTownId);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.onUnauthorized) {
      this.onUnauthorized();
    }

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const err = responseData as ApiErrorResponse | null;
      throw new ApiError(
        response.status,
        err?.error || response.statusText,
        err?.message || 'Unknown request failure',
        err?.path,
      );
    }

    const envelope = responseData as ApiResponse<T>;
    return envelope.data !== undefined ? envelope.data : (responseData as T);
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
