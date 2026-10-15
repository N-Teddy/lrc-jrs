# JULES.md — Master Autonomous Development & QA Directive

> **Repository:** LRC JRS Monorepo  
> **Author & Project Owner Directive**  
> **Target Agent:** Google Jules (Autonomous Engineering Agent)  
> **Primary Rule:** Strict execution according to this document. Do not deviate, drift, or skip verification steps.

---

## 1. Prime Directives & Non-Negotiable Quality Gates

### 1.1 Strict Zero `any` & No Unused Code Policy
- **No `any` types allowed anywhere in the monorepo.** The use of `any`, `unknown as any`, or implicit `any` is strictly prohibited. If a type is complex, define a proper generic, interface, or union type in `@jrs/shared` or in the feature's `types/` directory.
- **No unused variables, parameters, or imports.** Any unused variable, function, or imported symbol must be removed.
- **Enforcement:** No commit is permitted if `pnpm check-types` or `pnpm biome check` fails.

### 1.2 Scratch & Temporary File Cleanup (Zero Footprint)
- **Do not commit scratch files.** When writing temporary helper scripts, probe files, or test scratchpads (e.g., `temp.js`, `scratch.js`, `test.js`, `debug.ts`), you **must delete them** prior to staging changes.
- Before every single commit, run `git status --porcelain`. If any uncommitted temporary script exists, delete it immediately. The repository history must stay clean and professional.

### 1.3 Atomic Milestone Commits
- Do not accumulate a massive single diff.
- Organise work so that after **each major milestone**, you run the linters, type checks, and commit your work using [Conventional Commits](https://www.conventionalcommits.org/):
  - `refactor(desktop): extract presentation components from ActivityDetailPage`
  - `fix(i18n): remove pastoral terminology and fix AP/PC labels`
  - `docs(onboarding): add developer guides for server and desktop`
  - `test(e2e): setup apps/e2e adversarial endpoint suite`

### 1.4 Strict Task Order
Execute tasks in this exact sequence:
1. **Terminology & i18n Normalization** (Remove pastoral terms, fix AP/PC role labels, ensure `t()` coverage).
2. **Frontend Component & Logic Separation** (Extract inline UI into dumb components, headless hooks, pure utils).
3. **Developer Documentation & Onboarding Guides** (`docs/onboarding/` and professional `README.md`).
4. **Adversarial E2E Testing App** (Create `apps/e2e` as the **FINAL task**, run adversarial tests, and fix all discovered issues).

---

## 2. Terminology & i18n Standards (Crucial)

### 2.1 Remove Inaccurate AP & PC Role Expansions
- **Do NOT expand AP or PC.** In several places, AP has been erroneously expanded as "Apostolic Prefect" or "Principal Coordinator", and PC as "Parish Coordinator" or "Contact Person".
- **Rule:** Remove all text in brackets and expansions. AP must simply be displayed as **AP**, and PC must simply be displayed as **PC**.
  - Incorrect: `Apostolic Prefect (AP)` or `Parish Coordinator (PC)`
  - Correct: `AP` and `PC`

### 2.2 Eliminate Pastoral / Church Terminology
The application is a modern youth fellowship community platform. Replace all pastoral and ecclesiastical jargon with clean, standardized community and administrative terminology across all UI text, code comments, and translation files (`en.json` and `fr.json`):

| Deprecated Pastoral Term | Replacement Professional Term |
| :--- | :--- |
| *Sanctuary Origin / Mother Sanctuary* | **Origin Hub** or **Home Hub** |
| *Current Resident Seat* | **Current Hub** |
| *Canonical Relocation Ledger* | **Hub Transfer Ledger** or **Transfer Ledger** |
| *Pastoral Reason / Pastoral Notes* | **Relocation Reason** / **Transfer Notes** |
| *Canonical Enrollment* | **Official Enrollment** or **Registry Enrollment** |
| *Canonical JR Age (18–30)* | **Youth Age Range (18–30)** |
| *Canonical Guidelines* | **Community Guidelines** |
| *Diocesan Scope / All Diocesan* | **All Hubs Scope** / **Inter-Hub** |
| *Deanery Roll* | **Registry Index** |
| *Officiating coordinator stamp* | **Authorized Coordinator Stamp** |
| *Pastoral Agenda* | **Activity Agenda** / **Program Notes** |

### 2.3 100% Translation Coverage (French & English)
- Every single visible text element in `@jrs/desktop` and `@jrs/mobile` must use `useTranslation()` (`t('namespace:key')`).
- Absolutely no hardcoded English or French text in JSX/TSX.
- Always provide matching keys in both `packages/client-core/src/i18n/locales/en.json` and `fr.json`.

---

## 3. Frontend Architecture: Strict 4-Layer Separation

### 3.1 Purity of Files (No Inline UI inside Coordinators)
- Any file that coordinates a feature or manages state must **never contain inline UI trees** or large embedded sub-components.
- Large monolithic views (e.g. `ActivityDetailPage.tsx`, `ActivityAttendanceRoster.tsx`, `DriveExplorerFeature.tsx`) must be refactored into distinct, modular files.

### 3.2 The 4-Layer Directory Standard
Every feature in `apps/desktop/src/features/<feature>/` or `apps/mobile/src/features/<feature>/` must follow this structure:

```
features/<feature-name>/
├── types/
│   └── <feature>.types.ts          # Layer 1: Strict props interfaces, State types, Enums
├── utils/
│   └── <feature>-ui.utils.ts       # Layer 2: 100% Pure functions (one job, zero side-effects)
├── hooks/
│   └── use<Feature>Workspace.ts    # Layer 3: Headless React Hook (100% JS logic, queries, actions)
├── components/                     # Layer 4: Pure Presentational "Dumb" Components
│   ├── <Feature>TableView.tsx
│   ├── <Feature>CardGridView.tsx
│   ├── <Feature>FilterToolbar.tsx
│   └── modals/
│       └── <Feature>ActionModal.tsx
└── <Feature>Feature.tsx            # Clean Root Coordinator (Assembles Hook + Components)
```

#### Layer Rules:
1. **`types/`**: Defines explicit TypeScript interfaces for every component prop and state. No inline object types in components.
2. **`utils/`**: Functions must be pure mathematical or formatting functions (e.g., date formatting, telephone standardization, badge color resolution, search filtering). They must never call React hooks or make network calls.
3. **`hooks/`**: A headless hook that encapsulates all queries (`useQuery`), mutations (`useMutation`), state, pagination, sorting, and user event handlers. It returns a clean, typed API object.
4. **`components/`**: Pure presentational views. They receive props and emit callback events (`onPageChange`, `onSelect`, `onSubmit`). They contain zero direct API fetching logic.

---

## 4. Backend Standards (NestJS / Prisma)

1. **Layered Flow:** Controller $\rightarrow$ Service $\rightarrow$ Prisma.
2. **DTO Strictness:** All incoming request bodies must use DTO classes decorated with `class-validator` (`@IsString()`, `@IsUUID()`, `@IsOptional()`, etc.).
3. **Authorization & RBAC:**
   - Every controller must be guarded with `@UseGuards(JwtAuthGuard, RolesGuard)`.
   - Public endpoints (like file streams or health checks) must explicitly use the `@Public()` metadata decorator.
   - Hub jurisdiction must be validated: Users with role `PC` or `MEMBER` cannot manipulate or view records outside their authorized hub IDs (`allowedReadTownIds`). Only `AP` has global diocesan-wide access.
4. **Streaming for Large Files:** Never buffer large files (Google Drive exports, PDFs) entirely in memory. Stream them directly through the NestJS `Response` object using pipes.

---

## 5. Developer Onboarding Guides & Professional Documentation

Jules must create a dedicated `docs/onboarding/` directory with comprehensive, beautifully formatted Markdown guides:

1. **`docs/onboarding/overview.md`**:
   - Monorepo structure (Turborepo + pnpm workspaces).
   - Package dependency graph (`@jrs/shared` $\rightarrow$ `@jrs/api-client` $\rightarrow$ `@jrs/client-core` $\rightarrow$ Apps).
   - Prerequisites (Node.js $\ge 22$, pnpm $\ge 10$, Docker, Rust for Tauri).
   - Environment variables setup (`.env.example`).
2. **`docs/onboarding/server.md`**:
   - NestJS architecture, modules, and guards.
   - Prisma schema, PostgreSQL setup, and migrations (`pnpm prisma migrate dev`).
   - Google Drive Service Account integration and file streaming.
   - Notification strategy (WhatsApp / Maildev).
3. **`docs/onboarding/desktop.md`**:
   - Tauri v2 architecture + React frontend.
   - Linux WebKitGTK and Chromium graphics flags (`WEBKIT_DISABLE_DMABUF_RENDERER=1`).
   - Native Canvas PDF rendering via `pdfjs-dist`.
   - Biome linter configuration and pre-commit checks.
4. **`docs/onboarding/mobile.md`**:
   - React Native & Expo architecture.
   - Reusing `@jrs/client-core` hooks and `@jrs/shared` types.
   - Mobile styling patterns and platform-specific guidelines.
5. **`docs/onboarding/testing.md`**:
   - How to run and extend the E2E test suite.
   - Mocking authentication and test database teardown.
6. **Root `README.md` Modernization**:
   - Completely replace the default Turborepo starter template with a GitHub-ready, professional README containing badges, architecture overview, quickstart instructions, package table, and development workflows.

---

## 6. FINAL TASK: Adversarial E2E Testing App (`apps/e2e`)

> **IMPORTANT:** This must be performed as the **LAST task** after all refactoring, cleanup, and documentation are complete.

### 6.1 Package Architecture
Create a dedicated application in `apps/e2e`:
- Add package to `pnpm-workspace.yaml` as `@jrs/e2e`.
- Configure test runner (Vitest or Jest) with Supertest to execute real HTTP requests against the NestJS backend.
- Include a test database or transactional rollback fixture so tests are 100% reproducible and isolated.

### 6.2 The "Adversarial QA Tester" Mindset
Do not write trivial "happy path only" tests. You must think like an adversarial QA engineer attempting to exploit, bypass, and break the API endpoints:

#### Test Matrix Requirements:
1. **Authentication & Token Tampering:**
   - Attempt requests with expired JWTs, malformed signatures, empty Bearer headers.
   - Attempt privilege escalation: Use a `MEMBER` token on endpoints requiring `AP` or `PC`. Verify strictly returns `403 Forbidden`.
2. **Boundary & Malformed Inputs:**
   - Members registry: Submit birthdates outside youth range (age 17 or age 31). Verify rejection.
   - Submit malformed Cameroon phone numbers (invalid prefix, letters, too short/long). Verify `400 Bad Request`.
   - Submit oversized payloads, XSS strings (`<script>alert(1)</script>`), and SQL injection patterns in search parameters.
3. **Town Scopes & Hub Jurisdiction:**
   - Use a `PC` token scoped to "Town A" to view, edit, or transfer members belonging to "Town B". Verify strictly blocked with `403 Forbidden`.
4. **Concurrency & Race Conditions:**
   - Double-transfer attempts: Trigger two simultaneous relocation requests for the same member. Ensure idempotency and ledger integrity.
   - Double-attendance marking: Concurrently mark the same member as present multiple times for the same activity. Ensure no duplicate records.
5. **File Streaming & Drive Integration:**
   - Test `GET /api/activities/report/drive-file/:fileId/stream` with nonexistent file IDs. Ensure it responds with a clean `404 Not Found` JSON, never an unhandled 500 server crash.

### 6.3 The Break-and-Fix Loop
- When an adversarial test reveals an unhandled `500 Internal Server Error`, missing validation, or security leak:
  1. Diagnose the root cause in `apps/server/src/`.
  2. Implement proper validation, exception filters, or guards.
  3. Re-run the test suite until **100% of tests pass cleanly**.
  4. Commit the fixes and test suites.

---

## 7. Mandatory Verification Checklist Before Any PR

Before Jules finishes and opens a PR, execute and confirm:

```bash
# 1. Zero scratch files
git status --porcelain # Must NOT contain any temporary scripts or untracked .js files

# 2. Strict Biome Linting & Formatting
pnpm biome check --write

# 3. Monorepo TypeScript Compiler Check (0 errors, 0 warnings, 0 any)
pnpm check-types

# 4. E2E Test Suite Execution
pnpm --filter @jrs/e2e test
```

When all 4 commands exit with code `0`, the Pull Request may be submitted.
