import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectAppError } from '../../src/utils/error.assert.js';
import { expectSuccessResponse, expectUserShape } from '../../src/utils/success.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Auth - Protected endpoints', () => {
  test('GET /auth/me without token returns 401', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect(response.status()).toBe(401);
  });

  test('GET /auth/me with valid token returns user profile', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/auth/me', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expectUserShape(data);
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('homeTownId');
    expect(data).toHaveProperty('isActivePC');
  });

  test('POST /auth/change-password without token returns 401', async ({ request }) => {
    const response = await request.post('/api/auth/change-password', {
      data: {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /auth/change-password with wrong current password returns ERR_AUTH_CURRENT_PASSWORD_INCORRECT', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.post('/api/auth/change-password', {
      headers: auth.authHeaders(tokens.accessToken),
      data: {
        currentPassword: 'WrongOldPassword123!',
        newPassword: 'NewPassword123!',
      },
    });

    await expectAppError(response, { status: 400, errorCode: 'ERR_AUTH_CURRENT_PASSWORD_INCORRECT' });
  });

  test('POST /auth/change-password with short new password returns validation error', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.post('/api/auth/change-password', {
      headers: auth.authHeaders(tokens.accessToken),
      data: {
        currentPassword: TEST_USERS.ap.password,
        newPassword: 'short',
      },
    });

    expect(response.status()).toBe(400);
  });
});
