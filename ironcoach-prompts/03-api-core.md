# Prompt 03 — NestJS API Core

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–02 complete.

---

## Task

Bootstrap the NestJS API with Fastify, all shared infrastructure (guards, decorators, filters, interceptors), and Swagger.

---

## File: `apps/api/src/main.ts`

- Fastify adapter (`FastifyAdapter`)
- Global prefix: `/api/v1`
- `ValidationPipe` — `{ whitelist: true, transform: true, forbidNonWhitelisted: true }`
- Swagger (OpenAPI) at `/docs` — title "IronCoach API", version "1.0"
- CORS from `env.CORS_ORIGINS` (comma-separated list)
- Helmet for security headers
- Listen on `env.PORT` (default 3001)
- Log startup URL

---

## File: `apps/api/src/app.module.ts`

Imports (all global where appropriate):
- `ConfigModule` — global, Zod validation via `packages/config`
- `PrismaModule` — global, exports PrismaService wrapping `packages/db` singleton
- `AuthModule`
- `UsersModule`
- `OrganizationsModule`
- `BillingModule`
- `NotificationsModule`

---

## Directory: `apps/api/src/common/`

### Guards

**`guards/jwt-auth.guard.ts`**
- Extends `AuthGuard('jwt')`
- Attaches decoded payload to `req.user`
- Payload shape: `{ sub: string, orgId: string, role: RoleKey, email: string }`

**`guards/roles.guard.ts`**
- Reads `@Roles(RoleKey.TRAINER)` decorator
- Checks `req.user.role` against allowed roles
- Throws `ForbiddenException` if not allowed

**`guards/organization.guard.ts`**
- Reads `orgId` from `req.user`
- Loads `Subscription` from DB, checks `status === ACTIVE || TRIALING`
- Attaches `req.organization` for downstream use
- Throws `ForbiddenException` with message "subscription_inactive" if not active

**`guards/trainee-ownership.guard.ts`**
- For routes with `:traineeId` param
- Ensures the trainee belongs to `req.user.orgId`
- Throws `ForbiddenException` if mismatch

### Decorators

**`decorators/current-user.decorator.ts`** — `@CurrentUser()` → returns `req.user`
**`decorators/organization.decorator.ts`** — `@CurrentOrg()` → returns `req.organization`
**`decorators/roles.decorator.ts`** — `@Roles(...roles: RoleKey[])` sets metadata
**`decorators/public.decorator.ts`** — `@Public()` skips JWT guard

### Filters

**`filters/prisma-exception.filter.ts`**
Maps Prisma error codes to HTTP responses:
- `P2002` → `409 Conflict` + field name from meta
- `P2025` → `404 Not Found`
- `P2003` → `400 Bad Request` (FK constraint)
- All others → `500 Internal Server Error` + log

### Interceptors

**`interceptors/audit-log.interceptor.ts`**
- On every mutating request (POST/PUT/PATCH/DELETE)
- Writes `AuditLog` row: action, entityType (from route metadata), entityId, actorUserId, orgId, ip
- Non-blocking (fire and forget)

**`interceptors/response-transform.interceptor.ts`**
- Wraps all responses in `{ success: true, data: ... }`
- On errors: `{ success: false, error: { code, message, details? } }`

### Middleware

**`middleware/tenant.middleware.ts`**
- Reads `organizationId` from JWT (already in guard)
- Optionally reads `X-Organization-Id` header for admin impersonation
- Injects into `AsyncLocalStorage` for use in services without passing it around

---

## Directory: `apps/api/src/prisma/`

**`prisma.module.ts`** — global module
**`prisma.service.ts`** — extends `PrismaClient` from `packages/db`, implements `onModuleInit` / `onModuleDestroy`

---

## Directory: `apps/api/src/config/`

**`jwt.config.ts`**
```typescript
export const jwtConfig = {
  accessSecret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: '15m',
  refreshExpiresIn: '7d',
}
```

**`stripe.config.ts`** — Stripe client initialized with `env.STRIPE_SECRET_KEY`
**`redis.config.ts`** — ioredis client from `env.REDIS_URL`
**`r2.config.ts`** — S3 client pointed at Cloudflare R2 endpoint

---

## Output Requirements

- All files complete, no placeholders
- `pnpm dev` in `apps/api` starts without TypeScript errors
- Swagger UI accessible at `http://localhost:3001/docs`
