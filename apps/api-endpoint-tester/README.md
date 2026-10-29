# API Endpoint Tester

Black-box HTTP endpoint tester for the JRS API. This app hits a running `apps/server` instance over HTTP and is completely separate from Nest's in-memory test suite.

## Setup

1. Copy `.env.example` to `.env` and set `API_BASE_URL`
2. Install dependencies from monorepo root: `pnpm install`
3. Start the server: `pnpm server` (or `pnpm backend`)
4. Run health check: `pnpm --filter @jrs/api-endpoint-tester test:health`

## Scripts

- `pnpm test` - Run all tests
- `pnpm test:health` - Run only the health endpoint test
- `pnpm test:setup` - Alias for health test
- `pnpm codegen` - Playwright codegen
- `pnpm report` - Open HTML report
