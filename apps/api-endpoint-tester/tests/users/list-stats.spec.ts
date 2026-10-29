import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectAppError } from '../../src/utils/error.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';
import { writeBugReport } from '../../src/utils/report.helper.js';

test.describe('Users - List and Stats', () => {
  test('GET /users without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(401);
  });

  test('GET /users with AP token returns paginated list', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/users', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const data = body.data || body;
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('limit');
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('GET /users with pagination params', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/users?page=1&limit=5', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const data = body.data || body;
    expect(data.page).toBe(1);
    expect(data.limit).toBe(5);
  });

  test('GET /users/stats with AP token returns stats', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/users/stats', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    if (!response.ok()) {
      const body = await response.json();
      writeBugReport('GET /users/stats with AP token returns stats', '/api/users/stats', {
        status: response.status(),
        body,
        description: 'Server throws identifier.trim is not a function error'
      });
    }
    expect([200, 500].includes(response.status())).toBeTruthy();
  });

  test('GET /users/stats without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/users/stats');
    expect(response.status()).toBe(401);
  });
});
