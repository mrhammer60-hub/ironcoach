import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// ─── Workout Templates ──────────────────────────────────────────────────────

interface TemplateExercise {
  nameEn: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

interface TemplateDay {
  dayName: string;
  dayNameAr: string;
  exercises: TemplateExercise[];
}

interface WorkoutTemplate {
  name: string;
  nameAr: string;
  daysPerWeek: number;
  days: TemplateDay[];
}

const FULL_BODY_3X: WorkoutTemplate = {
  name: "Full Body 3x",
  nameAr: "جسم كامل 3 أيام",
  daysPerWeek: 3,
  days: [
    {
      dayName: "Full Body A",
      dayNameAr: "جسم كامل أ",
      exercises: [
        { nameEn: "Barbell Back Squat", sets: 4, reps: "6-8", restSeconds: 180 },
        { nameEn: "Barbell Bench Press", sets: 4, reps: "8-10", restSeconds: 120 },
        { nameEn: "Barbell Bent-Over Row", sets: 4, reps: "8-10", restSeconds: 120 },
        { nameEn: "Overhead Barbell Press", sets: 3, reps: "8-10", restSeconds: 90 },
        { nameEn: "Barbell Curl", sets: 3, reps: "10-12", restSeconds: 60 },
        { nameEn: "Plank", sets: 3, reps: "30-60s", restSeconds: 60 },
      ],
    },
    {
      dayName: "Full Body B",
      dayNameAr: "جسم كامل ب",
      exercises: [
        { nameEn: "Barbell Deadlift", sets: 4, reps: "5-6", restSeconds: 180 },
        { nameEn: "Incline Dumbbell Press", sets: 4, reps: "10-12", restSeconds: 90 },
        { nameEn: "Lat Pulldown", sets: 4, reps: "10-12", restSeconds: 90 },
        { nameEn: "Seated Dumbbell Press", sets: 3, reps: "8-10", restSeconds: 90 },
        { nameEn: "Tricep Rope Pushdown", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Hanging Leg Raise", sets: 3, reps: "12-15", restSeconds: 60 },
      ],
    },
    {
      dayName: "Full Body C",
      dayNameAr: "جسم كامل ج",
      exercises: [
        { nameEn: "Front Squat", sets: 4, reps: "6-8", restSeconds: 180 },
        { nameEn: "Dumbbell Fly", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Seated Cable Row", sets: 4, reps: "10-12", restSeconds: 90 },
        { nameEn: "Dumbbell Lateral Raise", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Dumbbell Hammer Curl", sets: 3, reps: "10-12", restSeconds: 60 },
        { nameEn: "Russian Twist", sets: 3, reps: "20 total", restSeconds: 60 },
      ],
    },
  ],
};

const UPPER_LOWER: WorkoutTemplate = {
  name: "Upper/Lower Split",
  nameAr: "تقسيم علوي/سفلي",
  daysPerWeek: 4,
  days: [
    {
      dayName: "Upper A",
      dayNameAr: "علوي أ",
      exercises: [
        { nameEn: "Barbell Bench Press", sets: 4, reps: "6-8", restSeconds: 120 },
        { nameEn: "Barbell Bent-Over Row", sets: 4, reps: "6-8", restSeconds: 120 },
        { nameEn: "Overhead Barbell Press", sets: 3, reps: "8-10", restSeconds: 90 },
        { nameEn: "Pull-Up", sets: 3, reps: "8-12", restSeconds: 90 },
        { nameEn: "Barbell Curl", sets: 3, reps: "10-12", restSeconds: 60 },
        { nameEn: "Tricep Rope Pushdown", sets: 3, reps: "12-15", restSeconds: 60 },
      ],
    },
    {
      dayName: "Lower A",
      dayNameAr: "سفلي أ",
      exercises: [
        { nameEn: "Barbell Back Squat", sets: 4, reps: "6-8", restSeconds: 180 },
        { nameEn: "Romanian Deadlift", sets: 4, reps: "8-10", restSeconds: 120 },
        { nameEn: "Leg Press", sets: 3, reps: "10-12", restSeconds: 120 },
        { nameEn: "Leg Curl", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Calf Raise", sets: 4, reps: "15-20", restSeconds: 60 },
        { nameEn: "Plank", sets: 3, reps: "30-60s", restSeconds: 60 },
      ],
    },
    {
      dayName: "Upper B",
      dayNameAr: "علوي ب",
      exercises: [
        { nameEn: "Incline Dumbbell Press", sets: 4, reps: "8-10", restSeconds: 90 },
        { nameEn: "Seated Cable Row", sets: 4, reps: "10-12", restSeconds: 90 },
        { nameEn: "Seated Dumbbell Press", sets: 3, reps: "8-10", restSeconds: 90 },
        { nameEn: "Lat Pulldown", sets: 3, reps: "10-12", restSeconds: 90 },
        { nameEn: "Dumbbell Hammer Curl", sets: 3, reps: "10-12", restSeconds: 60 },
        { nameEn: "Skull Crusher", sets: 3, reps: "10-12", restSeconds: 60 },
      ],
    },
    {
      dayName: "Lower B",
      dayNameAr: "سفلي ب",
      exercises: [
        { nameEn: "Barbell Deadlift", sets: 4, reps: "5-6", restSeconds: 180 },
        { nameEn: "Front Squat", sets: 3, reps: "6-8", restSeconds: 180 },
        { nameEn: "Walking Lunge", sets: 3, reps: "12 each", restSeconds: 90 },
        { nameEn: "Leg Extension", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Barbell Hip Thrust", sets: 4, reps: "8-12", restSeconds: 120 },
        { nameEn: "Hanging Leg Raise", sets: 3, reps: "12-15", restSeconds: 60 },
      ],
    },
  ],
};

const PPL_6DAY: WorkoutTemplate = {
  name: "Push/Pull/Legs 6-Day",
  nameAr: "دفع/سحب/أرجل 6 أيام",
  daysPerWeek: 6,
  days: [
    {
      dayName: "Push A",
      dayNameAr: "دفع أ",
      exercises: [
        { nameEn: "Barbell Bench Press", sets: 4, reps: "6-8", restSeconds: 120 },
        { nameEn: "Overhead Barbell Press", sets: 4, reps: "6-8", restSeconds: 120 },
        { nameEn: "Incline Dumbbell Press", sets: 3, reps: "10-12", restSeconds: 90 },
        { nameEn: "Dumbbell Lateral Raise", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Tricep Rope Pushdown", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Overhead Dumbbell Extension", sets: 3, reps: "10-12", restSeconds: 60 },
      ],
    },
    {
      dayName: "Pull A",
      dayNameAr: "سحب أ",
      exercises: [
        { nameEn: "Barbell Deadlift", sets: 4, reps: "5-6", restSeconds: 180 },
        { nameEn: "Pull-Up", sets: 4, reps: "8-12", restSeconds: 90 },
        { nameEn: "Barbell Bent-Over Row", sets: 4, reps: "8-10", restSeconds: 120 },
        { nameEn: "Face Pull", sets: 3, reps: "15-20", restSeconds: 60 },
        { nameEn: "Barbell Curl", sets: 3, reps: "10-12", restSeconds: 60 },
        { nameEn: "Dumbbell Hammer Curl", sets: 3, reps: "10-12", restSeconds: 60 },
      ],
    },
    {
      dayName: "Legs A",
      dayNameAr: "أرجل أ",
      exercises: [
        { nameEn: "Barbell Back Squat", sets: 4, reps: "6-8", restSeconds: 180 },
        { nameEn: "Romanian Deadlift", sets: 4, reps: "8-10", restSeconds: 120 },
        { nameEn: "Leg Press", sets: 3, reps: "10-12", restSeconds: 120 },
        { nameEn: "Leg Curl", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Calf Raise", sets: 4, reps: "15-20", restSeconds: 60 },
        { nameEn: "Plank", sets: 3, reps: "30-60s", restSeconds: 60 },
      ],
    },
    {
      dayName: "Push B",
      dayNameAr: "دفع ب",
      exercises: [
        { nameEn: "Seated Dumbbell Press", sets: 4, reps: "8-10", restSeconds: 90 },
        { nameEn: "Incline Dumbbell Press", sets: 4, reps: "8-10", restSeconds: 90 },
        { nameEn: "Cable Crossover", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Arnold Press", sets: 3, reps: "8-10", restSeconds: 90 },
        { nameEn: "Close-Grip Bench Press", sets: 3, reps: "8-10", restSeconds: 90 },
        { nameEn: "Cable Lateral Raise", sets: 3, reps: "12-15", restSeconds: 60 },
      ],
    },
    {
      dayName: "Pull B",
      dayNameAr: "سحب ب",
      exercises: [
        { nameEn: "T-Bar Row", sets: 4, reps: "8-10", restSeconds: 120 },
        { nameEn: "Lat Pulldown", sets: 4, reps: "10-12", restSeconds: 90 },
        { nameEn: "Seated Cable Row", sets: 3, reps: "10-12", restSeconds: 90 },
        { nameEn: "Face Pull", sets: 3, reps: "15-20", restSeconds: 60 },
        { nameEn: "Incline Dumbbell Curl", sets: 3, reps: "10-12", restSeconds: 60 },
        { nameEn: "Preacher Curl", sets: 3, reps: "10-12", restSeconds: 60 },
      ],
    },
    {
      dayName: "Legs B",
      dayNameAr: "أرجل ب",
      exercises: [
        { nameEn: "Front Squat", sets: 4, reps: "6-8", restSeconds: 180 },
        { nameEn: "Barbell Hip Thrust", sets: 4, reps: "8-12", restSeconds: 120 },
        { nameEn: "Bulgarian Split Squat", sets: 3, reps: "10 each", restSeconds: 90 },
        { nameEn: "Leg Extension", sets: 3, reps: "12-15", restSeconds: 60 },
        { nameEn: "Walking Lunge", sets: 3, reps: "12 each", restSeconds: 90 },
        { nameEn: "Hanging Leg Raise", sets: 3, reps: "12-15", restSeconds: 60 },
      ],
    },
  ],
};

const FULL_BODY_CIRCUIT: WorkoutTemplate = {
  name: "Full Body Circuit",
  nameAr: "دائرة جسم كامل",
  daysPerWeek: 3,
  days: [
    {
      dayName: "Circuit A",
      dayNameAr: "دائرة أ",
      exercises: [
        { nameEn: "Goblet Squat", sets: 3, reps: "15", restSeconds: 30 },
        { nameEn: "Push-Up", sets: 3, reps: "15-20", restSeconds: 30 },
        { nameEn: "Single-Arm Dumbbell Row", sets: 3, reps: "12 each", restSeconds: 30 },
        { nameEn: "Walking Lunge", sets: 3, reps: "12 each", restSeconds: 30 },
        { nameEn: "Plank", sets: 3, reps: "30-60s", restSeconds: 30 },
        { nameEn: "Glute Bridge", sets: 3, reps: "15", restSeconds: 30 },
      ],
    },
    {
      dayName: "Circuit B",
      dayNameAr: "دائرة ب",
      exercises: [
        { nameEn: "Barbell Back Squat", sets: 3, reps: "12", restSeconds: 30 },
        { nameEn: "Incline Dumbbell Press", sets: 3, reps: "12", restSeconds: 30 },
        { nameEn: "Lat Pulldown", sets: 3, reps: "12", restSeconds: 30 },
        { nameEn: "Step-Up", sets: 3, reps: "10 each", restSeconds: 30 },
        { nameEn: "Russian Twist", sets: 3, reps: "20 total", restSeconds: 30 },
        { nameEn: "Dumbbell Lateral Raise", sets: 3, reps: "15", restSeconds: 30 },
      ],
    },
    {
      dayName: "Circuit C",
      dayNameAr: "دائرة ج",
      exercises: [
        { nameEn: "Romanian Deadlift", sets: 3, reps: "12", restSeconds: 30 },
        { nameEn: "Dumbbell Fly", sets: 3, reps: "15", restSeconds: 30 },
        { nameEn: "Seated Cable Row", sets: 3, reps: "12", restSeconds: 30 },
        { nameEn: "Bulgarian Split Squat", sets: 3, reps: "10 each", restSeconds: 30 },
        { nameEn: "Dead Bug", sets: 3, reps: "10 each", restSeconds: 30 },
        { nameEn: "Tricep Rope Pushdown", sets: 3, reps: "15", restSeconds: 30 },
      ],
    },
  ],
};

const STRONGLIFTS_5X5: WorkoutTemplate = {
  name: "StrongLifts 5x5",
  nameAr: "سترونغ ليفتس 5×5",
  daysPerWeek: 3,
  days: [
    {
      dayName: "Workout A",
      dayNameAr: "تمرين أ",
      exercises: [
        { nameEn: "Barbell Back Squat", sets: 5, reps: "5", restSeconds: 180 },
        { nameEn: "Barbell Bench Press", sets: 5, reps: "5", restSeconds: 180 },
        { nameEn: "Barbell Bent-Over Row", sets: 5, reps: "5", restSeconds: 180 },
        { nameEn: "Barbell Curl", sets: 3, reps: "8-10", restSeconds: 60 },
        { nameEn: "Plank", sets: 3, reps: "30-60s", restSeconds: 60 },
      ],
    },
    {
      dayName: "Workout B",
      dayNameAr: "تمرين ب",
      exercises: [
        { nameEn: "Barbell Back Squat", sets: 5, reps: "5", restSeconds: 180 },
        { nameEn: "Overhead Barbell Press", sets: 5, reps: "5", restSeconds: 180 },
        { nameEn: "Barbell Deadlift", sets: 1, reps: "5", restSeconds: 180 },
        { nameEn: "Tricep Rope Pushdown", sets: 3, reps: "10-12", restSeconds: 60 },
        { nameEn: "Hanging Leg Raise", sets: 3, reps: "12-15", restSeconds: 60 },
      ],
    },
    {
      dayName: "Workout A (repeat)",
      dayNameAr: "تمرين أ (تكرار)",
      exercises: [
        { nameEn: "Barbell Back Squat", sets: 5, reps: "5", restSeconds: 180 },
        { nameEn: "Barbell Bench Press", sets: 5, reps: "5", restSeconds: 180 },
        { nameEn: "Barbell Bent-Over Row", sets: 5, reps: "5", restSeconds: 180 },
        { nameEn: "Dumbbell Hammer Curl", sets: 3, reps: "10-12", restSeconds: 60 },
        { nameEn: "Russian Twist", sets: 3, reps: "20 total", restSeconds: 60 },
      ],
    },
  ],
};

// ─── Activity Level Multipliers for TDEE ────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
};

// ─── Goal Calorie Adjustments ───────────────────────────────────────────────

const GOAL_CALORIE_ADJUSTMENTS: Record<string, number> = {
  MUSCLE_GAIN: 300,
  BULK: 500,
  FAT_LOSS: -400,
  LEAN_CUT: -250,
  GENERAL_FITNESS: 0,
};

// ─── Goal Macro Splits (protein%, carbs%, fats%) ────────────────────────────

const GOAL_MACRO_SPLITS: Record<string, { proteinPct: number; carbsPct: number; fatsPct: number }> = {
  MUSCLE_GAIN: { proteinPct: 0.30, carbsPct: 0.45, fatsPct: 0.25 },
  BULK: { proteinPct: 0.25, carbsPct: 0.50, fatsPct: 0.25 },
  FAT_LOSS: { proteinPct: 0.40, carbsPct: 0.30, fatsPct: 0.30 },
  LEAN_CUT: { proteinPct: 0.35, carbsPct: 0.35, fatsPct: 0.30 },
  GENERAL_FITNESS: { proteinPct: 0.30, carbsPct: 0.40, fatsPct: 0.30 },
};

// ─── Meal Blueprints (food nameEn references) ──────────────────────────────

interface MealBlueprint {
  title: string;
  titleAr: string;
  timeSuggestion: string;
  foods: Array<{ nameEn: string; quantityGrams: number }>;
}

const MEAL_BLUEPRINTS: MealBlueprint[] = [
  {
    title: "Breakfast",
    titleAr: "الإفطار",
    timeSuggestion: "07:00",
    foods: [
      { nameEn: "Oats (dry)", quantityGrams: 80 },
      { nameEn: "Eggs (whole, boiled)", quantityGrams: 100 },
      { nameEn: "Banana", quantityGrams: 120 },
    ],
  },
  {
    title: "Lunch",
    titleAr: "الغداء",
    timeSuggestion: "12:30",
    foods: [
      { nameEn: "Chicken Breast (grilled)", quantityGrams: 200 },
      { nameEn: "White Rice (cooked)", quantityGrams: 200 },
      { nameEn: "Broccoli (steamed)", quantityGrams: 150 },
    ],
  },
  {
    title: "Dinner",
    titleAr: "العشاء",
    timeSuggestion: "19:00",
    foods: [
      { nameEn: "Salmon (baked)", quantityGrams: 180 },
      { nameEn: "Sweet Potato (baked)", quantityGrams: 200 },
    ],
  },
  {
    title: "Snack",
    titleAr: "وجبة خفيفة",
    timeSuggestion: "16:00",
    foods: [
      { nameEn: "Whey Protein Powder", quantityGrams: 40 },
      { nameEn: "Greek Yogurt (plain)", quantityGrams: 200 },
    ],
  },
];

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Generate Workout Program ────────────────────────────────────────────

  async generateWorkoutProgram(traineeProfileId: string, orgId: string) {
    const profile = await this.prisma.traineeProfile.findFirst({
      where: { id: traineeProfileId, organizationId: orgId },
      select: {
        id: true,
        goal: true,
        activityLevel: true,
        trainingDaysPerWeek: true,
        gender: true,
        currentWeightKg: true,
        heightCm: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException("Trainee profile not found");
    }

    if (!profile.goal) {
      throw new BadRequestException(
        "Trainee profile must have a goal set before generating a workout program",
      );
    }

    const days = profile.trainingDaysPerWeek ?? 3;
    const template = this.selectWorkoutTemplate(profile.goal, days);

    // Look up real exercises from DB
    const exerciseNames = new Set<string>();
    for (const day of template.days) {
      for (const ex of day.exercises) {
        exerciseNames.add(ex.nameEn);
      }
    }

    const exercises = await this.prisma.exercise.findMany({
      where: {
        nameEn: { in: Array.from(exerciseNames) },
        OR: [{ organizationId: orgId }, { isGlobal: true }],
      },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        muscleGroup: true,
        equipment: true,
        defaultSets: true,
        defaultReps: true,
        defaultRestSeconds: true,
      },
    });

    const exerciseMap = new Map(exercises.map((e) => [e.nameEn, e]));

    // Build the program structure with real exercise IDs
    const days_with_exercises = template.days.map((day, dayIndex) => ({
      dayNumber: dayIndex + 1,
      dayName: day.dayName,
      dayNameAr: day.dayNameAr,
      exercises: day.exercises
        .map((templateEx, exIndex) => {
          const dbExercise = exerciseMap.get(templateEx.nameEn);
          if (!dbExercise) return null;
          return {
            order: exIndex + 1,
            exerciseId: dbExercise.id,
            nameEn: dbExercise.nameEn,
            nameAr: dbExercise.nameAr,
            muscleGroup: dbExercise.muscleGroup,
            equipment: dbExercise.equipment,
            sets: templateEx.sets,
            reps: templateEx.reps,
            restSeconds: templateEx.restSeconds,
          };
        })
        .filter(Boolean),
    }));

    return {
      templateName: template.name,
      templateNameAr: template.nameAr,
      daysPerWeek: template.daysPerWeek,
      traineeProfileId: profile.id,
      traineeName: `${profile.user.firstName} ${profile.user.lastName}`,
      goal: profile.goal,
      days: days_with_exercises,
      generatedAt: new Date().toISOString(),
      note: "This is a suggestion. Review and customize before assigning to the trainee.",
    };
  }

  private selectWorkoutTemplate(goal: string, trainingDays: number): WorkoutTemplate {
    switch (goal) {
      case "MUSCLE_GAIN":
      case "BULK":
        if (trainingDays <= 3) return FULL_BODY_3X;
        if (trainingDays <= 5) return UPPER_LOWER;
        return PPL_6DAY;

      case "FAT_LOSS":
      case "LEAN_CUT":
        if (trainingDays <= 4) return FULL_BODY_CIRCUIT;
        return FULL_BODY_CIRCUIT; // Keep circuit style even at higher days

      case "GENERAL_FITNESS":
      default:
        if (trainingDays <= 3) return FULL_BODY_3X;
        return UPPER_LOWER;
    }
  }

  // ── Generate Nutrition Plan ─────────────────────────────────────────────

  async generateNutritionPlan(traineeProfileId: string, orgId: string) {
    const profile = await this.prisma.traineeProfile.findFirst({
      where: { id: traineeProfileId, organizationId: orgId },
      select: {
        id: true,
        goal: true,
        activityLevel: true,
        gender: true,
        currentWeightKg: true,
        heightCm: true,
        birthDate: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException("Trainee profile not found");
    }

    if (!profile.currentWeightKg || !profile.heightCm || !profile.gender) {
      throw new BadRequestException(
        "Trainee profile must have weight, height, and gender set before generating a nutrition plan",
      );
    }

    const goal = profile.goal ?? "GENERAL_FITNESS";
    const activityLevel = profile.activityLevel ?? "MODERATELY_ACTIVE";
    const weightKg = Number(profile.currentWeightKg);
    const heightCm = Number(profile.heightCm);
    const age = profile.birthDate
      ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 25; // Default age if not set

    // Mifflin-St Jeor BMR
    let bmr: number;
    if (profile.gender === "MALE") {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55));
    const calorieAdjustment = GOAL_CALORIE_ADJUSTMENTS[goal] ?? 0;
    const targetCalories = Math.round(tdee + calorieAdjustment);

    const macroSplit = GOAL_MACRO_SPLITS[goal] ?? GOAL_MACRO_SPLITS.GENERAL_FITNESS;
    const proteinG = Math.round((targetCalories * macroSplit.proteinPct) / 4);
    const carbsG = Math.round((targetCalories * macroSplit.carbsPct) / 4);
    const fatsG = Math.round((targetCalories * macroSplit.fatsPct) / 9);

    // Look up foods from DB
    const foodNames = new Set<string>();
    for (const meal of MEAL_BLUEPRINTS) {
      for (const food of meal.foods) {
        foodNames.add(food.nameEn);
      }
    }

    const dbFoods = await this.prisma.food.findMany({
      where: { nameEn: { in: Array.from(foodNames) } },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        caloriesPer100g: true,
        proteinG: true,
        carbsG: true,
        fatsG: true,
      },
    });

    const foodMap = new Map(dbFoods.map((f) => [f.nameEn, f]));

    // Build meals with actual food references and calculated macros
    const meals = MEAL_BLUEPRINTS.map((blueprint, idx) => {
      const items = blueprint.foods
        .map((foodRef) => {
          const dbFood = foodMap.get(foodRef.nameEn);
          if (!dbFood) return null;
          const ratio = foodRef.quantityGrams / 100;
          return {
            foodId: dbFood.id,
            nameEn: dbFood.nameEn,
            nameAr: dbFood.nameAr,
            quantityGrams: foodRef.quantityGrams,
            calories: Math.round(Number(dbFood.caloriesPer100g) * ratio),
            proteinG: Math.round(Number(dbFood.proteinG) * ratio * 10) / 10,
            carbsG: Math.round(Number(dbFood.carbsG) * ratio * 10) / 10,
            fatsG: Math.round(Number(dbFood.fatsG) * ratio * 10) / 10,
          };
        })
        .filter(Boolean);

      const mealCalories = items.reduce((sum, i) => sum + (i?.calories ?? 0), 0);
      const mealProtein = items.reduce((sum, i) => sum + (i?.proteinG ?? 0), 0);
      const mealCarbs = items.reduce((sum, i) => sum + (i?.carbsG ?? 0), 0);
      const mealFats = items.reduce((sum, i) => sum + (i?.fatsG ?? 0), 0);

      return {
        mealOrder: idx + 1,
        title: blueprint.title,
        titleAr: blueprint.titleAr,
        timeSuggestion: blueprint.timeSuggestion,
        calories: mealCalories,
        proteinG: Math.round(mealProtein * 10) / 10,
        carbsG: Math.round(mealCarbs * 10) / 10,
        fatsG: Math.round(mealFats * 10) / 10,
        items,
      };
    });

    const totalMealCalories = meals.reduce((s, m) => s + m.calories, 0);

    return {
      traineeProfileId: profile.id,
      traineeName: `${profile.user.firstName} ${profile.user.lastName}`,
      goal,
      calculations: {
        bmr: Math.round(bmr),
        tdee,
        calorieAdjustment,
        targetCalories,
        proteinG,
        carbsG,
        fatsG,
        waterMl: Math.round(weightKg * 35), // ~35ml per kg body weight
      },
      meals,
      totalMealCalories,
      calorieGap: targetCalories - totalMealCalories,
      generatedAt: new Date().toISOString(),
      note: "This is a base suggestion. Adjust portions to match the target calorie and macro goals.",
    };
  }

  // ── Trainee Insights ────────────────────────────────────────────────────

  async getTraineeInsights(traineeProfileId: string, orgId: string) {
    const profile = await this.prisma.traineeProfile.findFirst({
      where: { id: traineeProfileId, organizationId: orgId },
      select: {
        id: true,
        goal: true,
        trainingDaysPerWeek: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException("Trainee profile not found");
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [workoutLogs, checkins] = await Promise.all([
      this.prisma.workoutLog.findMany({
        where: {
          traineeProfileId,
          organizationId: orgId,
          startedAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
          durationMinutes: true,
          difficultyRating: true,
        },
        orderBy: { startedAt: "desc" },
      }),
      this.prisma.checkin.findMany({
        where: {
          traineeProfileId,
          organizationId: orgId,
          submittedAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          submittedAt: true,
          weightKg: true,
          adherenceScore: true,
          energyScore: true,
          sleepScore: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
    ]);

    const insights: Array<{
      type: "warning" | "positive" | "info";
      titleEn: string;
      titleAr: string;
      messageEn: string;
      messageAr: string;
    }> = [];

    // 1. Days since last workout
    const completedWorkouts = workoutLogs.filter((w) => w.completedAt);
    if (completedWorkouts.length > 0) {
      const lastWorkout = completedWorkouts[0];
      const daysSinceLastWorkout = Math.floor(
        (Date.now() - new Date(lastWorkout.startedAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastWorkout >= 7) {
        insights.push({
          type: "warning",
          titleEn: "Inactive for a week",
          titleAr: "غير نشط لمدة أسبوع",
          messageEn: `Last workout was ${daysSinceLastWorkout} days ago. Consider reaching out to check on the trainee.`,
          messageAr: `آخر تمرين كان قبل ${daysSinceLastWorkout} يوم. يُنصح بالتواصل مع المتدرب.`,
        });
      } else if (daysSinceLastWorkout >= 3) {
        insights.push({
          type: "warning",
          titleEn: "Workout gap detected",
          titleAr: "فجوة في التمارين",
          messageEn: `No workout in the last ${daysSinceLastWorkout} days.`,
          messageAr: `لا يوجد تمرين خلال آخر ${daysSinceLastWorkout} يوم.`,
        });
      }
    } else {
      insights.push({
        type: "warning",
        titleEn: "No workouts recorded",
        titleAr: "لا توجد تمارين مسجلة",
        messageEn: "No completed workouts in the last 30 days.",
        messageAr: "لا توجد تمارين مكتملة خلال آخر 30 يوم.",
      });
    }

    // 2. Weight trend analysis
    const weightCheckins = checkins.filter((c) => c.weightKg !== null);
    if (weightCheckins.length >= 2) {
      const latestWeight = Number(weightCheckins[0].weightKg);
      const oldestWeight = Number(weightCheckins[weightCheckins.length - 1].weightKg);
      const weightChange = latestWeight - oldestWeight;
      const weeksBetween = Math.max(
        1,
        (new Date(weightCheckins[0].submittedAt).getTime() -
          new Date(weightCheckins[weightCheckins.length - 1].submittedAt).getTime()) /
          (1000 * 60 * 60 * 24 * 7),
      );
      const weeklyChange = weightChange / weeksBetween;

      if (profile.goal === "FAT_LOSS" || profile.goal === "LEAN_CUT") {
        if (weeklyChange > 0.1) {
          insights.push({
            type: "warning",
            titleEn: "Weight increasing on a cut",
            titleAr: "الوزن يزداد أثناء التنشيف",
            messageEn: `Weight increased by ${weightChange.toFixed(1)} kg. Consider reviewing nutrition plan.`,
            messageAr: `زاد الوزن بمقدار ${weightChange.toFixed(1)} كجم. يُنصح بمراجعة خطة التغذية.`,
          });
        } else if (weeklyChange < -1.0) {
          insights.push({
            type: "warning",
            titleEn: "Losing weight too fast",
            titleAr: "فقدان الوزن سريع جداً",
            messageEn: `Losing ${Math.abs(weeklyChange).toFixed(1)} kg/week. Risk of muscle loss. Consider slowing down.`,
            messageAr: `فقدان ${Math.abs(weeklyChange).toFixed(1)} كجم/أسبوع. خطر فقدان العضلات. يُنصح بالتخفيف.`,
          });
        } else if (weeklyChange >= -0.75 && weeklyChange <= -0.25) {
          insights.push({
            type: "positive",
            titleEn: "Good weight loss pace",
            titleAr: "معدل فقدان وزن جيد",
            messageEn: `Losing ${Math.abs(weeklyChange).toFixed(1)} kg/week. On track!`,
            messageAr: `فقدان ${Math.abs(weeklyChange).toFixed(1)} كجم/أسبوع. على المسار الصحيح!`,
          });
        } else if (Math.abs(weeklyChange) < 0.1) {
          insights.push({
            type: "info",
            titleEn: "Weight plateau",
            titleAr: "ثبات في الوزن",
            messageEn: "Weight has been stable. May need to adjust calories or training.",
            messageAr: "الوزن ثابت. قد تحتاج لتعديل السعرات أو التمرين.",
          });
        }
      } else if (profile.goal === "MUSCLE_GAIN" || profile.goal === "BULK") {
        if (weeklyChange < -0.1) {
          insights.push({
            type: "warning",
            titleEn: "Weight decreasing on a bulk",
            titleAr: "الوزن يقل أثناء التضخيم",
            messageEn: `Weight decreased by ${Math.abs(weightChange).toFixed(1)} kg. Consider increasing calories.`,
            messageAr: `نقص الوزن بمقدار ${Math.abs(weightChange).toFixed(1)} كجم. يُنصح بزيادة السعرات.`,
          });
        } else if (weeklyChange > 0.5) {
          insights.push({
            type: "warning",
            titleEn: "Gaining weight too fast",
            titleAr: "زيادة الوزن سريعة جداً",
            messageEn: `Gaining ${weeklyChange.toFixed(1)} kg/week. Risk of excessive fat gain.`,
            messageAr: `زيادة ${weeklyChange.toFixed(1)} كجم/أسبوع. خطر زيادة الدهون المفرطة.`,
          });
        } else if (weeklyChange >= 0.1 && weeklyChange <= 0.35) {
          insights.push({
            type: "positive",
            titleEn: "Good lean gain pace",
            titleAr: "معدل تضخيم جيد",
            messageEn: `Gaining ${weeklyChange.toFixed(1)} kg/week. On track for lean gains!`,
            messageAr: `زيادة ${weeklyChange.toFixed(1)} كجم/أسبوع. على المسار الصحيح!`,
          });
        }
      }
    }

    // 3. Compliance rate
    const expectedSessions = (profile.trainingDaysPerWeek ?? 3) * 4; // 4 weeks
    const actualSessions = completedWorkouts.length;
    const complianceRate = expectedSessions > 0 ? Math.round((actualSessions / expectedSessions) * 100) : 0;

    if (complianceRate >= 80) {
      insights.push({
        type: "positive",
        titleEn: "Great consistency",
        titleAr: "التزام ممتاز",
        messageEn: `${complianceRate}% compliance rate (${actualSessions}/${expectedSessions} sessions). Keep it up!`,
        messageAr: `معدل التزام ${complianceRate}% (${actualSessions}/${expectedSessions} جلسة). استمر!`,
      });
    } else if (complianceRate >= 50) {
      insights.push({
        type: "info",
        titleEn: "Moderate consistency",
        titleAr: "التزام متوسط",
        messageEn: `${complianceRate}% compliance rate (${actualSessions}/${expectedSessions} sessions).`,
        messageAr: `معدل التزام ${complianceRate}% (${actualSessions}/${expectedSessions} جلسة).`,
      });
    } else {
      insights.push({
        type: "warning",
        titleEn: "Low consistency",
        titleAr: "التزام منخفض",
        messageEn: `Only ${complianceRate}% compliance (${actualSessions}/${expectedSessions} sessions). Consider motivating the trainee.`,
        messageAr: `التزام ${complianceRate}% فقط (${actualSessions}/${expectedSessions} جلسة). يُنصح بتحفيز المتدرب.`,
      });
    }

    // 4. Streak count (consecutive days with workouts in the last 30 days)
    let streak = 0;
    if (completedWorkouts.length > 0) {
      const sortedDates = completedWorkouts
        .map((w) => new Date(w.startedAt).toISOString().split("T")[0])
        .filter((v, i, a) => a.indexOf(v) === i); // unique dates

      const today = new Date().toISOString().split("T")[0];
      let checkDate = new Date();

      // Count backwards from today
      for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (sortedDates.includes(dateStr)) {
          streak++;
        } else if (i > 0) {
          // Allow today to not have a workout yet
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    if (streak >= 5) {
      insights.push({
        type: "positive",
        titleEn: `${streak}-day streak!`,
        titleAr: `سلسلة ${streak} أيام!`,
        messageEn: `The trainee has worked out ${streak} days in a row. Excellent commitment!`,
        messageAr: `تمرّن المتدرب لمدة ${streak} أيام متتالية. التزام ممتاز!`,
      });
    }

    // 5. Average energy & sleep from checkins
    const energyScores = checkins.filter((c) => c.energyScore !== null).map((c) => c.energyScore!);
    const sleepScores = checkins.filter((c) => c.sleepScore !== null).map((c) => c.sleepScore!);

    if (energyScores.length >= 3) {
      const avgEnergy = energyScores.reduce((s, v) => s + v, 0) / energyScores.length;
      if (avgEnergy <= 3) {
        insights.push({
          type: "warning",
          titleEn: "Low energy levels",
          titleAr: "مستوى طاقة منخفض",
          messageEn: `Average energy score is ${avgEnergy.toFixed(1)}/10. May need recovery or nutrition adjustments.`,
          messageAr: `متوسط الطاقة ${avgEnergy.toFixed(1)}/10. قد يحتاج لراحة أو تعديل التغذية.`,
        });
      }
    }

    if (sleepScores.length >= 3) {
      const avgSleep = sleepScores.reduce((s, v) => s + v, 0) / sleepScores.length;
      if (avgSleep <= 3) {
        insights.push({
          type: "warning",
          titleEn: "Poor sleep quality",
          titleAr: "جودة نوم سيئة",
          messageEn: `Average sleep score is ${avgSleep.toFixed(1)}/10. Sleep impacts recovery and progress.`,
          messageAr: `متوسط النوم ${avgSleep.toFixed(1)}/10. النوم يؤثر على التعافي والتقدم.`,
        });
      }
    }

    // Calculate retention score (0-100)
    let retentionScore = 50; // Base score

    // Compliance impact (+/- 20)
    retentionScore += Math.round((complianceRate / 100) * 20 - 10);

    // Recency impact (+/- 15)
    if (completedWorkouts.length > 0) {
      const daysSinceLast = Math.floor(
        (Date.now() - new Date(completedWorkouts[0].startedAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLast <= 2) retentionScore += 15;
      else if (daysSinceLast <= 4) retentionScore += 5;
      else if (daysSinceLast >= 7) retentionScore -= 15;
      else retentionScore -= 5;
    } else {
      retentionScore -= 15;
    }

    // Checkin engagement (+/- 10)
    if (checkins.length >= 4) retentionScore += 10;
    else if (checkins.length >= 2) retentionScore += 5;
    else if (checkins.length === 0) retentionScore -= 10;

    // Streak bonus (+5)
    if (streak >= 3) retentionScore += 5;

    // Clamp to 0-100
    retentionScore = Math.max(0, Math.min(100, retentionScore));

    return {
      traineeProfileId: profile.id,
      traineeName: `${profile.user.firstName} ${profile.user.lastName}`,
      insights,
      metrics: {
        retentionScore,
        complianceRate,
        currentStreak: streak,
        totalWorkoutsLast30Days: completedWorkouts.length,
        totalCheckinsLast30Days: checkins.length,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
