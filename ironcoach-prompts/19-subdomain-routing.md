# Prompt 19 — Subdomain Routing & Branded Coach Spaces

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 10 complete (Next.js app built).
> **هذا الـ prompt ناقص كلياً من الحزمة الأصلية.**

---

## Task

كل مدرب يملك subdomain خاص به: `ahmed.ironcoach.com`
المتدرب يفتح هذا الرابط ويرى branded space خاص بمدربه — شعاره، اسمه، وصفحة تسجيل دخول بألوانه.

---

## Part A: Vercel Wildcard Domain Setup

### `vercel.json` في `apps/web/`

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ]
}
```

في Vercel Dashboard:
- أضف domain: `*.ironcoach.com` (wildcard)
- Primary domain: `ironcoach.com`
- DNS: CNAME `*` → `cname.vercel-dns.com`

---

## Part B: Next.js Middleware — Subdomain Detection

### `apps/web/middleware.ts` — استبدل الـ middleware الحالي بهذا

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/accept-invite', '/favicon.ico', '/_next', '/api']
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'ironcoach.com'

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') ?? ''
  const pathname = req.nextUrl.pathname

  // ── 1. Extract subdomain ──────────────────────────────
  // ahmed.ironcoach.com  → subdomain = "ahmed"
  // ironcoach.com        → subdomain = null (main app)
  // localhost:3000        → subdomain = null
  const isMainDomain =
    hostname === MAIN_DOMAIN ||
    hostname === `www.${MAIN_DOMAIN}` ||
    hostname.startsWith('localhost')

  const subdomain = isMainDomain
    ? null
    : hostname.replace(`.${MAIN_DOMAIN}`, '').replace(/:.*/, '')

  // ── 2. Subdomain route → Coach Branded Space ──────────
  if (subdomain) {
    // Rewrite to /[subdomain]/... internally
    // The user sees ahmed.ironcoach.com/login
    // Next.js serves app/(branded)/[subdomain]/login/page.tsx
    const url = req.nextUrl.clone()
    url.pathname = `/branded/${subdomain}${pathname}`
    return NextResponse.rewrite(url)
  }

  // ── 3. Main domain auth protection ───────────────────
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if (isPublicPath) return NextResponse.next()

  const token = req.cookies.get('ironcoach_access')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Role-based redirect
    const role = payload.role as string
    if (pathname === '/') {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      if (role === 'TRAINEE') return NextResponse.redirect(new URL('/trainee/today', req.url))
      return NextResponse.redirect(new URL('/coach/dashboard', req.url))
    }

    // Guard route groups
    if (pathname.startsWith('/coach') && role === 'TRAINEE') {
      return NextResponse.redirect(new URL('/trainee/today', req.url))
    }
    if (pathname.startsWith('/trainee') && (role === 'TRAINER' || role === 'OWNER')) {
      return NextResponse.redirect(new URL('/coach/dashboard', req.url))
    }
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.delete('ironcoach_access')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Part C: Branded Space Pages

### Structure

```
apps/web/app/
  branded/
    [subdomain]/
      layout.tsx          ← fetches org by subdomain, provides brand context
      page.tsx            ← landing/login for this coach's space
      login/page.tsx      ← branded login
      register/page.tsx   ← trainee registration (via invite)
      accept-invite/page.tsx  ← accept invite + set password
```

### `branded/[subdomain]/layout.tsx`

```typescript
// Fetch org branding at build time (ISR, revalidate every 60s)
export async function generateMetadata({ params }) {
  const org = await fetchOrgBySubdomain(params.subdomain)
  if (!org) notFound()
  return {
    title: `${org.name} — Powered by IronCoach`,
    description: org.bio ?? `تدريب احترافي مع ${org.name}`,
  }
}

export default async function BrandedLayout({ children, params }) {
  const org = await fetchOrgBySubdomain(params.subdomain)
  if (!org) notFound()

  return (
    <BrandProvider org={org}>
      <div style={{ '--brand-color': org.brandColor ?? '#c8f135' } as React.CSSProperties}>
        {children}
      </div>
    </BrandProvider>
  )
}
```

### `branded/[subdomain]/page.tsx` (Landing)

```
┌──────────────────────────────────────────────┐
│  [Coach Logo]                                │
│                                              │
│  مرحباً في [Coach Name]                       │
│  [Coach Bio]                                 │
│                                              │
│  [زر: تسجيل الدخول]   [زر: لدي دعوة]        │
│                                              │
│  Powered by IronCoach                        │
└──────────────────────────────────────────────┘
```

### `branded/[subdomain]/login/page.tsx`

- نفس صفحة login لكن بـ branded header
- بعد login ناجح: redirect لـ `/trainee/today`
- لون الـ CTA button يأخذ `var(--brand-color)` من الـ org

### `branded/[subdomain]/accept-invite/page.tsx`

- يقرأ `?token=...` من الـ URL
- يعرض form: كلمة المرور + تأكيد كلمة المرور
- يستدعي `POST /auth/accept-invite`
- بعد النجاح: redirect لـ `/trainee/today`

---

## Part D: API Endpoint لجلب الـ Org بالـ Subdomain

أضف لـ `apps/api/src/organizations/organizations.controller.ts`:

```typescript
// Public endpoint — no auth needed
@Get('by-subdomain/:subdomain')
@Public()
async getBySubdomain(@Param('subdomain') subdomain: string) {
  const org = await this.organizationsService.findBySubdomain(subdomain)
  if (!org) throw new NotFoundException()
  // Return only public branding fields — never expose private data
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.settings?.brandLogoUrl,
    brandColor: org.settings?.brandPrimaryColor ?? '#c8f135',
    bio: org.trainerProfile?.bio,
    subdomain: org.subdomain,
  }
}
```

Cache this response in Redis: `cache:org:subdomain:{subdomain}` — TTL 5 minutes.
Invalidate on `PUT /organizations/me` that updates branding.

---

## Part E: BrandProvider Context

### `apps/web/components/branded/brand-provider.tsx`

```typescript
'use client'

interface BrandContext {
  orgId: string
  orgName: string
  logoUrl: string | null
  brandColor: string
  subdomain: string
}

const BrandContext = createContext<BrandContext | null>(null)

export function BrandProvider({ org, children }) {
  return (
    <BrandContext.Provider value={org}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used within BrandProvider')
  return ctx
}
```

---

## Part F: Add NEXT_PUBLIC_ROOT_DOMAIN to env

في `packages/config/src/env.ts` أضف:
```
NEXT_PUBLIC_ROOT_DOMAIN=ironcoach.com   # production
# local dev: leave empty — subdomain routing skipped on localhost
```

---

## Local Development Note

On localhost, subdomain routing doesn't work via browser.
For local testing of branded spaces, add to `/etc/hosts`:
```
127.0.0.1  ahmed.localhost
```
Then visit `http://ahmed.localhost:3000` — middleware detects `ahmed` as subdomain.

Document this in README.md under "Testing Branded Spaces Locally".

---

## Output Requirements

- `ahmed.ironcoach.com` shows Ahmed's branded login page
- Trainee logs in on subdomain → redirected to `/trainee/today`
- Accept invite page works on subdomain
- `GET /organizations/by-subdomain/ahmed` returns branding data only (no private fields)
- ISR revalidates branding every 60 seconds
- Local dev instructions documented
