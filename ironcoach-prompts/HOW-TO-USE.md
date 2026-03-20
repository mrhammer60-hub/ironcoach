# How To Use These Prompts With Claude Code

## الخطوات

### كل session جديدة — خطوتان لازمتان:

**الخطوة 1:** افتح `CLAUDE.md` وانسخ محتواه كاملاً في أول رسالة.

**الخطوة 2:** انسخ الـ prompt المطلوب (مثلاً `01-foundation.md`) في نفس الرسالة أو الرسالة التالية.

---

## ترتيب التنفيذ

```
CLAUDE.md  →  01  →  02  →  03  →  04  →  05  →  06  →  07  →  08  →  09  →  10  →  11  →  12
```

**لا تتخطى أي خطوة.** كل خطوة تعتمد على السابقة.

---

## بعد كل خطوة — حدّث CLAUDE.md

افتح `CLAUDE.md` وعدّل قسم **Current State**:

```
# قبل
✗ 01-foundation   — not started

# بعد إكمالها
✓ 01-foundation   — complete · monorepo running, docker-compose up, pnpm dev works
```

---

## نصائح للحصول على أفضل نتيجة

1. **خطوة واحدة في كل session** — لا تجمع أكثر من prompt واحد.

2. **إذا توقف Claude في منتصف الكود** اكتب:
   ```
   Continue from where you stopped. Complete the remaining files.
   ```

3. **إذا أنتج كوداً ناقصاً** اكتب:
   ```
   The following files are missing or incomplete: [list them].
   Write them now with no placeholders.
   ```

4. **إذا أخطأ في شيء** اكتب:
   ```
   CORRECTION: [describe the error].
   Fix only this specific issue without changing other files.
   ```

5. **للتحقق قبل الانتقال** اكتب:
   ```Before we move to step [N+1], confirm:
   - [list the expected outputs from the current step]
   Are all of these complete?
   
   ```

---

## ترتيب الأولوية لو وقت محدود

إذا أردت MVP سريع (بدون mobile):

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 10
```

يعطيك: API كامل + Web للمدرب والمتدرب + بدون mobile.

---

## الملفات في هذا الزيب

| ملف | المحتوى |
|-----|---------|
| `CLAUDE.md` | Context رئيسي — الصقه في بداية كل session |
| `01-foundation.md` | Monorepo + Docker + env setup |
| `02-database.md` | Prisma schema كامل (47 model) |
| `03-api-core.md` | NestJS bootstrap + guards + decorators |
| `04-auth.md` | Auth module كامل مع JWT rotation |
| `05-orgs-billing.md` | Organizations + Stripe billing |
| `06-trainees.md` | Trainer/Trainee modules + Calorie Engine |
| `07-workouts.md` | Exercise library + Program builder + Logging |
| `08-nutrition.md` | Meal plans + Food database + Macro tracking |
| `09-messaging.md` | Socket.io chat + Push notifications |
| `10-web.md` | Next.js 14 web app (Coach + Trainee + Admin) |
| `11-mobile.md` | Expo mobile app (offline-first) |
| `12-finalize.md` | Seed data + Tests + Docker + CI/CD + README |

---

## النواقص التي أُضيفت (بعد مراجعة الحزمة)

| الملف | ما كان ناقصاً |
|-------|--------------|
| `13-admin-api.md` | Admin API module كامل — لم يكن موجوداً أصلاً |
| `14-shared-package.md` | packages/shared مع كل Zod schemas — كان placeholder فقط |
| `15-security-performance.md` | Rate limiting، Helmet، Redis caching، N+1 prevention، BullMQ |
| `16-admin-web.md` | Admin portal في الـ web — كان 3 أسطر فقط في Prompt 10 |
| `17-email-templates.md` | 14 email template كامل — لم تكن مكتوبة |
| `18-progress-checkins.md` | Progress tracking و Check-ins كـ module مستقل |
| `19-subdomain-routing.md` | Subdomain routing في Next.js middleware + Vercel wildcard config |
| `20-api-client.md` | Typed API client مع auto token refresh + TanStack Query setup |
| `21-file-upload-security.md` | MIME validation، size limits، safe key generation، cleanup jobs |
| `22-packages-ui.md` | packages/ui: كل المكونات المشتركة + hooks |

## نواقص أُصلحت داخل الملفات الموجودة

| الملف | التعديل |
|-------|---------|
| `02-database.md` | أُضيفت 4 models ناقصة: InviteToken، StrengthPR، OrganizationSetting، MediaAsset |
| `01-foundation.md` | قائمة env variables موسّعة من 17 إلى 35+ متغير مع groups وcomments |
| `04-auth.md` | أُضيف endpoint كامل `POST /auth/accept-invite` لتفعيل حساب المتدرب |

## الترتيب الصحيح النهائي (22 خطوة)

```
01 → 02 → 14 → 22 → 20 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 21 → 15 → 13 → 17 → 18 → 10 → 19 → 16 → 11 → 12
```

---

## النواقص التي أُضيفت — الجولة الثالثة

| الملف | ما كان ناقصاً |
|-------|--------------|
| `23-webhook-idempotency.md` | جدول ProcessedStripeEvent + handler يمنع المعالجة المزدوجة |
| `24-socket-reconnection.md` | Reconnect logic، missed message sync، offline message queue |
| `25-timezone-dates.md` | UTC storage في DB، تحويل محلي في UI، scheduler timezone-aware |
| `26-error-pages-loading.md` | error.tsx، loading.tsx، not-found.tsx، Suspense boundaries |
| `27-landing-page.md` | صفحة تسويقية كاملة + SEO + sitemap + robots.txt |
| `28-eas-build-appstore.md` | eas.json، app.config.ts، CI/CD mobile، محتوى App Store |
| `29-copy-duplicate-plans.md` | نسخ برامج التدريب وخطط التغذية + templates system |
| `30-notif-preferences.md` | إعدادات الإشعارات، quiet hours، per-type toggles |

## الترتيب النهائي الكامل — 30 خطوة

```
01 → 02 → 14 → 22 → 20 → 25 → 03 → 04 → 05 → 23 → 06 → 07 → 29 → 08 → 09 → 30 → 24 → 21 → 15 → 13 → 17 → 18 → 10 → 26 → 27 → 19 → 16 → 11 → 28 → 12
```
