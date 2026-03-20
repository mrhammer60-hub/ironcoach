# Prompt 30 — Notification Preferences

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 09 complete (notifications module exists).
> **أضفه بعد الخطوة 09.**

---

## Task

نظام إعدادات الإشعارات — كل مستخدم يتحكم في ما يصله ومتى.

---

## Part A: Schema

### أضف لـ `OrganizationSetting` model (موجود بالفعل في schema):

```prisma
model OrganizationSetting {
  // ... existing fields
  notificationPrefsJson  Json?    // coach notification preferences
}
```

### أضف model جديد `UserNotificationPrefs`:

```prisma
model UserNotificationPrefs {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Push notification toggles
  pushWorkoutAssigned     Boolean @default(true)
  pushMealPlanAssigned    Boolean @default(true)
  pushMessageReceived     Boolean @default(true)
  pushWorkoutCompleted    Boolean @default(true)   // coach: trainee completed
  pushCheckinReceived     Boolean @default(true)   // coach: new check-in
  pushWeeklyReminder      Boolean @default(true)   // trainee: weekly check-in reminder
  pushDailyWorkoutReminder Boolean @default(true)  // trainee: daily workout time

  // Email notification toggles
  emailWorkoutAssigned    Boolean @default(true)
  emailMealPlanAssigned   Boolean @default(true)
  emailWeeklySummary      Boolean @default(true)   // coach: weekly summary
  emailPaymentFailed      Boolean @default(true)
  emailMarketingUpdates   Boolean @default(false)

  // Quiet hours (in user's local time)
  quietHoursEnabled       Boolean @default(false)
  quietHoursStart         String  @default("22:00")  // "HH:MM"
  quietHoursEnd           String  @default("08:00")  // "HH:MM"

  // Daily workout reminder time (trainee)
  workoutReminderTime     String?                    // "HH:MM" — null = disabled

  // Weekly check-in day (trainee)
  weeklyCheckinDay        Int     @default(1)        // 0=Sun, 1=Mon, ...6=Sat
  weeklyCheckinTime       String  @default("08:00")

  updatedAt DateTime @updatedAt
}
```

---

## Part B: API Endpoints

### أضف لـ `apps/api/src/notifications/notifications.controller.ts`

```typescript
GET    /notifications/preferences          → get current user's prefs
PUT    /notifications/preferences          → update prefs
POST   /notifications/preferences/reset   → reset to defaults
```

### `notifications.service.ts` — أضف:

```typescript
async getPrefs(userId: string): Promise<UserNotificationPrefs> {
  return this.prisma.userNotificationPrefs.upsert({
    where: { userId },
    create: { userId },   // defaults from schema
    update: {},
  })
}

async updatePrefs(userId: string, dto: UpdatePrefsDto): Promise<UserNotificationPrefs> {
  const prefs = await this.prisma.userNotificationPrefs.upsert({
    where: { userId },
    create: { userId, ...dto },
    update: dto,
  })

  // Re-schedule reminder jobs if timing changed
  if (dto.workoutReminderTime !== undefined || dto.quietHoursEnabled !== undefined) {
    await this.rescheduleReminders(userId, prefs)
  }

  return prefs
}

// Before sending any notification, check preferences
async shouldSend(
  userId: string,
  type: NotificationType,
  channel: 'push' | 'email',
): Promise<boolean> {
  const prefs = await this.getPrefs(userId)

  // Check quiet hours
  if (channel === 'push' && prefs.quietHoursEnabled) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    })
    const tz = user?.timezone ?? 'Asia/Riyadh'
    if (this.isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd, tz)) {
      // Queue for after quiet hours end
      await this.queueAfterQuietHours(userId, type, prefs.quietHoursEnd, tz)
      return false
    }
  }

  // Check per-type toggle
  const toggleMap: Record<NotificationType, { push: keyof UserNotificationPrefs; email: keyof UserNotificationPrefs }> = {
    WORKOUT_ASSIGNED:    { push: 'pushWorkoutAssigned',    email: 'emailWorkoutAssigned' },
    MEAL_PLAN_ASSIGNED:  { push: 'pushMealPlanAssigned',   email: 'emailMealPlanAssigned' },
    MESSAGE_RECEIVED:    { push: 'pushMessageReceived',    email: 'emailWorkoutAssigned' },  // no email for chat
    WORKOUT_COMPLETED:   { push: 'pushWorkoutCompleted',   email: 'emailWorkoutAssigned' },
    CHECKIN_REMINDER:    { push: 'pushWeeklyReminder',     email: 'emailWeeklySummary' },
    PAYMENT_FAILED:      { push: 'pushMessageReceived',    email: 'emailPaymentFailed' },    // always send payment
    PLAN_EXPIRING:       { push: 'pushMessageReceived',    email: 'emailPaymentFailed' },
  }

  const toggle = toggleMap[type]
  if (!toggle) return true

  return channel === 'push' ? !!prefs[toggle.push] : !!prefs[toggle.email]
}

private isInQuietHours(start: string, end: string, timezone: string): boolean {
  const now = new Date()
  const localTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  const [h, m] = localTime.split(':').map(Number)
  const currentMins = h * 60 + m

  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMins = sh * 60 + sm
  const endMins = eh * 60 + em

  if (startMins > endMins) {
    // Crosses midnight: e.g. 22:00 → 08:00
    return currentMins >= startMins || currentMins < endMins
  }
  return currentMins >= startMins && currentMins < endMins
}
```

### Update `send()` in NotificationService:

```typescript
async send(params: SendNotificationParams): Promise<void> {
  // Check preferences BEFORE saving or sending
  const [allowPush, allowEmail] = await Promise.all([
    this.shouldSend(params.userId, params.type, 'push'),
    this.shouldSend(params.userId, params.type, 'email'),
  ])

  // Always save to in-app notification center
  await this.prisma.notification.create({ data: { ...params } })

  if (allowPush) {
    await this.sendPush(params)
  }
  if (allowEmail && params.emailTemplate) {
    await this.emailService.send(params.userEmail, params.emailTemplate, params.emailData)
  }
}
```

---

## Part C: DTO

```typescript
export class UpdatePrefsDto {
  @IsOptional() @IsBoolean() pushWorkoutAssigned?: boolean
  @IsOptional() @IsBoolean() pushMealPlanAssigned?: boolean
  @IsOptional() @IsBoolean() pushMessageReceived?: boolean
  @IsOptional() @IsBoolean() pushWorkoutCompleted?: boolean
  @IsOptional() @IsBoolean() pushCheckinReceived?: boolean
  @IsOptional() @IsBoolean() pushWeeklyReminder?: boolean
  @IsOptional() @IsBoolean() pushDailyWorkoutReminder?: boolean

  @IsOptional() @IsBoolean() emailWorkoutAssigned?: boolean
  @IsOptional() @IsBoolean() emailMealPlanAssigned?: boolean
  @IsOptional() @IsBoolean() emailWeeklySummary?: boolean
  @IsOptional() @IsBoolean() emailMarketingUpdates?: boolean

  @IsOptional() @IsBoolean() quietHoursEnabled?: boolean
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) quietHoursStart?: string
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) quietHoursEnd?: string

  @IsOptional() @Matches(/^\d{2}:\d{2}$/) workoutReminderTime?: string
  @IsOptional() @IsInt() @Min(0) @Max(6) weeklyCheckinDay?: number
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) weeklyCheckinTime?: string
}
```

---

## Part D: Settings UI

### Coach Settings — `(coach)/settings/page.tsx` — Notification Tab

```
الإشعارات الفورية (Push)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
○━ رسائل المتدربين                    [toggle ON]
○━ إتمام التمارين                     [toggle ON]
○━ تسجيلات الوصول الجديدة             [toggle ON]

البريد الإلكتروني
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
○━ ملخص أسبوعي كل إثنين               [toggle ON]
○━ تنبيهات الفواتير                    [toggle ON]  — لا يمكن إيقافه
○━ تحديثات المنتج                      [toggle OFF]

ساعات الهدوء
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
○━ تفعيل ساعات الهدوء                 [toggle OFF]
   من [22:00] إلى [08:00]
   (الإشعارات تُؤجَّل حتى انتهاء الهدوء)
```

### Trainee Settings — `(trainee)/profile.tsx` — Notification Tab (Mobile)

```
تذكير التمرين اليومي
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
○━ تفعيل التذكير                      [toggle ON]
   الوقت: [08:00 ص]  ←  time picker

تذكير التسجيل الأسبوعي
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
○━ اليوم: [الإثنين]  ← day picker
   الوقت: [08:00 ص]  ← time picker

الإشعارات الفورية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
○━ رسائل المدرب                       [toggle ON]
○━ برامج وخطط جديدة                   [toggle ON]

ساعات الهدوء
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
○━ من [22:00] إلى [07:00]             [toggle OFF]
```

---

## Output Requirements

- `shouldSend()` called before every push + email notification
- Quiet hours work correctly across midnight (22:00 → 08:00)
- Daily workout reminder re-scheduled when time changes
- Weekly check-in reminder re-scheduled when day/time changes
- Payment failed email cannot be disabled (hardcoded bypass in `shouldSend`)
- Settings UI shows current state and saves on toggle change (no save button needed — auto-save)
- Unit tests: quiet hours logic for midnight crossover edge case
