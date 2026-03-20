import { z } from "zod";
import { DifficultyLevel, MuscleGroup } from "../types/enums.types";

export const CreateExerciseSchema = z.object({
  nameEn: z.string().min(2, "Exercise name is required").max(100),
  nameAr: z.string().min(2, "اسم التمرين مطلوب").max(100),
  muscleGroup: z.enum(
    [
      MuscleGroup.CHEST,
      MuscleGroup.BACK,
      MuscleGroup.LEGS,
      MuscleGroup.SHOULDERS,
      MuscleGroup.BICEPS,
      MuscleGroup.TRICEPS,
      MuscleGroup.CORE,
      MuscleGroup.GLUTES,
    ],
    { required_error: "المجموعة العضلية مطلوبة" },
  ),
  secondaryMuscles: z.array(z.string()).default([]),
  difficultyLevel: z.enum(
    [
      DifficultyLevel.BEGINNER,
      DifficultyLevel.INTERMEDIATE,
      DifficultyLevel.ADVANCED,
    ],
    { required_error: "مستوى الصعوبة مطلوب" },
  ),
  equipment: z.string().max(100).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  instructionsEn: z.string().max(2000).nullable().optional(),
  instructionsAr: z.string().max(2000).nullable().optional(),
  tipsEn: z.string().max(1000).nullable().optional(),
  tipsAr: z.string().max(1000).nullable().optional(),
  defaultSets: z.number().int().min(1).max(20),
  defaultReps: z.string().max(20),
  defaultRestSeconds: z.number().int().min(0).max(600),
  tempo: z.string().max(20).nullable().optional(),
});
export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;

export const UpdateExerciseSchema = CreateExerciseSchema.partial();
export type UpdateExerciseInput = z.infer<typeof UpdateExerciseSchema>;
