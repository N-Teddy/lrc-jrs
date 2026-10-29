import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectSuccessResponse } from '../../src/utils/success.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Registration Links - Protected', () => {
  test('GET /registration-links without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/registration-links');
    expect(response.status()).toBe(401);
  });

  test('POST /registration-links without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/registration-links', {
      data: { title: 'Test Link' },
    });
    expect(response.status()).toBe(401);
  });

  test('GET /registration-links with PC token returns list', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.pc.identifier, TEST_USERS.pc.password);
    
    const response = await request.get('/api/registration-links', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('POST /registration-links with PC token creates link', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.pc.identifier, TEST_USERS.pc.password);
    
    const response = await request.post('/api/registration-links', {
      headers: auth.authHeaders(tokens.accessToken),
      data: {
        title: `E2E Reg Link ${Date.now()}`,
        expiresInHours: 72,
        maxUses: 10,
        customMessage: 'Welcome to registration',
      },
    });

    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data).toHaveProperty('token');
    expect(body.data).toHaveProperty('expiresAt');
  });

  test('GET /registration-links/pending-reviews with PC token', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.pc.identifier, TEST_USERS.pc.password);
    
    const response = await request.get('/api/registration-links/pending-reviews', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    expect(Array.isArray(body.data)).toBe(true);
  });
});
