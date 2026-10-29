import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
const timeout = Number(process.env.REQUEST_TIMEOUT_MS) || 10000;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  timeout: 30000,
  expect: {
    timeout,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  projects: [
    {
      name: 'api',
    },
  ],
});
