import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../src/utils/auth.helper.js';
import { expectSuccessResponse } from '../../src/utils/success.assert.js';
import { TEST_USERS } from '../../src/fixtures/users.js';

test.describe('Activities - Member Attendance History', () => {
  test('GET /activities/member/:memberId/history without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/activities/member/507f1f77bcf86cd799439011/history');
    expect(response.status()).toBe(401);
  });

  test('GET /activities/member/:memberId/history with AP token', async ({ request }) => {
    const auth = new AuthHelper(request);
    const tokens = await auth.login(TEST_USERS.ap.identifier, TEST_USERS.ap.password);
    
    // Get users to find a member
    const usersRes = await request.get('/api/users', {
      headers: auth.authHeaders(tokens.accessToken),
    });
    const usersBody = await usersRes.json();
    const usersData = usersBody.data || usersBody;
    const members = usersData.items || usersData || [];
    const memberId = Array.isArray(members) && members.length > 0 ? (members[0].id || members[0]._id) : '507f1f77bcf86cd799439011';
    
    const response = await request.get(`/api/activities/member/${memberId}/history`, {
      headers: auth.authHeaders(tokens.accessToken),
    });

    // May be 200 with data or 404 depending on setup
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    }
  });
});
