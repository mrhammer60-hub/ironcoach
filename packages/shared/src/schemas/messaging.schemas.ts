import { z } from "zod";
import { MediaType } from "../types/enums.types";

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().max(5000).nullable().optional(),
  mediaUrl: z.string().url().nullable().optional(),
  mediaType: z
    .enum([
      MediaType.IMAGE,
      MediaType.VIDEO,
      MediaType.VOICE_NOTE,
      MediaType.FILE,
    ])
    .nullable()
    .optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const CreateConversationSchema = z.object({
  participantUserIds: z
    .array(z.string().uuid())
    .min(1, "يجب تحديد مشارك واحد على الأقل"),
});
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

export const MarkReadSchema = z.object({
  conversationId: z.string().uuid(),
});
export type MarkReadInput = z.infer<typeof MarkReadSchema>;
