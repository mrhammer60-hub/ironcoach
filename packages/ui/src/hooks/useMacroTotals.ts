import { useMemo } from "react";

interface MacroLog {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export function useMacroTotals(logs: MacroLog[], targets: MacroLog) {
  return useMemo(() => {
    const consumed = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        proteinG: acc.proteinG + log.proteinG,
        carbsG: acc.carbsG + log.carbsG,
        fatsG: acc.fatsG + log.fatsG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 },
    );

    const safePct = (val: number, target: number) =>
      target > 0 ? Math.min(100, Math.round((val / target) * 100)) : 0;

    return {
      consumed,
      remaining: {
        calories: Math.max(0, targets.calories - consumed.calories),
        proteinG: Math.max(0, targets.proteinG - consumed.proteinG),
        carbsG: Math.max(0, targets.carbsG - consumed.carbsG),
        fatsG: Math.max(0, targets.fatsG - consumed.fatsG),
      },
      percentages: {
        calories: safePct(consumed.calories, targets.calories),
        proteinG: safePct(consumed.proteinG, targets.proteinG),
        carbsG: safePct(consumed.carbsG, targets.carbsG),
        fatsG: safePct(consumed.fatsG, targets.fatsG),
      },
    };
  }, [logs, targets]);
}
