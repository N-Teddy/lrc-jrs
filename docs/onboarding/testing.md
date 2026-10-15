# E2E Adversarial Testing Guide

> **Package:** `@jrs/e2e` (`apps/e2e/`)  
> **Philosophy:** Adversarial QA Testing — Actively hunt bugs, bypass attempts, and edge cases.

---

## 1. Overview & Objective

The `apps/e2e` package is a dedicated, isolated test suite designed to test the entire HTTP API surface of the NestJS backend under real-world and hostile conditions.

Rather than only verifying "happy paths", the test suite acts as an adversarial penetration tester to:
1. Detect unhandled `500 Internal Server Error` crashes.
2. Verify strict RBAC boundaries between roles (`AP`, `PC`, and `MEMBER`).
3. Ensure town hub jurisdiction rules cannot be bypassed.
4. Prevent data corruption from concurrent requests or race conditions.

---

## 2. Adversarial Test Suites

### 2.1 Authentication & Token Tampering (`auth.e2e-spec.ts`)
- **Tampered Signatures:** Sends JWTs with altered payloads or signed with invalid secrets. Verifies `401 Unauthorized`.
- **Expired Tokens:** Generates tokens with past `exp` timestamps. Verifies refusal.
- **Empty & Non-Bearer Authorization Headers:** Verifies clean `401` rejection with descriptive JSON error response.

### 2.2 Privilege Escalation & RBAC (`rbac.e2e-spec.ts`)
- **Member Accessing Administrative Endpoints:** A token with role `MEMBER` attempts to create an activity, initiate a member transfer, or revoke an account. Verifies `403 Forbidden`.
- **Cross-Town Scope Leaks:** A `PC` user scoped to Douala attempts to view or update members in Yaoundé. Verifies `403 Forbidden`.

### 2.3 Boundary & Fuzzing Inputs (`boundary.e2e-spec.ts`)
- **Youth Age Range Boundaries:** Submits registration with birthdates corresponding to age 17 and age 31. Verifies business validation error.
- **Malformed Cameroon Phone Numbers:** Sends numbers with invalid country codes, alphabetic characters, or invalid carrier prefixes. Verifies `400 Bad Request`.
- **SQL Injection & XSS Payloads:** Tests search filters with injection strings (`' OR 1=1 --`, `<script>alert(1)</script>`). Verifies proper parameterized queries and escaping.

### 2.4 Race Conditions & Idempotency (`concurrency.e2e-spec.ts`)
- **Concurrent Transfers:** Triggers two simultaneous relocation requests for the same member. Verifies only one succeeds and the ledger remains consistent.
- **Duplicate Attendance Marking:** Rapidly marks the same member as present multiple times for the same activity session. Verifies duplicate prevention.

---

## 3. Running E2E Tests

```bash
# Run the full E2E test suite
pnpm --filter @jrs/e2e test

# Run tests in watch mode during backend development
pnpm --filter @jrs/e2e test:watch
```

---

## 4. The Break-and-Fix Workflow

When an adversarial test fails or causes an unexpected 500 error:
1. **Identify the Gap:** Check if the failure is due to a missing guard, absent DTO validation decorator, or unhandled null condition.
2. **Patch the Server:** Apply the fix in `apps/server/src/`.
3. **Re-run the Suite:** Verify all tests pass with exit code `0`.
