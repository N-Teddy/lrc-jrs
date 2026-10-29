import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectSuccessResponse } from '../../src/utils/success.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Activities - Attendance', () => {
  test('GET /activities/:id/attendance without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/activities/507f1f77bcf86cd799439011/attendance');
    expect(response.status()).toBe(401);
  });

  test('GET /activities/:id/attendance for non-existent activity', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities/507f1f77bcf86cd799439011/attendance', {
      headers: auth.authHeaders(tokens.accessToken),
    });
    expect([404, 400]).toContain(response.status());
  });

  test('GET /activities/:id/attendance with existing activity', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    // Get an existing activity
    const activitiesRes = await request.get('/api/activities?limit=1', {
      headers: auth.authHeaders(tokens.accessToken),
    });
    const activitiesBody = await activitiesRes.json();
    const activitiesData = activitiesBody.data || activitiesBody;
    const items = activitiesData.items || [];
    
    if (items.length > 0) {
      const activityId = items[0].id;
      const response = await request.get(`/api/activities/${activityId}/attendance`, {
        headers: auth.authHeaders(tokens.accessToken),
      });
      const body = await expectSuccessResponse(response, { status: 200, hasData: true });
      expect(body.data).toBeDefined();
    }
  });

  test('POST /activities/:id/attendance without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/activities/507f1f77bcf86cd799439011/attendance', {
      data: { attendees: [] },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /activities/:id/attendance/lock without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/activities/507f1f77bcf86cd799439011/attendance/lock', {
      data: { reason: 'test' },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /activities/:id/attendance/unlock without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/activities/507f1f77bcf86cd799439011/attendance/unlock', {
      data: { reason: 'test' },
    });
    expect(response.status()).toBe(401);
  });
});
