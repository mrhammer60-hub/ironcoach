# Prompt 01 — Foundation

> **Paste CLAUDE.md first, then this prompt.**

---

## Task

Initialize the complete IronCoach monorepo from scratch.

### Steps

1. **Turborepo scaffold**
   ```bash
   npx create-turbo@latest ironcoach --package-manager pnpm
   ```

2. **Create all folders**
   ```
   apps/web
   apps/api
   apps/mobile
   packages/db
   packages/shared
   packages/ui
   packages/config
   packages/tsconfig
   infra/docker
   .github/workflows
   ```

3. **Root `turbo.json`** — pipelines: `build`, `dev`, `lint`, `test`, `type-check`, `db:migrate`, `db:seed`

4. **Root `pnpm-workspace.yaml`** — include `apps/*` and `packages/*`

5. **`packages/tsconfig`**
   - `base.json` — strict TypeScript, path aliases
   - `nextjs.json` — extends base + Next.js settings
   - `nestjs.json` — extends base + NestJS decorators

6. **`packages/config/src/env.ts`**
   - Zod schema validating all environment variables
   - Export typed `env` object used by all apps
   - All variables grouped by category with comments:

   ```
   # ── App ──────────────────────────────────────
   NODE_ENV=development
   PORT=3001
   APP_URL=http://localhost:3001
   FRONTEND_URL=http://localhost:3000
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001

   # ── Database ──────────────────────────────────
   DATABASE_URL=postgresql://ironcoach:ironcoach@localhost:5432/ironcoach

   # ── Redis ─────────────────────────────────────
   REDIS_URL=redis://localhost:6379
   REDIS_PASSWORD=

   # ── Auth ──────────────────────────────────────
   JWT_SECRET=change-me-min-32-chars-long
   JWT_REFRESH_SECRET=change-me-min-32-chars-long-different
   NEXTAUTH_SECRET=change-me-min-32-chars-long

   # ── Stripe ────────────────────────────────────
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_STARTER=price_...
   STRIPE_PRICE_GROWTH=price_...
   STRIPE_PRICE_PRO=price_...
   STRIPE_SUCCESS_URL=http://localhost:3000/billing/success
   STRIPE_CANCEL_URL=http://localhost:3000/billing/cancel

   # ── Cloudflare R2 ─────────────────────────────
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=ironcoach-media
   R2_PUBLIC_URL=https://media.ironcoach.com
   R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com

   # ── Email (Resend) ────────────────────────────
   RESEND_API_KEY=re_...
   EMAIL_FROM=IronCoach <noreply@ironcoach.com>

   # ── Push Notifications ────────────────────────
   EXPO_ACCESS_TOKEN=...

   # ── Monitoring ───────────────────────────────
   SENTRY_DSN=https://...@sentry.io/...

   # ── Admin UI ─────────────────────────────────
   BULL_BOARD_USERNAME=admin
   BULL_BOARD_PASSWORD=change-me

   # ── Mobile (Expo) ────────────────────────────
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   EAS_PROJECT_ID=...
   EXPO_SLUG=ironcoach
   ```

   Zod validation rules:
   - `NODE_ENV`: enum `['development', 'test', 'production']`
   - `PORT`: coerce to number, default 3001
   - `DATABASE_URL`: string starting with `postgresql://`
   - `JWT_SECRET` + `JWT_REFRESH_SECRET`: min length 32
   - All Stripe keys: string starting with appropriate prefix in production
   - All other strings: non-empty in production, optional in development

7. **`infra/docker/docker-compose.yml`**
   - Services: `postgres` (15-alpine), `redis` (7-alpine), `adminer`
   - Postgres env: `POSTGRES_DB=ironcoach`, `POSTGRES_USER=ironcoach`, `POSTGRES_PASSWORD=ironcoach`
   - Volumes for postgres and redis
   - Health checks on both

8. **`.env.example`** — all 40+ variables with placeholder values and comments

9. **`packages/db/package.json`** — Prisma dependency, scripts: `generate`, `migrate:dev`, `migrate:deploy`, `seed`, `studio`

10. **`packages/shared/src/index.ts`** — placeholder, will be filled in step 02

11. **Root `package.json`** — scripts: `dev`, `build`, `lint`, `format`, `db:migrate`, `db:seed`

---

## Output Requirements

- Every file complete — no `// TODO` placeholders
- `pnpm install` must succeed
- `docker-compose up -d` must start postgres + redis cleanly
- `pnpm dev` must start without errors (even if apps are empty shells)
