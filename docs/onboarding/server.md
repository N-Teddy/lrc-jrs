# Backend (Server) Onboarding Guide

> **Package:** `@jrs/server` (`apps/server/`)  
> **Framework:** NestJS 11 + Prisma ORM + PostgreSQL + Google APIs

---

## 1. Architecture & Module Structure

The backend is built with NestJS, strictly following the **Controller $\rightarrow$ Service $\rightarrow$ Prisma** pattern.

```
apps/server/src/
├── common/
│   ├── decorators/      # @Public(), @Roles(), @CurrentUser()
│   ├── filters/         # GlobalHttpExceptionFilter, PrismaExceptionFilter
│   ├── guards/          # JwtAuthGuard, RolesGuard, TownScopeGuard
│   └── interceptors/    # LoggingInterceptor, TransformResponseInterceptor
│
├── modules/
│   ├── access/          # Account access, password resets, credentials
│   ├── activities/      # Activities, attendance rosters, and reports
│   ├── auth/            # JWT authentication, login, refresh tokens
│   ├── members/         # Member registry and canonical profiles
│   ├── towns/           # Town hubs and regional jurisdictional management
│   └── transfers/       # Inter-hub relocation requests and ledger logs
│
├── services/
│   ├── drive.service.ts # Google Drive Service Account file streaming & PDF exports
│   └── prisma.service.ts# Prisma database client lifecycle manager
│
├── prisma/
│   ├── schema.prisma    # Database schema definitions
│   └── migrations/      # Version-controlled SQL migration scripts
│
├── app.module.ts        # Root NestJS module
└── main.ts              # Application bootstrap & global pipes
```

---

## 2. Key Architectural Patterns

### 2.1 Role-Based Access Control (RBAC)
User roles are defined in `@jrs/shared` as:
- **`AP`**: Full administrative access across all towns and hubs.
- **`PC`**: Operational coordinator access scoped to authorized town hubs.
- **`MEMBER`**: Basic member access for self-profile, activities, and roster registration.

Guards are applied at the controller or route level:
```typescript
@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  @Get()
  @Roles('AP', 'PC')
  async findAll(@CurrentUser() user: IUser) { ... }
}
```

### 2.2 Google Drive Integration & File Streaming
Files uploaded as activity reports or registries are stored securely in Google Drive via a Google Service Account (`credentials.json`).
- Files are **never buffered entirely in RAM**.
- The `DriveService.getFileStream(fileId)` streams files directly to the client via HTTP pipes, supporting both native binary downloads and automatic Google Doc $\rightarrow$ PDF exports.

---

## 3. Database & Migrations

- View and update the schema at `apps/server/prisma/schema.prisma`.
- Generate Prisma Client:
  ```bash
  pnpm --filter @jrs/server prisma generate
  ```
- Create and apply a new migration:
  ```bash
  pnpm --filter @jrs/server prisma migrate dev --name <migration_name>
  ```
- Launch Prisma Studio (interactive database GUI):
  ```bash
  pnpm --filter @jrs/server prisma studio
  ```

---

## 4. Running & Debugging the Server

```bash
# Start backend in watch/development mode (port 3500)
pnpm backend

# Run backend unit tests
pnpm --filter @jrs/server test

# Lint & type-check
pnpm biome check apps/server
pnpm --filter @jrs/server check-types
```
