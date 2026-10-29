import { test, expect } from '@playwright/test';
import { expectAppError } from '../../src/utils/error.assert.js';
import { expectSuccessResponse } from '../../src/utils/success.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Auth - Password Reset Flow', () => {
  test('POST /auth/forgot-password with valid identifier returns success (anti-enumeration)', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: {
        identifier: TEST_USERS.ap.identifier,
      },
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expect(data).toHaveProperty('sent');
    expect(typeof data.sent).toBe('boolean');
    expect(data).toHaveProperty('message');
    expect(typeof data.message).toBe('string');
  });

  test('POST /auth/forgot-password with non-existent identifier returns same success (anti-enumeration)', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: {
        identifier: '000000000000',
      },
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expect(data).toHaveProperty('sent');
    expect(typeof data.sent).toBe('boolean');
  });

  test('POST /auth/forgot-password with missing identifier returns validation error', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('POST /auth/verify-reset-code with non-existent user returns ERR_AUTH_INVALID_VERIFICATION_CODE', async ({ request }) => {
    const response = await request.post('/api/auth/verify-reset-code', {
      data: {
        identifier: '000000000000',
        code: '123456',
      },
    });

    await expectAppError(response, { status: 400, errorCode: 'ERR_AUTH_INVALID_VERIFICATION_CODE' });
  });

  test('POST /auth/verify-reset-code with invalid code format returns validation error', async ({ request }) => {
    const response = await request.post('/api/auth/verify-reset-code', {
      data: {
        identifier: TEST_USERS.ap.identifier,
        code: '123',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('POST /auth/reset-password with invalid token returns ERR_AUTH_RESET_SESSION_INVALID', async ({ request }) => {
    const response = await request.post('/api/auth/reset-password', {
      data: {
        resetToken: 'invalid-reset-token',
        newPassword: 'NewPassword123!',
      },
    });

    await expectAppError(response, { status: 400, errorCode: 'ERR_AUTH_RESET_SESSION_INVALID' });
  });

  test('POST /auth/reset-password with short password returns validation error', async ({ request }) => {
    const response = await request.post('/api/auth/reset-password', {
      data: {
        resetToken: 'some-token',
        newPassword: 'short',
      },
    });

    expect(response.status()).toBe(400);
  });
});
