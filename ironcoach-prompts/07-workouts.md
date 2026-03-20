# Prompt 07 — Workout System

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–06 complete.

---

## Task

Build the complete workout system: exercises library, program builder, and session logging.

---

## Part A: Exercises Module

### `apps/api/src/exercises/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/exercises` | JWT | List with filters |
| GET | `/exercises/:id` | JWT | Full detail |
| POST | `/exercises` | JWT (TRAINER/ADMIN) | Create exercise |
| PUT | `/exercises/:id` | JWT (TRAINER/ADMIN) | Update |
| DELETE | `/exercises/:id` | JWT (ADMIN) | Delete global; Trainer: own only |
| GET | `/exercises/muscle/:group` | JWT | Filter by MuscleGroup enum |
| GET | `/exercises/level/:level` | JWT | Filter by DifficultyLevel enum |
| GET | `/exercises/:id/substitutes` | JWT | Get substitution list |
| POST | `/exercises/upload-url` | JWT (TRAINER/ADMIN) | Get presigned R2 URL for image/video |

**GET `/exercises`** query params:
- `muscleGroup?` (MuscleGroup enum)
- `difficulty?` (DifficultyLevel enum)
- `equipment?` (string)
- `search?` (searches nameEn + nameAr)
- `isGlobal?` (boolean)
- `page?`, `limit?` (default 50)

Returns: id, nameEn, nameAr, muscleGroup, difficultyLevel, equipment, imageUrl, defaultSets, defaultReps

**POST `/exercises/upload-url`**
- Body: `{ filename, contentType: 'image/jpeg'|'image/webp'|'video/mp4' }`
- Returns presigned PUT URL expiring in 15 min + the final CDN URL
- Max image: 2 MB; max video: 50 MB (enforce via content-length-range condition)

---

## Part B: Workout Programs Module

### `apps/api/src/workout-programs/`

All endpoints: `JwtAuthGuard` + `OrganizationGuard`

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/workout-programs` | TRAINER | Create program |
| GET | `/workout-programs` | TRAINER | List coach's programs |
| GET | `/workout-programs/:id` | TRAINER/TRAINEE | Full program tree |
| PUT | `/workout-programs/:id` | TRAINER | Update metadata |
| DELETE | `/workout-programs/:id` | TRAINER | Delete (if not assigned) |
| POST | `/workout-programs/:id/weeks` | TRAINER | Add week |
| POST | `/workout-programs/:id/weeks/:wId/days` | TRAINER | Add day |
| POST | `/workout-programs/:id/weeks/:wId/days/:dId/exercises` | TRAINER | Add exercise to day |
| PUT | `/workout-programs/:id/weeks/:wId/days/:dId/exercises/:edId` | TRAINER | Update exercise params |
| DELETE | `/workout-programs/:id/weeks/:wId/days/:dId/exercises/:edId` | TRAINER | Remove exercise |
| POST | `/workout-programs/:id/assign` | TRAINER | Assign to trainee |

**POST `/workout-programs/:id/assign`** — `AssignProgramDto`:
- `traineeProfileId` (string UUID)
- `startDate` (ISO date string)
- Validates trainee belongs to same org
- Deactivates any existing active assignment for that trainee
- Creates `TraineeWorkoutAssignment` with `status: ACTIVE`
- Sends push notification to trainee: "وصلك برنامج تدريبي جديد 💪"
- Sends email via Resend

**GET `/workout-programs/:id`** returns full nested tree:
```typescript
{
  id, title, goal, level, durationWeeks,
  weeks: [{
    id, weekNumber, title,
    days: [{
      id, dayNumber, title, focusArea,
      exercises: [{
        id, sortOrder, sets, reps, restSeconds, tempo, rpe, notes,
        exercise: { id, nameEn, nameAr, muscleGroup, imageUrl, videoUrl, instructions }
      }]
    }]
  }],
  assignments: [{ traineeId, traineeName, startDate, status }]
}
```

---

## Part C: Workout Logging Module

### `apps/api/src/workout-logs/`

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/workout-logs` | TRAINEE | Start session |
| GET | `/workout-logs/today` | TRAINEE | Today's assigned workout |
| GET | `/workout-logs/me` | TRAINEE | Own log history |
| PUT | `/workout-logs/:id/sets` | TRAINEE | Log set data |
| PUT | `/workout-logs/:id/complete` | TRAINEE | Mark session done |
| GET | `/workout-logs/trainee/:traineeId` | TRAINER | Coach views trainee logs |

**POST `/workout-logs`** — `StartSessionDto`:
- `workoutDayId` (string UUID)
- Validates day belongs to an active assignment for this trainee
- Creates `WorkoutLog` with `startedAt = now`
- Returns log with full exercise list and empty set slots

**PUT `/workout-logs/:id/sets`** — `LogSetsDto`:
- `sets: Array<{ exerciseId, setNumber, repsCompleted, weightKg?, rpe?, isCompleted, notes? }>`
- Upserts `WorkoutLogSet` rows
- Returns updated log with completion percentage

**PUT `/workout-logs/:id/complete`** — `CompleteSessionDto`:
- `difficultyRating` (1–5)
- `traineeNotes?` (string)
- Sets `completedAt = now`, calculates `durationMinutes`
- Emits Socket.io event `workout_completed` to trainer room
- Sends push notification to trainer: `"{traineeName} أتم تمرين {dayTitle} 🎯"`
- Returns completed log

**GET `/workout-logs/today`**
- Finds active `TraineeWorkoutAssignment` for this trainee
- Determines today's `WorkoutDay` based on `startDate` and week/day numbers
- Returns day with exercises and today's log (if already started)

---

## Files Required

```
apps/api/src/exercises/
  exercises.module.ts
  exercises.controller.ts
  exercises.service.ts
  r2-upload.service.ts
  dto/create-exercise.dto.ts
  dto/update-exercise.dto.ts
  dto/list-exercises.dto.ts

apps/api/src/workout-programs/
  workout-programs.module.ts
  workout-programs.controller.ts
  workout-programs.service.ts
  dto/create-program.dto.ts
  dto/add-week.dto.ts
  dto/add-day.dto.ts
  dto/add-exercise.dto.ts
  dto/update-exercise.dto.ts
  dto/assign-program.dto.ts

apps/api/src/workout-logs/
  workout-logs.module.ts
  workout-logs.controller.ts
  workout-logs.service.ts
  dto/start-session.dto.ts
  dto/log-sets.dto.ts
  dto/complete-session.dto.ts
```

---

## Output Requirements

- Full program CRUD working
- `GET /workout-logs/today` returns correct day based on assignment start date
- Socket.io event fired on session completion
- Push notification sent to trainer
