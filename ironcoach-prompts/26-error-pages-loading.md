# Prompt 26 — Error Pages, Loading States & Empty States

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 10 complete (Next.js app built), Step 22 complete (UI components exist).
> **أضفه بعد الخطوة 22.**

---

## Task

بناء كل صفحات الـ error وloading وempty states في Next.js App Router والـ mobile — هذه مطلوبة لتجربة مستخدم احترافية.

---

## Part A: Next.js App Router Special Files

### `apps/web/app/error.tsx` (Global Error Boundary)

```tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-xl font-bold text-[#e8e8f2] mb-3">حدث خطأ غير متوقع</h1>
        <p className="text-[#7878a0] text-sm mb-6 leading-relaxed">
          نعتذر عن هذا الخطأ. تم إبلاغ الفريق التقني تلقائياً.
          {error.digest && (
            <span className="block mt-2 font-mono text-xs text-[#4a4a6a]">
              رمز الخطأ: {error.digest}
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-semibold text-sm"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-[rgba(255,255,255,0.10)] text-[#7878a0] rounded-[9px] text-sm"
          >
            الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  )
}
```

### `apps/web/app/not-found.tsx`

```tsx
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="font-[Syne] text-8xl font-bold text-[#1a1a26] mb-4 select-none">404</div>
        <h1 className="text-xl font-bold text-[#e8e8f2] mb-3">الصفحة غير موجودة</h1>
        <p className="text-[#7878a0] text-sm mb-6">الرابط الذي تبحث عنه غير موجود أو تم نقله.</p>
        <a href="/" className="inline-flex px-5 py-2.5 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-semibold text-sm">
          العودة للرئيسية
        </a>
      </div>
    </div>
  )
}
```

### `apps/web/app/(coach)/loading.tsx`

```tsx
export default function CoachLoading() {
  return (
    <div className="p-6">
      {/* Stats row skeleton */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5">
            <div className="w-9 h-9 rounded-[9px] bg-[#1a1a26] animate-pulse mb-3" />
            <div className="h-7 w-16 bg-[#1a1a26] rounded animate-pulse mb-2" />
            <div className="h-3 w-24 bg-[#1a1a26] rounded animate-pulse" />
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-[1fr_360px] gap-4">
        <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] overflow-hidden">
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
            <div className="h-4 w-32 bg-[#1a1a26] rounded animate-pulse" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 border-b border-[rgba(255,255,255,0.03)]">
              <div className="w-8 h-8 rounded-full bg-[#1a1a26] animate-pulse" />
              <div className="flex-1">
                <div className="h-3.5 w-32 bg-[#1a1a26] rounded animate-pulse mb-1.5" />
                <div className="h-3 w-20 bg-[#1a1a26] rounded animate-pulse" />
              </div>
              <div className="h-5 w-14 rounded-full bg-[#1a1a26] animate-pulse" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] h-48 animate-pulse" />
          <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] h-36 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
```

### `apps/web/app/(trainee)/loading.tsx`

```tsx
export default function TraineeLoading() {
  return (
    <div className="max-w-[440px] mx-auto p-6 space-y-4">
      {/* Hero card skeleton */}
      <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5 h-40 animate-pulse" />
      {/* Workout card skeleton */}
      <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5 h-48 animate-pulse" />
      {/* Macro strip skeleton */}
      <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4 h-24 animate-pulse" />
    </div>
  )
}
```

---

## Part B: Route-Level Error Boundaries

### `apps/web/app/(coach)/error.tsx`

```tsx
'use client'
export default function CoachError({ error, reset }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">🔧</div>
        <h2 className="text-base font-bold text-[#e8e8f2] mb-2">خطأ في تحميل البيانات</h2>
        <p className="text-[#7878a0] text-sm mb-4">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-semibold text-sm">
          إعادة المحاولة
        </button>
      </div>
    </div>
  )
}
```

Create the same file at:
- `apps/web/app/(trainee)/error.tsx`
- `apps/web/app/(admin)/error.tsx`
- `apps/web/app/branded/[subdomain]/error.tsx`

---

## Part C: Suspense Boundaries in Pages

Wrap data-fetching sections in `<Suspense>`:

```tsx
// In apps/web/app/(coach)/dashboard/page.tsx
import { Suspense } from 'react'
import { SkeletonTableRow } from '@ironcoach/ui'

export default function DashboardPage() {
  return (
    <div className="p-6">
      {/* Stats load fast from cache — no suspense needed */}
      <Suspense fallback={<StatsRowSkeleton />}>
        <StatsRow />
      </Suspense>

      <div className="grid grid-cols-[1fr_360px] gap-4 mt-5">
        <Suspense fallback={<TraineesTableSkeleton />}>
          <RecentTraineesTable />
        </Suspense>
        <Suspense fallback={<ActivitySkeleton />}>
          <ActivityFeed />
        </Suspense>
      </div>
    </div>
  )
}
```

---

## Part D: Empty State Definitions

Define all empty states clearly. Use the `EmptyState` component from `packages/ui`.

| Screen | Trigger | Icon | Title | Description | Action |
|--------|---------|------|-------|-------------|--------|
| Trainees list | 0 trainees | 👥 | "لا يوجد متدربون بعد" | "أضف أول متدرب لك وابدأ رحلة التدريب" | "إضافة متدرب" |
| Workout builder (day) | 0 exercises | 💪 | "اليوم فارغ" | "اختر تمارين من المكتبة يساراً أو اضغط +" | "إضافة تمرين" |
| Exercise library | No results | 🔍 | "لا توجد نتائج" | "جرب بحثاً مختلفاً أو أنشئ تمريناً جديداً" | "إنشاء تمرين" |
| Chat inbox | 0 conversations | 💬 | "لا توجد محادثات" | "ستظهر محادثاتك مع المتدربين هنا" | null |
| Check-ins | 0 pending | ✅ | "لا توجد تسجيلات جديدة" | "كل التسجيلات تمت مراجعتها" | null |
| Trainee today (no plan) | No active plan | 📋 | "لا يوجد برنامج تدريبي" | "انتظر حتى يُعيّن مدربك برنامجاً لك" | null |
| Nutrition (no plan) | No active plan | 🥗 | "لا توجد خطة غذائية" | "سيُعيّن مدربك خطتك الغذائية قريباً" | null |
| Progress photos | 0 photos | 📷 | "لا توجد صور بعد" | "أرسل صور تقدمك لمتابعة نتائجك" | "إضافة صور" |
| Food search | No results | 🍽 | "لا توجد نتائج" | "لم يُعثر على هذا الطعام في قاعدة البيانات" | null |

---

## Part E: Mobile Error + Loading (React Native)

### `apps/mobile/components/shared/ErrorState.tsx`

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export function ErrorState({
  message = 'حدث خطأ ما',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <View style={s.container}>
      <Text style={s.icon}>⚠️</Text>
      <Text style={s.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={s.btn} onPress={onRetry}>
          <Text style={s.btnText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
```

### Wrap all screens with error handling:

```tsx
// In every mobile screen:
const { data, isLoading, error, refetch } = useQuery(...)

if (isLoading) return <LoadingSkeleton />
if (error) return <ErrorState message="فشل تحميل البيانات" onRetry={refetch} />
if (!data) return <EmptyState title="لا توجد بيانات" />
```

---

## Output Requirements

- `pnpm build` succeeds with all special files present
- 404 page styled and matches brand
- Every list page has an empty state
- Skeletons match the exact layout of the loaded content (no layout shift)
- `Suspense` boundaries prevent full-page loading spinners
- Mobile screens never show blank screens — always show skeleton or error
