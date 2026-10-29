import { expect } from '@playwright/test';

export interface AppErrorExpectation {
  status: number;
  errorCode?: string;
}

export async function expectAppError(response: any, expected: AppErrorExpectation) {
  expect(response.status()).toBe(expected.status);
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body).toHaveProperty('statusCode');
  expect(body).toHaveProperty('errorCode');
  expect(body).toHaveProperty('error');
  expect(body).toHaveProperty('message');
  expect(body).toHaveProperty('path');
  expect(body).toHaveProperty('timestamp');
  if (expected.errorCode) {
    expect(body.errorCode).toBe(expected.errorCode);
  }
  return body;
}
