export const MUSCLE_GROUPS: Record<string, { ar: string; en: string; icon: string }> = {
  CHEST: { ar: "الصدر", en: "Chest", icon: "💪" },
  BACK: { ar: "الظهر", en: "Back", icon: "🏊" },
  LEGS: { ar: "الأرجل", en: "Legs", icon: "🦵" },
  SHOULDERS: { ar: "الأكتاف", en: "Shoulders", icon: "🤸" },
  BICEPS: { ar: "البايسبس", en: "Biceps", icon: "✊" },
  TRICEPS: { ar: "الترايسبس", en: "Triceps", icon: "🔱" },
  CORE: { ar: "البطن", en: "Core", icon: "🎯" },
  GLUTES: { ar: "الأرداف", en: "Glutes", icon: "🍑" },
};

export const FITNESS_LEVELS: Record<string, { ar: string; en: string }> = {
  BEGINNER: { ar: "مبتدئ", en: "Beginner" },
  INTERMEDIATE: { ar: "متوسط", en: "Intermediate" },
  ADVANCED: { ar: "محترف", en: "Advanced" },
};

export const GOALS: Record<string, { ar: string; en: string; icon: string }> = {
  MUSCLE_GAIN: { ar: "بناء عضلات", en: "Muscle Gain", icon: "💪" },
  FAT_LOSS: { ar: "حرق دهون", en: "Fat Loss", icon: "🔥" },
  GENERAL_FITNESS: { ar: "لياقة عامة", en: "General Fitness", icon: "🏃" },
  LEAN_CUT: { ar: "تنشيف", en: "Lean Cut", icon: "⚡" },
  BULK: { ar: "زيادة وزن", en: "Bulk", icon: "🏋️" },
};

export const ACTIVITY_LEVELS: Record<string, { ar: string; en: string; factor: number }> = {
  SEDENTARY: { ar: "خامل", en: "Sedentary", factor: 1.2 },
  LIGHTLY_ACTIVE: { ar: "خفيف النشاط", en: "Lightly Active", factor: 1.375 },
  MODERATELY_ACTIVE: { ar: "متوسط النشاط", en: "Moderately Active", factor: 1.55 },
  VERY_ACTIVE: { ar: "نشيط", en: "Very Active", factor: 1.725 },
  EXTRA_ACTIVE: { ar: "نشيط جداً", en: "Extra Active", factor: 1.9 },
};

export const EQUIPMENT: Record<string, { ar: string; en: string }> = {
  barbell: { ar: "باربل", en: "Barbell" },
  dumbbell: { ar: "دمبل", en: "Dumbbell" },
  cable: { ar: "كابل", en: "Cable" },
  machine: { ar: "جهاز", en: "Machine" },
  bodyweight: { ar: "وزن الجسم", en: "Bodyweight" },
  kettlebell: { ar: "كيتل بل", en: "Kettlebell" },
  band: { ar: "حبل مقاومة", en: "Resistance Band" },
  smith: { ar: "آلة سميث", en: "Smith Machine" },
};

export const PLAN_TYPES: Record<string, { ar: string; en: string }> = {
  STARTER: { ar: "المبتدئ", en: "Starter" },
  GROWTH: { ar: "النمو", en: "Growth" },
  PRO: { ar: "الاحترافي", en: "Pro" },
};

export const STATUS_TYPES: Record<string, { ar: string; en: string }> = {
  active: { ar: "نشط", en: "Active" },
  suspended: { ar: "معلّق", en: "Suspended" },
  canceled: { ar: "ملغي", en: "Canceled" },
  ACTIVE: { ar: "نشط", en: "Active" },
  TRIALING: { ar: "تجريبي", en: "Trial" },
  PAST_DUE: { ar: "متأخر", en: "Past Due" },
  CANCELED: { ar: "ملغي", en: "Canceled" },
};

export function getLabel(map: Record<string, { ar: string; en: string }>, key: string, lang: "ar" | "en"): string {
  return map[key]?.[lang] ?? key;
}
