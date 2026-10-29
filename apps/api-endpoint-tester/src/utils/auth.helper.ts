import { APIRequestContext, expect } from '@playwright/test';
import { env } from '../config/env.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  user?: any;
  requiresPasswordChange?: boolean;
  setupToken?: string;
}

export class AuthHelper {
  constructor(private request: APIRequestContext) {}

  async login(identifier: string, password: string): Promise<AuthTokens> {
    const response = await this.request.post('/api/auth/login', {
      data: { identifier, password },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const data = body.data || body;
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      requiresPasswordChange: data.requiresPasswordChange,
      setupToken: data.setupToken,
    };
  }

  authHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
}
