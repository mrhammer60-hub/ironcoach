import type {
  RoleKey,
  GoalType,
  ActivityLevel,
  Gender,
  DifficultyLevel,
  MuscleGroup,
  SubscriptionStatus,
  ConversationType,
  MediaType,
  NotificationType,
  AssignmentStatus,
  PlanCode,
  TicketStatus,
  TicketPriority,
} from "./enums.types";

// ─── Core Identity ───────────────────────────────────────────────────────────

export interface UserEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  locale: string;
  emailVerifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  subdomain: string;
  customDomain: string | null;
  ownerUserId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMemberEntity {
  id: string;
  organizationId: string;
  userId: string;
  roleKey: RoleKey;
  invitedById: string | null;
  joinedAt: string;
  status: string;
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface TrainerProfileEntity {
  id: string;
  organizationId: string;
  userId: string;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  socialLinksJson: Record<string, string> | null;
}

export interface TraineeProfileEntity {
  id: string;
  organizationId: string;
  userId: string;
  assignedTrainerId: string | null;
  gender: Gender | null;
  birthDate: string | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  activityLevel: ActivityLevel | null;
  goal: GoalType | null;
  trainingDaysPerWeek: number | null;
  injuriesNotes: string | null;
  foodPreferences: string | null;
  allergies: string | null;
  onboardingCompletedAt: string | null;
}

// ─── Workouts ────────────────────────────────────────────────────────────────

export interface ExerciseEntity {
  id: string;
  nameEn: string;
  nameAr: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  difficultyLevel: DifficultyLevel;
  equipment: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  instructionsEn: string | null;
  instructionsAr: string | null;
  tipsEn: string | null;
  tipsAr: string | null;
  defaultSets: number;
  defaultReps: string;
  defaultRestSeconds: number;
  tempo: string | null;
  isGlobal: boolean;
}

export interface WorkoutProgramEntity {
  id: string;
  organizationId: string;
  trainerId: string;
  title: string;
  description: string | null;
  goal: GoalType | null;
  level: DifficultyLevel | null;
  durationWeeks: number;
  isTemplate: boolean;
  status: string;
}

export interface WorkoutDayExerciseEntity {
  id: string;
  workoutDayId: string;
  exerciseId: string;
  sortOrder: number;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo: string | null;
  rpe: number | null;
  notes: string | null;
}

// ─── Nutrition ───────────────────────────────────────────────────────────────

export interface FoodEntity {
  id: string;
  nameEn: string;
  nameAr: string;
  caloriesPer100g: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  fiberG: number | null;
  barcode: string | null;
  isVerified: boolean;
}

export interface NutritionPlanEntity {
  id: string;
  organizationId: string;
  trainerId: string;
  traineeProfileId: string | null;
  title: string;
  goal: GoalType | null;
  caloriesTarget: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  waterMl: number | null;
  notes: string | null;
  isActive: boolean;
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export interface ConversationEntity {
  id: string;
  organizationId: string;
  type: ConversationType;
  lastMessageAt: string | null;
}

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string | null;
  mediaUrl: string | null;
  mediaType: MediaType | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export interface PlanEntity {
  id: string;
  code: PlanCode;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  maxTrainees: number;
  featuresJson: Record<string, boolean>;
  isActive: boolean;
}

export interface SubscriptionEntity {
  id: string;
  organizationId: string;
  planId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
}

// ─── Progress ────────────────────────────────────────────────────────────────

export interface CheckinEntity {
  id: string;
  organizationId: string;
  traineeProfileId: string;
  trainerId: string;
  submittedAt: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  hipsCm: number | null;
  armsCm: number | null;
  thighsCm: number | null;
  sleepScore: number | null;
  energyScore: number | null;
  adherenceScore: number | null;
  notes: string | null;
  coachResponse: string | null;
  reviewedAt: string | null;
}

// ─── System ──────────────────────────────────────────────────────────────────

export interface NotificationEntity {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  dataJson: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface SupportTicketEntity {
  id: string;
  organizationId: string;
  openedByUserId: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAdminId: string | null;
  resolvedAt: string | null;
}
