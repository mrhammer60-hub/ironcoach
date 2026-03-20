# Prompt 27 — Landing & Marketing Pages

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 10 complete (Next.js app exists).
> **أضفه بعد الخطوة 10.**

---

## Task

بناء الموقع التسويقي `ironcoach.com` — الصفحة الرئيسية، Pricing، وصفحة بعد نجاح الـ checkout.

---

## Structure

```
apps/web/app/
  (marketing)/
    layout.tsx          ← navigation bar + footer
    page.tsx            ← Home / Landing
    pricing/page.tsx    ← Pricing plans
    features/page.tsx   ← Feature details
    billing/
      success/page.tsx  ← After Stripe checkout success
      cancel/page.tsx   ← After Stripe checkout cancel
  sitemap.ts
  robots.ts
```

---

## `(marketing)/layout.tsx`

```tsx
export default function MarketingLayout({ children }) {
  return (
    <>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </>
  )
}
```

### `MarketingNav` component:
- Logo (IronCoach) — links to `/`
- Links: المميزات | الأسعار | تسجيل الدخول
- CTA button: "ابدأ مجاناً" → `/register`
- Sticky, dark background, blurred

---

## `(marketing)/page.tsx` — Landing Page

### Section 1: Hero

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   منصة التدريب الاحترافية للمدربين                      │
│   المميزين                                             │
│                                                        │
│   أدِر متدربيك، ابنِ برامجهم، وتابع تقدمهم            │
│   — كل شيء في مكان واحد.                              │
│                                                        │
│   [ابدأ مجاناً]  [شاهد كيف يعمل]                       │
│                                                        │
│   ✓ لا يوجد بطاقة ائتمان   ✓ إلغاء في أي وقت          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Stats bar below hero:
- +500 مدرب نشط | +12,000 متدرب | 4.9★ تقييم

### Section 2: Problem → Solution

```
المشكلة:                      الحل مع IronCoach:
✗ WhatsApp لمتابعة التمارين  → ✓ خطط تدريبية احترافية
✗ Excel لتتبع التقدم         → ✓ تقارير تلقائية
✗ رسائل متفرقة              → ✓ Chat مدمج
✗ وقت ضائع في الحسابات      → ✓ حاسبة سعرات تلقائية
```

### Section 3: Features Grid (3×2)

```
💪 بناء البرامج           🥗 خطط التغذية        📈 تتبع التقدم
باني سحب وإفلات          ماكرو تلقائي          رسوم بيانية
مكتبة 80+ تمرين          5 وجبات يومية         قياسات أسبوعية

💬 تواصل مباشر            📱 تطبيق للمتدرب       ⚡ توفير الوقت
Chat فوري                iOS & Android          80% أقل وقت إداري
إشعارات فورية            Offline support        لكل متدرب
```

### Section 4: How It Works (3 steps)

```
1 ← سجّل واختر خطتك
    في أقل من 5 دقائق

2 ← أضف متدربيك وابنِ برامجهم
    مكتبة تمارين جاهزة وبناء سهل

3 ← تابع وتواصل
    تقارير تلقائية وchat مدمج
```

### Section 5: Social Proof

3 testimonial cards:
```
"IronCoach وفّر عليّ 10 ساعات أسبوعياً"
— أحمد، مدرب في الرياض · 45 متدرب

"أخيراً منصة عربية احترافية"
— سارة، مدربة في دبي · 28 متدرب

"متدربيني أكثر التزاماً منذ استخدمت IronCoach"
— خالد، مدرب في الكويت · 60 متدرب
```

### Section 6: Pricing Preview

3 cards (Starter / Growth / Pro) مختصرة مع "عرض كل التفاصيل" → `/pricing`

### Section 7: CTA Banner

```
ابدأ رحلتك المهنية اليوم
جرّب IronCoach مجاناً لـ 14 يوم — لا حاجة لبطاقة ائتمان

[ابدأ مجاناً الآن]
```

---

## `(marketing)/pricing/page.tsx`

### Pricing Table

```tsx
const plans = [
  {
    name: 'Starter',
    nameAr: 'المبتدئ',
    price: 60,
    trainees: 20,
    features: [
      '20 متدرب نشط',
      'باني برامج التدريب',
      'خطط التغذية',
      'تتبع التقدم',
      'Chat مع المتدربين',
      'مساحة مخصصة ببراندك',
    ],
    cta: 'ابدأ بـ Starter',
    popular: false,
  },
  {
    name: 'Growth',
    nameAr: 'النمو',
    price: 100,
    trainees: 50,
    features: [
      'كل ما في Starter',
      '50 متدرب نشط',
      'تحليلات متقدمة',
      'قوالب وجبات مخصصة',
      'دعم أولوية',
      'تقارير PDF',
    ],
    cta: 'ابدأ بـ Growth',
    popular: true,
  },
  {
    name: 'Pro',
    nameAr: 'الاحترافي',
    price: 200,
    trainees: 150,
    features: [
      'كل ما في Growth',
      '150 متدرب نشط',
      'White-label كامل',
      'وصول API',
      'مدربون مساعدون',
      'دعم مخصص',
    ],
    cta: 'ابدأ بـ Pro',
    popular: false,
  },
]
```

Monthly / Yearly toggle:
- Yearly: خصم 20% — "وفّر شهرين"

FAQ section below pricing:
- هل يوجد نسخة تجريبية مجانية؟ نعم، 14 يوم.
- هل يمكنني تغيير الخطة لاحقاً؟ نعم، في أي وقت.
- هل البيانات محفوظة عند إلغاء الاشتراك؟ نعم، لمدة 30 يوم.
- هل التطبيق متاح بالعربية؟ نعم، عربي وإنجليزي.

---

## `billing/success/page.tsx`

```tsx
export default function BillingSuccess() {
  // Read plan from URL: /billing/success?plan=growth
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-6">🎉</div>
      <h1>مرحباً بك في IronCoach!</h1>
      <p>اشتراكك فعّال. ابدأ بإضافة متدربيك الآن.</p>
      <a href="/coach/dashboard">اذهب للوحة التحكم →</a>
    </div>
  )
}
```

---

## SEO

### `apps/web/app/layout.tsx` — Root metadata

```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://ironcoach.com'),
  title: { default: 'IronCoach — منصة التدريب الاحترافية', template: '%s | IronCoach' },
  description: 'منصة SaaS للمدربين الرياضيين — بناء برامج، خطط تغذية، وتتبع تقدم المتدربين.',
  keywords: ['مدرب رياضي', 'برامج تدريب', 'تغذية', 'bodybuilding', 'coaching app'],
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    siteName: 'IronCoach',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', site: '@ironcoach' },
  robots: { index: true, follow: true },
}
```

### `apps/web/app/sitemap.ts`

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://ironcoach.com', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://ironcoach.com/pricing', changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://ironcoach.com/features', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://ironcoach.com/register', changeFrequency: 'yearly', priority: 0.7 },
  ]
}
```

### `apps/web/app/robots.ts`

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/coach/', '/admin/', '/trainee/', '/api/'] },
    sitemap: 'https://ironcoach.com/sitemap.xml',
  }
}
```

---

## Output Requirements

- Landing page loads in < 2s (static generation, no client-side data fetching)
- Pricing page has monthly/yearly toggle working
- SEO metadata present on all marketing pages
- `robots.txt` blocks auth-required routes from indexing
- `sitemap.xml` accessible at `ironcoach.com/sitemap.xml`
- All marketing pages fully static (`export const dynamic = 'force-static'`)
