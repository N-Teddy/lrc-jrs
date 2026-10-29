import { expect } from '@playwright/test';

export interface SuccessResponseExpectation {
  status?: number;
  hasData?: boolean;
  hasMeta?: boolean;
  checkData?: boolean;
}

export async function expectSuccessResponse(response: any, expected: SuccessResponseExpectation = {}) {
  const status = expected.status ?? 200;
  expect(response.status()).toBe(status);
  
  const body = await response.json();
  
  expect(body).toHaveProperty('success');
  expect(body.success).toBe(true);
  expect(body).toHaveProperty('statusCode');
  expect(body.statusCode).toBe(status);
  expect(body).toHaveProperty('message');
  expect(typeof body.message).toBe('string');
  expect(body).toHaveProperty('timestamp');
  expect(typeof body.timestamp).toBe('string');
  
  if (expected.hasData !== false) {
    expect(body).toHaveProperty('data');
  }
  
  if (expected.hasMeta) {
    expect(body).toHaveProperty('meta');
  }
  
  return body;
}

export function expectUserShape(user: any) {
  expect(user).toBeDefined();
  expect(typeof user).toBe('object');
  expect(user).toHaveProperty('id');
  expect(typeof user.id).toBe('string');
  expect(user).toHaveProperty('fullName');
  expect(typeof user.fullName).toBe('string');
  expect(user).toHaveProperty('role');
  expect(typeof user.role).toBe('string');
  expect(user).toHaveProperty('phoneNumber');
  expect(user).toHaveProperty('account');
  expect(typeof user.account).toBe('object');
}

export function expectPaginationShape(data: any) {
  expect(data).toHaveProperty('items');
  expect(Array.isArray(data.items)).toBe(true);
  expect(data).toHaveProperty('total');
  expect(typeof data.total).toBe('number');
  expect(data).toHaveProperty('page');
  expect(typeof data.page).toBe('number');
  expect(data).toHaveProperty('limit');
  expect(typeof data.limit).toBe('number');
  expect(data).toHaveProperty('totalPages');
  expect(typeof data.totalPages).toBe('number');
}

export function expectMemberShape(member: any) {
  expect(member).toBeDefined();
  expect(typeof member).toBe('object');
  expect(member).toHaveProperty('id');
  expect(typeof member.id).toBe('string');
  expect(member).toHaveProperty('fullName');
  expect(typeof member.fullName).toBe('string');
  expect(member).toHaveProperty('phoneNumber');
  expect(member).toHaveProperty('role');
  expect(member).toHaveProperty('homeTownId');
}
