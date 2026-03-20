# Prompt 06 — Trainees & Calorie Engine

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–05 complete. Billing + seat enforcement working.

---

## Task

Build Trainer module, Trainee module, and Calorie Calculator service.

---

## Part A: Trainer Module

### `apps/api/src/trainers/`

All endpoints: `JwtAuthGuard` + `@Roles(RoleKey.TRAINER, RoleKey.OWNER)` + `OrganizationGuard`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/trainers/dashboard` | Aggregated stats |
| GET | `/trainers/trainees` | Paginated list with filters |
| POST | `/trainers/trainees/invite` | Create invite (SeatLimitGuard) |
| GET | `/trainers/trainees/:id` | Full trainee profile |
| DELETE | `/trainers/trainees/:id` | Soft delete (set inactive) |

**GET `/trainers/dashboard`** returns:
```typescript
{
  activeTrainees: number,
  pendingCheckins: number,
  unreadMessages: number,
  weeklyCompletionRate: number,  // % of assigned workouts completed this week
  recentActivity: Array<{ type, traineeId, traineeName, detail, occurredAt }>
}
```

**GET `/trainers/trainees`** query params: `status?`, `goal?`, `search?`, `page?`, `limit?` (default 20)
Returns paginated list with: profile data, active plan name, last activity, completion %, current weight

**POST `/trainers/trainees/invite`**
- Body: `{ email, firstName, lastName, roleKey: 'TRAINEE' }`
- `SeatLimitGuard` runs first
- If user exists → link to org
- If not → create User (no password), send invite email with set-password link
- Create `OrganizationMember` + `TraineeProfile`
- Return `{ traineeId, inviteUrl }`

---

## Part B: Trainee Module

### `apps/api/src/trainees/`

Trainee endpoints: `JwtAuthGuard` + `@Roles(RoleKey.TRAINEE)` + `TraineeOwnershipGuard`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/trainees/onboard` | Body assessment + auto TDEE calc |
| GET | `/trainees/me` | Own profile |
| PUT | `/trainees/me` | Update personal info |
| POST | `/trainees/me/assessment` | Submit measurements + photos |
| GET | `/trainees/me/assessments` | History |
| GET | `/trainees/me/progress` | Weight/body fat/strength trends |

**POST `/trainees/onboard`** — `OnboardDto`:
- Fields: `gender` (Gender enum), `birthDate` (Date), `heightCm` (number), `currentWeightKg` (number), `targetWeightKg?` (number), `activityLevel` (ActivityLevel enum), `goal` (GoalType enum), `trainingDaysPerWeek` (1–7), `injuriesNotes?`, `foodPreferences?`, `allergies?`
- Updates `TraineeProfile`
- Calls `CalorieCalculatorService.calculate(...)` → stores `CalorieCalculation`
- Sets `onboardingCompletedAt`
- Returns `{ profile, calculation: { bmr, tdee, targetCalories, proteinG, carbsG, fatsG } }`

**POST `/trainees/me/assessment`** — `AssessmentDto`:
- Fields: `weightKg`, `bodyFatPercentage?`, `waistCm?`, `chestCm?`, `hipsCm?`, `armsCm?`, `thighsCm?`, `notes?`
- Creates `BodyMeasurement` row
- Returns presigned R2 URLs for photo upload (front/side/back) — 3 presigned PUT URLs, 15 min expiry
- After upload: client calls `POST /trainees/me/assessment/:id/photos` with the R2 keys

**GET `/trainees/me/progress`** returns:
```typescript
{
  weightHistory: Array<{ date, weightKg }>,        // last 12 measurements
  bodyFatHistory: Array<{ date, bodyFatPct }>,      // last 12
  strengthPRs: Array<{ exerciseName, weightKg, date }>,  // best per exercise
  workoutStreak: number,
  totalWorkoutsCompleted: number
}
```

---

## Part C: Calorie Calculator Service

### `apps/api/src/trainees/calorie-calculator.service.ts`

```typescript
interface CalcInput {
  gender: Gender
  age: number           // derived from birthDate
  weightKg: number
  heightCm: number
  activityLevel: ActivityLevel
  goal: GoalType
}

interface CalcResult {
  bmr: number
  tdee: number
  targetCalories: number
  proteinG: number
  carbsG: number
  fatsG: number
  activityFactor: number
  goalAdjustment: number
}
```

**BMR — Mifflin-St Jeor:**
- Male: `(10 × weight) + (6.25 × height) − (5 × age) + 5`
- Female: `(10 × weight) + (6.25 × height) − (5 × age) − 161`

**Activity factors:**
```
SEDENTARY:          1.200
LIGHTLY_ACTIVE:     1.375
MODERATELY_ACTIVE:  1.550
VERY_ACTIVE:        1.725
EXTRA_ACTIVE:       1.900
```

**Goal adjustments (kcal):**
```
FAT_LOSS:          -500
LEAN_CUT:          -250
GENERAL_FITNESS:      0
MUSCLE_GAIN:       +200
BULK:              +500
```

**Macro split (protein-first):**
```
proteinG  = weightKg × 2.0
fatG      = (targetCalories × 0.25) / 9
carbsG    = (targetCalories − proteinG×4 − fatG×9) / 4
```

Round all values to nearest integer before storing.

---

## Files Required

```
apps/api/src/trainers/
  trainers.module.ts
  trainers.controller.ts
  trainers.service.ts
  dto/invite-trainee.dto.ts

apps/api/src/trainees/
  trainees.module.ts
  trainees.controller.ts
  trainees.service.ts
  calorie-calculator.service.ts
  calorie-calculator.service.spec.ts
  dto/onboard.dto.ts
  dto/assessment.dto.ts
  dto/update-profile.dto.ts
```

---

## Unit Tests (`calorie-calculator.service.spec.ts`)

Test every combination:
- Male + Female
- All 5 activity levels
- All 5 goal types
- Verify: BMR formula, TDEE = BMR × factor, targetCalories = TDEE + adjustment
- Verify: macros sum to ≈ targetCalories (within 5 kcal rounding tolerance)

---

## Output Requirements

- All files complete, no placeholders
- `POST /api/v1/trainees/onboard` returns TDEE calculation
- Unit tests pass: `pnpm test calorie`
