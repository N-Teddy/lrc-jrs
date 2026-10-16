# Backend (Server) Onboarding Guide

> **Package:** `@jrs/server` (`apps/server/`)  
> **Framework:** NestJS 11 + Mongoose ODM + MongoDB + Google APIs

---

## 1. Architecture & Module Structure

The backend is built with NestJS, strictly following the **Controller $\rightarrow$ Service $\rightarrow$ Mongoose Schema** pattern.

```
apps/server/src/
├── common/
│   ├── decorators/      # @Public(), @Roles(), @CurrentUser()
│   ├── filters/         # AllExceptionsFilter, HttpExceptionFilter
│   ├── guards/          # JwtAuthGuard, RolesGuard, TownScopeGuard
│   └── interceptors/    # LoggingInterceptor, TransformResponseInterceptor
│
├── modules/
│   ├── access/          # Account access, password resets, credentials
│   ├── activities/      # Activities, attendance rosters, and reports
│   ├── auth/            # JWT authentication, login, refresh tokens
│   ├── towns/           # Town hubs and regional jurisdictional management
│   └── users/           # User & member directory, official profiles
│
├── services/
│   ├── drive.service.ts # Google Drive Service Account file streaming & PDF exports
│   ├── email.service.ts # Nodemailer email transport (Maildev for dev)
│   ├── media.service.ts # Cloudinary / local media upload handler
│   └── whatsapp.service.ts # JifiHub WhatsApp API client
│
├── core/
│   └── database/
│       └── database.module.ts # Mongoose connection factory & connection logs
│
├── app.module.ts        # Root NestJS module
└── main.ts              # Application bootstrap & global pipes
```

---

## 2. Key Architectural Patterns

### 2.1 Role-Based Access Control (RBAC) & Town Scopes
User roles are defined in `@jrs/shared` as:
- **`AP`**: Full administrative access across all towns and hubs.
- **`PC`**: Operational coordinator access scoped to authorized town hubs (`allowedReadTownIds`, `allowedWriteTownIds`).
- **`MEMBER`**: Basic member access for self-profile, activities, and roster registration.

Guards are applied at the controller or route level:
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, TownScopeGuard)
export class UsersController {
  @Get()
  @Roles('AP', 'PC')
  async findAll(@CurrentUser() user: IUser) { ... }
}
```

### 2.2 Notification Strategy Pattern
The server sends notifications across two primary channels:
- **WhatsApp**: Dispatched via JifiHub REST API for instant temporary passwords and meeting reminders.
- **Email**: Dispatched via Nodemailer (connected to local Maildev on port 1025 during development).

These services implement a unified `NotificationStrategy` interface, allowing dynamic channel selection and automatic fallback.

### 2.3 Google Drive Integration & File Streaming
Files uploaded as activity reports or registries are stored securely in Google Drive via a Google Service Account (`credentials.json`).
- Files are **never buffered entirely in RAM**.
- The `DriveService.getFileStream(fileId)` streams files directly to the client via HTTP pipes, supporting both native binary downloads and automatic Google Doc $\rightarrow$ PDF exports.

---

## 3. Database & Mongoose Schemas

- MongoDB connects via the `MONGODB_URI` environment variable.
- Schemas are defined in `apps/server/src/modules/*/schemas/*.schema.ts` using `@nestjs/mongoose` decorators (`@Schema()`, `@Prop()`).
- High-frequency query columns are indexed for performance:
  - `UserSchema`: indexed on `{ townId: 1, role: 1 }`, `{ phoneNumber: 1 }`, `{ email: 1 }`.
  - `ActivitySchema`: indexed on `{ townId: 1, startDate: -1 }`, `{ status: 1 }`.
- Seed scripts are available in `apps/server/src/database/seeds/`:
  ```bash
  pnpm --filter @jrs/server seed            # Base town hubs and admin accounts
  pnpm --filter @jrs/server seed:transfers  # Transfer relocation records
  pnpm --filter @jrs/server seed:avatars    # User avatar generator
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
