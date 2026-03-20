# Prompt 25 — Timezone & Date Handling

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 03 complete (API core exists).
> **أضفه بعد الخطوة 03 — قبل بناء أي feature يعتمد على التوقيت.**

---

## The Problem

المنصة تخدم مدربين ومتدربين في مناطق زمنية مختلفة (بشكل رئيسي الخليج GMT+3، لكن أيضاً GMT+4 Dubai، GMT+2 مصر).

بدون timezone handling صحيح:
- المدرب يضبط reminder الساعة 8 صباحاً → يصل الساعة 5 صباحاً
- "تمرين اليوم" يتغير في منتصف الليل UTC بدل منتصف الليل المحلي
- تقارير الأسبوعية تحسب من الأحد UTC بدل الأحد المحلي
- scheduled jobs تعمل في الوقت الخاطئ

---

## Rule: UTC in DB, Local in UI

**قاعدة واحدة لكل المشروع:**
- كل `DateTime` في Prisma schema = UTC
- كل timestamp يُخزَّن بـ UTC
- التحويل للتوقيت المحلي يحدث فقط في الـ UI layer (web/mobile)
- الـ API يُرسل ويستقبل ISO 8601 strings (UTC)

---

## Part A: User Timezone Storage

### أضف لـ `User` model في schema.prisma

```prisma
model User {
  // ... existing fields
  timezone  String  @default("Asia/Riyadh")  // IANA timezone string
}
```

### Enum-like constants in `packages/shared/src/constants/timezones.ts`

```typescript
// Supported timezones (add more as needed)
export const SUPPORTED_TIMEZONES = [
  { value: 'Asia/Riyadh',   label: 'الرياض (GMT+3)',    offset: '+03:00' },
  { value: 'Asia/Dubai',    label: 'دبي (GMT+4)',        offset: '+04:00' },
  { value: 'Africa/Cairo',  label: 'القاهرة (GMT+2)',    offset: '+02:00' },
  { value: 'Asia/Kuwait',   label: 'الكويت (GMT+3)',     offset: '+03:00' },
  { value: 'Asia/Bahrain',  label: 'البحرين (GMT+3)',    offset: '+03:00' },
  { value: 'Asia/Qatar',    label: 'قطر (GMT+3)',        offset: '+03:00' },
  { value: 'Europe/London', label: 'لندن (GMT+0/+1)',    offset: '+00:00' },
] as const

export type SupportedTimezone = typeof SUPPORTED_TIMEZONES[number]['value']
```

### Detect on registration (web)

```typescript
// In register form:
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
// Include in POST /auth/register body
```

---

## Part B: Date Utilities — `packages/shared/src/utils/date.ts`

```typescript
/**
 * All functions accept UTC Date/string, return formatted string in user's timezone.
 * Uses Intl.DateTimeFormat — no external dependencies.
 */

export function formatDate(
  utcDate: Date | string,
  timezone: string,
  locale: 'ar' | 'en' = 'ar',
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatTime(
  utcDate: Date | string,
  timezone: string,
  locale: 'ar' | 'en' = 'ar',
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatRelative(
  utcDate: Date | string,
  timezone: string,
  locale: 'ar' | 'en' = 'ar',
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar' : 'en', { numeric: 'auto' })

  const diffMs = date.getTime() - Date.now()
  const diffMins = Math.round(diffMs / 60_000)
  const diffHours = Math.round(diffMs / 3_600_000)
  const diffDays = Math.round(diffMs / 86_400_000)

  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute')
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  return rtf.format(diffDays, 'day')
}

/**
 * Get the start of "today" in the user's timezone, as UTC Date.
 * Used for "today's workout" queries.
 */
export function getTodayInTimezone(timezone: string): { start: Date; end: Date } {
  const now = new Date()

  // Get current date parts in user's timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)

  const year  = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1
  const day   = parseInt(parts.find(p => p.type === 'day')!.value)

  // Midnight in user's timezone, converted to UTC
  const startLocal = new Date(Date.UTC(year, month, day, 0, 0, 0))
  const endLocal   = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))

  // Adjust for timezone offset
  const offsetMs = getTimezoneOffsetMs(timezone, now)
  return {
    start: new Date(startLocal.getTime() - offsetMs),
    end:   new Date(endLocal.getTime() - offsetMs),
  }
}

function getTimezoneOffsetMs(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate  = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  return utcDate.getTime() - tzDate.getTime()
}

/**
 * Convert a "local time" like "08:00" in a given timezone to next UTC occurrence.
 * Used for scheduling notifications.
 */
export function nextOccurrenceUTC(
  localTime: string,  // "HH:MM" format
  timezone: string,
): Date {
  const [hours, minutes] = localTime.split(':').map(Number)
  const now = new Date()

  // Get today's date in user timezone
  const { start } = getTodayInTimezone(timezone)
  const candidate = new Date(start)
  candidate.setHours(0, 0, 0, 0)

  // Add local hours + adjust for timezone
  const offsetMs = getTimezoneOffsetMs(timezone, now)
  const targetUTC = new Date(start.getTime() + (hours * 60 + minutes) * 60_000 - offsetMs)

  // If already past, schedule for tomorrow
  if (targetUTC <= now) {
    targetUTC.setDate(targetUTC.getDate() + 1)
  }

  return targetUTC
}
```

---

## Part C: API Layer — Pass Timezone in Responses

### Add to `apps/api/src/common/interceptors/response-transform.interceptor.ts`

```typescript
// Include server UTC time in every response for client sync
return {
  success: true,
  data: response,
  meta: {
    serverTime: new Date().toISOString(),  // UTC
  },
}
```

### "Today's Workout" endpoint — timezone-aware

```typescript
// In workout-logs.service.ts
async getTodayWorkout(userId: string): Promise<TodayWorkout> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  })
  const tz = user?.timezone ?? 'Asia/Riyadh'

  // Get today's date range IN USER'S TIMEZONE
  const { start, end } = getTodayInTimezone(tz)

  // Find assignment that covers today
  const assignment = await this.prisma.traineeWorkoutAssignment.findFirst({
    where: {
      traineeProfile: { userId },
      status: 'ACTIVE',
      startsOn: { lte: end },
      OR: [{ endsOn: null }, { endsOn: { gte: start } }],
    },
    include: { workoutProgram: { include: { weeks: { include: { days: true } } } } },
  })

  if (!assignment) return { assignment: null, day: null, log: null }

  // Calculate which day of the program "today" is
  const daysSinceStart = Math.floor(
    (start.getTime() - assignment.startsOn.getTime()) / 86_400_000
  )
  // ... rest of logic
}
```

---

## Part D: BullMQ Scheduled Jobs — Timezone-Aware

### `apps/api/src/notifications/jobs/checkin-reminder.job.ts`

```typescript
// DO NOT use a fixed cron time for all users.
// Instead: store each user's preferred reminder time, schedule individually.

// When trainee sets reminder preference:
async scheduleCheckinReminder(traineeId: string, localTime: string, timezone: string) {
  const nextRun = nextOccurrenceUTC(localTime, timezone)
  const delayMs = nextRun.getTime() - Date.now()

  await this.reminderQueue.add(
    'weekly-checkin',
    { traineeId },
    {
      delay: delayMs,
      repeat: { every: 7 * 24 * 60 * 60 * 1000 },  // repeat weekly
      jobId: `checkin-reminder-${traineeId}`,         // deduplicate
    }
  )
}

// Default: Monday 8 AM in user's timezone
// Called during trainee onboarding
```

---

## Part E: UI — Always Show Local Time

### `apps/web/components/shared/LocalTime.tsx`

```tsx
// Read timezone from auth store
export function LocalTime({ utcDate }: { utcDate: string | Date }) {
  const { timezone, locale } = useAuthStore()
  return <time dateTime={new Date(utcDate).toISOString()}>
    {formatTime(utcDate, timezone, locale)}
  </time>
}

export function LocalDate({ utcDate }: { utcDate: string | Date }) {
  const { timezone, locale } = useAuthStore()
  return <time dateTime={new Date(utcDate).toISOString()}>
    {formatDate(utcDate, timezone, locale)}
  </time>
}

export function RelativeTime({ utcDate }: { utcDate: string | Date }) {
  const { timezone, locale } = useAuthStore()
  return <time dateTime={new Date(utcDate).toISOString()} title={formatDate(utcDate, timezone, locale)}>
    {formatRelative(utcDate, timezone, locale)}
  </time>
}
```

**Rule:** Never use `new Date().toLocaleDateString()` directly in components — always use `<LocalTime>`, `<LocalDate>`, or `<RelativeTime>`.

---

## Part F: Settings — Timezone Selector

In `apps/web/app/(coach)/settings/page.tsx` and `apps/mobile/app/(tabs)/profile.tsx`:

```tsx
<Select
  label="المنطقة الزمنية"
  value={user.timezone}
  onChange={(tz) => updateProfile({ timezone: tz })}
  options={SUPPORTED_TIMEZONES.map(t => ({ value: t.value, label: t.label }))}
/>
```

On change: `PUT /trainees/me` or `PUT /coach/profile` with `{ timezone }`.

---

## Output Requirements

- All `DateTime` fields in DB contain UTC values
- `GET /workout-logs/today` returns correct day for GMT+3 user at 11 PM UTC (which is 2 AM next day locally)
- BullMQ reminders fire at correct local time per user
- `<LocalTime>` component shows correct time for users in different timezones
- `formatRelative` returns Arabic text: "منذ 3 دقائق"، "منذ ساعتين"
- Unit tests: `getTodayInTimezone` for GMT+3 user at various UTC times including midnight boundary
