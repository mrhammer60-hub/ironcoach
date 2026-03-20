import { z } from "zod";
import { ActivityLevel, GoalType, Gender } from "../types/enums.types";

export const OnboardSchema = z.object({
  gender: z.enum(
    [Gender.MALE, Gender.FEMALE],
    { required_error: "الجنس مطلوب" },
  ),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صالحة"),
  heightCm: z
    .number()
    .min(100, "الطول يجب أن يكون 100 سم على الأقل")
    .max(250, "الطول يجب أن يكون أقل من 250 سم"),
  currentWeightKg: z
    .number()
    .min(30, "الوزن يجب أن يكون 30 كجم على الأقل")
    .max(300),
  targetWeightKg: z.number().min(30).max(300).optional(),
  activityLevel: z.enum(
    [
      ActivityLevel.SEDENTARY,
      ActivityLevel.LIGHTLY_ACTIVE,
      ActivityLevel.MODERATELY_ACTIVE,
      ActivityLevel.VERY_ACTIVE,
      ActivityLevel.EXTRA_ACTIVE,
    ],
    { required_error: "مستوى النشاط مطلوب" },
  ),
  goal: z.enum(
    [
      GoalType.MUSCLE_GAIN,
      GoalType.FAT_LOSS,
      GoalType.BULK,
      GoalType.LEAN_CUT,
      GoalType.GENERAL_FITNESS,
    ],
    { required_error: "الهدف مطلوب" },
  ),
  trainingDaysPerWeek: z
    .number()
    .int()
    .min(1, "يجب تحديد يوم واحد على الأقل")
    .max(7, "الحد الأقصى 7 أيام"),
  injuriesNotes: z.string().max(500).optional(),
  foodPreferences: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
});
export type OnboardInput = z.infer<typeof OnboardSchema>;

export const UpdateTraineeProfileSchema = z.object({
  assignedTrainerId: z.string().uuid().nullable().optional(),
  gender: z.enum([Gender.MALE, Gender.FEMALE]).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  currentWeightKg: z.number().min(30).max(300).optional(),
  targetWeightKg: z.number().min(30).max(300).nullable().optional(),
  activityLevel: z
    .enum([
      ActivityLevel.SEDENTARY,
      ActivityLevel.LIGHTLY_ACTIVE,
      ActivityLevel.MODERATELY_ACTIVE,
      ActivityLevel.VERY_ACTIVE,
      ActivityLevel.EXTRA_ACTIVE,
    ])
    .optional(),
  goal: z
    .enum([
      GoalType.MUSCLE_GAIN,
      GoalType.FAT_LOSS,
      GoalType.BULK,
      GoalType.LEAN_CUT,
      GoalType.GENERAL_FITNESS,
    ])
    .optional(),
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  injuriesNotes: z.string().max(500).nullable().optional(),
  foodPreferences: z.string().max(500).nullable().optional(),
  allergies: z.string().max(500).nullable().optional(),
});
export type UpdateTraineeProfileInput = z.infer<
  typeof UpdateTraineeProfileSchema
>;

export const CalorieResultSchema = z.object({
  bmr: z.number(),
  tdee: z.number(),
  targetCalories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatsG: z.number(),
  activityFactor: z.number(),
  goalAdjustment: z.number(),
});
export type CalorieResult = z.infer<typeof CalorieResultSchema>;

export const SubmitCheckinSchema = z.object({
  weightKg: z.number().min(30).max(300).optional(),
  waistCm: z.number().min(30).max(200).optional(),
  chestCm: z.number().min(30).max(200).optional(),
  hipsCm: z.number().min(30).max(200).optional(),
  armsCm: z.number().min(10).max(80).optional(),
  thighsCm: z.number().min(20).max(100).optional(),
  sleepScore: z.number().int().min(1).max(5).optional(),
  energyScore: z.number().int().min(1).max(5).optional(),
  adherenceScore: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
});
export type SubmitCheckinInput = z.infer<typeof SubmitCheckinSchema>;

export const CoachCheckinResponseSchema = z.object({
  coachResponse: z.string().min(1).max(2000),
});
export type CoachCheckinResponseInput = z.infer<
  typeof CoachCheckinResponseSchema
>;
