export interface TemplateExercise {
  nameAr: string;
  nameEn: string;
  sets: number;
  reps: string;
  rest: number;
  tempo?: string;
}

export interface TemplateDay {
  nameAr: string;
  nameEn: string;
  focus: string;
  exercises: TemplateExercise[];
}

export interface ProgramTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  goal: string;
  goalAr: string;
  level: string;
  levelAr: string;
  daysPerWeek: number;
  durationWeeks: number;
  description: { ar: string; en: string };
  days: TemplateDay[];
}

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "ppl",
    nameAr: "Push Pull Legs",
    nameEn: "Push Pull Legs",
    goal: "MUSCLE_GAIN",
    goalAr: "بناء عضلات",
    level: "INTERMEDIATE",
    levelAr: "متوسط",
    daysPerWeek: 6,
    durationWeeks: 8,
    description: { ar: "برنامج كلاسيكي لبناء العضلات — 6 أيام في الأسبوع", en: "Classic muscle building program — 6 days/week" },
    days: [
      {
        nameAr: "صدر وترايسبس (Push)",
        nameEn: "Chest & Triceps (Push)",
        focus: "CHEST",
        exercises: [
          { nameAr: "بنش برس بالباربل", nameEn: "Barbell Bench Press", sets: 4, reps: "6-8", rest: 120 },
          { nameAr: "ضغط مائل بالدمبل", nameEn: "Incline DB Press", sets: 3, reps: "8-12", rest: 90 },
          { nameAr: "فلاي بالكابل", nameEn: "Cable Fly", sets: 3, reps: "12-15", rest: 60 },
          { nameAr: "ضغط أكتاف بالدمبل", nameEn: "DB Shoulder Press", sets: 3, reps: "8-12", rest: 90 },
          { nameAr: "رفع جانبي", nameEn: "Lateral Raise", sets: 3, reps: "12-15", rest: 60 },
          { nameAr: "بوش داون ترايسبس", nameEn: "Tricep Pushdown", sets: 3, reps: "12-15", rest: 60 },
        ],
      },
      {
        nameAr: "ظهر وبايسبس (Pull)",
        nameEn: "Back & Biceps (Pull)",
        focus: "BACK",
        exercises: [
          { nameAr: "ديدلفت", nameEn: "Deadlift", sets: 4, reps: "5-6", rest: 180 },
          { nameAr: "سحب علوي", nameEn: "Lat Pulldown", sets: 3, reps: "8-12", rest: 90 },
          { nameAr: "تجديف بالبار", nameEn: "Barbell Row", sets: 3, reps: "8-10", rest: 90 },
          { nameAr: "فيس بول", nameEn: "Face Pull", sets: 3, reps: "15-20", rest: 60 },
          { nameAr: "كيرل بالبار", nameEn: "Barbell Curl", sets: 3, reps: "10-12", rest: 60 },
          { nameAr: "هامر كيرل", nameEn: "Hammer Curl", sets: 3, reps: "10-12", rest: 60 },
        ],
      },
      {
        nameAr: "أرجل وأرداف (Legs)",
        nameEn: "Legs & Glutes",
        focus: "LEGS",
        exercises: [
          { nameAr: "سكوات خلفي", nameEn: "Back Squat", sets: 4, reps: "6-8", rest: 180 },
          { nameAr: "ضغط أرجل", nameEn: "Leg Press", sets: 3, reps: "10-12", rest: 120 },
          { nameAr: "رومانيان ديدلفت", nameEn: "Romanian Deadlift", sets: 3, reps: "8-10", rest: 90 },
          { nameAr: "تمديد أرجل", nameEn: "Leg Extension", sets: 3, reps: "12-15", rest: 60 },
          { nameAr: "ثني أرجل", nameEn: "Leg Curl", sets: 3, reps: "12-15", rest: 60 },
          { nameAr: "رفع ربلة", nameEn: "Calf Raise", sets: 4, reps: "15-20", rest: 60 },
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    nameAr: "علوي / سفلي",
    nameEn: "Upper Lower Split",
    goal: "MUSCLE_GAIN",
    goalAr: "بناء عضلات",
    level: "INTERMEDIATE",
    levelAr: "متوسط",
    daysPerWeek: 4,
    durationWeeks: 8,
    description: { ar: "تقسيم علوي/سفلي — 4 أيام في الأسبوع", en: "Upper/Lower split — 4 days/week" },
    days: [
      {
        nameAr: "الجزء العلوي A",
        nameEn: "Upper A",
        focus: "CHEST",
        exercises: [
          { nameAr: "بنش برس بالباربل", nameEn: "Bench Press", sets: 4, reps: "6-8", rest: 120 },
          { nameAr: "تجديف بالبار", nameEn: "Barbell Row", sets: 4, reps: "6-8", rest: 120 },
          { nameAr: "ضغط أكتاف", nameEn: "Shoulder Press", sets: 3, reps: "8-12", rest: 90 },
          { nameAr: "سحب علوي", nameEn: "Lat Pulldown", sets: 3, reps: "10-12", rest: 90 },
          { nameAr: "كيرل بايسبس", nameEn: "Bicep Curl", sets: 3, reps: "10-12", rest: 60 },
          { nameAr: "بوش داون ترايسبس", nameEn: "Tricep Pushdown", sets: 3, reps: "10-12", rest: 60 },
        ],
      },
      {
        nameAr: "الجزء السفلي A",
        nameEn: "Lower A",
        focus: "LEGS",
        exercises: [
          { nameAr: "سكوات خلفي", nameEn: "Back Squat", sets: 4, reps: "6-8", rest: 180 },
          { nameAr: "رومانيان ديدلفت", nameEn: "Romanian Deadlift", sets: 3, reps: "8-10", rest: 120 },
          { nameAr: "ضغط أرجل", nameEn: "Leg Press", sets: 3, reps: "10-12", rest: 90 },
          { nameAr: "ثني أرجل", nameEn: "Leg Curl", sets: 3, reps: "12-15", rest: 60 },
          { nameAr: "رفع ربلة", nameEn: "Calf Raise", sets: 4, reps: "15-20", rest: 60 },
        ],
      },
    ],
  },
  {
    id: "full-body-3x",
    nameAr: "كامل الجسم 3 أيام",
    nameEn: "Full Body 3x/week",
    goal: "GENERAL_FITNESS",
    goalAr: "لياقة عامة",
    level: "BEGINNER",
    levelAr: "مبتدئ",
    daysPerWeek: 3,
    durationWeeks: 8,
    description: { ar: "برنامج مبتدئ — تمرين كامل الجسم 3 مرات أسبوعياً", en: "Beginner full body program — 3 days/week" },
    days: [
      {
        nameAr: "كامل الجسم A",
        nameEn: "Full Body A",
        focus: "CHEST",
        exercises: [
          { nameAr: "سكوات خلفي", nameEn: "Squat", sets: 3, reps: "8-10", rest: 120 },
          { nameAr: "بنش برس", nameEn: "Bench Press", sets: 3, reps: "8-10", rest: 90 },
          { nameAr: "تجديف بالبار", nameEn: "Barbell Row", sets: 3, reps: "8-10", rest: 90 },
          { nameAr: "ضغط أكتاف", nameEn: "Shoulder Press", sets: 3, reps: "10-12", rest: 60 },
          { nameAr: "بلانك", nameEn: "Plank", sets: 3, reps: "30-60s", rest: 60 },
        ],
      },
    ],
  },
  {
    id: "fat-loss-circuit",
    nameAr: "حرق دهون — دائري",
    nameEn: "Fat Loss Circuit",
    goal: "FAT_LOSS",
    goalAr: "حرق دهون",
    level: "INTERMEDIATE",
    levelAr: "متوسط",
    daysPerWeek: 4,
    durationWeeks: 6,
    description: { ar: "تدريب دائري عالي الكثافة لحرق الدهون", en: "High-intensity circuit training for fat loss" },
    days: [
      {
        nameAr: "دائري علوي",
        nameEn: "Upper Circuit",
        focus: "CHEST",
        exercises: [
          { nameAr: "تمرين الضغط", nameEn: "Push-Ups", sets: 4, reps: "15-20", rest: 30 },
          { nameAr: "تجديف دمبل", nameEn: "DB Row", sets: 4, reps: "12-15", rest: 30 },
          { nameAr: "ضغط أكتاف", nameEn: "Shoulder Press", sets: 3, reps: "12-15", rest: 30 },
          { nameAr: "كيرل وبوش داون", nameEn: "Curl + Pushdown", sets: 3, reps: "15", rest: 30 },
          { nameAr: "بلانك", nameEn: "Plank", sets: 3, reps: "45s", rest: 30 },
        ],
      },
      {
        nameAr: "دائري سفلي",
        nameEn: "Lower Circuit",
        focus: "LEGS",
        exercises: [
          { nameAr: "سكوات جوبلت", nameEn: "Goblet Squat", sets: 4, reps: "15", rest: 30 },
          { nameAr: "لانجز", nameEn: "Walking Lunge", sets: 3, reps: "12 each", rest: 30 },
          { nameAr: "هيب ثراست", nameEn: "Hip Thrust", sets: 3, reps: "15", rest: 30 },
          { nameAr: "ثني أرجل", nameEn: "Leg Curl", sets: 3, reps: "15", rest: 30 },
          { nameAr: "رفع ربلة", nameEn: "Calf Raise", sets: 3, reps: "20", rest: 30 },
        ],
      },
    ],
  },
  {
    id: "strength-5x5",
    nameAr: "قوة 5×5",
    nameEn: "5x5 Strength",
    goal: "MUSCLE_GAIN",
    goalAr: "قوة",
    level: "BEGINNER",
    levelAr: "مبتدئ",
    daysPerWeek: 3,
    durationWeeks: 12,
    description: { ar: "برنامج قوة كلاسيكي — 5 سيتات × 5 تكرارات", en: "Classic strength program — 5 sets of 5 reps" },
    days: [
      {
        nameAr: "يوم A — سكوات",
        nameEn: "Day A — Squat",
        focus: "LEGS",
        exercises: [
          { nameAr: "سكوات خلفي", nameEn: "Back Squat", sets: 5, reps: "5", rest: 180 },
          { nameAr: "بنش برس", nameEn: "Bench Press", sets: 5, reps: "5", rest: 180 },
          { nameAr: "تجديف بالبار", nameEn: "Barbell Row", sets: 5, reps: "5", rest: 120 },
        ],
      },
      {
        nameAr: "يوم B — ديدلفت",
        nameEn: "Day B — Deadlift",
        focus: "BACK",
        exercises: [
          { nameAr: "سكوات خلفي", nameEn: "Back Squat", sets: 5, reps: "5", rest: 180 },
          { nameAr: "ضغط أكتاف", nameEn: "Overhead Press", sets: 5, reps: "5", rest: 180 },
          { nameAr: "ديدلفت", nameEn: "Deadlift", sets: 1, reps: "5", rest: 180 },
        ],
      },
    ],
  },
];
