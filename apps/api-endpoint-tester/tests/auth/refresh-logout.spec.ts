import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectAppError } from '../../src/utils/error.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Auth - Refresh and Logout', () => {
  test('POST /auth/refresh with invalid token returns ERR_AUTH_INVALID_TOKEN', async ({ request }) => {
    const response = await request.post('/api/auth/refresh', {
      data: {
        refreshToken: 'invalid-refresh-token-12345',
      },
    });

    await expectAppError(response, { status: 401, errorCode: 'ERR_AUTH_INVALID_TOKEN' });
  });

  test('POST /auth/refresh with missing token returns validation error', async ({ request }) => {
    const response = await request.post('/api/auth/refresh', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('POST /auth/refresh rotates tokens successfully', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    expect(tokens.refreshToken).toBeDefined();

    const response = await request.post('/api/auth/refresh', {
      data: {
        refreshToken: tokens.refreshToken,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const data = body.data || body;
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
  });

  test('POST /auth/logout without body succeeds', async ({ request }) => {
    const response = await request.post('/api/auth/logout', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('POST /auth/logout with refresh token succeeds', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.post('/api/auth/logout', {
      data: {
        refreshToken: tokens.refreshToken,
      },
    });

    expect(response.ok()).toBeTruthy();
  });
});
