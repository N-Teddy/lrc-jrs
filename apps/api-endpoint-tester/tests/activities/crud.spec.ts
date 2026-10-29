import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectAppError } from '../../src/utils/error.assert.js';
import { expectSuccessResponse } from '../../src/utils/success.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Activities - CRUD', () => {
  test('GET /activities/:id without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/activities/507f1f77bcf86cd799439011');
    expect(response.status()).toBe(401);
  });

  test('GET /activities/:id with invalid id returns 404', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities/507f1f77bcf86cd799439011', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    expect([404]).toContain(response.status());
  });

  test('POST /activities without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/activities', {
      data: {
        title: 'Test Activity',
        activityType: 'MONTHLY_MEETING',
        startDate: '2026-12-01T10:00:00.000Z',
        townId: '507f1f77bcf86cd799439011',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /activities with missing fields returns validation error', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.post('/api/activities', {
      headers: auth.authHeaders(tokens.accessToken),
      data: {
        title: 'Test Activity',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('POST /activities with valid data creates activity (AP)', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    // Get towns
    const townsRes = await request.get('/api/towns');
    const townsBody = await townsRes.json();
    const towns = townsBody.data || townsBody || [];
    const townId = Array.isArray(towns) && towns.length > 0 ? (towns[0].id || towns[0]._id) : '507f1f77bcf86cd799439011';
    
    const response = await request.post('/api/activities', {
      headers: auth.authHeaders(tokens.accessToken),
      data: {
        title: `E2E Test Activity ${Date.now()}`,
        activityType: 'MONTHLY_MEETING',
        startDate: '2026-12-15T14:00:00.000Z',
        endDate: '2026-12-15T17:00:00.000Z',
        townId: townId,
        notes: 'Created by API endpoint tester',
      },
    });

    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.title).toContain('E2E Test Activity');
  });

  test('PATCH /activities/:id without auth returns 401', async ({ request }) => {
    const response = await request.patch('/api/activities/507f1f77bcf86cd799439011', {
      data: { notes: 'Updated' },
    });
    expect(response.status()).toBe(401);
  });

  test('DELETE /activities/:id without auth returns 401', async ({ request }) => {
    const response = await request.delete('/api/activities/507f1f77bcf86cd799439011');
    expect(response.status()).toBe(401);
  });
});
