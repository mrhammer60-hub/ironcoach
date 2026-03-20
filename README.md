# IronCoach

Multi-tenant SaaS platform for fitness coaches. Arabic-first (RTL) with English support.

Built with: Next.js 14 + NestJS 10 + Expo SDK 51 + Prisma + PostgreSQL + Redis + Stripe + Socket.io

## Local Development

```bash
git clone https://github.com/your-org/ironcoach
cd ironcoach
cp .env.example .env                    # fill in values
pnpm install
docker compose -f infra/docker/docker-compose.yml up -d
cd packages/db && npx prisma migrate dev && npx prisma db seed && cd ../..
pnpm dev
```

## Access

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |
| Adminer | http://localhost:8080 |

## Test Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ironcoach.com | Admin1234! |
| Coach (Starter) | coach.ahmed@ironcoach.com | Coach1234! |
| Coach (Growth) | coach.sara@ironcoach.com | Coach1234! |
| Coach (Pro) | coach.mohammed@ironcoach.com | Coach1234! |

## Project Structure

```
apps/web       → Next.js 14 App Router (coach + trainee + admin + marketing)
apps/api       → NestJS 10 + Fastify (REST API + Socket.io)
apps/mobile    → Expo SDK 51 (trainee-focused)
packages/db    → Prisma schema + client
packages/shared → Zod schemas + types + utils + API client
packages/ui    → Shared React components (web + mobile)
packages/config → Zod-validated env variables
infra/docker   → Docker Compose (dev + prod)
```

## Commands

```bash
pnpm dev          # Start all apps
pnpm build        # Build all
pnpm type-check   # TypeScript check
pnpm test         # Run tests
pnpm db:migrate   # Prisma migrations
pnpm db:seed      # Seed database
```

## API Modules

Auth, Organizations, Billing, Trainers, Trainees, Exercises, Workout Programs, Workout Logs, Nutrition, Chat, Notifications, Progress, Admin, Uploads

## Architecture

- **Multi-tenant**: every query filters by `organizationId` from JWT
- **Billing-first**: `OrganizationGuard` checks subscription status
- **Timezone-aware**: UTC in DB, local in UI via `getTodayInTimezone()`
- **Real-time**: Socket.io with Redis Pub/Sub adapter
- **Offline-first**: mobile workout logging with local queue

## Deployment

- **Web**: Vercel (automatic via GitHub Actions)
- **API**: Docker → Railway / any container host
- **Mobile**: EAS Build → App Store + Play Store
- **Database**: PostgreSQL (Railway / Supabase)
- **Cache**: Redis (Upstash)

## Testing Branded Spaces Locally

Add to `/etc/hosts`:
```
127.0.0.1 ahmed-fitness.localhost
```
Visit `http://ahmed-fitness.localhost:3000` to see branded coach space.
