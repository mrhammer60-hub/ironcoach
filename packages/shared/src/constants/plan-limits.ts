import type { PlanCode } from "../types/enums.types";

export const PLAN_LIMITS: Record<PlanCode, number> = {
  STARTER: 20,
  GROWTH: 50,
  PRO: 150,
};
