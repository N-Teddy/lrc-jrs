import { request } from '@playwright/test';
import { env } from '../config/env.js';
import { Logger } from '../utils/logger.js';

export async function getRequestContext() {
  Logger.log(`Using API base URL: ${env.API_BASE_URL}`);
  return await request.newContext({
    baseURL: env.API_BASE_URL,
    timeout: env.REQUEST_TIMEOUT_MS,
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  });
}
