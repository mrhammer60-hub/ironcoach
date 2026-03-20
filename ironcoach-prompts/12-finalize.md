# Prompt 12 — Finalize: Tests, Docker, CI/CD

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–11 complete.

---

## Task

Finalize the project for production: complete seed data, write tests, set up Docker for production, configure GitHub Actions CI/CD, and write the README.

---

## Part A: Complete Seed Data

Extend `packages/db/prisma/seed.ts` to produce:

### Users
- 1 Admin: `admin@ironcoach.com` / `Admin1234!`
- 3 Coaches:
  - Coach A (Starter, 20 seats): `coach.a@ironcoach.com` / `Coach1234!` — org name "Alpha Coaching"
  - Coach B (Growth, 50 seats): `coach.b@ironcoach.com` / `Coach1234!` — org name "Beta Performance"
  - Coach C (Pro, 150 seats): `coach.c@ironcoach.com` / `Coach1234!` — org name "Gamma Elite"
- 10 Trainees distributed: 3 under A, 4 under B, 3 under C — with full `TraineeProfile` data (gender, age, height, weight, goal, activityLevel)

### Exercises (80 total)
10 per `MuscleGroup` × 3 `DifficultyLevel` (some exercises appear at multiple levels).

For each exercise provide: `nameEn`, `nameAr`, `muscleGroup`, `difficultyLevel`, `equipment`, `defaultSets`, `defaultReps`, `defaultRestSeconds`, `tempo`, `isGlobal: true`.

Example set (chest):
```
Chest BEGINNER: Push-up, Machine Chest Press, Dumbbell Fly, ...
Chest INTERMEDIATE: Barbell Bench Press, Incline DB Press, Cable Fly, ...
Chest ADVANCED: Weighted Dips, Deficit Push-up, Chest Press w/ Bands, ...
```

### Foods (50 entries)
Common Arabic foods with accurate macros per 100g. Examples:
- Chicken breast grilled: 165 kcal, 31g protein, 0g carbs, 3.6g fat
- White rice cooked: 130 kcal, 2.7g protein, 28g carbs, 0.3g fat
- Whole egg: 155 kcal, 13g protein, 1g carbs, 11g fat
- Arabic bread (khubz): 275 kcal, 9g protein, 56g carbs, 1.4g fat
- Full-fat labneh: 170 kcal, 7g protein, 4g carbs, 14g fat
- (45 more...)

### Sample Programs (3)
- "Push Pull Legs 6-day" — 6 days/week, 8 weeks
- "Full Body 3x/week Beginner" — 3 days/week, 8 weeks
- "Hypertrophy Upper Lower" — 4 days/week, 12 weeks

---

## Part B: Unit Tests

### `CalorieCalculatorService` (already spec'd in Prompt 06)
Ensure all combinations pass.

### `AuthService.spec.ts` (already spec'd in Prompt 04)
Ensure all cases pass.

### `BillingService.spec.ts`
- `createCheckout`: returns Stripe URL
- `SeatLimitGuard`: allows invite when under limit
- `SeatLimitGuard`: blocks invite when at limit
- `handleWebhook.checkout.session.completed`: creates Subscription row
- `handleWebhook.invoice.payment_failed`: sets status PAST_DUE

### `WorkoutLogsService.spec.ts`
- `startSession`: creates WorkoutLog linked to correct day
- `logSets`: upserts WorkoutLogSet rows correctly
- `completeSession`: sets completedAt, calculates duration, fires notification

---

## Part C: E2E Tests (Playwright)

File: `apps/web/e2e/`

### Coach flow (`coach.spec.ts`)
```
1. Navigate to /register
2. Fill form: name, email, password
3. Choose Growth plan → mock Stripe redirect → return to /coach/dashboard
4. See dashboard with 0 trainees
5. Click "Add trainee" → fill form → submit
6. Navigate to /coach/builder
7. Click "Push" preset → verify 7 exercises appear
8. Adjust bench press sets to 5 → verify saved
9. Click "Assign" → select trainee → pick start date → confirm
10. Trainee receives notification (mock)
```

### Trainee flow (`trainee.spec.ts`)
```
1. Click invite link (seeded URL)
2. Set password
3. Complete onboarding wizard (7 steps)
4. See TDEE result screen
5. Navigate to /trainee/today
6. See assigned workout card
7. Click "Start workout"
8. Log set 1: reps=10, weight=80 → check ✓
9. Rest timer appears and counts down
10. Complete all exercises → click Finish → rate 5 stars
11. Return to today screen → see 100% completion
```

---

## Part D: Docker Production Setup

### `infra/docker/docker-compose.prod.yml`
```yaml
services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  api:
    build:
      context: ../..
      dockerfile: infra/docker/api/Dockerfile
    restart: unless-stopped
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_started }
    env_file: .env
    ports:
      - "3001:3001"
```

### `infra/docker/api/Dockerfile`
```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @ironcoach/db generate
RUN pnpm --filter @ironcoach/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/node_modules/.prisma ./.prisma
CMD ["node", "dist/main.js"]
```

---

## Part E: GitHub Actions

### `.github/workflows/ci.yml`
Trigger: `pull_request` to `main`
Jobs:
1. `lint-typecheck`: `pnpm lint && pnpm type-check`
2. `test`: start postgres + redis services, run `pnpm test`
3. `e2e`: start full stack, run Playwright

### `.github/workflows/deploy.yml`
Trigger: `push` to `main`
Jobs:
1. `deploy-web`: `vercel --prod` (Vercel CLI)
2. `deploy-api`: build Docker image → push to GHCR → SSH to Railway and pull

---

## Part F: README.md

```markdown
# IronCoach

Multi-tenant SaaS platform for fitness coaches.

## Local Development (5 commands)

git clone https://github.com/your-org/ironcoach
cd ironcoach
cp .env.example .env          # fill in values
pnpm install
docker-compose up -d          # starts postgres + redis
pnpm db:migrate && pnpm db:seed
pnpm dev                      # starts all apps

## Access
- Web:    http://localhost:3000
- API:    http://localhost:3001
- Swagger: http://localhost:3001/docs
- Adminer: http://localhost:8080

## Test Accounts (after seed)
| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@ironcoach.com    | Admin1234! |
| Coach A | coach.a@ironcoach.com  | Coach1234! |
| Trainee | trainee1@ironcoach.com | Coach1234! |
```

---

## Output Requirements

- `pnpm db:seed` completes in under 30 seconds
- Unit tests: `pnpm test` passes with 0 failures
- E2E: both flows pass in headless mode
- `docker-compose -f infra/docker/docker-compose.prod.yml up` starts API successfully
- README: local setup works in exactly 5 commands
