import { useState, useCallback } from "react";

interface ExerciseSetState {
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  done: boolean;
}

export function useWorkoutProgress(totalExercises: number) {
  const [sets, setSets] = useState<Record<string, ExerciseSetState[]>>({});
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set(),
  );

  const markSetDone = useCallback(
    (exerciseId: string, setNumber: number) => {
      setSets((prev) => {
        const exerciseSets = prev[exerciseId] ?? [];
        const updated = exerciseSets.map((s) =>
          s.setNumber === setNumber ? { ...s, done: true } : s,
        );
        const allDone = updated.every((s) => s.done);
        if (allDone) {
          setCompletedExercises((c) => new Set([...c, exerciseId]));
        }
        return { ...prev, [exerciseId]: updated };
      });
    },
    [],
  );

  const progressPct =
    totalExercises > 0
      ? Math.round((completedExercises.size / totalExercises) * 100)
      : 0;

  return { sets, completedExercises, progressPct, markSetDone, setSets };
}
