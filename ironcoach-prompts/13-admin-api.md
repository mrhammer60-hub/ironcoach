# Prompt 13 — Admin Module (API)

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–09 complete.
> **هذا الـ prompt ناقص من الحزمة الأصلية — أضفه بعد الخطوة 09.**

---

## Task

Build the complete Super Admin module. الأدمن هو مالك المنصة — يرى كل شيء عبر كل الـ organizations.

---

## Endpoints

### `apps/api/src/admin/`

جميع الـ endpoints تتطلب: `JwtAuthGuard` + `@Roles(RoleKey.ADMIN)`

لا يوجد `OrganizationGuard` هنا — الأدمن يتجاوز حدود الـ tenant.

---

### Dashboard & Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | Platform-wide KPIs |
| GET | `/admin/revenue` | Stripe MRR, ARR, churn, plan distribution |

**GET `/admin/dashboard`** returns:
```typescript
{
  totalOrganizations: number,
  activeSubscriptions: number,
  totalTrainers: number,
  totalTrainees: number,
  mrr: number,                    // Monthly Recurring Revenue in USD
  newOrgsThisMonth: number,
  churnedThisMonth: number,
  planDistribution: {
    STARTER: number,
    GROWTH: number,
    PRO: number
  },
  recentSignups: Array<{
    orgName: string,
    planCode: string,
    createdAt: string
  }>
}
```

**GET `/admin/revenue`** — pulls from Stripe API:
- MRR, ARR
- Active subscriptions count per plan
- Failed payments in last 30 days
- Churn rate (cancelled last 30 days / total active start of month)

---

### Coach (Organization) Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/coaches` | Paginated list of all organizations |
| GET | `/admin/coaches/:orgId` | Full org detail + subscription + trainee count |
| PUT | `/admin/coaches/:orgId/approve` | Approve pending organization |
| PUT | `/admin/coaches/:orgId/suspend` | Suspend org (blocks all API access) + email coach |
| PUT | `/admin/coaches/:orgId/unsuspend` | Restore access |
| DELETE | `/admin/coaches/:orgId` | Hard delete (GDPR — irreversible, requires confirmation token) |
| POST | `/admin/coaches/:orgId/impersonate` | Generate short-lived impersonation JWT (1 hour) for support |

**GET `/admin/coaches`** query params: `status?`, `plan?`, `search?`, `page?`, `limit?` (default 20)

Returns per org:
```typescript
{
  id, name, slug, ownerEmail, ownerName,
  plan: { code, name },
  subscription: { status, currentPeriodEnd, mrr },
  stats: { totalTrainees, activeTrainees, lastActivityAt },
  createdAt
}
```

**POST `/admin/coaches/:orgId/impersonate`**
- Creates impersonation JWT: payload `{ sub: ownerUserId, orgId, role: OWNER, isImpersonation: true, adminId }`
- Expires in 1 hour
- Logs to `AuditLog`: action `IMPERSONATE_ORG`, actorUserId = admin, entityId = orgId
- Returns `{ impersonationToken, expiresAt }`

---

### Exercise Library Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/exercises` | All global exercises |
| POST | `/admin/exercises` | Create global exercise (available to all coaches) |
| PUT | `/admin/exercises/:id` | Update global exercise |
| DELETE | `/admin/exercises/:id` | Delete (check no active workout day references it first) |
| POST | `/admin/exercises/:id/approve` | Approve coach-submitted exercise as global |

---

### Support

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/support` | All support tickets, paginated |
| GET | `/admin/support/:ticketId` | Ticket detail with conversation |
| PUT | `/admin/support/:ticketId/assign` | Assign to admin user |
| PUT | `/admin/support/:ticketId/resolve` | Mark resolved |
| POST | `/admin/support/:ticketId/reply` | Send reply (creates Message in support conversation) |

---

### Announcements & System

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/announcements` | Send push + email to filtered users |
| GET | `/admin/audit-logs` | Paginated audit log with filters |
| GET | `/admin/feature-flags` | List all feature flags |
| PUT | `/admin/feature-flags/:id` | Toggle flag on/off |
| GET | `/admin/system/health` | DB + Redis + Stripe connectivity check |

**POST `/admin/announcements`** body:
```typescript
{
  target: 'all_coaches' | 'all_trainees' | 'all_users' | 'plan_STARTER' | 'plan_GROWTH' | 'plan_PRO',
  title: string,
  body: string,
  sendPush: boolean,
  sendEmail: boolean,
  emailSubject?: string
}
```

Uses BullMQ to queue in batches of 100 (never blocks the request).

---

## Files Required

```
apps/api/src/admin/
  admin.module.ts
  admin.controller.ts
  admin.service.ts
  revenue.service.ts          ← Stripe API calls for MRR/ARR
  impersonation.service.ts    ← short-lived token generation
  dto/
    list-coaches.dto.ts
    suspend-org.dto.ts
    announcement.dto.ts
    reply-ticket.dto.ts
    list-audit-logs.dto.ts
```

---

## Security Rules

- All admin endpoints log to `AuditLog` via `AuditLogInterceptor`
- Impersonation tokens include `isImpersonation: true` in payload — UI must show a banner when active
- Hard delete requires body `{ confirmationPhrase: "DELETE {orgName}" }` — must match exactly
- Rate limit admin endpoints: max 60 req/min per admin user (add `@Throttle` decorator)

---

## Output Requirements

- All endpoints return correct data
- Impersonation JWT works with existing `JwtStrategy`
- Announcement queue processes in background without timing out
- `GET /admin/system/health` returns `{ postgres: 'ok', redis: 'ok', stripe: 'ok' }` or error detail
