# LRC JRS · Community & Fellowship Platform

[![Turborepo](https://img.shields.io/badge/monorepo-Turborepo-0284c7?style=flat&logo=turborepo)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Biome](https://img.shields.io/badge/linter-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![Tauri](https://img.shields.io/badge/desktop-Tauri_v2-24c8db?style=flat&logo=tauri)](https://tauri.app/)
[![NestJS](https://img.shields.io/badge/backend-NestJS-ea2845?style=flat&logo=nestjs)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/database-MongoDB-47a248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-Private-gray.svg)](#)

> **LRC JRS** is an enterprise-grade, cross-platform youth fellowship and community management system. It provides real-time hub tracking, Official membership registries, activity attendance tracking, inter-hub relocation ledgers, Google Drive document integration, and bilingual (English/French) support.

---

## 🏛️ System Architecture

The project is structured as a high-performance **Turborepo** monorepo using **pnpm workspaces**:

```
jrs/
├── apps/
│   ├── desktop/          # Tauri v2 + React 19 desktop application
│   ├── mobile/           # Expo / React Native mobile application
│   ├── server/           # NestJS 11 backend with Mongoose ODM & MongoDB
│   └── e2e/              # Adversarial end-to-end API test suite
│
├── packages/
│   ├── shared/           # Cross-platform types, DTOs, and Enums
│   ├── api-client/       # Type-safe HTTP client SDK
│   └── client-core/      # React Query hooks, auth context, and i18n
│
├── docs/
│   └── onboarding/       # Detailed developer onboarding guides
│
└── JULES.md              # Autonomous agent directive & QA standards
```

### Monorepo Packages Breakdown

| Workspace Package | Type | Description |
| :--- | :--- | :--- |
| **`@jrs/desktop`** | Application | Tauri v2 desktop app with native Canvas PDF rendering & Tailwind CSS |
| **`@jrs/mobile`** | Application | Cross-platform mobile app built with React Native and Expo |
| **`@jrs/server`** | Application | NestJS REST API with MongoDB, Mongoose, and Google Service Account |
| **`@jrs/e2e`** | Application | Adversarial E2E API penetration and boundary test harness |
| **`@jrs/client-core`** | Library | Shared React Query hooks, authentication state, and bilingual i18n |
| **`@jrs/api-client`** | Library | Strongly typed HTTP client communicating with `@jrs/server` |
| **`@jrs/shared`** | Library | Universal TypeScript interfaces, enums, validation DTOs |

---

## ✨ Core Features

- **Regional Hub Management:** Dynamic jurisdiction scoping across Cameroon town hubs with real-time switching.
- **Official Membership Directory:** Complete member lifecycle tracking, age verification (18–30), contact cards, and account access controls.
- **Activity Planning & Attendance Roster:** Schedule community activities, log real-time attendance, and track participation statistics.
- **Town Transfer Management:** Inter-hub member relocation requests with chronological audit ledgers and route tracking.
- **Google Drive Integration & In-App PDF Canvas:** Secure file streaming via Google Service Account and canvas document preview.
- **Bilingual Localization:** 100% internationalization coverage in English and French.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v22.0.0` or higher
- **pnpm**: `v10.0.0` or higher (`corepack enable pnpm`)
- **MongoDB**: Local MongoDB instance on `localhost:27017`
- **Rust Toolchain**: Required for compiling the Tauri desktop app

### 2. Installation & Setup
```bash
# Clone the repository
git clone <repo-url>
cd jrs

# Install all monorepo dependencies
pnpm install

# Setup backend environment variables
cp apps/server/.env.example apps/server/.env

# Seed initial database records
pnpm --filter @jrs/server seed
```

### 3. Launch Development Environments
```bash
# Start all apps simultaneously via Turborepo
pnpm dev

# Or launch specific targets:
pnpm backend   # NestJS Server on http://localhost:3500
pnpm desktop   # Tauri Desktop App
pnpm mobile    # Expo Mobile Dev Server
pnpm maildev   # Local email testing interface on http://localhost:1080
```

---

## 🛠️ CLI Commands & Quality Gates

| Command | Action |
| :--- | :--- |
| `pnpm biome check --write` | Format and lint all files with Biome |
| `pnpm check-types` | Run TypeScript type checks across all 7 packages |
| `pnpm --filter @jrs/server test` | Run backend unit tests |
| `pnpm --filter @jrs/e2e test` | Run adversarial end-to-end API test suite |
| `pnpm build` | Build production bundles for all packages |

---

## 📚 Developer Onboarding Guides

For detailed, step-by-step setup guides, explore the `docs/onboarding/` directory:

- 📖 [Monorepo Architecture Overview](docs/onboarding/overview.md)
- ⚙️ [Backend (`apps/server`) Guide](docs/onboarding/server.md)
- 🖥️ [Desktop (`apps/desktop`) Guide](docs/onboarding/desktop.md)
- 🧪 [Adversarial E2E Testing Guide](docs/onboarding/testing.md)

---

## 🛡️ Coding Standards

- **Zero `any` Types:** All code must be strictly typed.
- **Clean Separation:** UI components are presentational; state and data fetching belong in headless hooks.
- **Zero Scratch Files:** Temporary scripts must be removed prior to git staging.
- **Conventional Commits:** Enforced on all commit messages via Husky.
