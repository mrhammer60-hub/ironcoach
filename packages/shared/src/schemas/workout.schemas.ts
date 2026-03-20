import { z } from "zod";
import { DifficultyLevel, GoalType } from "../types/enums.types";

export const CreateProgramSchema = z.object({
  title: z.string().min(2, "عنوان البرنامج مطلوب").max(100),
  description: z.string().max(500).optional(),
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
  level: z.enum(
    [
      DifficultyLevel.BEGINNER,
      DifficultyLevel.INTERMEDIATE,
      DifficultyLevel.ADVANCED,
    ],
    { required_error: "المستوى مطلوب" },
  ),
  durationWeeks: z
    .number()
    .int()
    .min(1, "المدة يجب أن تكون أسبوع واحد على الأقل")
    .max(52),
  isTemplate: z.boolean().default(false),
});
export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;

export const AddExerciseToDaySchema = z.object({
  exerciseId: z.string().uuid(),
  sortOrder: z.number().int().min(0),
  sets: z.number().int().min(1).max(20),
  reps: z.string().max(20),
  restSeconds: z.number().int().min(0).max(600),
  tempo: z.string().max(20).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(300).optional(),
});
export type AddExerciseToDayInput = z.infer<typeof AddExerciseToDaySchema>;

export const LogSetsSchema = z.object({
  sets: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        setNumber: z.number().int().min(1),
        repsCompleted: z.number().int().min(0),
        weightKg: z.number().min(0).optional(),
        rpe: z.number().int().min(1).max(10).optional(),
        isCompleted: z.boolean(),
        notes: z.string().max(200).optional(),
      }),
    )
    .min(1, "يجب تسجيل مجموعة واحدة على الأقل"),
});
export type LogSetsInput = z.infer<typeof LogSetsSchema>;

export const CompleteSessionSchema = z.object({
  difficultyRating: z.number().int().min(1).max(5),
  traineeNotes: z.string().max(500).optional(),
});
export type CompleteSessionInput = z.infer<typeof CompleteSessionSchema>;

export const AssignProgramSchema = z.object({
  traineeProfileId: z.string().uuid(),
  workoutProgramId: z.string().uuid(),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type AssignProgramInput = z.infer<typeof AssignProgramSchema>;
