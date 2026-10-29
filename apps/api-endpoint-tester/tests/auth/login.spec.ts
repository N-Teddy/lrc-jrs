import { test, expect } from '@playwright/test';
import { expectAppError } from '../../src/utils/error.assert.js';
import { expectSuccessResponse } from '../../src/utils/success.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Auth - Login', () => {
  test('login with valid credentials returns tokens and user', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        identifier: TEST_USERS.ap.identifier,
        password: TEST_USERS.ap.password,
      },
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
    expect(data).toHaveProperty('accessToken');
    expect(typeof data.accessToken).toBe('string');
    expect(data).toHaveProperty('refreshToken');
    expect(typeof data.refreshToken).toBe('string');
    expect(data).toHaveProperty('user');
    expect(typeof data.user).toBe('object');
    expect(data.user).toHaveProperty('id');
    expect(typeof data.user.id).toBe('string');
    expect(data.user).toHaveProperty('fullName');
    expect(data.user).toHaveProperty('role');
    expect(data.user).toHaveProperty('phoneNumber');
    expect(data.user).toHaveProperty('email');
    expect(data.user).toHaveProperty('account');
    expect(typeof data.user.account).toBe('object');
    expect(data).toHaveProperty('requiresPasswordChange');
    expect(data.requiresPasswordChange).toBe(false);
    expect(data).toHaveProperty('expiresIn');
    expect(typeof data.expiresIn).toBe('number');
  });

  test('login with invalid identifier returns ERR_AUTH_INVALID_CREDENTIALS', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        identifier: '999999999999',
        password: 'WrongPassword123!',
      },
    });

    await expectAppError(response, { status: 401, errorCode: 'ERR_AUTH_INVALID_CREDENTIALS' });
  });

  test('login with wrong password returns ERR_AUTH_INVALID_CREDENTIALS', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        identifier: TEST_USERS.ap.identifier,
        password: 'WrongPassword123!',
      },
    });

    await expectAppError(response, { status: 401, errorCode: 'ERR_AUTH_INVALID_CREDENTIALS' });
  });

  test('login with missing identifier returns validation error', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        password: 'SomePassword123!',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('login with missing password returns validation error', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        identifier: TEST_USERS.ap.identifier,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('login with short password returns validation error', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        identifier: TEST_USERS.ap.identifier,
        password: '12345',
      },
    });

    expect(response.status()).toBe(400);
  });
});
