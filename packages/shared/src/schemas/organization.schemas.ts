import { z } from "zod";
import { RoleKey } from "../types/enums.types";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, "اسم المنظمة يجب أن يكون حرفين على الأقل").max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "الرابط يجب أن يحتوي على حروف صغيرة وأرقام وشرطات فقط",
    ),
});
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().nullable().optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "اللون يجب أن يكون بصيغة hex")
    .nullable()
    .optional(),
  customDomain: z.string().max(253).nullable().optional(),
});
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  roleKey: z.enum([
    RoleKey.TRAINER,
    RoleKey.ASSISTANT_TRAINER,
    RoleKey.TRAINEE,
  ]),
});
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
