# Prompt 15 — Security, Rate Limiting & Performance

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–09 complete (full API built).
> **أضفه بعد الخطوة 09 — قبل الـ web.**

---

## Task

أضف Rate Limiting، Security Hardening، وPerformance optimizations على الـ API.

هذه النقاط كانت ناقصة من الحزمة الأصلية وهي ضرورية لأي SaaS production.

---

## Part A: Rate Limiting (NestJS Throttler)

### Install
```bash
pnpm add @nestjs/throttler
```

### `apps/api/src/app.module.ts` — أضف:

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'

ThrottlerModule.forRoot([
  {
    name: 'short',   // 10 requests per second
    ttl: 1000,
    limit: 10,
  },
  {
    name: 'medium',  // 100 requests per minute
    ttl: 60000,
    limit: 100,
  },
  {
    name: 'long',    // 1000 requests per hour
    ttl: 3600000,
    limit: 1000,
  },
]),

// Global guard
{ provide: APP_GUARD, useClass: ThrottlerGuard }
```

### Per-endpoint overrides:

```typescript
// Auth endpoints — stricter
@Throttle({ short: { limit: 5, ttl: 60000 } })   // 5 per minute
POST /auth/login

@Throttle({ short: { limit: 3, ttl: 3600000 } })  // 3 per hour
POST /auth/forgot-password

// Admin endpoints
@Throttle({ medium: { limit: 60, ttl: 60000 } })  // 60 per minute
GET /admin/*

// File upload
@Throttle({ medium: { limit: 20, ttl: 60000 } })  // 20 per minute
POST /exercises/upload-url
POST /chat/upload
```

### Redis-backed throttler (for multi-instance):
```typescript
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis'

// In ThrottlerModule config:
storage: new ThrottlerStorageRedisService(redisClient)
```

---

## Part B: Security Hardening

### 1. Helmet configuration (`apps/api/src/main.ts`)

```typescript
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', '*.r2.cloudflarestorage.com'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
})
```

### 2. Request size limits

```typescript
// In Fastify setup:
await app.register(import('@fastify/multipart'), {
  limits: {
    fileSize: 52_428_800,   // 50MB max (video)
    files: 3,               // max 3 files per request
  },
})
// Body size limit:
app.getHttpAdapter().getInstance().addContentTypeParser(
  'application/json',
  { parseAs: 'string', bodyLimit: 1_048_576 },  // 1MB JSON limit
  ...
)
```

### 3. SQL injection prevention
Prisma handles this by default — add a comment in `prisma.service.ts` noting this, and ban raw `$queryRawUnsafe` usage with an ESLint rule:

```json
// .eslintrc.json
"rules": {
  "no-restricted-syntax": [
    "error",
    {
      "selector": "CallExpression[callee.property.name='$queryRawUnsafe']",
      "message": "Use $queryRaw with tagged template literals instead of $queryRawUnsafe"
    }
  ]
}
```

### 4. CORS — strict configuration

```typescript
// Only allow explicit origins, never wildcard in production
const corsOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim())
app.enableCors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id'],
})
```

### 5. Sensitive data — never log

Create `apps/api/src/common/interceptors/sanitize-log.interceptor.ts`:
- Strip `password`, `passwordHash`, `token`, `refreshToken`, `stripeCustomerId` from logs
- Applied globally

### 6. JWT — additional hardening

```typescript
// In jwt.config.ts — add:
algorithm: 'HS256',
issuer: 'ironcoach-api',
audience: 'ironcoach-client',

// In jwt.strategy.ts — validate:
ignoreExpiration: false,
// Check issuer + audience on every request
```

---

## Part C: Performance

### 1. Database indexes — add to Prisma schema

```prisma
// Add to models that are queried heavily:

model WorkoutLog {
  // ...
  @@index([traineeProfileId, completedAt])
  @@index([organizationId, completedAt])
}

model Message {
  // ...
  @@index([conversationId, createdAt])
}

model Notification {
  // ...
  @@index([userId, isRead, createdAt])
}

model OrganizationMember {
  // ...
  @@index([organizationId, roleKey])
}

model TraineeProfile {
  // ...
  @@index([organizationId, assignedTrainerId])
}
```

### 2. Response caching (Redis)

Create `apps/api/src/common/decorators/cache-response.decorator.ts`:

```typescript
@CacheResponse({ ttl: 300 })  // 5 minutes
GET /exercises              ← global exercises change rarely

@CacheResponse({ ttl: 60 })   // 1 minute
GET /admin/dashboard

@CacheResponse({ ttl: 30 })
GET /trainers/dashboard
```

Cache key pattern: `cache:{route}:{orgId}:{queryHash}`

Invalidate on mutations: add `@InvalidateCache(['exercises'])` decorator to POST/PUT/DELETE exercise endpoints.

### 3. N+1 prevention — Prisma `include` strategy

Add a comment in each service file listing the required `include` fields. Example in `workout-programs.service.ts`:

```typescript
// ALWAYS include in single-program queries (avoid N+1):
const PROGRAM_FULL_INCLUDE = {
  weeks: {
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { dayNumber: 'asc' }
      }
    },
    orderBy: { weekNumber: 'asc' }
  }
} satisfies Prisma.WorkoutProgramInclude
```

### 4. Pagination — enforce on all list endpoints

Add `PaginationDto` to `packages/shared`:
```typescript
export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 20
}
```

Every `GET /*/list` endpoint must accept and enforce `page` + `limit`. Never return unbounded lists.

### 5. Background job queue — BullMQ setup

Create `apps/api/src/queue/queue.module.ts`:
```typescript
import { BullModule } from '@nestjs/bullmq'

BullModule.forRoot({ connection: redisConfig })
BullModule.registerQueue(
  { name: 'notifications' },
  { name: 'emails' },
  { name: 'announcements' },
  { name: 'webhooks' },
)
```

Move these operations off the request thread into queues:
- Sending push notifications → `notifications` queue
- Sending emails → `emails` queue
- Admin announcements → `announcements` queue (batched 100/job)
- Stripe webhook processing → `webhooks` queue (idempotent, retryable)

---

## Part D: Monitoring

### Sentry error tracking

```typescript
// apps/api/src/main.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
```

Add `SentryInterceptor` to catch and report unhandled exceptions.

### Structured logging (Pino via NestJS)

```typescript
// apps/api/src/main.ts
import { Logger } from 'nestjs-pino'

app.useLogger(app.get(Logger))

// Log format: { level, time, requestId, orgId, userId, method, url, statusCode, duration }
```

Every log line includes: `requestId` (UUID per request), `orgId`, `userId`.

---

## Output Requirements

- `POST /auth/login` returns `429` after 5 failed attempts in 1 minute
- `GET /exercises` response is cached in Redis, second request < 5ms
- All list endpoints have `page` + `limit` enforced
- Background jobs visible in BullMQ dashboard (`/admin/queues` — bull-board)
- Zero N+1 queries on `/workout-programs/:id` (verified with Prisma query logging)
