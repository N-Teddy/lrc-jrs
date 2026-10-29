import { expect, test } from '@playwright/test';
import { expectSuccessResponse } from '../../src/utils/success.assert.js';

test.describe('Towns', () => {
  test('GET /towns is public and returns towns', async ({ request }) => {
    const response = await request.get('/api/towns');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    // Public endpoint returns data wrapped by interceptor
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
