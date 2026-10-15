# Monorepo Onboarding & Architecture Overview

Welcome to the **LRC JRS** monorepo. This guide provides an end-to-end overview of the repository structure, architecture patterns, development workflows, and toolchains.

---

## 1. Monorepo Structure

This project uses **Turborepo** with **pnpm workspaces** to manage applications and shared packages efficiently.

```
jrs/
├── apps/
│   ├── desktop/         # Tauri v2 + React desktop application
│   ├── mobile/          # Expo / React Native mobile application
│   ├── server/          # NestJS backend API with Mongoose ODM & MongoDB
│   └── e2e/             # Dedicated end-to-end adversarial API test suite
│
├── packages/
│   ├── shared/          # Universal TypeScript interfaces, DTOs, Enums, and constants
│   ├── api-client/      # Strongly-typed HTTP API client SDK
│   └── client-core/     # Reusable React Query hooks, authentication context, and i18n
│
├── docs/
│   └── onboarding/      # Detailed developer guides for server, desktop, mobile, and testing
│
├── JULES.md             # Autonomous agent instructions & QA standards
├── package.json         # Root package scripts and dependencies
├── pnpm-workspace.yaml  # Workspace package definitions
└── turbo.json           # Turborepo task pipeline configuration
```

---

## 2. Dependency Flow

The monorepo follows a strict unidirectional dependency graph to prevent circular references and contract drift:

```
                ┌───────────────┐
                │  @jrs/shared  │ (Types, Enums, DTOs)
                └───────┬───────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│   @jrs/server    │          │ @jrs/api-client  │
└──────────────────┘          └────────┬─────────┘
                                       ▼
                              ┌──────────────────┐
                              │ @jrs/client-core │ (Hooks, i18n, Auth)
                              └────────┬─────────┘
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
               ┌──────────────────┐          ┌──────────────────┐
               │   @jrs/desktop   │          │   @jrs/mobile    │
               └──────────────────┘          └──────────────────┘
```

---

## 3. Prerequisites & Environment Setup

Ensure you have the following installed on your development machine:

- **Node.js**: `v22.0.0` or higher
- **pnpm**: `v10.0.0` or higher (`corepack enable pnpm`)
- **MongoDB**: Local MongoDB instance running on `localhost:27017`
- **Maildev**: Local email testing server on port 1025 / 1080 (`pnpm maildev`)
- **Rust toolchain & Cargo**: For Tauri v2 desktop compilation (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **Linux libraries** (if developing on Ubuntu/Debian):
  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

---

## 4. Getting Started

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment Variables
Copy the example environment files in each app:
```bash
cp apps/server/.env.example apps/server/.env
```

### Step 3: Seed Database
Ensure MongoDB is running, then run initial seed scripts:
```bash
pnpm --filter @jrs/server seed
pnpm --filter @jrs/server seed:transfers
```

### Step 4: Run Development Servers
- **Full Stack Dev Server:**
  ```bash
  pnpm dev
  ```
- **Backend Only (NestJS):**
  ```bash
  pnpm backend
  ```
- **Desktop App Only (Tauri + React):**
  ```bash
  pnpm desktop
  ```
- **Mobile App Only (Expo):**
  ```bash
  pnpm mobile
  ```

---

## 5. Development Standards

- **Linter & Formatter**: Powered by **Biome**. Always run `pnpm biome check --write` before committing.
- **Type Safety**: Strictly zero `any` types. Run `pnpm check-types` across all 7 packages.
- **Git Commits**: Conventional Commits standard enforced via `husky` and `commitlint`.
