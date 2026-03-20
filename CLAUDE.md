# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IronCoach is a multi-tenant SaaS platform for fitness coaches. Monorepo using Turborepo + pnpm 9.15.4 workspaces.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm 9.15.4 |
| Web | Next.js 14 App Router + Tailwind CSS + Shadcn/ui |
| API | NestJS 10 + Fastify adapter |
| Mobile | Expo SDK 51 + React Native 0.74 |
| Database | Prisma 5 + PostgreSQL 15 |
| Shared types | packages/shared (Zod schemas + TS types) |
| Auth | JWT access (15 min) + refresh tokens (7 d) + bcrypt (12 rounds) |
| Billing | Stripe Subscriptions + webhooks |
| Cache/Queue | Redis (Upstash) + BullMQ |
| Storage | Cloudflare R2 (presigned URLs, 15 min expiry) |
| Email | Resend + React Email |
| Push | Expo Push API (FCM + APNs) |
| Realtime | Socket.io + @socket.io/redis-adapter |
| i18n | next-intl — Arabic RTL (IBM Plex Sans Arabic) + English (Syne / Plus Jakarta Sans) |
| Server state | @tanstack/react-query v5 (web) |
| Hosting | Vercel (web) + Railway/Docker (API) |

## Commands

```bash
pnpm dev              # Start all dev servers (web :3000, api :3001)
pnpm build            # Build all apps and packages
pnpm type-check       # TypeScript check all packages
pnpm test             # Run all tests
pnpm format           # Prettier (ts,tsx,js,jsx,json,md)
pnpm db:migrate       # Prisma migrate dev
pnpm db:seed          # Seed database
```

**Per-package** (use `pnpm --filter <name>`):
```bash
pnpm --filter @ironcoach/api dev          # API only
pnpm --filter @ironcoach/web dev          # Web only
pnpm --filter @ironcoach/web lint         # Next.js lint (only app with real linting)
pnpm --filter @ironcoach/db studio        # Prisma Studio UI
pnpm --filter @ironcoach/db generate      # Regenerate Prisma client
```

Note: `pnpm lint` runs across all packages but most have no linter configured yet — only `@ironcoach/web` has `next lint`.

## Architecture

```
apps/
  api/            NestJS + Fastify (port 3001, Swagger at /docs)
  web/            Next.js 14 App Router (port 3000)
  mobile/         Expo SDK 51 (EAS Build, expo-router)
packages/
  db/             Prisma schema (51 models), client singleton, seed (tsx)
  shared/         Zod schemas, TS types, constants, API client
  ui/             Shared React components (web + mobile)
  config/         Zod-validated env variables (35+ vars)
  tsconfig/       base.json, nextjs.json, nestjs.json
infra/
  docker/         docker-compose.yml (PostgreSQL 15, Redis 7, Adminer)
```

All packages use `@ironcoach/<name>` naming with `workspace:*` protocol for internal deps.

## Architecture Rules

1. **Multi-tenancy**: Every query MUST filter by `organizationId` from JWT — never trust request body for tenant scoping.
2. **Trainee isolation**: `TraineeGuard` enforces `trainee.userId === req.user.id`.
3. **Admin routes**: Protected by `@Roles(RoleKey.ADMIN)` guard.
4. **Billing enforcement**: `POST /trainers/trainees/invite` checks active trainees against `plan.maxTrainees`. Every feature checks subscription status.
5. **Socket.io**: Verify JWT on `handleConnection`, join only rooms for user's conversations.
6. **Roles**: Always Prisma enums (`RoleKey`), never table columns.
7. **Prisma client**: Exported only from `packages/db/src/index.ts`.
8. **Refresh tokens**: Stored as SHA-256 hash, never raw.
9. **API response format**: `{ success, data, error }` via `ResponseTransformInterceptor`.
10. **Global auth**: `JwtAuthGuard` on all routes; use `@Public()` decorator to skip.

## Database

51 Prisma models across domains: User/Org/Auth, Workouts (Exercise, WorkoutProgram, WorkoutLog, StrengthPR), Nutrition (Food, NutritionPlan, MealLog), Progress (Checkin, ProgressPhoto, BodyMeasurement), Messaging (Conversation, Message), Billing (Plan, Subscription, Invoice, ProcessedStripeEvent), System (AuditLog, FeatureFlag, Notification, MediaAsset).

Key enums: `RoleKey` (OWNER, TRAINER, ASSISTANT_TRAINER, TRAINEE, ADMIN), `PlanCode` (STARTER, GROWTH, PRO), `GoalType`, `MuscleGroup`, `NotificationType`.

## Local Dev Setup

```bash
docker-compose -f infra/docker/docker-compose.yml up -d   # PostgreSQL + Redis + Adminer
cp .env.example .env                                        # Fill in Stripe, R2, Resend keys
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

Services: Web http://localhost:3000, API http://localhost:3001, Swagger http://localhost:3001/docs, Adminer http://localhost:8080

## Build Order

The project follows a strict 30-step build sequence. Detailed prompts for each step live in `ironcoach-prompts/` with the master plan in `ironcoach-prompts/CLAUDE.md`.

Sequence: foundation → database → shared-package → ui → api-client → timezone → api-core → auth → orgs-billing → webhook-idempotency → trainees → workouts → nutrition → messaging → notifications → security → admin-api → email → progress → web → error-pages → landing → subdomain → admin-web → mobile → eas-build → finalize

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

## Current State

> **Update this section after completing each step.**

```
✓ 01  foundation                — complete
✓ 02  database                  — complete
✓ 14  shared-package            — complete
✓ 22  packages-ui               — complete
✓ 20  api-client                — complete
✓ 25  timezone-dates            — complete
✓ 03  api-core                  — complete
✓ 04  auth                      — complete
✓ 05  orgs-billing              — complete
✓ 23  webhook-idempotency       — complete
✓ 06  trainees                  — complete
✓ 07  workouts                  — complete
✓ 29  copy-duplicate            — complete
✓ 08  nutrition                 — complete
✓ 09  messaging                 — complete
✓ 30  notif-preferences         — complete
✓ 24  socket-reconnection       — complete
✓ 21  file-security             — complete
✓ 15  security-perf             — complete
✓ 13  admin-api                 — complete
✓ 17  email-templates           — complete
✓ 18  progress                  — complete
✓ 10  web                       — complete
✓ 26  error-pages               — complete
✓ 27  landing-page              — complete
✓ 19  subdomain-routing         — complete
✓ 16  admin-web                 — complete
✓ 11  mobile                    — complete
✓ 28  eas-build                 — complete
✓ 12  finalize                  — complete
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ironcoach.com | Admin1234! |
| Coach A | coach.ahmed@ironcoach.com | Admin1234! |
| Coach B | coach.sara@ironcoach.com | Admin1234! |
| Trainee (Khalid) | khalid.m@test.com | Admin1234! |

## Coding Standards

- ZERO TypeScript errors always
- All user-facing text through `useTranslation()` — never hardcode Arabic
- CSS variables only — NEVER hardcode colors
- Every API query filtered by `organizationId` from JWT
- Every page needs: loading skeleton + empty state + error state
- Every mutation needs: loading state + success toast + error toast
- Toast API: `toast("type", "message")` — type is `"success"` | `"error"` | `"info"` | `"warning"`
