export interface MealTemplateItem {
  nameAr: string;
  nameEn: string;
  grams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export interface MealTemplateDay {
  nameAr: string;
  nameEn: string;
  time: string;
  items: MealTemplateItem[];
}

export interface MealPlanTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  goal: string;
  targetCalories: number;
  meals: MealTemplateDay[];
}

export const MEAL_TEMPLATES: MealPlanTemplate[] = [
  {
    id: "muscle-gain-3000",
    nameAr: "بناء عضلات — 3000 سعرة",
    nameEn: "Muscle Gain — 3000 kcal",
    goal: "MUSCLE_GAIN",
    targetCalories: 3000,
    meals: [
      {
        nameAr: "الفطور",
        nameEn: "Breakfast",
        time: "07:30",
        items: [
          { nameAr: "بيض مسلوق", nameEn: "Boiled Eggs", grams: 200, calories: 310, proteinG: 26, carbsG: 2, fatsG: 22 },
          { nameAr: "شوفان", nameEn: "Oats", grams: 80, calories: 311, proteinG: 14, carbsG: 53, fatsG: 6 },
          { nameAr: "موز", nameEn: "Banana", grams: 120, calories: 107, proteinG: 1, carbsG: 28, fatsG: 0 },
        ],
      },
      {
        nameAr: "الغداء",
        nameEn: "Lunch",
        time: "13:00",
        items: [
          { nameAr: "أرز بسمتي", nameEn: "Basmati Rice", grams: 250, calories: 303, proteinG: 9, carbsG: 63, fatsG: 1 },
          { nameAr: "صدر دجاج مشوي", nameEn: "Grilled Chicken", grams: 200, calories: 330, proteinG: 62, carbsG: 0, fatsG: 7 },
          { nameAr: "سلطة خضار", nameEn: "Vegetable Salad", grams: 150, calories: 30, proteinG: 2, carbsG: 5, fatsG: 1 },
        ],
      },
      {
        nameAr: "وجبة ما بعد التمرين",
        nameEn: "Post-Workout",
        time: "17:00",
        items: [
          { nameAr: "بروتين شيك", nameEn: "Protein Shake", grams: 40, calories: 160, proteinG: 32, carbsG: 4, fatsG: 2 },
          { nameAr: "تمر", nameEn: "Dates", grams: 60, calories: 166, proteinG: 1, carbsG: 45, fatsG: 0 },
        ],
      },
      {
        nameAr: "العشاء",
        nameEn: "Dinner",
        time: "20:00",
        items: [
          { nameAr: "سمك مشوي", nameEn: "Grilled Fish", grams: 200, calories: 416, proteinG: 40, carbsG: 0, fatsG: 26 },
          { nameAr: "بطاطا مخبوزة", nameEn: "Baked Potato", grams: 250, calories: 218, proteinG: 5, carbsG: 50, fatsG: 0 },
          { nameAr: "خضار مشوية", nameEn: "Grilled Vegetables", grams: 200, calories: 70, proteinG: 3, carbsG: 12, fatsG: 2 },
        ],
      },
    ],
  },
  {
    id: "fat-loss-1800",
    nameAr: "حرق دهون — 1800 سعرة",
    nameEn: "Fat Loss — 1800 kcal",
    goal: "FAT_LOSS",
    targetCalories: 1800,
    meals: [
      {
        nameAr: "الفطور",
        nameEn: "Breakfast",
        time: "08:00",
        items: [
          { nameAr: "بياض بيض", nameEn: "Egg Whites", grams: 200, calories: 104, proteinG: 22, carbsG: 1, fatsG: 0 },
          { nameAr: "أفوكادو", nameEn: "Avocado", grams: 50, calories: 80, proteinG: 1, carbsG: 4, fatsG: 8 },
          { nameAr: "خبز توست", nameEn: "Toast", grams: 30, calories: 74, proteinG: 4, carbsG: 12, fatsG: 1 },
        ],
      },
      {
        nameAr: "الغداء",
        nameEn: "Lunch",
        time: "13:00",
        items: [
          { nameAr: "صدر دجاج", nameEn: "Chicken Breast", grams: 200, calories: 330, proteinG: 62, carbsG: 0, fatsG: 7 },
          { nameAr: "سلطة كبيرة", nameEn: "Large Salad", grams: 300, calories: 60, proteinG: 3, carbsG: 10, fatsG: 2 },
          { nameAr: "أرز بني", nameEn: "Brown Rice", grams: 100, calories: 123, proteinG: 3, carbsG: 26, fatsG: 1 },
        ],
      },
      {
        nameAr: "العشاء",
        nameEn: "Dinner",
        time: "19:00",
        items: [
          { nameAr: "سمك تونة", nameEn: "Tuna", grams: 150, calories: 174, proteinG: 39, carbsG: 0, fatsG: 1 },
          { nameAr: "خضار مشوية", nameEn: "Grilled Veggies", grams: 250, calories: 88, proteinG: 4, carbsG: 15, fatsG: 2 },
        ],
      },
    ],
  },
];
