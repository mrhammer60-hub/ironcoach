import { Injectable } from "@nestjs/common";
import { ActivityLevel, Gender, GoalType } from "@ironcoach/db";

const ACTIVITY_FACTORS: Record<string, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
};

const GOAL_ADJUSTMENTS: Record<string, number> = {
  FAT_LOSS: -500,
  LEAN_CUT: -250,
  GENERAL_FITNESS: 0,
  MUSCLE_GAIN: 200,
  BULK: 500,
};

export interface CalcInput {
  gender: Gender;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
}

export interface CalcResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  activityFactor: number;
  goalAdjustment: number;
}

@Injectable()
export class CalorieCalculatorService {
  calculate(input: CalcInput): CalcResult {
    // BMR — Mifflin-St Jeor
    const bmrRaw =
      input.gender === Gender.MALE
        ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + 5
        : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age - 161;

    const bmr = Math.round(bmrRaw);

    const activityFactor = ACTIVITY_FACTORS[input.activityLevel] ?? 1.55;
    const tdee = Math.round(bmrRaw * activityFactor);

    const goalAdjustment = GOAL_ADJUSTMENTS[input.goal] ?? 0;
    const targetCalories = Math.round(tdee + goalAdjustment);

    // Macro split (protein-first)
    const proteinG = Math.round(input.weightKg * 2.0);
    const fatsG = Math.round((targetCalories * 0.25) / 9);
    const carbsG = Math.round(
      (targetCalories - proteinG * 4 - fatsG * 9) / 4,
    );

    return {
      bmr,
      tdee,
      targetCalories,
      proteinG,
      carbsG: Math.max(0, carbsG),
      fatsG,
      activityFactor,
      goalAdjustment,
    };
  }

  calculateAge(birthDate: string | Date): number {
    const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }
}
