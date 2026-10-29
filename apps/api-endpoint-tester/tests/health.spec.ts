import { test, expect } from '@playwright/test';
import { env } from '../src/config/env.js';

test('health endpoint is reachable', async ({ request }) => {
  const response = await request.get(env.HEALTH_PATH);
  
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
  
  const body = await response.json();
  expect(body).toBeDefined();
  expect(typeof body).toBe('object');
});
