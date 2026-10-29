import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Public Registration', () => {
  test('GET /public/registration/:token with invalid token returns error', async ({ request }) => {
    const response = await request.get('/api/public/registration/invalidtoken123456789');
    expect(response.status()).not.toBe(200);
  });

  test('GET /public/registration/:token with valid token returns link info', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.pc.identifier, TEST_USERS.pc.password);
    
    // Create a link first
    const createRes = await request.post('/api/registration-links', {
      headers: auth.authHeaders(tokens.accessToken),
      data: {
        title: `Public Test Link ${Date.now()}`,
        expiresInHours: 24,
      },
    });
    const createBody = await createRes.json();
    const token = createBody.data?.token;
    
    if (token) {
      const response = await request.get(`/api/public/registration/${token}`);
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    }
  });
});
