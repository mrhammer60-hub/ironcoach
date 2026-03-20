# Prompt 02 — Database Schema

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 01 complete — `packages/db` folder exists.

---

## Task

Write the complete Prisma schema and seed file.

---

## File: `packages/db/prisma/schema.prisma`

### Rules
- Provider: `postgresql`
- UUID PKs: `@id @default(uuid())`
- Every model has `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- All categorical values as **Prisma enums** — never as model fields with boolean columns
- `organizationId` present on every tenant-scoped model

---

### Required Enums

```prisma
enum RoleKey {
  OWNER
  TRAINER
  ASSISTANT_TRAINER
  TRAINEE
  ADMIN
}

enum ConversationType {
  TRAINER_TRAINEE
  SUPPORT
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
}

enum PlanCode {
  STARTER   // $60/mo · 20 seats
  GROWTH    // $100/mo · 50 seats
  PRO       // $200/mo · 150 seats
}

enum GoalType {
  MUSCLE_GAIN
  FAT_LOSS
  BULK
  LEAN_CUT
  GENERAL_FITNESS
}

enum ActivityLevel {
  SEDENTARY
  LIGHTLY_ACTIVE
  MODERATELY_ACTIVE
  VERY_ACTIVE
  EXTRA_ACTIVE
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum MuscleGroup {
  CHEST
  BACK
  LEGS
  SHOULDERS
  BICEPS
  TRICEPS
  CORE
  GLUTES
}

enum MediaType {
  IMAGE
  VIDEO
  VOICE_NOTE
  FILE
}

enum NotificationType {
  WORKOUT_ASSIGNED
  MEAL_PLAN_ASSIGNED
  WORKOUT_COMPLETED
  MESSAGE_RECEIVED
  CHECKIN_REMINDER
  PAYMENT_FAILED
  PLAN_EXPIRING
}

enum Gender {
  MALE
  FEMALE
}

enum AssignmentStatus {
  ACTIVE
  COMPLETED
  PAUSED
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

### Required Models (51 total)

**Core identity**
- `User` — id, email (unique), passwordHash, firstName, lastName, phone, avatarUrl, locale (default "ar"), emailVerifiedAt, isActive (default true)
- `Organization` — id, name, slug (unique), logoUrl, brandColor, subdomain (unique), customDomain, ownerUserId (FK → User), status (default "active")
- `OrganizationMember` — id, organizationId, userId, roleKey (RoleKey enum), invitedBy, joinedAt, status — @@unique([organizationId, userId])
- `RefreshToken` — id, userId (FK), tokenHash (unique), expiresAt, revokedAt (nullable), deviceInfo, ipAddress
- `PushToken` — id, userId (FK), token (unique), platform (String: "ios"|"android"|"web"), updatedAt — @@unique([userId, platform])

**Profiles**
- `TrainerProfile` — id, organizationId, userId (unique FK), bio, specialties (String[]), certifications (String[]), socialLinksJson (Json)
- `TraineeProfile` — id, organizationId, userId (unique FK), assignedTrainerId (FK → User nullable), gender (Gender enum), birthDate, heightCm, currentWeightKg, targetWeightKg, activityLevel (ActivityLevel enum), goal (GoalType enum), trainingDaysPerWeek (Int), injuriesNotes, foodPreferences, allergies, onboardingCompletedAt (nullable)
- `TraineeTag` — id, organizationId, name — @@unique([organizationId, name])
- `TraineeTagLink` — id, traineeProfileId (FK), traineeTagId (FK) — @@unique([traineeProfileId, traineeTagId])

**Workouts**
- `ExerciseCategory` — id, organizationId (nullable — null = global), name, slug — @@unique([organizationId, slug])
- `Exercise` — id, organizationId (nullable), nameEn, nameAr, muscleGroup (MuscleGroup enum), secondaryMuscles (String[]), difficultyLevel (DifficultyLevel enum), equipment, imageUrl, videoUrl, instructionsEn, instructionsAr, tipsEn, tipsAr, defaultSets (Int), defaultReps (String), defaultRestSeconds (Int), tempo (String), isGlobal (Boolean default true), createdByUserId (FK nullable)
- `ExerciseSubstitution` — id, exerciseId (FK), substituteExerciseId (FK) — @@unique([exerciseId, substituteExerciseId])
- `WorkoutProgram` — id, organizationId, trainerId (FK → User), title, description, goal (GoalType enum), level (DifficultyLevel enum), durationWeeks (Int), isTemplate (Boolean default false), status (String default "active")
- `WorkoutWeek` — id, workoutProgramId (FK), weekNumber (Int), title — @@unique([workoutProgramId, weekNumber])
- `WorkoutDay` — id, workoutWeekId (FK), dayNumber (Int), title, focusArea — @@unique([workoutWeekId, dayNumber])
- `WorkoutDayExercise` — id, workoutDayId (FK), exerciseId (FK), sortOrder (Int), sets (Int), reps (String), restSeconds (Int), tempo (String), rpe (Int nullable), notes — @@unique([workoutDayId, sortOrder])
- `TraineeWorkoutAssignment` — id, organizationId, traineeProfileId (FK), workoutProgramId (FK), assignedAt, startsOn (DateTime), endsOn (DateTime nullable), status (AssignmentStatus enum default ACTIVE)
- `WorkoutLog` — id, organizationId, traineeProfileId (FK), workoutDayId (FK), startedAt, completedAt (nullable), durationMinutes (Int nullable), difficultyRating (Int nullable 1-5), traineeNotes, coachFeedback
- `WorkoutLogSet` — id, workoutLogId (FK), exerciseId (FK), setNumber (Int), repsCompleted (Int), weightKg (Decimal nullable), rpe (Int nullable), isCompleted (Boolean default false), notes

**Nutrition**
- `Food` — id, nameEn, nameAr, caloriesPer100g (Decimal), proteinG (Decimal), carbsG (Decimal), fatsG (Decimal), fiberG (Decimal nullable), barcode (String nullable unique), isVerified (Boolean default false)
- `CalorieCalculation` — id, traineeProfileId (FK), bmr (Decimal), tdee (Decimal), targetCalories (Int), proteinG (Int), carbsG (Int), fatsG (Int), goal (GoalType enum), activityLevel (ActivityLevel enum), activityFactor (Decimal), goalAdjustment (Int), weightKg (Decimal), heightCm (Decimal), age (Int), gender (Gender enum)
- `MealTemplate` — id, organizationId (nullable), title, titleAr, mealType (String), calories (Int), proteinG (Decimal), carbsG (Decimal), fatsG (Decimal), instructions, imageUrl, isGlobal (Boolean default false)
- `NutritionPlan` — id, organizationId, trainerId (FK → User), traineeProfileId (FK nullable), title, goal (GoalType enum), caloriesTarget (Int), proteinG (Int), carbsG (Int), fatsG (Int), waterMl (Int nullable), notes, isActive (Boolean default true)
- `NutritionPlanMeal` — id, nutritionPlanId (FK), mealTemplateId (FK nullable), title, titleAr, mealOrder (Int), timeSuggestion (String nullable), calories (Int), proteinG (Decimal), carbsG (Decimal), fatsG (Decimal), notes — @@unique([nutritionPlanId, mealOrder])
- `NutritionPlanMealItem` — id, nutritionPlanMealId (FK), foodId (FK nullable), customFoodName (String nullable), quantityGrams (Decimal), calories (Decimal), proteinG (Decimal), carbsG (Decimal), fatsG (Decimal)
- `TraineeNutritionAssignment` — id, organizationId, traineeProfileId (FK), nutritionPlanId (FK), assignedAt, startsOn, endsOn (nullable), status (AssignmentStatus enum default ACTIVE)
- `MealLog` — id, organizationId, traineeProfileId (FK), nutritionPlanMealId (FK nullable), loggedAt, calories (Decimal), proteinG (Decimal), carbsG (Decimal), fatsG (Decimal), notes, imageUrl

**Progress**
- `Checkin` — id, organizationId, traineeProfileId (FK), trainerId (FK → User), submittedAt, weightKg (Decimal nullable), waistCm (Decimal nullable), chestCm (Decimal nullable), hipsCm (Decimal nullable), armsCm (Decimal nullable), thighsCm (Decimal nullable), sleepScore (Int nullable 1-5), energyScore (Int nullable 1-5), adherenceScore (Int nullable 1-5), notes, coachResponse (nullable), reviewedAt (nullable)
- `ProgressPhoto` — id, organizationId, traineeProfileId (FK), checkinId (FK nullable), photoType (String: "front"|"side"|"back"), imageUrl, capturedAt
- `BodyMeasurement` — id, organizationId, traineeProfileId (FK), recordedAt, weightKg (Decimal), bodyFatPercentage (Decimal nullable), waistCm, chestCm, hipsCm, armsCm, thighsCm

**Messaging**
- `Conversation` — id, organizationId, type (ConversationType enum), lastMessageAt (nullable)
- `ConversationParticipant` — id, conversationId (FK), userId (FK), joinedAt, lastReadAt (nullable) — @@unique([conversationId, userId])
- `Message` — id, conversationId (FK), senderUserId (FK), body (nullable), mediaUrl (nullable), mediaType (MediaType enum nullable), isRead (Boolean default false), readAt (nullable)

**Billing**
- `Plan` — id, code (PlanCode enum unique), name, monthlyPrice (Decimal), yearlyPrice (Decimal nullable), maxTrainees (Int), featuresJson (Json), isActive (Boolean default true)
- `Subscription` — id, organizationId (FK unique), planId (FK), stripeCustomerId (String unique), stripeSubscriptionId (String unique nullable), status (SubscriptionStatus enum), currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd (Boolean default false), trialEndsAt (nullable)
- `Invoice` — id, organizationId (FK), subscriptionId (FK), stripeInvoiceId (String unique), amount (Decimal), currency (String default "usd"), status (String), issuedAt, paidAt (nullable)
- `PaymentMethod` — id, organizationId (FK), stripeCustomerId, brand, last4, expMonth (Int), expYear (Int), isDefault (Boolean default false)

**System**
- `SupportTicket` — id, organizationId (FK), openedByUserId (FK), subject, category (String), priority (TicketPriority enum default NORMAL), status (TicketStatus enum default OPEN), assignedAdminId (FK → User nullable), resolvedAt (nullable)
- `AuditLog` — id, organizationId (nullable), actorUserId (nullable), action (String), entityType (String), entityId (String nullable), metadataJson (Json nullable), ipAddress (String nullable)
- `FeatureFlag` — id, key (String unique), name, isEnabled (Boolean default false), rulesJson (Json nullable)
- `Notification` — id, organizationId (FK), userId (FK), type (NotificationType enum), title, body, dataJson (Json nullable), isRead (Boolean default false), readAt (nullable)

**Missing models — add these too (identified in gap analysis)**
- `InviteToken` — id, token (String unique — raw token, hashed for lookup), tokenHash (String unique), organizationId (FK), invitedByUserId (FK), email (String), roleKey (RoleKey enum), expiresAt (DateTime), acceptedAt (DateTime nullable), createdAt. @@index([tokenHash])
- `StrengthPR` — id, organizationId, traineeProfileId (FK), exerciseId (FK), weightKg (Decimal), reps (Int), volume (Decimal — weightKg × reps), achievedAt (DateTime), workoutLogId (FK), createdAt. @@unique([traineeProfileId, exerciseId]) @@index([traineeProfileId, achievedAt])
- `OrganizationSetting` — id, organizationId (FK unique), brandPrimaryColor (String nullable), brandLogoUrl (String nullable), defaultLanguage (String default "ar"), notificationPrefsJson (Json nullable), onboardingCompletedAt (DateTime nullable). One-to-one with Organization.
- `MediaAsset` — id, organizationId (nullable), uploadedByUserId (FK), bucket (String), key (String unique), cdnUrl (String), mimeType (String), sizeBytes (Int), entityType (String nullable — "exercise"|"progress_photo"|"chat"), entityId (String nullable), createdAt. @@index([entityType, entityId])

---

## File: `packages/db/src/index.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'
```

---

## File: `packages/db/prisma/seed.ts`

Seed the following:
- 1 Admin user (`admin@ironcoach.com` / `Admin1234!`)
- 3 Coach accounts with organizations:
  - Coach A: Starter plan (20 seats), 5 trainees
  - Coach B: Growth plan (50 seats), 10 trainees
  - Coach C: Pro plan (150 seats), 8 trainees
- **80 global exercises** — 10 per MuscleGroup × 3 DifficultyLevel — realistic Arabic + English names, defaultSets, defaultReps, defaultRestSeconds, tempo
- 3 Plan rows: Starter ($60, 20 seats), Growth ($100, 50 seats), Pro ($200, 150 seats)
- 50 Food rows — common Arabic foods with accurate macros per 100g

---

## Output Requirements

- Full `schema.prisma` — every model, every field, every relation, every @@unique
- `packages/db/src/index.ts`
- `packages/db/prisma/seed.ts`
- Run `pnpm db:migrate` and `pnpm db:seed` without errors
