import type { GoalType } from "../types/enums.types";

export const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  FAT_LOSS: -500,
  LEAN_CUT: -250,
  GENERAL_FITNESS: 0,
  MUSCLE_GAIN: 200,
  BULK: 500,
};
