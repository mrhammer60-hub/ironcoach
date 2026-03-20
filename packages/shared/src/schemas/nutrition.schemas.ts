import { z } from "zod";
import { GoalType } from "../types/enums.types";

export const CreateNutritionPlanSchema = z.object({
  traineeProfileId: z.string().uuid().nullable().optional(),
  title: z.string().min(2, "عنوان الخطة مطلوب").max(100),
  goal: z
    .enum([
      GoalType.MUSCLE_GAIN,
      GoalType.FAT_LOSS,
      GoalType.BULK,
      GoalType.LEAN_CUT,
      GoalType.GENERAL_FITNESS,
    ])
    .optional(),
  caloriesTarget: z.number().int().min(800).max(10000),
  proteinG: z.number().int().min(0).max(1000),
  carbsG: z.number().int().min(0).max(2000),
  fatsG: z.number().int().min(0).max(500),
  waterMl: z.number().int().min(0).max(10000).optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateNutritionPlanInput = z.infer<
  typeof CreateNutritionPlanSchema
>;

export const AddMealSchema = z.object({
  mealTemplateId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, "اسم الوجبة مطلوب").max(100),
  titleAr: z.string().max(100).optional(),
  mealOrder: z.number().int().min(1),
  timeSuggestion: z.string().max(20).optional(),
  calories: z.number().int().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatsG: z.number().min(0),
  notes: z.string().max(500).optional(),
});
export type AddMealInput = z.infer<typeof AddMealSchema>;

export const AddMealItemSchema = z.object({
  foodId: z.string().uuid().nullable().optional(),
  customFoodName: z.string().max(100).nullable().optional(),
  quantityGrams: z.number().min(1, "الكمية يجب أن تكون أكبر من 0"),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatsG: z.number().min(0),
});
export type AddMealItemInput = z.infer<typeof AddMealItemSchema>;

export const LogMealSchema = z.object({
  nutritionPlanMealId: z.string().uuid().nullable().optional(),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatsG: z.number().min(0),
  notes: z.string().max(500).optional(),
  imageUrl: z.string().url().nullable().optional(),
});
export type LogMealInput = z.infer<typeof LogMealSchema>;

export const AssignNutritionPlanSchema = z.object({
  traineeProfileId: z.string().uuid(),
  nutritionPlanId: z.string().uuid(),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type AssignNutritionPlanInput = z.infer<
  typeof AssignNutritionPlanSchema
>;
