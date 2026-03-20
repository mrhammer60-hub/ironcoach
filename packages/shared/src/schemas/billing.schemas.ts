import { z } from "zod";
import { PlanCode } from "../types/enums.types";

export const CreateCheckoutSchema = z.object({
  planCode: z.enum([PlanCode.STARTER, PlanCode.GROWTH, PlanCode.PRO]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});
export type CreateCheckoutInput = z.infer<typeof CreateCheckoutSchema>;

export const UpgradePlanSchema = z.object({
  planCode: z.enum([PlanCode.STARTER, PlanCode.GROWTH, PlanCode.PRO]),
});
export type UpgradePlanInput = z.infer<typeof UpgradePlanSchema>;

export const CancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
});
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>;
