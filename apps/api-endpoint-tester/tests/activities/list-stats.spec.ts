import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectAppError } from '../../src/utils/error.assert.js';
import { expectSuccessResponse, expectPaginationShape } from '../../src/utils/success.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Activities - List and Stats', () => {
  test('GET /activities without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/activities');
    expect(response.status()).toBe(401);
  });

  test('GET /activities with AP token returns paginated list', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expectPaginationShape(data);
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('GET /activities with pagination params', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities?page=1&limit=5', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expectPaginationShape(data);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(5);
  });

  test('GET /activities with year filter', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities?year=2026', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expectPaginationShape(data);
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('GET /activities with month filter', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities?year=2026&month=12', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expectPaginationShape(data);
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('GET /activities with activityType filter', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities?activityType=MONTHLY_MEETING', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expectPaginationShape(data);
  });

  test('GET /activities/stats without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/activities/stats');
    expect(response.status()).toBe(401);
  });

  test('GET /activities/stats with AP token returns stats', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities/stats', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    const data = body.data;
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
  });
});
