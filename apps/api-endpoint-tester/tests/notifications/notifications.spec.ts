import { expect, test } from '@playwright/test';
import { TEST_USERS } from '../../src/fixtures/users.js';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectSuccessResponse } from '../../src/utils/success.assert.js';

test.describe('Notifications', () => {
  test('GET /notifications without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/notifications');
    expect(response.status()).toBe(401);
  });

  test('GET /notifications with auth returns notifications', async ({
    request,
  }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(
      TEST_USERS.ap.identifier,
      TEST_USERS.ap.password,
    );

    const response = await request.get('/api/notifications', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, {
      status: 200,
      hasData: true,
    });
    const data = body.data;
    expect(data).toBeDefined();
  });

  test('GET /notifications/unread-count with auth', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(
      TEST_USERS.ap.identifier,
      TEST_USERS.ap.password,
    );

    const response = await request.get('/api/notifications/unread-count', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    const body = await expectSuccessResponse(response, {
      status: 200,
      hasData: true,
    });
    expect(body.data).toHaveProperty('unreadCount');
    expect(typeof body.data.unreadCount).toBe('number');
  });

  test('PATCH /notifications/mark-all-read with auth', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(
      TEST_USERS.ap.identifier,
      TEST_USERS.ap.password,
    );

    const response = await request.patch('/api/notifications/mark-all-read', {
      headers: auth.authHeaders(tokens.accessToken),
    });

    // Should be ok
    expect(response.ok()).toBeTruthy();
  });
});
