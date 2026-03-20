# Prompt 08 — Nutrition System

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–07 complete.

---

## Task

Build the complete nutrition system: meal plans, food database, macro tracking.

---

## Endpoints

### `apps/api/src/nutrition/`

All: `JwtAuthGuard` + `OrganizationGuard`

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/nutrition/plans` | TRAINER/TRAINEE | Coach: all; Trainee: own active |
| POST | `/nutrition/plans` | TRAINER | Create plan |
| GET | `/nutrition/plans/:id` | TRAINER/TRAINEE | Full plan with meals + items |
| PUT | `/nutrition/plans/:id` | TRAINER | Update macro targets |
| DELETE | `/nutrition/plans/:id` | TRAINER | Delete (if not assigned) |
| POST | `/nutrition/plans/:id/assign` | TRAINER | Assign to trainee |
| POST | `/nutrition/plans/:id/meals` | TRAINER | Add meal to plan |
| PUT | `/nutrition/meals/:id` | TRAINER | Update meal |
| DELETE | `/nutrition/meals/:id` | TRAINER | Remove meal |
| POST | `/nutrition/meals/:id/items` | TRAINER | Add food item to meal |
| PUT | `/nutrition/meal-items/:id` | TRAINER | Update item quantity |
| DELETE | `/nutrition/meal-items/:id` | TRAINER | Remove item |
| GET | `/nutrition/today` | TRAINEE | Today's plan + macro totals |
| GET | `/nutrition/foods` | JWT | Search food database |
| POST | `/nutrition/logs` | TRAINEE | Log a meal |
| GET | `/nutrition/logs` | TRAINEE | Own meal logs (today by default) |

---

## Implementation Details

### `POST /nutrition/plans`
Body — `CreateNutritionPlanDto`:
- `traineeProfileId?` (optional — can create template first)
- `title` (string)
- `goal` (GoalType enum)
- `caloriesTarget` (Int) — can pull from latest `CalorieCalculation` if `traineeProfileId` provided
- `proteinG`, `carbsG`, `fatsG` (Int)
- `waterMl?` (Int)
- `notes?`

### `POST /nutrition/plans/:id/assign`
Body — `AssignNutritionPlanDto`:
- `traineeProfileId` (UUID)
- `startDate` (ISO date)
- Deactivates existing active nutrition assignment for that trainee
- Creates `TraineeNutritionAssignment`
- Sends push notification: "وصلتك خطة غذائية جديدة 🥗"

### `POST /nutrition/meals/:id/items`
Body — `AddMealItemDto`:
- `foodId?` (UUID from food DB — nullable)
- `customFoodName?` (string — if no foodId)
- `quantityGrams` (number)
- Service auto-calculates `calories`, `proteinG`, `carbsG`, `fatsG` from food macros × (quantity/100)
- After insert: recalculate meal totals, then plan totals (update denormalized fields)

### `GET /nutrition/today`
Returns:
```typescript
{
  plan: { id, title, caloriesTarget, proteinG, carbsG, fatsG },
  meals: [{
    id, title, titleAr, mealOrder, timeSuggestion,
    calories, proteinG, carbsG, fatsG,
    items: [{ foodName, quantityGrams, calories, proteinG, carbsG, fatsG }]
  }],
  todayLog: {
    totalCalories, totalProtein, totalCarbs, totalFats,
    remainingCalories, remainingProtein,
    percentComplete: number
  }
}
```

### `GET /nutrition/foods`
Query: `search?` (min 2 chars), `barcode?`, `page?`, `limit?` (default 20)
Full-text search on `nameEn` + `nameAr` using `ILIKE`.
Returns: id, nameEn, nameAr, caloriesPer100g, proteinG, carbsG, fatsG

---

## Auto-recalculation Rule

Whenever a `NutritionPlanMealItem` is created/updated/deleted:
1. Recalculate `NutritionPlanMeal.calories/proteinG/carbsG/fatsG` = sum of all items
2. Recalculate `NutritionPlan.caloriesTarget` if `autoSync` flag is set (optional feature)

Use a Prisma transaction to ensure consistency.

---

## Files Required

```
apps/api/src/nutrition/
  nutrition.module.ts
  nutrition.controller.ts
  nutrition.service.ts
  macro-calculator.service.ts   ← converts food × quantity → macros
  dto/
    create-plan.dto.ts
    update-plan.dto.ts
    assign-plan.dto.ts
    add-meal.dto.ts
    update-meal.dto.ts
    add-meal-item.dto.ts
    update-meal-item.dto.ts
    log-meal.dto.ts
    search-foods.dto.ts
```

---

## Output Requirements

- Macro auto-recalculation works correctly on item changes
- `GET /nutrition/today` returns accurate remaining macros
- Food search works with Arabic + English names
