import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectAppError } from '../../src/utils/error.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Users - CRUD Operations', () => {
  test('GET /users/:id without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/users/507f1f77bcf86cd799439011');
    expect(response.status()).toBe(401);
  });

  test('GET /users/:id with invalid id returns 404', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/users/507f1f77bcf86cd799439011', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    await expectAppError(response, { status: 404, errorCode: 'ERR_MEMBER_NOT_FOUND' });
  });

  test('PATCH /users/preferences/language with valid language', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.patch('/api/users/preferences/language', {
      headers: auth.authHeaders(tokens.accessToken),
      data: { language: 'fr' },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('PATCH /users/preferences/language without auth returns 401', async ({ request }) => {
    const response = await request.patch('/api/users/preferences/language', {
      data: { language: 'en' },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /users without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: {
        fullName: 'Test User',
        phoneNumber: '+237699999999',
        dateOfBirth: '2000-01-01',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('DELETE /users/:id as non-AP returns 403', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.member.identifier, TEST_USERS.member.password);
    
    const response = await request.delete('/api/users/507f1f77bcf86cd799439011', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    expect(response.status()).toBe(403);
  });
});
