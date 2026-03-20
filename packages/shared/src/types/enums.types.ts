export const RoleKey = {
  OWNER: "OWNER",
  TRAINER: "TRAINER",
  ASSISTANT_TRAINER: "ASSISTANT_TRAINER",
  TRAINEE: "TRAINEE",
  ADMIN: "ADMIN",
} as const;
export type RoleKey = (typeof RoleKey)[keyof typeof RoleKey];

export const ConversationType = {
  TRAINER_TRAINEE: "TRAINER_TRAINEE",
  SUPPORT: "SUPPORT",
} as const;
export type ConversationType =
  (typeof ConversationType)[keyof typeof ConversationType];

export const SubscriptionStatus = {
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
  INCOMPLETE: "INCOMPLETE",
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PlanCode = {
  STARTER: "STARTER",
  GROWTH: "GROWTH",
  PRO: "PRO",
} as const;
export type PlanCode = (typeof PlanCode)[keyof typeof PlanCode];

export const GoalType = {
  MUSCLE_GAIN: "MUSCLE_GAIN",
  FAT_LOSS: "FAT_LOSS",
  BULK: "BULK",
  LEAN_CUT: "LEAN_CUT",
  GENERAL_FITNESS: "GENERAL_FITNESS",
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const ActivityLevel = {
  SEDENTARY: "SEDENTARY",
  LIGHTLY_ACTIVE: "LIGHTLY_ACTIVE",
  MODERATELY_ACTIVE: "MODERATELY_ACTIVE",
  VERY_ACTIVE: "VERY_ACTIVE",
  EXTRA_ACTIVE: "EXTRA_ACTIVE",
} as const;
export type ActivityLevel = (typeof ActivityLevel)[keyof typeof ActivityLevel];

export const DifficultyLevel = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
} as const;
export type DifficultyLevel =
  (typeof DifficultyLevel)[keyof typeof DifficultyLevel];

export const MuscleGroup = {
  CHEST: "CHEST",
  BACK: "BACK",
  LEGS: "LEGS",
  SHOULDERS: "SHOULDERS",
  BICEPS: "BICEPS",
  TRICEPS: "TRICEPS",
  CORE: "CORE",
  GLUTES: "GLUTES",
} as const;
export type MuscleGroup = (typeof MuscleGroup)[keyof typeof MuscleGroup];

export const MediaType = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  VOICE_NOTE: "VOICE_NOTE",
  FILE: "FILE",
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const NotificationType = {
  WORKOUT_ASSIGNED: "WORKOUT_ASSIGNED",
  MEAL_PLAN_ASSIGNED: "MEAL_PLAN_ASSIGNED",
  WORKOUT_COMPLETED: "WORKOUT_COMPLETED",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  CHECKIN_REMINDER: "CHECKIN_REMINDER",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PLAN_EXPIRING: "PLAN_EXPIRING",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const AssignmentStatus = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  PAUSED: "PAUSED",
} as const;
export type AssignmentStatus =
  (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const TicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type TicketPriority =
  (typeof TicketPriority)[keyof typeof TicketPriority];
