# Prompt 05 — Organizations & Billing

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–04 complete. Auth working with JWT.
> **⚠ Billing MUST be built before workouts/nutrition — every feature checks subscription.**

---

## Task

Build Organizations module + Billing module together.

---

## Part A: Organizations Module

### `apps/api/src/organizations/`

All endpoints require `JwtAuthGuard` + `OrganizationGuard`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/organizations/me` | Current org + subscription summary |
| PUT | `/organizations/me` | Update branding |
| GET | `/organizations/me/members` | List members with roles |
| POST | `/organizations/me/members/invite` | Invite by email |
| DELETE | `/organizations/me/members/:memberId` | Remove member |

**GET `/organizations/me`** returns:
```typescript
{
  id, name, slug, logoUrl, brandColor, subdomain, customDomain,
  subscription: { status, plan: { code, name, maxTrainees }, currentPeriodEnd },
  stats: { totalTrainees, activeTrainees, seatsUsed, seatsAvailable }
}
```

**PUT `/organizations/me`** — `UpdateOrganizationDto`:
- `name?` (string, min 2)
- `slug?` (string, regex `/^[a-z0-9-]{3,32}$/`, must check uniqueness)
- `subdomain?` (same regex, must check uniqueness)
- `brandColor?` (hex color string)
- `logoUrl?` (valid URL)

**POST `/organizations/me/members/invite`** — `InviteDto`:
- `email` (IsEmail)
- `roleKey` (enum: TRAINER | ASSISTANT_TRAINER)
- If user with email exists → create `OrganizationMember` directly
- If not → create pending invite, send email
- Cannot exceed `plan.maxTrainees` total members

**DELETE `/organizations/me/members/:memberId`**
- Owner cannot remove themselves → `400`
- Remove membership row

---

## Part B: Billing Module

### `apps/api/src/billing/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/billing/create-checkout` | JWT | Stripe Checkout Session |
| GET | `/billing/subscription` | JWT | Current subscription + usage |
| POST | `/billing/portal` | JWT | Stripe Customer Portal link |
| POST | `/billing/webhook` | **None** | Stripe webhook handler |
| PUT | `/billing/upgrade` | JWT | Change plan (proration) |
| DELETE | `/billing/cancel` | JWT | Cancel at period end |

### `POST /billing/create-checkout`
Body: `{ planCode: PlanCode }`
1. Load `Plan` by code → get Stripe Price ID from `Plan.featuresJson.stripePriceId`
2. Check if org already has a Stripe customer → create if not, store `stripeCustomerId` on `Subscription`
3. Create Stripe Checkout Session:
   - `mode: 'subscription'`
   - `success_url`, `cancel_url` from env
   - `metadata: { organizationId }`
4. Return `{ url: session.url }`

### `POST /billing/webhook`
No auth. Verify `Stripe-Signature` header with `env.STRIPE_WEBHOOK_SECRET`.
Handlers (all idempotent — check if already processed):

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update `Subscription` row; set plan, status ACTIVE |
| `customer.subscription.updated` | Update status, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd` |
| `customer.subscription.deleted` | Set `status = CANCELED`; block API via OrganizationGuard |
| `invoice.payment_succeeded` | Create `Invoice` row; set `paidAt`; if was PAST_DUE → set ACTIVE |
| `invoice.payment_failed` | Set `status = PAST_DUE`; create `Invoice` row; send dunning email via Resend |

### Seat Limit Enforcement Middleware

Create `apps/api/src/billing/guards/seat-limit.guard.ts`:
- Intercepts `POST /trainers/trainees/invite`
- Counts `OrganizationMember` rows where `orgId = req.user.orgId` and `roleKey = TRAINEE` and `status = active`
- Loads `Subscription` → `Plan.maxTrainees`
- Throws `402 Payment Required` with `{ code: 'SEAT_LIMIT_REACHED', current, max }` if over limit

---

## Plan Seeder

Add to `packages/db/prisma/seed.ts` (if not already there):
```typescript
await prisma.plan.upsert({
  where: { code: 'STARTER' },
  update: {},
  create: {
    code: 'STARTER',
    name: 'Starter',
    monthlyPrice: 60,
    maxTrainees: 20,
    featuresJson: {
      stripePriceId: 'price_starter_placeholder',
      features: ['20 active trainees', 'Workout builder', 'Nutrition planning', 'Progress tracking', 'Coach-trainee chat']
    }
  }
})
// Repeat for GROWTH ($100, 50 seats) and PRO ($200, 150 seats)
```

---

## Files Required

```
apps/api/src/organizations/
  organizations.module.ts
  organizations.controller.ts
  organizations.service.ts
  dto/update-organization.dto.ts
  dto/invite-member.dto.ts

apps/api/src/billing/
  billing.module.ts
  billing.controller.ts
  billing.service.ts
  webhook.service.ts
  guards/seat-limit.guard.ts
  dto/create-checkout.dto.ts
  dto/upgrade-plan.dto.ts
```

---

## Output Requirements

- All files complete, no placeholders
- Webhook endpoint returns `200` for all handled events
- `OrganizationGuard` blocks inactive subscriptions with `403`
- `SeatLimitGuard` blocks over-limit invites with `402`
