# IronCoach — Master Context (paste this at the start of every Claude Code session)

You are building **IronCoach** — a production-ready multi-tenant SaaS platform for fitness coaches.

---

## Tech Stack (non-negotiable)

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Web | Next.js 14 App Router + Tailwind CSS + Shadcn/ui |
| API | NestJS 10 + Fastify adapter |
| Mobile | Expo SDK 51 + React Native |
| Database | packages/db → Prisma 5 + PostgreSQL |
| Shared types | packages/shared → Zod schemas + TypeScript types |
| UI components | packages/ui → shared React components |
| Auth | JWT access (15 min) + refresh tokens (7 d) + bcrypt (12 rounds) |
| Billing | Stripe Subscriptions + webhooks |
| Cache / Queue | Redis (Upstash) + BullMQ |
| Storage | Cloudflare R2 — presigned URLs only, never store raw files |
| Email | Resend + React Email templates |
| Push | Expo Push API (FCM + APNs) |
| Realtime | Socket.io + Redis Pub/Sub (@socket.io/redis-adapter) |
| i18n | next-intl — Arabic RTL (IBM Plex Sans Arabic) + English (Syne / Plus Jakarta Sans) |
| Hosting | Vercel (web) · Railway + Docker (API) |

---

## Architecture Rules (enforce on every file)

1. Every API route **MUST** filter by `organizationId` extracted from JWT — never trust request body for tenant scoping.
2. Trainees can only access **their own** data — `TraineeGuard` middleware enforces `trainee.userId === req.user.id`.
3. Admin routes protected by `@Roles(RoleKey.ADMIN)` guard.
4. Stripe plan enforcement: `POST /trainers/trainees/invite` counts active trainees, rejects if over `plan.maxTrainees`.
5. Socket.io: verify JWT on `handleConnection`, join only rooms for conversations the user belongs to.
6. All role values are **Prisma enums**, never table columns.
7. Prisma client exported **only** from `packages/db/src/index.ts`.
8. All presigned upload URLs expire in **15 minutes**.
9. Refresh tokens stored as SHA-256 hash — never raw.
10. Billing comes **before** workout/nutrition modules — every feature checks subscription status.

---

## Folder Structure

```
ironcoach/
├── apps/
│   ├── web/          # Next.js 14
│   ├── api/          # NestJS + Fastify
│   └── mobile/       # Expo SDK 51
├── packages/
│   ├── db/           # Prisma schema + client singleton
│   ├── shared/       # Zod schemas + TS types (shared across all apps)
│   ├── ui/           # Shared React components
│   ├── config/       # Zod-validated env helpers
│   └── tsconfig/     # base.json · nextjs.json · nestjs.json
├── infra/
│   ├── docker/
│   └── terraform/
└── .github/workflows/
```

---

## Build Order (never skip ahead)

```
01-foundation    → monorepo, docker-compose, env, tsconfig
02-database      → full Prisma schema (51 models), seed data
03-api-core      → NestJS bootstrap, guards, decorators, Swagger
04-auth          → register/login/refresh/logout/reset
05-orgs-billing  → organizations + Stripe (BEFORE all features)
06-trainees      → profiles, onboarding, calorie engine
07-workouts      → exercises, programs, logging
08-nutrition     → meal plans, food database, macro calc
09-messaging     → Socket.io chat + push notifications
10-web           → Next.js pages (coach + trainee + admin)
11-mobile        → Expo app (trainee-focused)
12-finalize      → seed, tests, CI/CD, Docker
```

---

## Current State

> **Update this section after completing each step.**

```
✗ 01-foundation   — not started
✗ 02-database     — not started
✗ 03-api-core     — not started
✗ 04-auth         — not started
✗ 05-orgs-billing — not started
✗ 06-trainees     — not started
✗ 07-workouts     — not started
✗ 08-nutrition    — not started
✗ 09-messaging    — not started
✗ 10-web          — not started
✗ 11-mobile       — not started
✗ 12-finalize     — not started
```

---

## Additional Prompts (Added After Gap Analysis)

```
13-admin-api      → Super Admin API module (endpoints, impersonation, announcements)
14-shared-package → packages/shared Zod schemas + TypeScript types (add after step 02)
15-security-perf  → Rate limiting, security hardening, Redis caching, N+1 prevention
16-admin-web      → Admin web portal (coaches mgmt, revenue, support, feature flags)
17-email-templates→ React Email templates (14 templates) + Resend wiring
18-progress       → Full progress tracking + check-ins module (API + Coach UI + Trainee UI)
19-subdomain      → Subdomain routing + branded coach spaces (Next.js middleware + Vercel)
20-api-client     → Typed API client with auto token refresh (web + mobile)
21-file-security  → File upload security: MIME validation, size limits, safe key generation
22-packages-ui    → packages/ui shared components (web + mobile + hooks)
```

## ✅ Final Build Order (30 steps)

```
01 → 02 → 14 → 22 → 20 → 25 → 03 → 04 → 05 → 23 → 06 → 07 → 29 → 08 → 09 → 30 → 24 → 21 → 15 → 13 → 17 → 18 → 10 → 26 → 27 → 19 → 16 → 11 → 28 → 12
```

### Step reference:
```
01  foundation          monorepo, docker, env (35+ vars)
02  database            Prisma schema (51 models)
14  shared-package      Zod schemas + TS types
22  packages-ui         shared components + hooks
20  api-client          typed fetch client (web + mobile)
25  timezone-dates      UTC storage, local display, scheduler
03  api-core            NestJS bootstrap, guards, Swagger
04  auth                JWT, refresh rotation, accept-invite
05  orgs-billing        organizations + Stripe
23  webhook-idempotency processed events table, dunning
06  trainees            profiles, onboarding, calorie engine
07  workouts            exercises, programs, logging
29  copy-duplicate      duplicate programs + templates
08  nutrition           meal plans, food DB, macro calc
09  messaging           Socket.io + push notifications
30  notif-preferences   quiet hours, per-type toggles
24  socket-reconnection reconnect logic, missed message sync
21  file-security       MIME validation, size limits, cleanup
15  security-perf       rate limiting, caching, N+1 prevention
13  admin-api           super admin endpoints, impersonation
17  email-templates     14 React Email templates
18  progress            check-ins, StrengthPR, photos
10  web                 Next.js pages (coach + trainee)
26  error-pages         error.tsx, loading.tsx, empty states
27  landing-page        marketing site + SEO
19  subdomain-routing   branded spaces + Next.js middleware
16  admin-web           admin portal pages
11  mobile              Expo app (offline-first)
28  eas-build           EAS config, app.config, CI/CD mobile
12  finalize            seed, E2E tests, Docker prod, README
```
