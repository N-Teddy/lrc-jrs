import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectSuccessResponse } from '../../src/utils/success.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Activities - Reports and Reminders', () => {
  test('GET /activities/reminder-templates without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/activities/reminder-templates');
    expect(response.status()).toBe(401);
  });

  test('GET /activities/reminder-templates with auth returns templates', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities/reminder-templates', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, { status: 200, hasData: true });
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /activities/report/folders with auth', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities/report/folders', {
      headers: auth.authHeaders(tokens.accessToken),
    });
    // May succeed or fail depending on Google Drive config, but should be authenticated
    expect(response.status()).not.toBe(401);
  });

  test('GET /activities/report/drive-files with auth', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    const response = await request.get('/api/activities/report/drive-files', {
      headers: auth.authHeaders(tokens.accessToken),
    });
    expect(response.status()).not.toBe(401);
  });
});
