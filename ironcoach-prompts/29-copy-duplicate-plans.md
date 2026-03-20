# Prompt 29 — Copy & Duplicate Workout Programs

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 07 complete (workout programs module exists).
> **أضفه بعد الخطوة 07.**

---

## Task

أضف إمكانية نسخ برامج التدريب — من أكثر features الـ UX أهمية للمدرب.

---

## Why This Matters

بدون copy feature:
- المدرب ينشئ "Push Pull Legs" من الصفر لكل متدرب جديد
- يُضيع 20-30 دقيقة في كل برنامج مكرر
- الخطأ البشري يزيد مع كل نسخة يدوية

مع copy feature:
- أنشئ برنامج مرة واحدة كـ template
- انسخه لأي متدرب في ثانية واحدة
- عدّل عليه حسب احتياج المتدرب

---

## Part A: API Endpoints

### أضف لـ `apps/api/src/workout-programs/workout-programs.controller.ts`

```typescript
// Duplicate a program (creates independent copy)
POST /workout-programs/:id/duplicate

// Save as template (marks isTemplate = true, removes traineeId)
POST /workout-programs/:id/save-as-template

// List templates only
GET /workout-programs/templates

// Apply template to trainee (copies template → assigns to trainee)
POST /workout-programs/templates/:id/apply
```

---

## Part B: Duplicate Service

### `apps/api/src/workout-programs/workout-programs.service.ts` — أضف:

```typescript
async duplicate(
  programId: string,
  organizationId: string,
  trainerId: string,
  options: DuplicateProgramDto,
): Promise<WorkoutProgram> {

  // Load original with full nested structure
  const original = await this.prisma.workoutProgram.findUnique({
    where: { id: programId },
    include: {
      weeks: {
        include: {
          days: {
            include: {
              exercises: true,
            },
          },
        },
        orderBy: { weekNumber: 'asc' },
      },
    },
  })

  if (!original) throw new NotFoundException('البرنامج غير موجود')
  if (original.organizationId !== organizationId) throw new ForbiddenException()

  // Deep clone inside a transaction
  return this.prisma.$transaction(async (tx) => {
    // 1. Create new program
    const newProgram = await tx.workoutProgram.create({
      data: {
        organizationId,
        trainerId,
        title: options.title ?? `${original.title} (نسخة)`,
        description: original.description,
        goal: original.goal,
        level: original.level,
        durationWeeks: original.durationWeeks,
        isTemplate: options.saveAsTemplate ?? false,
        status: 'active',
      },
    })

    // 2. Clone weeks → days → exercises
    for (const week of original.weeks) {
      const newWeek = await tx.workoutWeek.create({
        data: {
          workoutProgramId: newProgram.id,
          weekNumber: week.weekNumber,
          title: week.title,
        },
      })

      for (const day of week.days) {
        const newDay = await tx.workoutDay.create({
          data: {
            workoutWeekId: newWeek.id,
            dayNumber: day.dayNumber,
            title: day.title,
            focusArea: day.focusArea,
          },
        })

        if (day.exercises.length > 0) {
          await tx.workoutDayExercise.createMany({
            data: day.exercises.map(ex => ({
              workoutDayId: newDay.id,
              exerciseId: ex.exerciseId,
              sortOrder: ex.sortOrder,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds,
              tempo: ex.tempo,
              rpe: ex.rpe,
              notes: ex.notes,
            })),
          })
        }
      }
    }

    return tx.workoutProgram.findUnique({
      where: { id: newProgram.id },
      include: {
        weeks: { include: { days: { include: { exercises: true } } } },
      },
    })
  })
}

async saveAsTemplate(programId: string, organizationId: string): Promise<WorkoutProgram> {
  return this.prisma.workoutProgram.update({
    where: { id: programId, organizationId },
    data: { isTemplate: true },
  })
}

async applyTemplate(
  templateId: string,
  organizationId: string,
  trainerId: string,
  traineeProfileId: string,
  startDate: Date,
): Promise<TraineeWorkoutAssignment> {

  // 1. Duplicate the template (non-template copy for this trainee)
  const program = await this.duplicate(templateId, organizationId, trainerId, {
    title: undefined,  // will generate name
    saveAsTemplate: false,
  })

  // 2. Assign to trainee
  const assignment = await this.prisma.traineeWorkoutAssignment.create({
    data: {
      organizationId,
      traineeProfileId,
      workoutProgramId: program.id,
      startsOn: startDate,
      status: 'ACTIVE',
      assignedAt: new Date(),
    },
  })

  // 3. Notify trainee
  await this.notificationService.send({
    userId: (await this.prisma.traineeProfile.findUnique({
      where: { id: traineeProfileId },
      select: { userId: true },
    }))!.userId,
    organizationId,
    type: NotificationType.WORKOUT_ASSIGNED,
    title: 'وصلك برنامج تدريبي جديد 💪',
    body: `برنامج: ${program.title}`,
  })

  return assignment
}
```

---

## Part C: DTOs

### `dto/duplicate-program.dto.ts`

```typescript
export class DuplicateProgramDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string        // custom name for the copy — defaults to original + " (نسخة)"

  @IsOptional()
  @IsBoolean()
  saveAsTemplate?: boolean   // if true, saves as template instead of personal program
}

export class ApplyTemplateDto {
  @IsUUID()
  traineeProfileId: string

  @IsDateString()
  startDate: string
}
```

---

## Part D: Coach Builder UI

### In `apps/web/app/(coach)/builder/page.tsx`

#### Templates Section (above the builder)

```
┌──────────────────────────────────────────────────────────┐
│  قوالبي المحفوظة                          [إنشاء قالب +] │
│                                                          │
│  [Push Pull Legs 5-day]  [Full Body 3x]  [Hypertrophy]   │
│   6 أيام · 12 أسبوع       3 أيام · 8 أسبوع   5 أيام      │
│   [تطبيق على متدرب]       [تطبيق]            [تطبيق]     │
└──────────────────────────────────────────────────────────┘
```

Each template card has:
- اسم البرنامج + meta (أيام / أسابيع)
- "تطبيق على متدرب" button → opens modal to select trainee + start date
- "تعديل" button → opens in builder
- "نسخ" button → duplicates immediately

#### In the workout program list `(coach)/trainees/[id]/page.tsx` — Workout tab:

Add "نسخ من قالب" button beside "إنشاء برنامج جديد":

```tsx
<div className="flex gap-3">
  <Button variant="ghost" onClick={() => setShowTemplatesModal(true)}>
    📋 من قالب
  </Button>
  <Button onClick={() => setShowBuilderModal(true)}>
    + برنامج جديد
  </Button>
</div>
```

#### Apply Template Modal

```
اختر القالب:
○ Push Pull Legs 5-day (12 أسبوع)
○ Full Body 3x Week (8 أسابيع)
○ Upper Lower Split (10 أسابيع)

تاريخ البداية: [date picker]

[تطبيق البرنامج]
```

On confirm: `POST /workout-programs/templates/:id/apply` → shows success toast.

---

## Part E: Nutrition Plan Copy

### أضف نفس المنطق لـ nutrition plans:

```typescript
// In nutrition.service.ts
async duplicatePlan(planId: string, orgId: string, options: DuplicatePlanDto) {
  const original = await this.prisma.nutritionPlan.findUnique({
    where: { id: planId, organizationId: orgId },
    include: {
      meals: { include: { items: true }, orderBy: { mealOrder: 'asc' } },
    },
  })

  return this.prisma.$transaction(async (tx) => {
    const newPlan = await tx.nutritionPlan.create({
      data: {
        organizationId: orgId,
        trainerId: options.trainerId,
        title: options.title ?? `${original.title} (نسخة)`,
        goal: original.goal,
        caloriesTarget: original.caloriesTarget,
        proteinG: original.proteinG,
        carbsG: original.carbsG,
        fatsG: original.fatsG,
        waterMl: original.waterMl,
        notes: original.notes,
      },
    })

    for (const meal of original.meals) {
      const newMeal = await tx.nutritionPlanMeal.create({
        data: {
          nutritionPlanId: newPlan.id,
          title: meal.title,
          titleAr: meal.titleAr,
          mealOrder: meal.mealOrder,
          timeSuggestion: meal.timeSuggestion,
          calories: meal.calories,
          proteinG: meal.proteinG,
          carbsG: meal.carbsG,
          fatsG: meal.fatsG,
          notes: meal.notes,
        },
      })

      if (meal.items.length > 0) {
        await tx.nutritionPlanMealItem.createMany({
          data: meal.items.map(item => ({
            nutritionPlanMealId: newMeal.id,
            foodId: item.foodId,
            customFoodName: item.customFoodName,
            quantityGrams: item.quantityGrams,
            calories: item.calories,
            proteinG: item.proteinG,
            carbsG: item.carbsG,
            fatsG: item.fatsG,
          })),
        })
      }
    }

    return newPlan
  })
}
```

Endpoint: `POST /nutrition/plans/:id/duplicate`

---

## Output Requirements

- `POST /workout-programs/:id/duplicate` creates exact deep copy with all weeks/days/exercises
- `POST /workout-programs/templates/:id/apply` copies template + assigns to trainee in one call
- Templates tab shows in builder sidebar
- "من قالب" button works in trainee detail page
- Nutrition plan duplicate works the same way
- Unit test: duplicate preserves all nested exercises with correct sortOrder
