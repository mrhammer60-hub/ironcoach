# Prompt 18 — Progress Tracking & Check-ins Module

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–08 complete.
> **هذا الـ prompt كان موجوداً جزئياً في 06 و12 لكن ناقص تفاصيله.**

---

## Task

Build the complete progress tracking and check-in system — API + Coach UI + Trainee UI.

---

## Part A: API (`apps/api/src/progress/`)

### Endpoints

All: `JwtAuthGuard` + `OrganizationGuard`

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/progress/checkins` | TRAINEE | Submit weekly check-in |
| GET | `/progress/checkins/me` | TRAINEE | Own check-in history |
| GET | `/progress/checkins/pending` | TRAINER | Pending check-ins needing review |
| GET | `/progress/checkins/:id` | TRAINER/TRAINEE | Single check-in detail |
| PUT | `/progress/checkins/:id/review` | TRAINER | Add coach response |
| POST | `/progress/measurements` | TRAINEE | Log body measurements |
| GET | `/progress/measurements/me` | TRAINEE | Own measurement history |
| POST | `/progress/photos/upload-url` | TRAINEE | Get presigned R2 URLs for photos |
| POST | `/progress/photos` | TRAINEE | Confirm photo upload + save record |
| GET | `/progress/photos/me` | TRAINEE | Own photo history |
| GET | `/progress/trainee/:traineeId` | TRAINER | Full progress overview for a trainee |

---

### `POST /progress/checkins` — `SubmitCheckinDto`

```typescript
{
  weightKg?: number        // decimal
  waistCm?: number
  chestCm?: number
  hipsCm?: number
  armsCm?: number
  thighsCm?: number
  sleepScore?: number      // 1-5
  energyScore?: number     // 1-5
  adherenceScore?: number  // 1-5
  notes?: string           // max 1000 chars
}
```

After save:
- Notify trainer: "تسجيل وصول جديد من {traineeName} 📏"
- Create `Notification` row for trainer

---

### `PUT /progress/checkins/:id/review` — `ReviewCheckinDto`

```typescript
{
  coachResponse: string    // max 2000 chars — markdown supported
}
```

After save:
- Notify trainee: "ردّ مدربك على تسجيل وصولك 💬"

---

### `GET /progress/trainee/:traineeId`

Returns comprehensive progress object:
```typescript
{
  trainee: { id, name, avatarUrl, goal, startDate },
  currentStats: {
    weightKg, bodyFatPct, waistCm, chestCm, hipsCm, armsCm, thighsCm
  },
  startingStats: {
    // same fields from first check-in/measurement
  },
  delta: {
    weightKg: -2.5,       // current minus starting
    waistCm: -4,
    // ...
  },
  weightHistory: Array<{ date, weightKg }>,          // all measurements
  bodyFatHistory: Array<{ date, bodyFatPct }>,
  strengthPRs: Array<{
    exerciseId, exerciseName, weightKg, reps, achievedAt
  }>,
  workoutStats: {
    totalCompleted: number,
    completionRate: number,    // % in last 4 weeks
    streak: number,
    lastSessionAt: string
  },
  checkins: Array<{            // last 8 check-ins
    id, submittedAt, weightKg, notes, coachResponse, reviewedAt
  }>,
  photos: Array<{
    id, photoType, imageUrl, capturedAt
  }>
}
```

---

### Strength PRs calculation

After every `WorkoutLog.complete`, run a background job:
```typescript
// For each exercise in the completed log:
// Find the maximum weight × reps from all time for this trainee
// If today's performance > previous best → create or update PR record
// Emit socket event 'new_pr' to trainee room with { exerciseName, weightKg }
```

Store PRs in a `StrengthPR` table (add to schema):
```prisma
model StrengthPR {
  id               String   @id @default(uuid())
  organizationId   String
  traineeProfileId String
  exerciseId       String
  weightKg         Decimal
  reps             Int
  volume           Decimal  // weightKg × reps
  achievedAt       DateTime
  workoutLogId     String
  createdAt        DateTime @default(now())

  @@unique([traineeProfileId, exerciseId])  // one PR per exercise
  @@index([traineeProfileId, achievedAt])
}
```

---

### `POST /progress/photos/upload-url`

Returns 3 presigned PUT URLs (one per photo type: front, side, back):
```typescript
{
  front: { uploadUrl: string, cdnUrl: string },
  side:  { uploadUrl: string, cdnUrl: string },
  back:  { uploadUrl: string, cdnUrl: string },
}
```
Each URL expires in 15 minutes.

---

## Part B: Coach UI — Check-in Inbox

### In `apps/web/app/(coach)/checkins/page.tsx`

**Layout:** split view — list on left, detail on right.

**Left panel — Check-in list:**
- Filter: All / Pending Review / Reviewed
- Each item shows: trainee avatar + name, date, weight change (if available), sleepScore + energyScore mini-badges, "NEW" badge if not reviewed
- Click → loads detail in right panel

**Right panel — Check-in detail:**
- Trainee header: avatar, name, goal, current vs starting weight delta
- Check-in stats grid: weight, sleep, energy, adherence (1-5 stars)
- Measurements (if submitted): waist, chest, hips, arms, thighs
- Progress photos (if submitted): 3 thumbnails (front/side/back), click to expand
- Trainee notes (text)
- Coach response textarea (markdown supported, with preview toggle)
- "حفظ الرد" button → saves + notifies trainee
- "عرض التقدم الكامل" link → opens `/coach/trainees/:id`

---

## Part C: Trainee UI — Progress Screen

### In `apps/web/app/(trainee)/progress/page.tsx` and `apps/mobile/app/(tabs)/progress.tsx`

**Sections:**

1. **Summary cards** (2×2 grid):
   - الوزن الحالي + delta من البداية
   - نسبة الدهون + delta
   - الجلسات المكتملة + streak
   - معدل الالتزام % هذا الشهر

2. **Weight chart** — line chart (آخر 12 قياس)
   - Y-axis: weight in kg
   - X-axis: dates
   - Tooltip on hover/tap

3. **Body measurements table** — latest vs starting:
   | القياس | الحالي | البداية | التغيير |
   |--------|--------|---------|---------|
   | خصر | 86 سم | 90 سم | -4 سم ✓ |

4. **Strength PRs** — list of personal records with "جديد 🔥" badge if achieved this week

5. **Progress photos** — timeline grid sorted by date, toggle front/side/back

6. **Check-in button** — "تسجيل وصول أسبوعي"
   - Opens modal/page with form
   - Weight input (required)
   - Optional measurements
   - Sleep/Energy/Adherence sliders (1-5)
   - Notes textarea
   - Photo upload (3 buttons: صور أمامية، جانبية، خلفية)

---

## Output Requirements

- Check-in submission sends push to trainer within 2 seconds
- Strength PRs calculated after every session completion
- Progress photos stored in R2, CDN URLs in DB
- Weight chart renders correctly with < 5 data points (edge case)
- Coach response triggers notification to trainee
