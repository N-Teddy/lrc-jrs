# Activities API Tests - Implementation Plan

## Objectives
Implement comprehensive black-box Playwright tests for the Activities API (`/api/activities`) following existing patterns:
- Use `AuthHelper` for authentication
- Use `expectSuccessResponse` / `expectAppError` from utils
- All responses are wrapped by TransformResponseInterceptor as `{ success, statusCode, message, data, meta?, timestamp }` - read from `body.data`
- Follow naming/style of `tests/users/*` and `tests/auth/*`

## Endpoints to Test

### 1. List & Stats (`list-stats.spec.ts`)
- [x] GET /activities without auth -> 401
- [x] GET /activities with AP token returns paginated list (items array, pagination shape)
- [x] GET /activities with pagination (page/limit)
- [x] GET /activities with year filter
- [ ] GET /activities with month filter (year+month)
- [ ] GET /activities with activityType filter
- [ ] GET /activities with status filter
- [ ] GET /activities with search
- [x] GET /activities/stats without auth -> 401
- [x] GET /activities/stats with AP token returns stats object
- [ ] GET /activities/stats with filters (year/month/townId)

### 2. CRUD (`crud.spec.ts`)
- [ ] GET /activities/:id without auth -> 401
- [ ] GET /activities/:id with non-existent ObjectId -> 404 (ERR_ACTIVITY_NOT_FOUND or similar)
- [ ] GET /activities/:id with valid existing activity -> success
- [ ] POST /activities without auth -> 401
- [ ] POST /activities with invalid/missing fields -> validation error (400)
- [ ] POST /activities with valid data (AP/PC) -> 201, created activity in data
- [ ] PATCH /activities/:id without auth -> 401
- [ ] PATCH /activities/:id update fields -> success
- [ ] DELETE /activities/:id without auth -> 401
- [ ] DELETE /activities/:id (soft delete) -> success

### 3. Member Attendance History (`member-history.spec.ts`)
- [ ] GET /activities/member/:memberId/history without auth -> 401
- [ ] GET /activities/member/:memberId/history with valid member -> success with expected shape

### 4. Attendance (`attendance.spec.ts`)
- [ ] GET /activities/:id/attendance without auth -> 401
- [ ] GET /activities/:id/attendance for existing activity -> success
- [ ] POST /activities/:id/attendance without auth -> 401
- [ ] POST /activities/:id/attendance record attendance -> success
- [ ] POST /activities/:id/attendance/lock without auth -> 401
- [ ] POST /activities/:id/attendance/lock -> success (if activity eligible)
- [ ] POST /activities/:id/attendance/unlock without auth -> 401
- [ ] POST /activities/:id/attendance/unlock (AP only) -> success/forbidden based on role

### 5. Reports & Drive (basic auth/validation)
- [ ] GET /activities/report/folders without auth? (check guards) - may need auth
- [ ] GET /activities/report/drive-files
- [ ] Public streaming/downloading routes behavior

### 6. Reminders/Templates
- [ ] GET /activities/reminder-templates without auth -> 401?
- [ ] GET /activities/reminder-templates with auth -> list
- [ ] GET /activities/reminder-templates/:type
- [ ] PUT /activities/reminder-templates/:type (admin)
- [ ] POST /activities/reminders/trigger-daily / trigger-monthly

## Implementation Strategy

### Discovering test data (black-box)
Since we need valid `townId`, existing activities/members:
1. Login as AP via AuthHelper
2. GET /api/towns (public) to get town IDs
3. GET /api/users (AP) to find member IDs
4. GET /api/activities to find existing activity IDs

### Creating test activities
Need valid CreateActivityDto:
- title (string)
- activityType (enum from shared)
- startDate (ISO, >= 2026) - use future dates like 2026-12-01T10:00:00.000Z
- townId (from towns)
- endDate optional for multi-day
- hostTownId optional
- includedTownIds optional

### Error codes to expect
Check AppException patterns - activities service likely throws custom exceptions. Look up common codes like ERR_ACTIVITY_NOT_FOUND etc from shared/constants/errors if needed, but tests should be flexible.

## Files to create
1. `tests/activities/list-stats.spec.ts` - expand existing
2. `tests/activities/crud.spec.ts`
3. `tests/activities/member-history.spec.ts`
4. `tests/activities/attendance.spec.ts`
5. `tests/activities/reports-reminders.spec.ts` (optional/basic)

## Next Steps
1. Expand list-stats tests with more filter cases
2. Create crud.spec.ts with discover-then-test pattern
3. Create attendance.spec.ts
4. Create member-history.spec.ts
5. Run tests to see what passes/fails and adjust
