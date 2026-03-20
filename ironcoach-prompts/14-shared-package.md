# Prompt 14 — packages/shared (Zod Schemas + Types)

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 02 complete (Prisma schema exists).
> **أضفه بعد الخطوة 02 مباشرة — قبل بناء أي API endpoint أو web form.**

---

## Task

Build `packages/shared` — the single source of truth for all Zod schemas and TypeScript types used across `apps/api`, `apps/web`, and `apps/mobile`.

---

## Why This Matters

بدون هذا الملف:
- كل app تعرّف types خاصة بها → تعارض وتكرار
- الـ web forms لا تشارك validation مع الـ API
- الـ mobile لا يعرف شكل responses الـ API

بعد هذا الملف:
- DTO في NestJS = نفس Zod schema في Next.js form = نفس type في Expo
- تغيير واحد في المكان يُعدَّل في كل مكان

---

## File Structure

```
packages/shared/
  src/
    schemas/
      auth.schemas.ts
      organization.schemas.ts
      trainee.schemas.ts
      exercise.schemas.ts
      workout.schemas.ts
      nutrition.schemas.ts
      messaging.schemas.ts
      billing.schemas.ts
      admin.schemas.ts
    types/
      api.types.ts          ← ApiResponse<T>, PaginatedResponse<T>
      entities.types.ts     ← TypeScript interfaces matching Prisma models
      enums.types.ts        ← Re-export of all enums (mirrored from Prisma)
    constants/
      activity-factors.ts
      goal-adjustments.ts
      plan-limits.ts
    index.ts                ← barrel export of everything
  package.json
  tsconfig.json
```

---

## `src/types/api.types.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export interface CursorPaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}
```

---

## `src/types/enums.types.ts`

Mirror all Prisma enums as TypeScript const enums (so they work without Prisma client on web/mobile):

```typescript
export const RoleKey = {
  OWNER: 'OWNER',
  TRAINER: 'TRAINER',
  ASSISTANT_TRAINER: 'ASSISTANT_TRAINER',
  TRAINEE: 'TRAINEE',
  ADMIN: 'ADMIN',
} as const
export type RoleKey = typeof RoleKey[keyof typeof RoleKey]

// Repeat for: ConversationType, SubscriptionStatus, PlanCode,
// GoalType, ActivityLevel, DifficultyLevel, MuscleGroup,
// MediaType, NotificationType, Gender, AssignmentStatus,
// TicketStatus, TicketPriority
```

---

## `src/schemas/auth.schemas.ts`

```typescript
import { z } from 'zod'

export const RegisterSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم'),
  phone: z.string().optional(),
})
export type RegisterInput = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
})

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    avatarUrl: z.string().nullable(),
    role: z.string(),
  }),
  organization: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
})
export type LoginResponse = z.infer<typeof LoginResponseSchema>
```

---

## `src/schemas/trainee.schemas.ts`

```typescript
import { z } from 'zod'
import { ActivityLevel, GoalType, Gender } from '../types/enums.types'

export const OnboardSchema = z.object({
  gender: z.nativeEnum(Gender),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heightCm: z.number().min(100).max(250),
  currentWeightKg: z.number().min(30).max(300),
  targetWeightKg: z.number().min(30).max(300).optional(),
  activityLevel: z.nativeEnum(ActivityLevel),
  goal: z.nativeEnum(GoalType),
  trainingDaysPerWeek: z.number().int().min(1).max(7),
  injuriesNotes: z.string().max(500).optional(),
  foodPreferences: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
})
export type OnboardInput = z.infer<typeof OnboardSchema>

export const CalorieResultSchema = z.object({
  bmr: z.number(),
  tdee: z.number(),
  targetCalories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatsG: z.number(),
  activityFactor: z.number(),
  goalAdjustment: z.number(),
})
export type CalorieResult = z.infer<typeof CalorieResultSchema>
```

---

## `src/schemas/workout.schemas.ts`

```typescript
import { z } from 'zod'
import { DifficultyLevel, GoalType, MuscleGroup } from '../types/enums.types'

export const CreateProgramSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  goal: z.nativeEnum(GoalType),
  level: z.nativeEnum(DifficultyLevel),
  durationWeeks: z.number().int().min(1).max(52),
  isTemplate: z.boolean().default(false),
})

export const AddExerciseToDaySchema = z.object({
  exerciseId: z.string().uuid(),
  sortOrder: z.number().int().min(0),
  sets: z.number().int().min(1).max(20),
  reps: z.string().max(20),           // "8-12" or "10" or "AMRAP"
  restSeconds: z.number().int().min(0).max(600),
  tempo: z.string().max(20).optional(), // "3-1-2-0"
  rpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(300).optional(),
})
export type AddExerciseToDayInput = z.infer<typeof AddExerciseToDaySchema>

export const LogSetsSchema = z.object({
  sets: z.array(z.object({
    exerciseId: z.string().uuid(),
    setNumber: z.number().int().min(1),
    repsCompleted: z.number().int().min(0),
    weightKg: z.number().min(0).optional(),
    rpe: z.number().int().min(1).max(10).optional(),
    isCompleted: z.boolean(),
    notes: z.string().max(200).optional(),
  })).min(1),
})
export type LogSetsInput = z.infer<typeof LogSetsSchema>

export const CompleteSessionSchema = z.object({
  difficultyRating: z.number().int().min(1).max(5),
  traineeNotes: z.string().max(500).optional(),
})
```

---

## `src/constants/activity-factors.ts`

```typescript
import { ActivityLevel, GoalType } from '../types/enums.types'

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
}

export const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  FAT_LOSS: -500,
  LEAN_CUT: -250,
  GENERAL_FITNESS: 0,
  MUSCLE_GAIN: 200,
  BULK: 500,
}

export const PLAN_LIMITS: Record<string, number> = {
  STARTER: 20,
  GROWTH: 50,
  PRO: 150,
}
```

---

## Write schemas for all remaining modules too:

- `organization.schemas.ts` — UpdateOrganizationSchema, InviteMemberSchema
- `nutrition.schemas.ts` — CreatePlanSchema, AddMealSchema, AddMealItemSchema, LogMealSchema
- `messaging.schemas.ts` — SendMessageSchema
- `billing.schemas.ts` — CreateCheckoutSchema, UpgradePlanSchema
- `admin.schemas.ts` — AnnouncementSchema, SuspendOrgSchema
- `exercise.schemas.ts` — CreateExerciseSchema, UpdateExerciseSchema

---

## `src/index.ts`

```typescript
// Schemas
export * from './schemas/auth.schemas'
export * from './schemas/organization.schemas'
export * from './schemas/trainee.schemas'
export * from './schemas/exercise.schemas'
export * from './schemas/workout.schemas'
export * from './schemas/nutrition.schemas'
export * from './schemas/messaging.schemas'
export * from './schemas/billing.schemas'
export * from './schemas/admin.schemas'

// Types
export * from './types/api.types'
export * from './types/entities.types'
export * from './types/enums.types'

// Constants
export * from './constants/activity-factors'
export * from './constants/plan-limits'
```

---

## Output Requirements

- `packages/shared` compiles with `pnpm type-check` — zero errors
- All Zod schemas have Arabic error messages where user-facing
- `apps/api` can import: `import { RegisterSchema } from '@ironcoach/shared'`
- `apps/web` can import: `import { OnboardSchema } from '@ironcoach/shared'`
- `apps/mobile` can import the same
