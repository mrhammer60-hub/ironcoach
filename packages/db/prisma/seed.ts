import { PrismaClient, RoleKey, PlanCode, GoalType, ActivityLevel, DifficultyLevel, MuscleGroup, Gender, SubscriptionStatus, ConversationType, AssignmentStatus } from "@prisma/client";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Password Hashes (bcrypt 12 rounds) ─────────────────────────────────
  // All accounts: Admin1234!
  const ADMIN_HASH = await bcrypt.hash("Admin1234!", 12);
  const COACH_HASH = ADMIN_HASH; // Same password for demo simplicity
  const TRAINEE_HASH = ADMIN_HASH;
  console.log("Generated password hashes (all accounts: Admin1234!)");

  // ─── Plans ───────────────────────────────────────────────────────────────
  const starterPlan = await prisma.plan.upsert({
    where: { code: PlanCode.STARTER },
    update: {},
    create: {
      code: PlanCode.STARTER,
      name: "Starter",
      monthlyPrice: 60,
      yearlyPrice: 600,
      maxTrainees: 20,
      featuresJson: {
        stripePriceId: "price_starter_placeholder",
        workoutPrograms: true,
        nutritionPlans: true,
        messaging: true,
        progressTracking: true,
        customBranding: false,
        prioritySupport: false,
        features: ["20 active trainees", "Workout builder", "Nutrition planning", "Progress tracking", "Coach-trainee chat"],
      },
    },
  });

  const growthPlan = await prisma.plan.upsert({
    where: { code: PlanCode.GROWTH },
    update: {},
    create: {
      code: PlanCode.GROWTH,
      name: "Growth",
      monthlyPrice: 100,
      yearlyPrice: 1000,
      maxTrainees: 50,
      featuresJson: {
        stripePriceId: "price_growth_placeholder",
        workoutPrograms: true,
        nutritionPlans: true,
        messaging: true,
        progressTracking: true,
        customBranding: true,
        prioritySupport: false,
        features: ["50 active trainees", "Workout builder", "Nutrition planning", "Progress tracking", "Coach-trainee chat", "Custom branding"],
      },
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { code: PlanCode.PRO },
    update: {},
    create: {
      code: PlanCode.PRO,
      name: "Pro",
      monthlyPrice: 200,
      yearlyPrice: 2000,
      maxTrainees: 150,
      featuresJson: {
        stripePriceId: "price_pro_placeholder",
        workoutPrograms: true,
        nutritionPlans: true,
        messaging: true,
        progressTracking: true,
        customBranding: true,
        prioritySupport: true,
        features: ["150 active trainees", "Workout builder", "Nutrition planning", "Progress tracking", "Coach-trainee chat", "Custom branding", "Priority support"],
      },
    },
  });

  // ─── Admin User ──────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@ironcoach.com" },
    update: { passwordHash: ADMIN_HASH },
    create: {
      email: "admin@ironcoach.com",
      passwordHash: ADMIN_HASH,
      firstName: "System",
      lastName: "Admin",
      locale: "en",
      emailVerifiedAt: new Date(),
    },
  });

  // ─── Coach A — Starter Plan, 5 trainees ──────────────────────────────────
  const coachA = await prisma.user.upsert({
    where: { email: "coach.ahmed@ironcoach.com" },
    update: { passwordHash: COACH_HASH },
    create: {
      email: "coach.ahmed@ironcoach.com",
      passwordHash: COACH_HASH,
      firstName: "Ahmed",
      lastName: "Al-Farsi",
      locale: "ar",
      emailVerifiedAt: new Date(),
    },
  });

  const orgA = await prisma.organization.upsert({
    where: { slug: "ahmed-fitness" },
    update: {},
    create: {
      name: "Ahmed Fitness",
      slug: "ahmed-fitness",
      subdomain: "ahmed-fitness",
      ownerUserId: coachA.id,
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: orgA.id, userId: coachA.id } },
    update: {},
    create: { organizationId: orgA.id, userId: coachA.id, roleKey: RoleKey.OWNER },
  });

  await prisma.trainerProfile.upsert({
    where: { userId: coachA.id },
    update: {},
    create: {
      organizationId: orgA.id,
      userId: coachA.id,
      bio: "Certified strength and conditioning coach with 8 years of experience",
      specialties: ["Strength Training", "Fat Loss", "Sports Performance"],
      certifications: ["CSCS", "CPT-NASM"],
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: orgA.id },
    update: {},
    create: {
      organizationId: orgA.id,
      planId: starterPlan.id,
      stripeCustomerId: "cus_seed_coachA",
      stripeSubscriptionId: "sub_seed_coachA",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Coach A trainees
  const coachATrainees = [
    { first: "Khalid", last: "Mansour", email: "khalid.m@test.com", gender: Gender.MALE },
    { first: "Fatima", last: "Hassan", email: "fatima.h@test.com", gender: Gender.FEMALE },
    { first: "Omar", last: "Zayed", email: "omar.z@test.com", gender: Gender.MALE },
    { first: "Nora", last: "Salem", email: "nora.s@test.com", gender: Gender.FEMALE },
    { first: "Youssef", last: "Ali", email: "youssef.a@test.com", gender: Gender.MALE },
  ];

  for (const t of coachATrainees) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { passwordHash: TRAINEE_HASH },
      create: {
        email: t.email,
        passwordHash: TRAINEE_HASH,
        firstName: t.first,
        lastName: t.last,
        locale: "ar",
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgA.id, userId: user.id } },
      update: {},
      create: { organizationId: orgA.id, userId: user.id, roleKey: RoleKey.TRAINEE },
    });
    await prisma.traineeProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        organizationId: orgA.id,
        userId: user.id,
        assignedTrainerId: coachA.id,
        gender: t.gender,
        heightCm: t.gender === Gender.MALE ? 175 : 162,
        currentWeightKg: t.gender === Gender.MALE ? 82 : 65,
        targetWeightKg: t.gender === Gender.MALE ? 78 : 58,
        activityLevel: ActivityLevel.MODERATELY_ACTIVE,
        goal: GoalType.FAT_LOSS,
        trainingDaysPerWeek: 4,
        onboardingCompletedAt: new Date(),
      },
    });
  }

  // ─── Coach B — Growth Plan, 10 trainees ──────────────────────────────────
  const coachB = await prisma.user.upsert({
    where: { email: "coach.sara@ironcoach.com" },
    update: { passwordHash: COACH_HASH },
    create: {
      email: "coach.sara@ironcoach.com",
      passwordHash: COACH_HASH,
      firstName: "Sara",
      lastName: "Al-Rashid",
      locale: "ar",
      emailVerifiedAt: new Date(),
    },
  });

  const orgB = await prisma.organization.upsert({
    where: { slug: "sara-coaching" },
    update: {},
    create: {
      name: "Sara Coaching",
      slug: "sara-coaching",
      subdomain: "sara-coaching",
      ownerUserId: coachB.id,
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: orgB.id, userId: coachB.id } },
    update: {},
    create: { organizationId: orgB.id, userId: coachB.id, roleKey: RoleKey.OWNER },
  });

  await prisma.trainerProfile.upsert({
    where: { userId: coachB.id },
    update: {},
    create: {
      organizationId: orgB.id,
      userId: coachB.id,
      bio: "Nutrition and body transformation specialist helping women achieve their fitness goals",
      specialties: ["Women's Fitness", "Nutrition", "Body Transformation"],
      certifications: ["ISSA-CFT", "Precision Nutrition L1"],
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: orgB.id },
    update: {},
    create: {
      organizationId: orgB.id,
      planId: growthPlan.id,
      stripeCustomerId: "cus_seed_coachB",
      stripeSubscriptionId: "sub_seed_coachB",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const coachBTrainees = [
    { first: "Layla", last: "Mahmoud", email: "layla.m@test.com", gender: Gender.FEMALE },
    { first: "Huda", last: "Ibrahim", email: "huda.i@test.com", gender: Gender.FEMALE },
    { first: "Mona", last: "Khalil", email: "mona.k@test.com", gender: Gender.FEMALE },
    { first: "Reem", last: "Nasser", email: "reem.n@test.com", gender: Gender.FEMALE },
    { first: "Dalia", last: "Osman", email: "dalia.o@test.com", gender: Gender.FEMALE },
    { first: "Tariq", last: "Hamdi", email: "tariq.h@test.com", gender: Gender.MALE },
    { first: "Sami", last: "Farouk", email: "sami.f@test.com", gender: Gender.MALE },
    { first: "Amira", last: "Younis", email: "amira.y@test.com", gender: Gender.FEMALE },
    { first: "Hassan", last: "Reda", email: "hassan.r@test.com", gender: Gender.MALE },
    { first: "Salma", last: "Adel", email: "salma.a@test.com", gender: Gender.FEMALE },
  ];

  for (const t of coachBTrainees) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { passwordHash: TRAINEE_HASH },
      create: {
        email: t.email,
        passwordHash: TRAINEE_HASH,
        firstName: t.first,
        lastName: t.last,
        locale: "ar",
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgB.id, userId: user.id } },
      update: {},
      create: { organizationId: orgB.id, userId: user.id, roleKey: RoleKey.TRAINEE },
    });
    await prisma.traineeProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        organizationId: orgB.id,
        userId: user.id,
        assignedTrainerId: coachB.id,
        gender: t.gender,
        heightCm: t.gender === Gender.MALE ? 178 : 165,
        currentWeightKg: t.gender === Gender.MALE ? 85 : 68,
        targetWeightKg: t.gender === Gender.MALE ? 80 : 60,
        activityLevel: ActivityLevel.LIGHTLY_ACTIVE,
        goal: GoalType.LEAN_CUT,
        trainingDaysPerWeek: 5,
        onboardingCompletedAt: new Date(),
      },
    });
  }

  // ─── Coach C — Pro Plan, 8 trainees ──────────────────────────────────────
  const coachC = await prisma.user.upsert({
    where: { email: "coach.mohammed@ironcoach.com" },
    update: { passwordHash: COACH_HASH },
    create: {
      email: "coach.mohammed@ironcoach.com",
      passwordHash: COACH_HASH,
      firstName: "Mohammed",
      lastName: "Al-Bakr",
      locale: "ar",
      emailVerifiedAt: new Date(),
    },
  });

  const orgC = await prisma.organization.upsert({
    where: { slug: "bakr-athletics" },
    update: {},
    create: {
      name: "Bakr Athletics",
      slug: "bakr-athletics",
      subdomain: "bakr-athletics",
      ownerUserId: coachC.id,
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: orgC.id, userId: coachC.id } },
    update: {},
    create: { organizationId: orgC.id, userId: coachC.id, roleKey: RoleKey.OWNER },
  });

  await prisma.trainerProfile.upsert({
    where: { userId: coachC.id },
    update: {},
    create: {
      organizationId: orgC.id,
      userId: coachC.id,
      bio: "Professional bodybuilding coach and contest prep specialist with 12 years experience",
      specialties: ["Bodybuilding", "Contest Prep", "Muscle Gain", "Powerlifting"],
      certifications: ["IFBB Pro Coach", "CSCS", "RD"],
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: orgC.id },
    update: {},
    create: {
      organizationId: orgC.id,
      planId: proPlan.id,
      stripeCustomerId: "cus_seed_coachC",
      stripeSubscriptionId: "sub_seed_coachC",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const coachCTrainees = [
    { first: "Faisal", last: "Qasim", email: "faisal.q@test.com", gender: Gender.MALE },
    { first: "Majid", last: "Hamed", email: "majid.h@test.com", gender: Gender.MALE },
    { first: "Nawaf", last: "Turki", email: "nawaf.t@test.com", gender: Gender.MALE },
    { first: "Abdullah", last: "Saeed", email: "abdullah.s@test.com", gender: Gender.MALE },
    { first: "Bandar", last: "Fahad", email: "bandar.f@test.com", gender: Gender.MALE },
    { first: "Lina", last: "Jamal", email: "lina.j@test.com", gender: Gender.FEMALE },
    { first: "Rami", last: "Walid", email: "rami.w@test.com", gender: Gender.MALE },
    { first: "Dana", last: "Faris", email: "dana.f@test.com", gender: Gender.FEMALE },
  ];

  for (const t of coachCTrainees) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { passwordHash: TRAINEE_HASH },
      create: {
        email: t.email,
        passwordHash: TRAINEE_HASH,
        firstName: t.first,
        lastName: t.last,
        locale: "ar",
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgC.id, userId: user.id } },
      update: {},
      create: { organizationId: orgC.id, userId: user.id, roleKey: RoleKey.TRAINEE },
    });
    await prisma.traineeProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        organizationId: orgC.id,
        userId: user.id,
        assignedTrainerId: coachC.id,
        gender: t.gender,
        heightCm: t.gender === Gender.MALE ? 180 : 167,
        currentWeightKg: t.gender === Gender.MALE ? 90 : 62,
        targetWeightKg: t.gender === Gender.MALE ? 95 : 58,
        activityLevel: ActivityLevel.VERY_ACTIVE,
        goal: GoalType.MUSCLE_GAIN,
        trainingDaysPerWeek: 6,
        onboardingCompletedAt: new Date(),
      },
    });
  }

  // ─── 80 Global Exercises (10 per MuscleGroup) ────────────────────────────
  const exercises: Array<{
    nameEn: string;
    nameAr: string;
    muscleGroup: MuscleGroup;
    secondaryMuscles: string[];
    difficultyLevel: DifficultyLevel;
    equipment: string;
    defaultSets: number;
    defaultReps: string;
    defaultRestSeconds: number;
    tempo: string;
  }> = [
    // CHEST (10)
    { nameEn: "Barbell Bench Press", nameAr: "ضغط البنش بالبار", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["TRICEPS", "SHOULDERS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell, Bench", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 120, tempo: "3-1-1-0" },
    { nameEn: "Incline Dumbbell Press", nameAr: "ضغط بالدمبل على مقعد مائل", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["TRICEPS", "SHOULDERS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Dumbbells, Incline Bench", defaultSets: 4, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "3-1-1-0" },
    { nameEn: "Dumbbell Fly", nameAr: "تفتيح بالدمبل", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["SHOULDERS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Dumbbells, Bench", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "3-1-1-0" },
    { nameEn: "Cable Crossover", nameAr: "كروس أوفر بالكيبل", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["SHOULDERS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Cable Machine", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Push-Up", nameAr: "تمرين الضغط", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["TRICEPS", "CORE"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Bodyweight", defaultSets: 3, defaultReps: "15-20", defaultRestSeconds: 60, tempo: "2-1-1-0" },
    { nameEn: "Decline Barbell Press", nameAr: "ضغط البنش المنخفض بالبار", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["TRICEPS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell, Decline Bench", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 120, tempo: "3-1-1-0" },
    { nameEn: "Machine Chest Press", nameAr: "ضغط الصدر بالجهاز", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["TRICEPS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Chest Press Machine", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "2-1-1-0" },
    { nameEn: "Pec Deck Machine", nameAr: "جهاز البيك ديك", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["SHOULDERS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Pec Deck Machine", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Weighted Dip (Chest)", nameAr: "ديبس بوزن للصدر", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["TRICEPS", "SHOULDERS"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Dip Station, Weight Belt", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 120, tempo: "3-1-1-0" },
    { nameEn: "Landmine Press", nameAr: "ضغط اللاندماين", muscleGroup: MuscleGroup.CHEST, secondaryMuscles: ["SHOULDERS", "TRICEPS"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Barbell, Landmine", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "2-1-1-0" },

    // BACK (10)
    { nameEn: "Barbell Deadlift", nameAr: "رفعة ميتة بالبار", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["LEGS", "CORE", "GLUTES"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Barbell", defaultSets: 4, defaultReps: "5-6", defaultRestSeconds: 180, tempo: "3-1-1-0" },
    { nameEn: "Pull-Up", nameAr: "تمرين العقلة", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["BICEPS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Pull-Up Bar", defaultSets: 4, defaultReps: "8-12", defaultRestSeconds: 90, tempo: "2-1-1-0" },
    { nameEn: "Barbell Bent-Over Row", nameAr: "تجديف منحني بالبار", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["BICEPS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 120, tempo: "2-1-1-0" },
    { nameEn: "Lat Pulldown", nameAr: "سحب علوي بالكيبل", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["BICEPS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Cable Machine", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "2-1-2-0" },
    { nameEn: "Seated Cable Row", nameAr: "تجديف بالكيبل جالس", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["BICEPS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Cable Machine", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "2-1-2-0" },
    { nameEn: "Single-Arm Dumbbell Row", nameAr: "تجديف بالدمبل بيد واحدة", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["BICEPS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Dumbbell, Bench", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "2-1-1-0" },
    { nameEn: "T-Bar Row", nameAr: "تجديف تي بار", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["BICEPS", "CORE"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "T-Bar Row Machine", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 120, tempo: "2-1-1-0" },
    { nameEn: "Face Pull", nameAr: "فيس بول بالكيبل", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["SHOULDERS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Cable Machine, Rope", defaultSets: 3, defaultReps: "15-20", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Rack Pull", nameAr: "رفعة من الرف", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["LEGS", "CORE"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Barbell, Power Rack", defaultSets: 4, defaultReps: "5-8", defaultRestSeconds: 180, tempo: "3-1-1-0" },
    { nameEn: "Chest-Supported Row", nameAr: "تجديف مع سند الصدر", muscleGroup: MuscleGroup.BACK, secondaryMuscles: ["BICEPS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Incline Bench, Dumbbells", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "2-1-2-0" },

    // LEGS (10)
    { nameEn: "Barbell Back Squat", nameAr: "سكوات خلفي بالبار", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: ["GLUTES", "CORE"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell, Squat Rack", defaultSets: 4, defaultReps: "6-8", defaultRestSeconds: 180, tempo: "3-1-1-0" },
    { nameEn: "Leg Press", nameAr: "ضغط الأرجل بالجهاز", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: ["GLUTES"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Leg Press Machine", defaultSets: 4, defaultReps: "10-12", defaultRestSeconds: 120, tempo: "3-1-1-0" },
    { nameEn: "Romanian Deadlift", nameAr: "رفعة ميتة رومانية", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: ["GLUTES", "BACK"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 120, tempo: "3-1-1-0" },
    { nameEn: "Leg Extension", nameAr: "تمديد الأرجل بالجهاز", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Leg Extension Machine", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Leg Curl", nameAr: "ثني الأرجل بالجهاز", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Leg Curl Machine", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Walking Lunge", nameAr: "طعنات المشي بالدمبل", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: ["GLUTES", "CORE"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Dumbbells", defaultSets: 3, defaultReps: "12 each", defaultRestSeconds: 90, tempo: "2-1-1-0" },
    { nameEn: "Front Squat", nameAr: "سكوات أمامي بالبار", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: ["CORE", "GLUTES"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Barbell, Squat Rack", defaultSets: 4, defaultReps: "6-8", defaultRestSeconds: 180, tempo: "3-1-1-0" },
    { nameEn: "Bulgarian Split Squat", nameAr: "سكوات بلغاري", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: ["GLUTES"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Dumbbells, Bench", defaultSets: 3, defaultReps: "10 each", defaultRestSeconds: 90, tempo: "3-1-1-0" },
    { nameEn: "Calf Raise", nameAr: "رفع ربلة الساق", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Calf Raise Machine", defaultSets: 4, defaultReps: "15-20", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Hack Squat", nameAr: "هاك سكوات بالجهاز", muscleGroup: MuscleGroup.LEGS, secondaryMuscles: ["GLUTES"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Hack Squat Machine", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 120, tempo: "3-1-1-0" },

    // SHOULDERS (10)
    { nameEn: "Overhead Barbell Press", nameAr: "ضغط علوي بالبار", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: ["TRICEPS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell", defaultSets: 4, defaultReps: "6-8", defaultRestSeconds: 120, tempo: "3-1-1-0" },
    { nameEn: "Dumbbell Lateral Raise", nameAr: "رفع جانبي بالدمبل", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Dumbbells", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Seated Dumbbell Press", nameAr: "ضغط بالدمبل جالس", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: ["TRICEPS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Dumbbells, Bench", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 90, tempo: "2-1-1-0" },
    { nameEn: "Front Dumbbell Raise", nameAr: "رفع أمامي بالدمبل", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: ["CHEST"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Dumbbells", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-1-0" },
    { nameEn: "Reverse Pec Deck", nameAr: "بيك ديك عكسي", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: ["BACK"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Pec Deck Machine", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Arnold Press", nameAr: "ضغط أرنولد", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: ["TRICEPS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Dumbbells", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 90, tempo: "2-1-1-0" },
    { nameEn: "Cable Lateral Raise", nameAr: "رفع جانبي بالكيبل", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Cable Machine", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Barbell Upright Row", nameAr: "تجديف عمودي بالبار", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: ["BICEPS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "2-1-1-0" },
    { nameEn: "Handstand Push-Up", nameAr: "ضغط الوقوف على اليدين", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: ["TRICEPS", "CORE"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Wall / Bodyweight", defaultSets: 3, defaultReps: "5-8", defaultRestSeconds: 120, tempo: "3-1-1-0" },
    { nameEn: "Machine Shoulder Press", nameAr: "ضغط الكتف بالجهاز", muscleGroup: MuscleGroup.SHOULDERS, secondaryMuscles: ["TRICEPS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Shoulder Press Machine", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "2-1-1-0" },

    // BICEPS (10)
    { nameEn: "Barbell Curl", nameAr: "ثني البار للباي", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Barbell", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Dumbbell Hammer Curl", nameAr: "هامر كيرل بالدمبل", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Dumbbells", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Incline Dumbbell Curl", nameAr: "كيرل على المقعد المائل", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Dumbbells, Incline Bench", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "3-1-2-0" },
    { nameEn: "Preacher Curl", nameAr: "كيرل على مسند الواعظ", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "EZ Bar, Preacher Bench", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Cable Curl", nameAr: "كيرل بالكيبل", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Cable Machine", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Concentration Curl", nameAr: "كيرل التركيز بالدمبل", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Dumbbell", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "EZ-Bar Curl", nameAr: "كيرل بالبار المنحني", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "EZ Bar", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Spider Curl", nameAr: "سبايدر كيرل", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "EZ Bar, Incline Bench", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Reverse Barbell Curl", nameAr: "كيرل عكسي بالبار", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Chin-Up", nameAr: "تمرين العقلة بقبضة سفلية", muscleGroup: MuscleGroup.BICEPS, secondaryMuscles: ["BACK"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Pull-Up Bar", defaultSets: 4, defaultReps: "6-10", defaultRestSeconds: 90, tempo: "2-1-1-0" },

    // TRICEPS (10)
    { nameEn: "Tricep Rope Pushdown", nameAr: "ضغط تراي بالحبل", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Cable Machine, Rope", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Close-Grip Bench Press", nameAr: "ضغط البنش بقبضة ضيقة", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: ["CHEST"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell, Bench", defaultSets: 4, defaultReps: "8-10", defaultRestSeconds: 90, tempo: "2-1-1-0" },
    { nameEn: "Overhead Dumbbell Extension", nameAr: "تمديد خلفي بالدمبل", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Dumbbell", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 60, tempo: "3-1-1-0" },
    { nameEn: "Skull Crusher", nameAr: "سكل كراشر بالبار", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "EZ Bar, Bench", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "3-1-1-0" },
    { nameEn: "Tricep Dip", nameAr: "ديبس للتراي", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: ["CHEST"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Dip Station", defaultSets: 3, defaultReps: "10-12", defaultRestSeconds: 90, tempo: "2-1-1-0" },
    { nameEn: "Diamond Push-Up", nameAr: "ضغط بقبضة ماسية", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: ["CHEST"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Bodyweight", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-1-0" },
    { nameEn: "Tricep Kickback", nameAr: "كيك باك بالدمبل للتراي", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Dumbbells", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Cable Overhead Extension", nameAr: "تمديد علوي بالكيبل", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Cable Machine, Rope", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "V-Bar Pushdown", nameAr: "ضغط تراي بمقبض V", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Cable Machine, V-Bar", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "JM Press", nameAr: "جي ام بريس", muscleGroup: MuscleGroup.TRICEPS, secondaryMuscles: ["CHEST"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Barbell, Bench", defaultSets: 4, defaultReps: "6-8", defaultRestSeconds: 120, tempo: "3-1-1-0" },

    // CORE (10)
    { nameEn: "Plank", nameAr: "تمرين البلانك", muscleGroup: MuscleGroup.CORE, secondaryMuscles: ["SHOULDERS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Bodyweight", defaultSets: 3, defaultReps: "30-60s", defaultRestSeconds: 60, tempo: "hold" },
    { nameEn: "Hanging Leg Raise", nameAr: "رفع الأرجل معلقاً", muscleGroup: MuscleGroup.CORE, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Pull-Up Bar", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Cable Woodchop", nameAr: "وود تشوب بالكيبل", muscleGroup: MuscleGroup.CORE, secondaryMuscles: ["SHOULDERS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Cable Machine", defaultSets: 3, defaultReps: "12 each", defaultRestSeconds: 60, tempo: "2-1-1-0" },
    { nameEn: "Ab Wheel Rollout", nameAr: "تمرين عجلة البطن", muscleGroup: MuscleGroup.CORE, secondaryMuscles: ["SHOULDERS"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Ab Wheel", defaultSets: 3, defaultReps: "8-12", defaultRestSeconds: 90, tempo: "3-1-1-0" },
    { nameEn: "Russian Twist", nameAr: "لف روسي", muscleGroup: MuscleGroup.CORE, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Bodyweight / Plate", defaultSets: 3, defaultReps: "20 total", defaultRestSeconds: 60, tempo: "1-0-1-0" },
    { nameEn: "Dead Bug", nameAr: "تمرين الحشرة الميتة", muscleGroup: MuscleGroup.CORE, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Bodyweight", defaultSets: 3, defaultReps: "10 each", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Cable Crunch", nameAr: "كرنش بالكيبل", muscleGroup: MuscleGroup.CORE, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Cable Machine", defaultSets: 3, defaultReps: "15-20", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Pallof Press", nameAr: "بالوف بريس بالكيبل", muscleGroup: MuscleGroup.CORE, secondaryMuscles: [], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Cable Machine", defaultSets: 3, defaultReps: "12 each", defaultRestSeconds: 60, tempo: "2-2-2-0" },
    { nameEn: "Dragon Flag", nameAr: "علم التنين", muscleGroup: MuscleGroup.CORE, secondaryMuscles: [], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Bench", defaultSets: 3, defaultReps: "5-8", defaultRestSeconds: 120, tempo: "3-1-3-0" },
    { nameEn: "Bicycle Crunch", nameAr: "كرنش الدراجة", muscleGroup: MuscleGroup.CORE, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Bodyweight", defaultSets: 3, defaultReps: "20 total", defaultRestSeconds: 60, tempo: "1-0-1-0" },

    // GLUTES (10)
    { nameEn: "Barbell Hip Thrust", nameAr: "هيب ثراست بالبار", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: ["LEGS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Barbell, Bench", defaultSets: 4, defaultReps: "8-12", defaultRestSeconds: 120, tempo: "2-1-2-0" },
    { nameEn: "Glute Bridge", nameAr: "جسر الأرداف", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: ["LEGS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Bodyweight / Barbell", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Cable Pull-Through", nameAr: "سحب بين الأرجل بالكيبل", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: ["LEGS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Cable Machine", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Sumo Deadlift", nameAr: "رفعة ميتة سومو", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: ["LEGS", "BACK"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Barbell", defaultSets: 4, defaultReps: "5-8", defaultRestSeconds: 180, tempo: "3-1-1-0" },
    { nameEn: "Goblet Squat", nameAr: "سكوات الكأس بالدمبل", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: ["LEGS", "CORE"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Dumbbell / Kettlebell", defaultSets: 3, defaultReps: "12-15", defaultRestSeconds: 60, tempo: "3-1-1-0" },
    { nameEn: "Step-Up", nameAr: "ستيب أب بالدمبل", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: ["LEGS"], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Dumbbells, Box", defaultSets: 3, defaultReps: "10 each", defaultRestSeconds: 60, tempo: "2-1-1-0" },
    { nameEn: "Cable Kickback", nameAr: "كيك باك بالكيبل للأرداف", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Cable Machine, Ankle Strap", defaultSets: 3, defaultReps: "12-15 each", defaultRestSeconds: 60, tempo: "2-1-2-0" },
    { nameEn: "Frog Pump", nameAr: "فروج بامب", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: [], difficultyLevel: DifficultyLevel.BEGINNER, equipment: "Bodyweight", defaultSets: 3, defaultReps: "20-25", defaultRestSeconds: 45, tempo: "1-1-1-0" },
    { nameEn: "Single-Leg Hip Thrust", nameAr: "هيب ثراست برجل واحدة", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: ["LEGS"], difficultyLevel: DifficultyLevel.ADVANCED, equipment: "Bench", defaultSets: 3, defaultReps: "10 each", defaultRestSeconds: 90, tempo: "2-1-2-0" },
    { nameEn: "Reverse Lunge", nameAr: "طعنة خلفية", muscleGroup: MuscleGroup.GLUTES, secondaryMuscles: ["LEGS"], difficultyLevel: DifficultyLevel.INTERMEDIATE, equipment: "Dumbbells", defaultSets: 3, defaultReps: "10 each", defaultRestSeconds: 90, tempo: "2-1-1-0" },
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { id: crypto.createHash("md5").update(ex.nameEn).digest("hex").slice(0, 8) + "-0000-0000-0000-000000000000" },
      update: {},
      create: {
        nameEn: ex.nameEn,
        nameAr: ex.nameAr,
        muscleGroup: ex.muscleGroup,
        secondaryMuscles: ex.secondaryMuscles,
        difficultyLevel: ex.difficultyLevel,
        equipment: ex.equipment,
        defaultSets: ex.defaultSets,
        defaultReps: ex.defaultReps,
        defaultRestSeconds: ex.defaultRestSeconds,
        tempo: ex.tempo,
        isGlobal: true,
      },
    });
  }

  console.log(`Seeded ${exercises.length} exercises`);

  // ─── 50 Common Foods (Arabic + English, accurate macros per 100g) ────────
  const foods: Array<{
    nameEn: string;
    nameAr: string;
    caloriesPer100g: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
    fiberG: number | null;
  }> = [
    { nameEn: "Chicken Breast (grilled)", nameAr: "صدر دجاج مشوي", caloriesPer100g: 165, proteinG: 31, carbsG: 0, fatsG: 3.6, fiberG: 0 },
    { nameEn: "White Rice (cooked)", nameAr: "أرز أبيض مطبوخ", caloriesPer100g: 130, proteinG: 2.7, carbsG: 28, fatsG: 0.3, fiberG: 0.4 },
    { nameEn: "Whole Wheat Bread", nameAr: "خبز قمح كامل", caloriesPer100g: 247, proteinG: 13, carbsG: 41, fatsG: 3.4, fiberG: 6.0 },
    { nameEn: "Eggs (whole, boiled)", nameAr: "بيض مسلوق", caloriesPer100g: 155, proteinG: 13, carbsG: 1.1, fatsG: 11, fiberG: 0 },
    { nameEn: "Egg Whites", nameAr: "بياض البيض", caloriesPer100g: 52, proteinG: 11, carbsG: 0.7, fatsG: 0.2, fiberG: 0 },
    { nameEn: "Salmon (baked)", nameAr: "سلمون مخبوز", caloriesPer100g: 208, proteinG: 20, carbsG: 0, fatsG: 13, fiberG: 0 },
    { nameEn: "Tuna (canned in water)", nameAr: "تونة معلبة بالماء", caloriesPer100g: 116, proteinG: 26, carbsG: 0, fatsG: 0.8, fiberG: 0 },
    { nameEn: "Ground Beef (90% lean)", nameAr: "لحم بقر مفروم قليل الدهن", caloriesPer100g: 176, proteinG: 20, carbsG: 0, fatsG: 10, fiberG: 0 },
    { nameEn: "Lamb (leg, roasted)", nameAr: "لحم ضأن مشوي", caloriesPer100g: 258, proteinG: 25, carbsG: 0, fatsG: 17, fiberG: 0 },
    { nameEn: "Shrimp (cooked)", nameAr: "روبيان مطبوخ", caloriesPer100g: 99, proteinG: 24, carbsG: 0.2, fatsG: 0.3, fiberG: 0 },
    { nameEn: "Greek Yogurt (plain)", nameAr: "زبادي يوناني سادة", caloriesPer100g: 59, proteinG: 10, carbsG: 3.6, fatsG: 0.4, fiberG: 0 },
    { nameEn: "Full-Fat Yogurt", nameAr: "زبادي كامل الدسم", caloriesPer100g: 61, proteinG: 3.5, carbsG: 4.7, fatsG: 3.3, fiberG: 0 },
    { nameEn: "Oats (dry)", nameAr: "شوفان جاف", caloriesPer100g: 389, proteinG: 17, carbsG: 66, fatsG: 7, fiberG: 11 },
    { nameEn: "Sweet Potato (baked)", nameAr: "بطاطا حلوة مخبوزة", caloriesPer100g: 90, proteinG: 2, carbsG: 21, fatsG: 0.1, fiberG: 3.3 },
    { nameEn: "Potato (boiled)", nameAr: "بطاطس مسلوقة", caloriesPer100g: 87, proteinG: 1.9, carbsG: 20, fatsG: 0.1, fiberG: 1.8 },
    { nameEn: "Brown Rice (cooked)", nameAr: "أرز بني مطبوخ", caloriesPer100g: 123, proteinG: 2.7, carbsG: 26, fatsG: 1, fiberG: 1.8 },
    { nameEn: "Banana", nameAr: "موز", caloriesPer100g: 89, proteinG: 1.1, carbsG: 23, fatsG: 0.3, fiberG: 2.6 },
    { nameEn: "Apple", nameAr: "تفاح", caloriesPer100g: 52, proteinG: 0.3, carbsG: 14, fatsG: 0.2, fiberG: 2.4 },
    { nameEn: "Dates (Medjool)", nameAr: "تمر مجهول", caloriesPer100g: 277, proteinG: 1.8, carbsG: 75, fatsG: 0.2, fiberG: 6.7 },
    { nameEn: "Hummus", nameAr: "حمص", caloriesPer100g: 166, proteinG: 8, carbsG: 14, fatsG: 10, fiberG: 6 },
    { nameEn: "Falafel", nameAr: "فلافل", caloriesPer100g: 333, proteinG: 13, carbsG: 32, fatsG: 18, fiberG: 4 },
    { nameEn: "Foul Medames", nameAr: "فول مدمس", caloriesPer100g: 110, proteinG: 8, carbsG: 15, fatsG: 2, fiberG: 5 },
    { nameEn: "Lentils (cooked)", nameAr: "عدس مطبوخ", caloriesPer100g: 116, proteinG: 9, carbsG: 20, fatsG: 0.4, fiberG: 7.9 },
    { nameEn: "Chickpeas (cooked)", nameAr: "حمص حب مطبوخ", caloriesPer100g: 164, proteinG: 9, carbsG: 27, fatsG: 2.6, fiberG: 7.6 },
    { nameEn: "Avocado", nameAr: "أفوكادو", caloriesPer100g: 160, proteinG: 2, carbsG: 9, fatsG: 15, fiberG: 7 },
    { nameEn: "Olive Oil", nameAr: "زيت زيتون", caloriesPer100g: 884, proteinG: 0, carbsG: 0, fatsG: 100, fiberG: 0 },
    { nameEn: "Peanut Butter", nameAr: "زبدة فول سوداني", caloriesPer100g: 588, proteinG: 25, carbsG: 20, fatsG: 50, fiberG: 6 },
    { nameEn: "Almonds", nameAr: "لوز", caloriesPer100g: 579, proteinG: 21, carbsG: 22, fatsG: 50, fiberG: 12 },
    { nameEn: "Walnuts", nameAr: "جوز", caloriesPer100g: 654, proteinG: 15, carbsG: 14, fatsG: 65, fiberG: 7 },
    { nameEn: "Milk (whole)", nameAr: "حليب كامل الدسم", caloriesPer100g: 61, proteinG: 3.2, carbsG: 4.8, fatsG: 3.3, fiberG: 0 },
    { nameEn: "Milk (skim)", nameAr: "حليب خالي الدسم", caloriesPer100g: 34, proteinG: 3.4, carbsG: 5, fatsG: 0.1, fiberG: 0 },
    { nameEn: "Whey Protein Powder", nameAr: "بروتين مصل اللبن", caloriesPer100g: 400, proteinG: 80, carbsG: 10, fatsG: 5, fiberG: 0 },
    { nameEn: "Cottage Cheese", nameAr: "جبنة قريش", caloriesPer100g: 98, proteinG: 11, carbsG: 3.4, fatsG: 4.3, fiberG: 0 },
    { nameEn: "Arabic Flatbread (Khubz)", nameAr: "خبز عربي", caloriesPer100g: 275, proteinG: 9, carbsG: 55, fatsG: 1.2, fiberG: 2.2 },
    { nameEn: "Kabsa Rice", nameAr: "أرز كبسة", caloriesPer100g: 178, proteinG: 4, carbsG: 30, fatsG: 5, fiberG: 1 },
    { nameEn: "Shawarma Chicken (meat only)", nameAr: "شاورما دجاج (لحم فقط)", caloriesPer100g: 190, proteinG: 27, carbsG: 3, fatsG: 8, fiberG: 0 },
    { nameEn: "Labneh", nameAr: "لبنة", caloriesPer100g: 154, proteinG: 8, carbsG: 4, fatsG: 12, fiberG: 0 },
    { nameEn: "Tahini", nameAr: "طحينة", caloriesPer100g: 595, proteinG: 17, carbsG: 21, fatsG: 54, fiberG: 9 },
    { nameEn: "Fattoush Salad", nameAr: "سلطة فتوش", caloriesPer100g: 60, proteinG: 1.5, carbsG: 8, fatsG: 3, fiberG: 2 },
    { nameEn: "Tabbouleh", nameAr: "تبولة", caloriesPer100g: 87, proteinG: 2, carbsG: 10, fatsG: 5, fiberG: 2.5 },
    { nameEn: "Quinoa (cooked)", nameAr: "كينوا مطبوخة", caloriesPer100g: 120, proteinG: 4.4, carbsG: 21, fatsG: 1.9, fiberG: 2.8 },
    { nameEn: "Broccoli (steamed)", nameAr: "بروكلي مطبوخ", caloriesPer100g: 35, proteinG: 2.4, carbsG: 7, fatsG: 0.4, fiberG: 3.3 },
    { nameEn: "Spinach (raw)", nameAr: "سبانخ طازجة", caloriesPer100g: 23, proteinG: 2.9, carbsG: 3.6, fatsG: 0.4, fiberG: 2.2 },
    { nameEn: "Cucumber", nameAr: "خيار", caloriesPer100g: 15, proteinG: 0.7, carbsG: 3.6, fatsG: 0.1, fiberG: 0.5 },
    { nameEn: "Tomato", nameAr: "طماطم", caloriesPer100g: 18, proteinG: 0.9, carbsG: 3.9, fatsG: 0.2, fiberG: 1.2 },
    { nameEn: "Honey", nameAr: "عسل", caloriesPer100g: 304, proteinG: 0.3, carbsG: 82, fatsG: 0, fiberG: 0.2 },
    { nameEn: "Dark Chocolate (70%)", nameAr: "شوكولاتة داكنة ٧٠٪", caloriesPer100g: 598, proteinG: 8, carbsG: 46, fatsG: 43, fiberG: 11 },
    { nameEn: "White Cheese (Akkawi)", nameAr: "جبنة عكاوي", caloriesPer100g: 289, proteinG: 18, carbsG: 1, fatsG: 24, fiberG: 0 },
    { nameEn: "Halloumi Cheese", nameAr: "جبنة حلوم", caloriesPer100g: 321, proteinG: 25, carbsG: 1.7, fatsG: 25, fiberG: 0 },
    { nameEn: "Basmati Rice (cooked)", nameAr: "أرز بسمتي مطبوخ", caloriesPer100g: 121, proteinG: 3.5, carbsG: 25, fatsG: 0.4, fiberG: 0.4 },
  ];

  // Clear all foods to prevent duplicates from previous runs
  await prisma.nutritionPlanMealItem.deleteMany({});
  await prisma.food.deleteMany({});

  // Additional foods beyond the base 50
  const extraFoods = [
    { nameEn: "Brown Bread", nameAr: "خبز أسمر", caloriesPer100g: 247, proteinG: 9, carbsG: 41, fatsG: 3.4, fiberG: 6 },
    { nameEn: "White Bread", nameAr: "خبز أبيض", caloriesPer100g: 265, proteinG: 9, carbsG: 49, fatsG: 3.2, fiberG: 2.7 },
    { nameEn: "Pasta (dry)", nameAr: "معكرونة", caloriesPer100g: 371, proteinG: 13, carbsG: 74, fatsG: 1.5, fiberG: 3.2 },
    { nameEn: "Grapes", nameAr: "عنب", caloriesPer100g: 69, proteinG: 0.7, carbsG: 18, fatsG: 0.2, fiberG: 0.9 },
    { nameEn: "Orange", nameAr: "برتقال", caloriesPer100g: 47, proteinG: 0.9, carbsG: 12, fatsG: 0.1, fiberG: 2.4 },
    { nameEn: "Corn (dry)", nameAr: "ذرة", caloriesPer100g: 365, proteinG: 9, carbsG: 74, fatsG: 4.7, fiberG: 7.3 },
    { nameEn: "Pumpkin", nameAr: "قرع", caloriesPer100g: 26, proteinG: 1, carbsG: 6.5, fatsG: 0.1, fiberG: 0.5 },
    { nameEn: "Whole Chicken", nameAr: "دجاج كامل", caloriesPer100g: 239, proteinG: 27, carbsG: 0, fatsG: 14, fiberG: 0 },
    { nameEn: "Beef (lean)", nameAr: "لحم بقري", caloriesPer100g: 250, proteinG: 26, carbsG: 0, fatsG: 15, fiberG: 0 },
    { nameEn: "Peanuts", nameAr: "فول سوداني", caloriesPer100g: 567, proteinG: 26, carbsG: 16, fatsG: 49, fiberG: 8.5 },
    { nameEn: "Coconut (fresh)", nameAr: "جوز هند", caloriesPer100g: 354, proteinG: 3.3, carbsG: 15, fatsG: 33, fiberG: 9 },
    { nameEn: "Flax Seeds", nameAr: "بذور كتان", caloriesPer100g: 534, proteinG: 18, carbsG: 29, fatsG: 42, fiberG: 27 },
    { nameEn: "Coconut Oil", nameAr: "زيت جوز الهند", caloriesPer100g: 862, proteinG: 0, carbsG: 0, fatsG: 100, fiberG: 0 },
    { nameEn: "Cashews", nameAr: "كاشو", caloriesPer100g: 553, proteinG: 18, carbsG: 30, fatsG: 44, fiberG: 3.3 },
    { nameEn: "Skim Milk", nameAr: "حليب خالي الدسم", caloriesPer100g: 34, proteinG: 3.4, carbsG: 5, fatsG: 0.1, fiberG: 0 },
    { nameEn: "Cheese (Cheddar)", nameAr: "جبن شيدر", caloriesPer100g: 402, proteinG: 25, carbsG: 1.3, fatsG: 33, fiberG: 0 },
    { nameEn: "Butter", nameAr: "زبدة", caloriesPer100g: 717, proteinG: 0.9, carbsG: 0.1, fatsG: 81, fiberG: 0 },
    { nameEn: "Carrot", nameAr: "جزر", caloriesPer100g: 41, proteinG: 0.9, carbsG: 10, fatsG: 0.2, fiberG: 2.8 },
    { nameEn: "Bell Pepper", nameAr: "فلفل حلو", caloriesPer100g: 31, proteinG: 1, carbsG: 6, fatsG: 0.3, fiberG: 2.1 },
    { nameEn: "Garlic", nameAr: "ثوم", caloriesPer100g: 149, proteinG: 6.4, carbsG: 33, fatsG: 0.5, fiberG: 2.1 },
    { nameEn: "Onion", nameAr: "بصل", caloriesPer100g: 40, proteinG: 1.1, carbsG: 9.3, fatsG: 0.1, fiberG: 1.7 },
    { nameEn: "Zucchini", nameAr: "كوسا", caloriesPer100g: 17, proteinG: 1.2, carbsG: 3.1, fatsG: 0.3, fiberG: 1 },
    { nameEn: "Lettuce", nameAr: "خس", caloriesPer100g: 15, proteinG: 1.4, carbsG: 2.9, fatsG: 0.2, fiberG: 1.3 },
    { nameEn: "Chicken Liver", nameAr: "كبدة دجاج", caloriesPer100g: 167, proteinG: 24, carbsG: 1, fatsG: 7.5, fiberG: 0 },
    { nameEn: "Laban (Buttermilk)", nameAr: "لبن", caloriesPer100g: 40, proteinG: 3.3, carbsG: 4.8, fatsG: 0.9, fiberG: 0 },
    { nameEn: "Creatine (supplement)", nameAr: "كرياتين", caloriesPer100g: 0, proteinG: 0, carbsG: 0, fatsG: 0, fiberG: 0 },
    { nameEn: "Casein Protein", nameAr: "بروتين كازين", caloriesPer100g: 370, proteinG: 78, carbsG: 5, fatsG: 2, fiberG: 0 },
    { nameEn: "Beans (dried)", nameAr: "فاصوليا", caloriesPer100g: 347, proteinG: 21, carbsG: 63, fatsG: 1.2, fiberG: 15 },
    { nameEn: "Mango", nameAr: "مانجو", caloriesPer100g: 60, proteinG: 0.8, carbsG: 15, fatsG: 0.4, fiberG: 1.6 },
    { nameEn: "Watermelon", nameAr: "بطيخ", caloriesPer100g: 30, proteinG: 0.6, carbsG: 8, fatsG: 0.2, fiberG: 0.4 },
  ];

  const allFoods = [...foods, ...extraFoods];

  for (let i = 0; i < allFoods.length; i++) {
    const f = allFoods[i];
    const foodId = `food-${String(i + 1).padStart(3, "0")}`;
    await prisma.food.upsert({
      where: { id: foodId },
      update: { nameEn: f.nameEn, nameAr: f.nameAr, caloriesPer100g: f.caloriesPer100g, proteinG: f.proteinG, carbsG: f.carbsG, fatsG: f.fatsG, fiberG: f.fiberG, isVerified: true },
      create: { id: foodId, nameEn: f.nameEn, nameAr: f.nameAr, caloriesPer100g: f.caloriesPer100g, proteinG: f.proteinG, carbsG: f.carbsG, fatsG: f.fatsG, fiberG: f.fiberG, isVerified: true },
    });
  }

  console.log(`Seeded ${allFoods.length} foods (0 duplicates)`);

  // ─── Workout Programs + Assignments for Coach A's trainees ──────────────
  // Get exercise IDs for building programs
  const allExercises = await prisma.exercise.findMany({ where: { isGlobal: true }, take: 80 });
  const exByName = (name: string) => allExercises.find(e => e.nameEn === name);

  // PPL Program for Coach A
  const pplProgram = await prisma.workoutProgram.upsert({
    where: { id: "seed-ppl-program-0001" },
    update: {},
    create: {
      id: "seed-ppl-program-0001",
      organizationId: orgA.id,
      trainerId: coachA.id,
      title: "Push Pull Legs",
      description: "Classic 6-day PPL split for intermediate lifters",
      goal: GoalType.MUSCLE_GAIN,
      level: DifficultyLevel.INTERMEDIATE,
      durationWeeks: 4,
      isTemplate: false,
      status: "active",
    },
  });

  // Create week 1
  const week1 = await prisma.workoutWeek.upsert({
    where: { workoutProgramId_weekNumber: { workoutProgramId: pplProgram.id, weekNumber: 1 } },
    update: {},
    create: {
      workoutProgramId: pplProgram.id,
      weekNumber: 1,
      title: "Week 1",
    },
  });

  // Push Day
  const pushDay = await prisma.workoutDay.upsert({
    where: { workoutWeekId_dayNumber: { workoutWeekId: week1.id, dayNumber: 1 } },
    update: {},
    create: {
      workoutWeekId: week1.id,
      dayNumber: 1,
      title: "Push Day",
      focusArea: "CHEST",
    },
  });

  const pushExercises = [
    { name: "Barbell Bench Press", sets: 4, reps: "8-10", rest: 120 },
    { name: "Incline Dumbbell Press", sets: 4, reps: "10-12", rest: 90 },
    { name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15", rest: 60 },
    { name: "Tricep Rope Pushdown", sets: 3, reps: "12-15", rest: 60 },
    { name: "Overhead Dumbbell Extension", sets: 3, reps: "10-12", rest: 60 },
  ];

  for (let i = 0; i < pushExercises.length; i++) {
    const ex = exByName(pushExercises[i].name);
    if (!ex) continue;
    await prisma.workoutDayExercise.upsert({
      where: { workoutDayId_sortOrder: { workoutDayId: pushDay.id, sortOrder: i + 1 } },
      update: {},
      create: {
        workoutDayId: pushDay.id,
        exerciseId: ex.id,
        sortOrder: i + 1,
        sets: pushExercises[i].sets,
        reps: pushExercises[i].reps,
        restSeconds: pushExercises[i].rest,
      },
    });
  }

  // Pull Day
  const pullDay = await prisma.workoutDay.upsert({
    where: { workoutWeekId_dayNumber: { workoutWeekId: week1.id, dayNumber: 2 } },
    update: {},
    create: {
      workoutWeekId: week1.id,
      dayNumber: 2,
      title: "Pull Day",
      focusArea: "BACK",
    },
  });

  const pullExercises = [
    { name: "Barbell Bent-Over Row", sets: 4, reps: "8-10", rest: 120 },
    { name: "Pull-Up", sets: 4, reps: "8-12", rest: 90 },
    { name: "Seated Cable Row", sets: 3, reps: "10-12", rest: 90 },
    { name: "Barbell Curl", sets: 3, reps: "10-12", rest: 60 },
    { name: "Dumbbell Hammer Curl", sets: 3, reps: "10-12", rest: 60 },
  ];

  for (let i = 0; i < pullExercises.length; i++) {
    const ex = exByName(pullExercises[i].name);
    if (!ex) continue;
    await prisma.workoutDayExercise.upsert({
      where: { workoutDayId_sortOrder: { workoutDayId: pullDay.id, sortOrder: i + 1 } },
      update: {},
      create: {
        workoutDayId: pullDay.id,
        exerciseId: ex.id,
        sortOrder: i + 1,
        sets: pullExercises[i].sets,
        reps: pullExercises[i].reps,
        restSeconds: pullExercises[i].rest,
      },
    });
  }

  // Leg Day
  const legDay = await prisma.workoutDay.upsert({
    where: { workoutWeekId_dayNumber: { workoutWeekId: week1.id, dayNumber: 3 } },
    update: {},
    create: {
      workoutWeekId: week1.id,
      dayNumber: 3,
      title: "Leg Day",
      focusArea: "LEGS",
    },
  });

  const legExercises = [
    { name: "Barbell Back Squat", sets: 4, reps: "6-8", rest: 180 },
    { name: "Romanian Deadlift", sets: 4, reps: "8-10", rest: 120 },
    { name: "Leg Press", sets: 4, reps: "10-12", rest: 120 },
    { name: "Leg Curl", sets: 3, reps: "12-15", rest: 60 },
    { name: "Calf Raise", sets: 4, reps: "15-20", rest: 60 },
  ];

  for (let i = 0; i < legExercises.length; i++) {
    const ex = exByName(legExercises[i].name);
    if (!ex) continue;
    await prisma.workoutDayExercise.upsert({
      where: { workoutDayId_sortOrder: { workoutDayId: legDay.id, sortOrder: i + 1 } },
      update: {},
      create: {
        workoutDayId: legDay.id,
        exerciseId: ex.id,
        sortOrder: i + 1,
        sets: legExercises[i].sets,
        reps: legExercises[i].reps,
        restSeconds: legExercises[i].rest,
      },
    });
  }

  console.log("Seeded PPL workout program with 3 days");

  // Assign program to Coach A's first trainee (Khalid)
  const khalidUser = await prisma.user.findUnique({ where: { email: "khalid.m@test.com" } });
  const khalidProfile = khalidUser ? await prisma.traineeProfile.findUnique({ where: { userId: khalidUser.id } }) : null;

  if (khalidProfile) {
    await prisma.traineeWorkoutAssignment.upsert({
      where: { id: "seed-assign-khalid-ppl" },
      update: {},
      create: {
        id: "seed-assign-khalid-ppl",
        organizationId: orgA.id,
        traineeProfileId: khalidProfile.id,
        workoutProgramId: pplProgram.id,
        startsOn: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Started 2 weeks ago
        status: AssignmentStatus.ACTIVE,
      },
    });

    // Create workout logs for Khalid (past 2 weeks — 6 sessions)
    const days = [pushDay, pullDay, legDay];
    const dayExerciseSets: Record<string, Array<{ name: string; sets: number }>> = {
      [pushDay.id]: pushExercises.map(e => ({ name: e.name, sets: e.sets })),
      [pullDay.id]: pullExercises.map(e => ({ name: e.name, sets: e.sets })),
      [legDay.id]: legExercises.map(e => ({ name: e.name, sets: e.sets })),
    };

    for (let w = 0; w < 2; w++) {
      for (let d = 0; d < 3; d++) {
        const daysAgo = (1 - w) * 7 + (2 - d) * 2 + 1; // Spread across past 14 days
        const sessionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const logId = `seed-log-khalid-w${w + 1}d${d + 1}`;
        const day = days[d];

        const log = await prisma.workoutLog.upsert({
          where: { id: logId },
          update: {},
          create: {
            id: logId,
            organizationId: orgA.id,
            traineeProfileId: khalidProfile.id,
            workoutDayId: day.id,
            startedAt: sessionDate,
            completedAt: new Date(sessionDate.getTime() + 65 * 60 * 1000), // 65 min session
            durationMinutes: 65,
            difficultyRating: 4,
            traineeNotes: w === 1 && d === 0 ? "Felt strong today, increased bench weight" : null,
          },
        });

        // Add sets for each exercise in the day
        const dayExs = dayExerciseSets[day.id] || [];
        let setCounter = 0;
        for (const dex of dayExs) {
          const ex = exByName(dex.name);
          if (!ex) continue;
          for (let s = 1; s <= dex.sets; s++) {
            setCounter++;
            const baseWeight = d === 2 ? 80 + w * 2.5 : d === 0 ? 60 + w * 2.5 : 50 + w * 2.5;
            await prisma.workoutLogSet.upsert({
              where: { id: `${logId}-set-${setCounter}` },
              update: {},
              create: {
                id: `${logId}-set-${setCounter}`,
                workoutLogId: log.id,
                exerciseId: ex.id,
                setNumber: s,
                repsCompleted: 10 - (s > 2 ? 1 : 0), // Slight rep drop on later sets
                weightKg: baseWeight,
                isCompleted: true,
              },
            });
          }
        }
      }
    }
    console.log("Seeded 6 workout logs for Khalid with sets");

    // Strength PRs for Khalid
    const benchEx = exByName("Barbell Bench Press");
    const squatEx = exByName("Barbell Back Squat");
    const rowEx = exByName("Barbell Bent-Over Row");

    if (benchEx) {
      await prisma.strengthPR.upsert({
        where: { traineeProfileId_exerciseId: { traineeProfileId: khalidProfile.id, exerciseId: benchEx.id } },
        update: {},
        create: {
          organizationId: orgA.id,
          traineeProfileId: khalidProfile.id,
          exerciseId: benchEx.id,
          weightKg: 85,
          reps: 8,
          volume: 680,
          achievedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          workoutLogId: "seed-log-khalid-w2d1",
        },
      });
    }
    if (squatEx) {
      await prisma.strengthPR.upsert({
        where: { traineeProfileId_exerciseId: { traineeProfileId: khalidProfile.id, exerciseId: squatEx.id } },
        update: {},
        create: {
          organizationId: orgA.id,
          traineeProfileId: khalidProfile.id,
          exerciseId: squatEx.id,
          weightKg: 100,
          reps: 6,
          volume: 600,
          achievedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          workoutLogId: "seed-log-khalid-w2d3",
        },
      });
    }
    if (rowEx) {
      await prisma.strengthPR.upsert({
        where: { traineeProfileId_exerciseId: { traineeProfileId: khalidProfile.id, exerciseId: rowEx.id } },
        update: {},
        create: {
          organizationId: orgA.id,
          traineeProfileId: khalidProfile.id,
          exerciseId: rowEx.id,
          weightKg: 70,
          reps: 10,
          volume: 700,
          achievedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          workoutLogId: "seed-log-khalid-w2d2",
        },
      });
    }
    console.log("Seeded strength PRs for Khalid");

    // Check-ins for Khalid (2 weekly check-ins)
    for (let c = 0; c < 2; c++) {
      const daysAgo = (1 - c) * 7 + 1;
      await prisma.checkin.upsert({
        where: { id: `seed-checkin-khalid-${c + 1}` },
        update: {},
        create: {
          id: `seed-checkin-khalid-${c + 1}`,
          organizationId: orgA.id,
          traineeProfileId: khalidProfile.id,
          trainerId: coachA.id,
          submittedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          weightKg: 81.5 - c * 0.5,
          waistCm: 86 - c * 0.5,
          chestCm: 102,
          sleepScore: 4,
          energyScore: c === 0 ? 5 : 4,
          adherenceScore: 4,
          notes: c === 0 ? "Feeling great, diet on point" : "Had a couple cheat meals but back on track",
          coachResponse: c === 1 ? "Great progress! Keep pushing the weights up." : null,
          reviewedAt: c === 1 ? new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
    console.log("Seeded 2 check-ins for Khalid");
  }

  // Also assign program to Fatima (second trainee)
  const fatimaUser = await prisma.user.findUnique({ where: { email: "fatima.h@test.com" } });
  const fatimaProfile = fatimaUser ? await prisma.traineeProfile.findUnique({ where: { userId: fatimaUser.id } }) : null;
  if (fatimaProfile) {
    await prisma.traineeWorkoutAssignment.upsert({
      where: { id: "seed-assign-fatima-ppl" },
      update: {},
      create: {
        id: "seed-assign-fatima-ppl",
        organizationId: orgA.id,
        traineeProfileId: fatimaProfile.id,
        workoutProgramId: pplProgram.id,
        startsOn: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: AssignmentStatus.ACTIVE,
      },
    });
  }

  // ─── Nutrition Plan for Coach A → Khalid ──────────────────────────────────
  if (khalidProfile) {
    const nutritionPlan = await prisma.nutritionPlan.upsert({
      where: { id: "seed-nutri-plan-khalid" },
      update: {},
      create: {
        id: "seed-nutri-plan-khalid",
        organizationId: orgA.id,
        trainerId: coachA.id,
        traineeProfileId: khalidProfile.id,
        title: "Fat Loss — High Protein",
        goal: GoalType.FAT_LOSS,
        caloriesTarget: 2200,
        proteinG: 180,
        carbsG: 200,
        fatsG: 60,
        isActive: true,
      },
    });

    // Get food IDs
    const chicken = await prisma.food.findFirst({ where: { nameEn: "Chicken Breast (grilled)" } });
    const rice = await prisma.food.findFirst({ where: { nameEn: "White Rice (cooked)" } });
    const eggs = await prisma.food.findFirst({ where: { nameEn: "Eggs (whole, boiled)" } });
    const oats = await prisma.food.findFirst({ where: { nameEn: "Oats (dry)" } });
    const banana = await prisma.food.findFirst({ where: { nameEn: "Banana" } });
    const greek = await prisma.food.findFirst({ where: { nameEn: "Greek Yogurt (plain)" } });
    const sweetPotato = await prisma.food.findFirst({ where: { nameEn: "Sweet Potato (baked)" } });
    const broccoli = await prisma.food.findFirst({ where: { nameEn: "Broccoli (steamed)" } });
    const whey = await prisma.food.findFirst({ where: { nameEn: "Whey Protein Powder" } });
    const salmon = await prisma.food.findFirst({ where: { nameEn: "Salmon (baked)" } });

    // Breakfast
    const breakfast = await prisma.nutritionPlanMeal.upsert({
      where: { nutritionPlanId_mealOrder: { nutritionPlanId: nutritionPlan.id, mealOrder: 1 } },
      update: {},
      create: {
        nutritionPlanId: nutritionPlan.id,
        title: "Breakfast",
        titleAr: "الفطور",
        mealOrder: 1,
        timeSuggestion: "07:30",
        calories: 520,
        proteinG: 42,
        carbsG: 60,
        fatsG: 12,
      },
    });

    if (oats) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: breakfast.id, foodId: oats.id, quantityGrams: 80, calories: 311, proteinG: 13.6, carbsG: 52.8, fatsG: 5.6 } }).catch(() => {});
    if (eggs) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: breakfast.id, foodId: eggs.id, quantityGrams: 100, calories: 155, proteinG: 13, carbsG: 1.1, fatsG: 11 } }).catch(() => {});
    if (banana) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: breakfast.id, foodId: banana.id, quantityGrams: 120, calories: 107, proteinG: 1.3, carbsG: 27.6, fatsG: 0.4 } }).catch(() => {});

    // Lunch
    const lunch = await prisma.nutritionPlanMeal.upsert({
      where: { nutritionPlanId_mealOrder: { nutritionPlanId: nutritionPlan.id, mealOrder: 2 } },
      update: {},
      create: {
        nutritionPlanId: nutritionPlan.id,
        title: "Lunch",
        titleAr: "الغداء",
        mealOrder: 2,
        timeSuggestion: "13:00",
        calories: 680,
        proteinG: 55,
        carbsG: 70,
        fatsG: 15,
      },
    });

    if (chicken) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: lunch.id, foodId: chicken.id, quantityGrams: 200, calories: 330, proteinG: 62, carbsG: 0, fatsG: 7.2 } }).catch(() => {});
    if (rice) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: lunch.id, foodId: rice.id, quantityGrams: 200, calories: 260, proteinG: 5.4, carbsG: 56, fatsG: 0.6 } }).catch(() => {});
    if (broccoli) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: lunch.id, foodId: broccoli.id, quantityGrams: 150, calories: 52, proteinG: 3.6, carbsG: 10.5, fatsG: 0.6 } }).catch(() => {});

    // Dinner
    const dinner = await prisma.nutritionPlanMeal.upsert({
      where: { nutritionPlanId_mealOrder: { nutritionPlanId: nutritionPlan.id, mealOrder: 3 } },
      update: {},
      create: {
        nutritionPlanId: nutritionPlan.id,
        title: "Dinner",
        titleAr: "العشاء",
        mealOrder: 3,
        timeSuggestion: "20:00",
        calories: 600,
        proteinG: 48,
        carbsG: 45,
        fatsG: 20,
      },
    });

    if (salmon) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: dinner.id, foodId: salmon.id, quantityGrams: 200, calories: 416, proteinG: 40, carbsG: 0, fatsG: 26 } }).catch(() => {});
    if (sweetPotato) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: dinner.id, foodId: sweetPotato.id, quantityGrams: 200, calories: 180, proteinG: 4, carbsG: 42, fatsG: 0.2 } }).catch(() => {});

    // Post-workout snack
    const snack = await prisma.nutritionPlanMeal.upsert({
      where: { nutritionPlanId_mealOrder: { nutritionPlanId: nutritionPlan.id, mealOrder: 4 } },
      update: {},
      create: {
        nutritionPlanId: nutritionPlan.id,
        title: "Post-Workout",
        titleAr: "بعد التمرين",
        mealOrder: 4,
        timeSuggestion: "17:00",
        calories: 400,
        proteinG: 45,
        carbsG: 30,
        fatsG: 5,
      },
    });

    if (whey) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: snack.id, foodId: whey.id, quantityGrams: 40, calories: 160, proteinG: 32, carbsG: 4, fatsG: 2 } }).catch(() => {});
    if (greek) await prisma.nutritionPlanMealItem.create({ data: { nutritionPlanMealId: snack.id, foodId: greek.id, quantityGrams: 200, calories: 118, proteinG: 20, carbsG: 7.2, fatsG: 0.8 } }).catch(() => {});

    // Assign nutrition plan
    await prisma.traineeNutritionAssignment.upsert({
      where: { id: "seed-nutri-assign-khalid" },
      update: { status: AssignmentStatus.COMPLETED },
      create: {
        id: "seed-nutri-assign-khalid",
        organizationId: orgA.id,
        traineeProfileId: khalidProfile.id,
        nutritionPlanId: nutritionPlan.id,
        startsOn: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        status: AssignmentStatus.COMPLETED,
      },
    });

    console.log("Seeded nutrition plan with 4 meals for Khalid");
  }

  // ─── Conversations + Messages ─────────────────────────────────────────────
  // Coach A ↔ Khalid conversation
  if (khalidUser) {
    const conv = await prisma.conversation.upsert({
      where: { id: "seed-conv-ahmed-khalid" },
      update: {},
      create: {
        id: "seed-conv-ahmed-khalid",
        organizationId: orgA.id,
        type: ConversationType.TRAINER_TRAINEE,
        lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    });

    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conv.id, userId: coachA.id } },
      update: {},
      create: { conversationId: conv.id, userId: coachA.id, lastReadAt: new Date() },
    });

    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conv.id, userId: khalidUser.id } },
      update: {},
      create: { conversationId: conv.id, userId: khalidUser.id, lastReadAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    });

    const messages = [
      { sender: coachA.id, body: "مرحبا خالد! كيف حالك مع البرنامج الجديد؟", hoursAgo: 48 },
      { sender: khalidUser.id, body: "الحمد لله كويس يا كابتن، زدت وزن البنش 5 كيلو هالأسبوع 💪", hoursAgo: 47 },
      { sender: coachA.id, body: "ممتاز! حافظ على التقنية الصحيحة ولا تستعجل الزيادة", hoursAgo: 46 },
      { sender: khalidUser.id, body: "إن شاء الله. بس عندي سؤال عن يوم الأرجل، الرومانيان ديدلفت يوجعني ظهري شوي", hoursAgo: 25 },
      { sender: coachA.id, body: "ممكن يكون عندك مشكلة بالفورم. خلنا نعدل: نزل الوزن 10 كيلو وركز على إبقاء الظهر مستقيم. إذا استمر الألم بنبدله", hoursAgo: 24 },
      { sender: khalidUser.id, body: "تمام يا كابتن، بجرب كذا اليوم 👍", hoursAgo: 2 },
    ];

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      await prisma.message.upsert({
        where: { id: `seed-msg-ak-${i + 1}` },
        update: {},
        create: {
          id: `seed-msg-ak-${i + 1}`,
          conversationId: conv.id,
          senderUserId: m.sender,
          body: m.body,
          isRead: true,
          readAt: new Date(Date.now() - (m.hoursAgo - 1) * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - m.hoursAgo * 60 * 60 * 1000),
        },
      });
    }

    console.log("Seeded conversation with 6 messages (Ahmed ↔ Khalid)");
  }

  // Coach A ↔ Fatima conversation
  if (fatimaUser) {
    const conv2 = await prisma.conversation.upsert({
      where: { id: "seed-conv-ahmed-fatima" },
      update: {},
      create: {
        id: "seed-conv-ahmed-fatima",
        organizationId: orgA.id,
        type: ConversationType.TRAINER_TRAINEE,
        lastMessageAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    });

    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conv2.id, userId: coachA.id } },
      update: {},
      create: { conversationId: conv2.id, userId: coachA.id },
    });

    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conv2.id, userId: fatimaUser.id } },
      update: {},
      create: { conversationId: conv2.id, userId: fatimaUser.id },
    });

    const msgs2 = [
      { sender: coachA.id, body: "أهلاً فاطمة! خطة التغذية الجديدة جاهزة، شوفيها وقوليلي رأيك", hoursAgo: 30 },
      { sender: fatimaUser.id, body: "شكراً كابتن! شفتها وعجبتني بس ممكن نزيد البروتين شوي؟", hoursAgo: 28 },
      { sender: coachA.id, body: "أكيد، بعدّل الخطة وأضيف وجبة خفيفة بروتين بعد التمرين", hoursAgo: 5 },
    ];

    for (let i = 0; i < msgs2.length; i++) {
      const m = msgs2[i];
      await prisma.message.upsert({
        where: { id: `seed-msg-af-${i + 1}` },
        update: {},
        create: {
          id: `seed-msg-af-${i + 1}`,
          conversationId: conv2.id,
          senderUserId: m.sender,
          body: m.body,
          isRead: m.hoursAgo > 6,
          createdAt: new Date(Date.now() - m.hoursAgo * 60 * 60 * 1000),
        },
      });
    }

    console.log("Seeded conversation with 3 messages (Ahmed ↔ Fatima)");
  }

  // ─── Nutrition Plan for Coach A (unassigned template) ─────────────────────
  await prisma.nutritionPlan.upsert({
    where: { id: "seed-nutri-plan-template" },
    update: {},
    create: {
      id: "seed-nutri-plan-template",
      organizationId: orgA.id,
      trainerId: coachA.id,
      title: "Muscle Gain — 3000 kcal",
      goal: GoalType.MUSCLE_GAIN,
      caloriesTarget: 3000,
      proteinG: 200,
      carbsG: 350,
      fatsG: 80,
      isActive: true,
    },
  });

  // ─── Additional Workout Logs for MORE trainees (richer demo) ───────────
  // Fatima's workout logs (4 sessions over past 2 weeks)
  if (fatimaProfile) {
    const fDays = [pushDay, pullDay, legDay, pushDay];
    for (let i = 0; i < 4; i++) {
      const daysAgo = 12 - i * 3;
      const sessionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const logId = `seed-log-fatima-${i + 1}`;
      await prisma.workoutLog.upsert({
        where: { id: logId },
        update: {},
        create: {
          id: logId,
          organizationId: orgA.id,
          traineeProfileId: fatimaProfile.id,
          workoutDayId: fDays[i].id,
          startedAt: sessionDate,
          completedAt: new Date(sessionDate.getTime() + 55 * 60 * 1000),
          durationMinutes: 55,
          difficultyRating: 3 + (i % 2),
          traineeNotes: i === 2 ? "Great session, felt energized!" : null,
        },
      });
    }
    // Fatima check-ins (4 weeks of check-ins)
    for (let c = 0; c < 4; c++) {
      const daysAgo = 28 - c * 7;
      await prisma.checkin.upsert({
        where: { id: `seed-checkin-fatima-${c + 1}` },
        update: {},
        create: {
          id: `seed-checkin-fatima-${c + 1}`,
          organizationId: orgA.id,
          traineeProfileId: fatimaProfile.id,
          trainerId: coachA.id,
          submittedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          weightKg: 65 - c * 0.4,
          waistCm: 72 - c * 0.3,
          chestCm: 88,
          sleepScore: 4,
          energyScore: 3 + (c % 2),
          adherenceScore: c > 1 ? 5 : 4,
          notes: c === 3 ? "الحمد لله نزلت كيلو ونص!" : c === 0 ? "بداية البرنامج" : null,
          coachResponse: c > 0 ? "ممتاز! استمري على هالإيقاع 💪" : null,
          reviewedAt: c > 0 ? new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
    console.log("Seeded 4 workout logs + 4 check-ins for Fatima");
  }

  // Omar's workout logs (8 sessions — very consistent trainee)
  const omarUser = await prisma.user.findUnique({ where: { email: "omar.z@test.com" } });
  const omarProfile = omarUser ? await prisma.traineeProfile.findUnique({ where: { userId: omarUser.id } }) : null;
  if (omarProfile) {
    // Assign program to Omar
    await prisma.traineeWorkoutAssignment.upsert({
      where: { id: "seed-assign-omar-ppl" },
      update: {},
      create: {
        id: "seed-assign-omar-ppl",
        organizationId: orgA.id,
        traineeProfileId: omarProfile.id,
        workoutProgramId: pplProgram.id,
        startsOn: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: AssignmentStatus.ACTIVE,
      },
    });
    const oDays = [pushDay, pullDay, legDay];
    for (let w = 0; w < 3; w++) {
      for (let d = 0; d < Math.min(3, 3); d++) {
        if (w === 2 && d >= 2) break; // 8 total sessions
        const daysAgo = (2 - w) * 7 + (2 - d) * 2;
        const sessionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const logId = `seed-log-omar-w${w + 1}d${d + 1}`;
        await prisma.workoutLog.upsert({
          where: { id: logId },
          update: {},
          create: {
            id: logId,
            organizationId: orgA.id,
            traineeProfileId: omarProfile.id,
            workoutDayId: oDays[d].id,
            startedAt: sessionDate,
            completedAt: new Date(sessionDate.getTime() + 70 * 60 * 1000),
            durationMinutes: 70,
            difficultyRating: 4 + (w > 0 ? 1 : 0),
          },
        });
      }
    }
    // Omar check-ins (6 weekly)
    for (let c = 0; c < 6; c++) {
      const daysAgo = 42 - c * 7;
      await prisma.checkin.upsert({
        where: { id: `seed-checkin-omar-${c + 1}` },
        update: {},
        create: {
          id: `seed-checkin-omar-${c + 1}`,
          organizationId: orgA.id,
          traineeProfileId: omarProfile.id,
          trainerId: coachA.id,
          submittedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          weightKg: 82 - c * 0.6,
          waistCm: 88 - c * 0.4,
          chestCm: 103 + c * 0.2,
          armsCm: 37 + c * 0.15,
          sleepScore: c > 2 ? 5 : 4,
          energyScore: 4,
          adherenceScore: 5,
          notes: c === 5 ? "Lost 3kg total, arms are bigger!" : null,
          coachResponse: c % 2 === 0 ? "Outstanding consistency Omar, keep it up!" : null,
          reviewedAt: c % 2 === 0 ? new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
    console.log("Seeded 8 workout logs + 6 check-ins for Omar");
  }

  // ─── Additional Workout Logs for Coach B's trainees ────────────────────
  // Create Upper/Lower program for Coach B
  const ulProgram = await prisma.workoutProgram.upsert({
    where: { id: "seed-ul-program-0002" },
    update: {},
    create: {
      id: "seed-ul-program-0002",
      organizationId: orgB.id,
      trainerId: coachB.id,
      title: "Upper / Lower Split",
      description: "4-day upper/lower split for lean body transformation",
      goal: GoalType.LEAN_CUT,
      level: DifficultyLevel.INTERMEDIATE,
      durationWeeks: 6,
      isTemplate: false,
      status: "active",
    },
  });

  const ulWeek = await prisma.workoutWeek.upsert({
    where: { workoutProgramId_weekNumber: { workoutProgramId: ulProgram.id, weekNumber: 1 } },
    update: {},
    create: { workoutProgramId: ulProgram.id, weekNumber: 1, title: "Week 1" },
  });

  const upperDay = await prisma.workoutDay.upsert({
    where: { workoutWeekId_dayNumber: { workoutWeekId: ulWeek.id, dayNumber: 1 } },
    update: {},
    create: { workoutWeekId: ulWeek.id, dayNumber: 1, title: "Upper Body", focusArea: "CHEST" },
  });

  const lowerDay = await prisma.workoutDay.upsert({
    where: { workoutWeekId_dayNumber: { workoutWeekId: ulWeek.id, dayNumber: 2 } },
    update: {},
    create: { workoutWeekId: ulWeek.id, dayNumber: 2, title: "Lower Body", focusArea: "LEGS" },
  });

  // Add exercises to upper day
  const upperExs = ["Barbell Bench Press", "Pull-Up", "Seated Dumbbell Press", "Barbell Curl", "Tricep Rope Pushdown"];
  for (let i = 0; i < upperExs.length; i++) {
    const ex = exByName(upperExs[i]);
    if (!ex) continue;
    await prisma.workoutDayExercise.upsert({
      where: { workoutDayId_sortOrder: { workoutDayId: upperDay.id, sortOrder: i + 1 } },
      update: {},
      create: { workoutDayId: upperDay.id, exerciseId: ex.id, sortOrder: i + 1, sets: 4, reps: "10-12", restSeconds: 90 },
    });
  }
  const lowerExs = ["Barbell Back Squat", "Romanian Deadlift", "Leg Press", "Walking Lunge", "Calf Raise"];
  for (let i = 0; i < lowerExs.length; i++) {
    const ex = exByName(lowerExs[i]);
    if (!ex) continue;
    await prisma.workoutDayExercise.upsert({
      where: { workoutDayId_sortOrder: { workoutDayId: lowerDay.id, sortOrder: i + 1 } },
      update: {},
      create: { workoutDayId: lowerDay.id, exerciseId: ex.id, sortOrder: i + 1, sets: 4, reps: "8-12", restSeconds: 120 },
    });
  }
  console.log("Seeded Upper/Lower program for Coach B");

  // Layla (Coach B's trainee) — 10 workout logs
  const laylaUser = await prisma.user.findUnique({ where: { email: "layla.m@test.com" } });
  const laylaProfile = laylaUser ? await prisma.traineeProfile.findUnique({ where: { userId: laylaUser.id } }) : null;
  if (laylaProfile) {
    await prisma.traineeWorkoutAssignment.upsert({
      where: { id: "seed-assign-layla-ul" },
      update: {},
      create: {
        id: "seed-assign-layla-ul",
        organizationId: orgB.id,
        traineeProfileId: laylaProfile.id,
        workoutProgramId: ulProgram.id,
        startsOn: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        status: AssignmentStatus.ACTIVE,
      },
    });
    const lDays = [upperDay, lowerDay];
    for (let i = 0; i < 10; i++) {
      const daysAgo = 30 - i * 3;
      const sessionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      await prisma.workoutLog.upsert({
        where: { id: `seed-log-layla-${i + 1}` },
        update: {},
        create: {
          id: `seed-log-layla-${i + 1}`,
          organizationId: orgB.id,
          traineeProfileId: laylaProfile.id,
          workoutDayId: lDays[i % 2].id,
          startedAt: sessionDate,
          completedAt: new Date(sessionDate.getTime() + 50 * 60 * 1000),
          durationMinutes: 50,
          difficultyRating: 3 + (i > 5 ? 1 : 0),
        },
      });
    }
    console.log("Seeded 10 workout logs for Layla");
  }

  // ─── Full Body program for Coach C ─────────────────────────────────────
  const fbProgram = await prisma.workoutProgram.upsert({
    where: { id: "seed-fb-program-0003" },
    update: {},
    create: {
      id: "seed-fb-program-0003",
      organizationId: orgC.id,
      trainerId: coachC.id,
      title: "Full Body Strength",
      description: "3-day full body program for advanced lifters focusing on compound movements",
      goal: GoalType.MUSCLE_GAIN,
      level: DifficultyLevel.ADVANCED,
      durationWeeks: 8,
      isTemplate: true,
      status: "active",
    },
  });

  const fbWeek = await prisma.workoutWeek.upsert({
    where: { workoutProgramId_weekNumber: { workoutProgramId: fbProgram.id, weekNumber: 1 } },
    update: {},
    create: { workoutProgramId: fbProgram.id, weekNumber: 1, title: "Week 1" },
  });

  const fullDay1 = await prisma.workoutDay.upsert({
    where: { workoutWeekId_dayNumber: { workoutWeekId: fbWeek.id, dayNumber: 1 } },
    update: {},
    create: { workoutWeekId: fbWeek.id, dayNumber: 1, title: "Full Body A", focusArea: "CHEST" },
  });

  const fbExs = ["Barbell Bench Press", "Barbell Back Squat", "Barbell Bent-Over Row", "Overhead Barbell Press", "Barbell Deadlift"];
  for (let i = 0; i < fbExs.length; i++) {
    const ex = exByName(fbExs[i]);
    if (!ex) continue;
    await prisma.workoutDayExercise.upsert({
      where: { workoutDayId_sortOrder: { workoutDayId: fullDay1.id, sortOrder: i + 1 } },
      update: {},
      create: { workoutDayId: fullDay1.id, exerciseId: ex.id, sortOrder: i + 1, sets: 5, reps: "5", restSeconds: 180 },
    });
  }
  console.log("Seeded Full Body program for Coach C");

  // Faisal (Coach C's trainee) — 12 workout logs over 6 weeks
  const faisalUser = await prisma.user.findUnique({ where: { email: "faisal.q@test.com" } });
  const faisalProfile = faisalUser ? await prisma.traineeProfile.findUnique({ where: { userId: faisalUser.id } }) : null;
  if (faisalProfile) {
    await prisma.traineeWorkoutAssignment.upsert({
      where: { id: "seed-assign-faisal-fb" },
      update: {},
      create: {
        id: "seed-assign-faisal-fb",
        organizationId: orgC.id,
        traineeProfileId: faisalProfile.id,
        workoutProgramId: fbProgram.id,
        startsOn: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        status: AssignmentStatus.ACTIVE,
      },
    });
    for (let i = 0; i < 12; i++) {
      const daysAgo = 42 - i * 3;
      const sessionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      await prisma.workoutLog.upsert({
        where: { id: `seed-log-faisal-${i + 1}` },
        update: {},
        create: {
          id: `seed-log-faisal-${i + 1}`,
          organizationId: orgC.id,
          traineeProfileId: faisalProfile.id,
          workoutDayId: fullDay1.id,
          startedAt: sessionDate,
          completedAt: new Date(sessionDate.getTime() + 75 * 60 * 1000),
          durationMinutes: 75,
          difficultyRating: 5,
          traineeNotes: i === 11 ? "New squat PR: 140kg x 5!" : null,
        },
      });
    }
    console.log("Seeded 12 workout logs for Faisal");
  }

  // ─── Additional Nutrition Plan for Coach B → Layla ──────────────────────
  if (laylaProfile) {
    const laylaPlan = await prisma.nutritionPlan.upsert({
      where: { id: "seed-nutri-plan-layla" },
      update: {},
      create: {
        id: "seed-nutri-plan-layla",
        organizationId: orgB.id,
        trainerId: coachB.id,
        traineeProfileId: laylaProfile.id,
        title: "Lean Cut — 1600 kcal",
        goal: GoalType.LEAN_CUT,
        caloriesTarget: 1600,
        proteinG: 130,
        carbsG: 140,
        fatsG: 50,
        isActive: true,
      },
    });

    await prisma.traineeNutritionAssignment.upsert({
      where: { id: "seed-nutri-assign-layla" },
      update: {},
      create: {
        id: "seed-nutri-assign-layla",
        organizationId: orgB.id,
        traineeProfileId: laylaProfile.id,
        nutritionPlanId: laylaPlan.id,
        startsOn: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        status: AssignmentStatus.ACTIVE,
      },
    });
    console.log("Seeded nutrition plan for Layla");
  }

  // ─── More conversations for Coach B ────────────────────────────────────
  if (laylaUser) {
    const conv3 = await prisma.conversation.upsert({
      where: { id: "seed-conv-sara-layla" },
      update: {},
      create: {
        id: "seed-conv-sara-layla",
        organizationId: orgB.id,
        type: ConversationType.TRAINER_TRAINEE,
        lastMessageAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    });
    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conv3.id, userId: coachB.id } },
      update: {},
      create: { conversationId: conv3.id, userId: coachB.id },
    });
    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conv3.id, userId: laylaUser.id } },
      update: {},
      create: { conversationId: conv3.id, userId: laylaUser.id },
    });
    const msgs3 = [
      { sender: coachB.id, body: "مرحبا ليلى! شفت نتائج التسجيل الأسبوعي — ممتازة 🎉", hoursAgo: 72 },
      { sender: laylaUser.id, body: "شكراً كابتنة سارة! الخطة الغذائية ساعدتني كثير", hoursAgo: 70 },
      { sender: coachB.id, body: "الحلو إنك ملتزمة. الأسبوع الجاي بنزيد شوي كارديو خفيف", hoursAgo: 48 },
      { sender: laylaUser.id, body: "تمام! كم دقيقة تنصحيني أمشي؟", hoursAgo: 24 },
      { sender: coachB.id, body: "٣٠ دقيقة مشي سريع بعد التمرين، ٤ أيام بالأسبوع كافي 🚶‍♀️", hoursAgo: 1 },
    ];
    for (let i = 0; i < msgs3.length; i++) {
      await prisma.message.upsert({
        where: { id: `seed-msg-sl-${i + 1}` },
        update: {},
        create: {
          id: `seed-msg-sl-${i + 1}`,
          conversationId: conv3.id,
          senderUserId: msgs3[i].sender,
          body: msgs3[i].body,
          isRead: msgs3[i].hoursAgo > 2,
          createdAt: new Date(Date.now() - msgs3[i].hoursAgo * 60 * 60 * 1000),
        },
      });
    }
    console.log("Seeded conversation (Sara ↔ Layla)");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KHALID 28-DAY DEMO DATA — Complete month of training + nutrition
  // ═══════════════════════════════════════════════════════════════════════════

  if (khalidProfile) {
    const DAY = 24 * 60 * 60 * 1000;

    // ─── PPL Weeks 2-4 ────────────────────────────────────────────────────
    for (let w = 2; w <= 4; w++) {
      const week = await prisma.workoutWeek.upsert({
        where: { workoutProgramId_weekNumber: { workoutProgramId: pplProgram.id, weekNumber: w } },
        update: {},
        create: { workoutProgramId: pplProgram.id, weekNumber: w, title: w === 4 ? "أسبوع الذروة" : `Week ${w}` },
      });
      const dayDefs = [
        { num: 1, title: "Push Day", focus: "CHEST", exs: ["Barbell Bench Press","Incline Dumbbell Press","Dumbbell Lateral Raise","Tricep Rope Pushdown","Overhead Dumbbell Extension"] },
        { num: 2, title: "Pull Day", focus: "BACK", exs: ["Barbell Bent-Over Row","Pull-Up","Seated Cable Row","Barbell Curl","Dumbbell Hammer Curl"] },
        { num: 3, title: "Leg Day", focus: "LEGS", exs: ["Barbell Back Squat","Romanian Deadlift","Leg Press","Leg Curl","Calf Raise"] },
      ];
      for (const dd of dayDefs) {
        const day = await prisma.workoutDay.upsert({
          where: { workoutWeekId_dayNumber: { workoutWeekId: week.id, dayNumber: dd.num } },
          update: {},
          create: { workoutWeekId: week.id, dayNumber: dd.num, title: dd.title, focusArea: dd.focus },
        });
        for (let ei = 0; ei < dd.exs.length; ei++) {
          const ex = exByName(dd.exs[ei]);
          if (!ex) continue;
          await prisma.workoutDayExercise.upsert({
            where: { workoutDayId_sortOrder: { workoutDayId: day.id, sortOrder: ei + 1 } },
            update: {},
            create: { workoutDayId: day.id, exerciseId: ex.id, sortOrder: ei + 1, sets: 4, reps: dd.num === 3 ? "6-8" : "8-10", restSeconds: dd.num === 3 ? 120 : 90 },
          });
        }
      }
    }
    console.log("Seeded PPL weeks 2-4");

    // ─── 24 Workout Logs (Mon/Wed/Fri × 4 weeks) + Sets ──────────────────
    const days3 = [pushDay, pullDay, legDay];
    const benchEx = exByName("Barbell Bench Press");
    const squatEx = exByName("Barbell Back Squat");
    const benchWeights = [75, 77.5, 80, 80];
    const benchReps = [8, 8, 7, 8];
    const squatWeights = [100, 102.5, 105, 107.5];
    const squatReps = [6, 6, 5, 5];

    const sessionNotes: Record<number, string> = {
      7: "أحس بتحسن كبير في قوة الصدر",
      14: "تجاوزت الـ 80kg في البنش برس للمرة الأولى 🏆",
      21: "أصعب أسبوع لكن الأكثر فائدة",
      24: "اكتملت الشهر الأول بنجاح! فخور بنفسي 💪",
    };

    let sessionNum = 0;
    for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
      for (let dayIdx = 0; dayIdx < 3; dayIdx++) {
        // 3 sessions per week: day offsets 0 (Mon), 2 (Wed), 4 (Fri)
        const dayOffset = weekIdx * 7 + [0, 2, 4][dayIdx];
        const daysAgo = 27 - dayOffset;
        if (daysAgo < 0) continue;
        sessionNum++;
        const startTime = new Date(Date.now() - daysAgo * DAY);
        startTime.setHours(6 + (sessionNum % 2), 0, 0, 0);
        const duration = 55 + Math.floor(Math.random() * 20);
        const logId = `seed-log-khalid-month-${sessionNum}`;
        const day = days3[dayIdx];

        const log = await prisma.workoutLog.upsert({
          where: { id: logId },
          update: {},
          create: {
            id: logId,
            organizationId: orgA.id,
            traineeProfileId: khalidProfile.id,
            workoutDayId: day.id,
            startedAt: startTime,
            completedAt: new Date(startTime.getTime() + duration * 60 * 1000),
            durationMinutes: duration,
            difficultyRating: 3 + Math.min(2, weekIdx),
            traineeNotes: sessionNotes[sessionNum] || null,
          },
        });

        // Add sets for bench (push days) or squat (leg days)
        if (dayIdx === 0 && benchEx) {
          for (let s = 1; s <= 4; s++) {
            await prisma.workoutLogSet.upsert({
              where: { id: `${logId}-bench-${s}` },
              update: {},
              create: {
                id: `${logId}-bench-${s}`,
                workoutLogId: log.id,
                exerciseId: benchEx.id,
                setNumber: s,
                repsCompleted: benchReps[weekIdx] - (s > 3 ? 1 : 0),
                weightKg: benchWeights[weekIdx],
                isCompleted: true,
              },
            });
          }
        }
        if (dayIdx === 2 && squatEx) {
          for (let s = 1; s <= 4; s++) {
            await prisma.workoutLogSet.upsert({
              where: { id: `${logId}-squat-${s}` },
              update: {},
              create: {
                id: `${logId}-squat-${s}`,
                workoutLogId: log.id,
                exerciseId: squatEx.id,
                setNumber: s,
                repsCompleted: squatReps[weekIdx] - (s > 3 ? 1 : 0),
                weightKg: squatWeights[weekIdx],
                isCompleted: true,
              },
            });
          }
        }
      }
    }
    console.log(`Seeded ${sessionNum} workout logs for Khalid (month)` );

    // Update Strength PRs
    if (benchEx) {
      await prisma.strengthPR.upsert({
        where: { traineeProfileId_exerciseId: { traineeProfileId: khalidProfile.id, exerciseId: benchEx.id } },
        update: { weightKg: 80, reps: 8, volume: 640, achievedAt: new Date(Date.now() - 7 * DAY), workoutLogId: "seed-log-khalid-month-4" },
        create: { organizationId: orgA.id, traineeProfileId: khalidProfile.id, exerciseId: benchEx.id, weightKg: 80, reps: 8, volume: 640, achievedAt: new Date(Date.now() - 7 * DAY), workoutLogId: "seed-log-khalid-month-4" },
      });
    }
    if (squatEx) {
      await prisma.strengthPR.upsert({
        where: { traineeProfileId_exerciseId: { traineeProfileId: khalidProfile.id, exerciseId: squatEx.id } },
        update: { weightKg: 107.5, reps: 5, volume: 537.5, achievedAt: new Date(Date.now() - 3 * DAY), workoutLogId: "seed-log-khalid-month-12" },
        create: { organizationId: orgA.id, traineeProfileId: khalidProfile.id, exerciseId: squatEx.id, weightKg: 107.5, reps: 5, volume: 537.5, achievedAt: new Date(Date.now() - 3 * DAY), workoutLogId: "seed-log-khalid-month-12" },
      });
    }
    console.log("Updated Khalid strength PRs");

    // ─── 4 Weekly Check-ins (transformation story) ────────────────────────
    const checkins = [
      { id: "seed-checkin-khalid-month-1", daysAgo: 28, w: 88.5, waist: 92, chest: 102, arms: 36, thighs: 58, sleep: 3, energy: 3, adh: 4, notes: "أول أسبوع صعب لكن متحمس للبداية", coach: "بداية ممتازة خالد! ركز على النوم هذا الأسبوع 💪" },
      { id: "seed-checkin-khalid-month-2", daysAgo: 21, w: 87.2, waist: 91, chest: 103, arms: 36.5, thighs: 58, sleep: 4, energy: 4, adh: 5, notes: "تحسن واضح في الطاقة، النوم أحسن", coach: "شاهدت تحسناً رائعاً في الالتزام! استمر 🔥" },
      { id: "seed-checkin-khalid-month-3", daysAgo: 14, w: 86.0, waist: 90, chest: 104, arms: 37, thighs: 57.5, sleep: 4, energy: 5, adh: 5, notes: "تجاوزت الـ 80kg في البنش! لم أتوقع ذلك بهذه السرعة", coach: "رقم قياسي جديد! زيادة العضلات واضحة جداً في الصدر والذراعين 💪" },
      { id: "seed-checkin-khalid-month-4", daysAgo: 7, w: 85.0, waist: 89, chest: 105, arms: 37.5, thighs: 57, sleep: 5, energy: 5, adh: 5, notes: "الشهر الأول منتهي — خسرت 3.5kg وزدت في كل الأوزان", coach: "خالد هذا إنجاز استثنائي في 4 أسابيع فقط! -3.5kg + قوة أعلى = تحول حقيقي. الشهر الثاني سيكون أقوى 🏆" },
    ];
    for (const c of checkins) {
      await prisma.checkin.upsert({
        where: { id: c.id },
        update: { weightKg: c.w, waistCm: c.waist, chestCm: c.chest, armsCm: c.arms, thighsCm: c.thighs },
        create: {
          id: c.id,
          organizationId: orgA.id,
          traineeProfileId: khalidProfile.id,
          trainerId: coachA.id,
          submittedAt: new Date(Date.now() - c.daysAgo * DAY),
          weightKg: c.w,
          waistCm: c.waist,
          chestCm: c.chest,
          armsCm: c.arms,
          thighsCm: c.thighs,
          sleepScore: c.sleep,
          energyScore: c.energy,
          adherenceScore: c.adh,
          notes: c.notes,
          coachResponse: c.coach,
          reviewedAt: new Date(Date.now() - (c.daysAgo - 1) * DAY),
        },
      });
    }
    console.log("Seeded 4 monthly check-ins for Khalid (88.5→85.0kg)");

    // ─── Detailed Nutrition Plan (5 meals) ────────────────────────────────
    const nutPlanDetailed = await prisma.nutritionPlan.upsert({
      where: { id: "seed-nutri-plan-khalid-v2" },
      update: {},
      create: {
        id: "seed-nutri-plan-khalid-v2",
        organizationId: orgA.id,
        trainerId: coachA.id,
        traineeProfileId: khalidProfile.id,
        title: "خسارة الدهون — بروتين عالي",
        goal: GoalType.FAT_LOSS,
        caloriesTarget: 2200,
        proteinG: 180,
        carbsG: 200,
        fatsG: 65,
        notes: "بروتين عالي لحماية العضلات أثناء الكاتينج",
        isActive: true,
      },
    });

    const mealDefs = [
      { order: 1, title: "Breakfast", titleAr: "الإفطار", time: "07:00", cal: 520, p: 45, c: 55, f: 12 },
      { order: 2, title: "Pre-workout", titleAr: "قبل التمرين", time: "10:00", cal: 380, p: 35, c: 45, f: 8 },
      { order: 3, title: "Post-workout", titleAr: "بعد التمرين", time: "13:00", cal: 480, p: 50, c: 55, f: 8 },
      { order: 4, title: "Lunch", titleAr: "الغداء", time: "16:00", cal: 520, p: 45, c: 45, f: 18 },
      { order: 5, title: "Dinner", titleAr: "العشاء", time: "20:30", cal: 300, p: 35, c: 10, f: 15 },
    ];
    for (const m of mealDefs) {
      await prisma.nutritionPlanMeal.upsert({
        where: { nutritionPlanId_mealOrder: { nutritionPlanId: nutPlanDetailed.id, mealOrder: m.order } },
        update: {},
        create: {
          nutritionPlanId: nutPlanDetailed.id,
          title: m.title,
          titleAr: m.titleAr,
          mealOrder: m.order,
          timeSuggestion: m.time,
          calories: m.cal,
          proteinG: m.p,
          carbsG: m.c,
          fatsG: m.f,
        },
      });
    }

    await prisma.traineeNutritionAssignment.upsert({
      where: { id: "seed-nutri-assign-khalid-v2" },
      update: {},
      create: {
        id: "seed-nutri-assign-khalid-v2",
        organizationId: orgA.id,
        traineeProfileId: khalidProfile.id,
        nutritionPlanId: nutPlanDetailed.id,
        startsOn: new Date(Date.now() - 28 * DAY),
        status: AssignmentStatus.ACTIVE,
      },
    });
    console.log("Seeded detailed 5-meal nutrition plan for Khalid");

    // ─── Meal Logs (20 entries showing compliance) ────────────────────────
    const allMeals = await prisma.nutritionPlanMeal.findMany({ where: { nutritionPlanId: nutPlanDetailed.id }, orderBy: { mealOrder: "asc" } });
    let mealLogIdx = 0;
    for (let d = 0; d < 28; d++) {
      const mealsToday = d % 4 === 0 ? 4 : 5; // 4 meals on some days, 5 on most
      for (let mi = 0; mi < Math.min(mealsToday, allMeals.length); mi++) {
        mealLogIdx++;
        if (mealLogIdx > 100) break; // safety cap
        const meal = allMeals[mi];
        await prisma.mealLog.upsert({
          where: { id: `seed-meallog-khalid-${mealLogIdx}` },
          update: {},
          create: {
            id: `seed-meallog-khalid-${mealLogIdx}`,
            organizationId: orgA.id,
            traineeProfileId: khalidProfile.id,
            nutritionPlanMealId: meal.id,
            loggedAt: new Date(Date.now() - (27 - d) * DAY + mi * 3 * 60 * 60 * 1000),
            calories: meal.calories,
            proteinG: meal.proteinG,
            carbsG: meal.carbsG,
            fatsG: meal.fatsG,
          },
        });
      }
    }
    console.log(`Seeded ${mealLogIdx} meal logs for Khalid`);

    // ─── Additional Chat Messages (coaching relationship over 28 days) ───
    const khalidUserId = khalidUser!.id;
    const chatMsgs = [
      { sender: coachA.id, body: "مرحباً خالد! جاهز للبداية؟ اليوم نبدأ برنامج الـ PPL 💪", daysAgo: 28 },
      { sender: khalidUserId, body: "جاهز 100%! متحمس جداً", daysAgo: 28 },
      { sender: khalidUserId, body: "أنهيت أول جلسة Push — صعبة لكن ممتازة!", daysAgo: 25 },
      { sender: coachA.id, body: "ممتاز! كيف كان الوزن في البنش؟", daysAgo: 25 },
      { sender: khalidUserId, body: "75kg × 8 تكرارات، حسيت بحرق قوي في الصدر", daysAgo: 25 },
      { sender: coachA.id, body: "شوف الـ check-in الأول — نتائج ممتازة! استمر 🔥", daysAgo: 21 },
      { sender: khalidUserId, body: "سؤال مدرب — هل أزيد بروتين المكملات؟", daysAgo: 18 },
      { sender: coachA.id, body: "لا، الخطة الغذائية كافية. تأكد من شرب 3 لترات ماء يومياً", daysAgo: 18 },
      { sender: khalidUserId, body: "تجاوزت الـ 80kg في البنش اليوم! 🏆🏆", daysAgo: 14 },
      { sender: coachA.id, body: "هذا رقم قياسي شخصي جديد! فخور بك خالد! الشهر القادم نستهدف 85kg", daysAgo: 14 },
      { sender: khalidUserId, body: "الجسم تعبان بعد أسبوع الذروة، طبيعي؟", daysAgo: 10 },
      { sender: coachA.id, body: "طبيعي 100%، هذا يعني العضلات تنمو. نم 8 ساعات وخذ البروتين", daysAgo: 10 },
      { sender: khalidUserId, body: "أنهيت الشهر الأول! خسرت 3.5kg وكل أوزاني زادت", daysAgo: 7 },
      { sender: coachA.id, body: "إنجاز مذهل خالد! -3.5kg دهون + قوة أعلى = تحول حقيقي 🏆 جاهز للشهر الثاني؟", daysAgo: 7 },
      { sender: khalidUserId, body: "جاهز! متى ترسل برنامج الشهر الثاني؟", daysAgo: 1 },
    ];
    for (let i = 0; i < chatMsgs.length; i++) {
      const m = chatMsgs[i];
      await prisma.message.upsert({
        where: { id: `seed-msg-ak-month-${i + 1}` },
        update: {},
        create: {
          id: `seed-msg-ak-month-${i + 1}`,
          conversationId: "seed-conv-ahmed-khalid",
          senderUserId: m.sender,
          body: m.body,
          isRead: m.daysAgo > 1,
          createdAt: new Date(Date.now() - m.daysAgo * DAY + (i % 3) * 60 * 60 * 1000),
        },
      });
    }
    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: "seed-conv-ahmed-khalid" },
      data: { lastMessageAt: new Date(Date.now() - 1 * DAY) },
    });
    console.log("Seeded 15 monthly chat messages (Ahmed ↔ Khalid)");

    // Update Khalid's profile weight to match latest check-in
    await prisma.traineeProfile.update({
      where: { id: khalidProfile.id },
      data: { currentWeightKg: 85.0, targetWeightKg: 80.0 },
    });
    console.log("Updated Khalid profile: 85.0kg current, 80.0kg target");
  }

  console.log("Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
