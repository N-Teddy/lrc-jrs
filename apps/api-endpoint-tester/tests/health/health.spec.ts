import { expect, test } from '@playwright/test';

test.describe('Health', () => {
  test('GET /api/health returns status ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.status).toBe('ok');
  });
});
