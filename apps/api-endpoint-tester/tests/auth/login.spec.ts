import { test, expect } from '@playwright/test';
import { expectAppError } from '../../src/utils/error.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Auth - Login', () => {
  test('login with valid credentials returns tokens and user', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        identifier: TEST_USERS.ap.identifier,
        password: TEST_USERS.ap.password,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('accessToken');
    expect(body.data).toHaveProperty('refreshToken');
    expect(body.data).toHaveProperty('user');
    expect(body.data.requiresPasswordChange).toBe(false);
    expect(body.data.user).toHaveProperty('id');
    expect(body.data.user).toHaveProperty('role');
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
