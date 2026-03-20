import { z } from "zod";
import { TicketPriority, TicketStatus } from "../types/enums.types";

export const AnnouncementSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(1).max(5000),
  targetOrganizationIds: z.array(z.string().uuid()).optional(),
});
export type AnnouncementInput = z.infer<typeof AnnouncementSchema>;

export const SuspendOrgSchema = z.object({
  organizationId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});
export type SuspendOrgInput = z.infer<typeof SuspendOrgSchema>;

export const UpdateTicketSchema = z.object({
  status: z
    .enum([
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.RESOLVED,
      TicketStatus.CLOSED,
    ])
    .optional(),
  priority: z
    .enum([
      TicketPriority.LOW,
      TicketPriority.NORMAL,
      TicketPriority.HIGH,
      TicketPriority.URGENT,
    ])
    .optional(),
  assignedAdminId: z.string().uuid().nullable().optional(),
});
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;

export const ToggleFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100),
  isEnabled: z.boolean(),
  rulesJson: z.record(z.unknown()).nullable().optional(),
});
export type ToggleFeatureFlagInput = z.infer<typeof ToggleFeatureFlagSchema>;

export const ImpersonateSchema = z.object({
  userId: z.string().uuid(),
});
export type ImpersonateInput = z.infer<typeof ImpersonateSchema>;
