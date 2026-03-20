# Prompt 17 — Email Templates (React Email + Resend)

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 09 complete (NotificationService exists).
> **هذا الـ prompt ناقص من الحزمة الأصلية.**

---

## Task

Build all transactional email templates using React Email, and wire them into the notification triggers.

---

## Setup

```bash
pnpm add @react-email/components react-email
pnpm add resend
```

### File structure

```
apps/api/src/emails/
  templates/
    welcome-coach.tsx
    welcome-trainee.tsx
    invite-trainee.tsx
    reset-password.tsx
    verify-email.tsx
    subscription-confirmed.tsx
    payment-failed.tsx
    dunning-day3.tsx
    dunning-day7.tsx
    workout-assigned.tsx
    nutrition-assigned.tsx
    weekly-summary.tsx           ← sent to coaches every Monday
    subscription-expiring.tsx
    account-suspended.tsx
  email.service.ts
  email.module.ts
  previews/                      ← React Email preview server
```

---

## `email.service.ts`

```typescript
import { Resend } from 'resend'

@Injectable()
export class EmailService {
  private resend = new Resend(env.RESEND_API_KEY)
  private from = 'IronCoach <noreply@ironcoach.com>'

  async send<T extends Record<string, unknown>>(
    to: string,
    template: EmailTemplate,
    props: T
  ): Promise<void> {
    const { subject, html } = await this.render(template, props)
    await this.resend.emails.send({ from: this.from, to, subject, html })
  }
}
```

---

## Templates Required

### 1. `welcome-coach.tsx`
**Subject:** "مرحباً بك في IronCoach 🏋️ — ابدأ رحلتك الاحترافية"
**Content:**
- Logo + hero: "حساب مدربك جاهز"
- اسم المدرب
- زر CTA: "ادخل للوحة التحكم"
- 3 خطوات البدء: أضف متدربيك، ابنِ برامجك، تابع تقدمهم
- Footer: unsubscribe link

### 2. `welcome-trainee.tsx`
**Subject:** "وصلتك دعوة من مدربك على IronCoach 💪"
**Content:**
- اسم المتدرب + اسم المدرب
- زر CTA: "اكمل تسجيلك"
- ما يمكنه فعله: تمارين، تغذية، تواصل مع المدرب
- رابط التطبيق (App Store + Play Store)

### 3. `invite-trainee.tsx`
**Subject:** "دعوة للانضمام إلى [Coach Name] على IronCoach"
**Content:**
- "دعاك [Coach Name] للانضمام كمتدرب"
- زر: "قبول الدعوة" → link يحتوي invite token
- الدعوة تنتهي خلال 7 أيام

### 4. `reset-password.tsx`
**Subject:** "إعادة تعيين كلمة المرور — IronCoach"
**Content:**
- "طلبت إعادة تعيين كلمة المرور"
- زر CTA: "إعادة تعيين كلمة المرور" (صالح لمدة ساعة)
- "إذا لم تطلب هذا، تجاهل الإيميل"

### 5. `verify-email.tsx`
**Subject:** "تأكيد بريدك الإلكتروني — IronCoach"
- رابط تأكيد صالح 24 ساعة

### 6. `subscription-confirmed.tsx`
**Subject:** "اشتراكك مفعّل ✅ — IronCoach [Plan Name]"
**Content:**
- تفاصيل الخطة: الاسم، السعر، عدد المتدربين
- تاريخ التجديد التالي
- زر: "ابدأ الآن"
- ملاحظة: يمكن إلغاء الاشتراك في أي وقت

### 7. `payment-failed.tsx`
**Subject:** "⚠️ فشل سداد اشتراكك — IronCoach"
**Content:**
- "لم نتمكن من خصم رسوم الاشتراك"
- آخر 4 أرقام البطاقة
- زر: "تحديث بيانات الدفع"
- "سيتوقف الوصول خلال 7 أيام إذا لم يُحل الأمر"

### 8. `dunning-day3.tsx`
**Subject:** "تذكير: تجديد اشتراكك IronCoach"
- نفس محتوى payment-failed لكن بنبرة أهدأ
- "متبقي 4 أيام قبل إيقاف الوصول"

### 9. `dunning-day7.tsx`
**Subject:** "🚨 سيُوقف حسابك غداً — IronCoach"
- نبرة عاجلة
- "سيُوقف وصولك ومتدربيك غداً"
- زر: "تحديث الدفع الآن"

### 10. `workout-assigned.tsx`
**Subject:** "وصلك برنامج تدريبي جديد 💪"
**Target:** Trainee
- اسم البرنامج + المدرب
- عدد الأسابيع + الأيام في الأسبوع
- زر: "عرض البرنامج"

### 11. `nutrition-assigned.tsx`
**Subject:** "وصلتك خطة غذائية جديدة 🥗"
**Target:** Trainee
- اسم الخطة + إجمالي السعرات
- زر: "عرض الخطة"

### 12. `weekly-summary.tsx`
**Subject:** "ملخص أسبوعك — IronCoach 📊"
**Target:** Coach — يُرسل كل إثنين الساعة 9 صباحاً
**Content:**
- عدد الجلسات المكتملة هذا الأسبوع / المتوقعة
- المتدربون غير النشطين (لم يتمرنوا منذ 4+ أيام) → قائمة بأسمائهم
- تسجيلات وصول جديدة تنتظر المراجعة
- زر: "اذهب للوحة التحكم"

### 13. `subscription-expiring.tsx`
**Subject:** "اشتراكك ينتهي خلال 3 أيام — IronCoach"
- تاريخ الانتهاء
- زر: "تجديد الاشتراك"

### 14. `account-suspended.tsx`
**Subject:** "تم تعليق حسابك على IronCoach"
**Target:** Coach (عند تعليق الأدمن)
- "تم تعليق حسابك بسبب: [reason]"
- "للاستفسار: support@ironcoach.com"

---

## Design System for All Templates

```tsx
// packages/shared/email-theme.ts
export const theme = {
  colors: {
    primary: '#c8f135',      // lime
    background: '#0d0d12',   // dark
    surface: '#13131c',
    text: '#e8e8f2',
    textMuted: '#7878a0',
    danger: '#ff4f7b',
    success: '#2de8c8',
  },
  fonts: {
    // Use system fonts for email compatibility
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
}
```

---

## Wire Into Services

| Event | Service | Template |
|-------|---------|----------|
| Coach registers | `AuthService.register` | `welcome-coach` |
| Trainee invited | `TrainersService.invite` | `invite-trainee` + `welcome-trainee` |
| Password reset | `AuthService.forgotPassword` | `reset-password` |
| Stripe checkout done | `BillingWebhookService` | `subscription-confirmed` |
| Payment failed | `BillingWebhookService` | `payment-failed` |
| Day +3 still failed | BullMQ dunning job | `dunning-day3` |
| Day +7 still failed | BullMQ dunning job | `dunning-day7` |
| Workout assigned | `WorkoutProgramsService.assign` | `workout-assigned` |
| Nutrition assigned | `NutritionService.assign` | `nutrition-assigned` |
| Every Monday 9am | Scheduled BullMQ job | `weekly-summary` |
| 3 days before renewal | Scheduled BullMQ job | `subscription-expiring` |
| Admin suspends org | `AdminService.suspend` | `account-suspended` |

---

## Output Requirements

- All 14 templates render correctly in `react-email` preview
- Arabic text renders RTL in email clients (add `dir="rtl"` to containers)
- All templates dark-themed matching the IronCoach brand
- `EmailService.send()` queues via BullMQ (`emails` queue) — never blocks the request
- Preview server accessible: `pnpm email:preview` → opens at `localhost:3002`
