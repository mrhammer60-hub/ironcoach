import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum } from "class-validator";
import { RoleKey } from "@ironcoach/db";

export class InviteMemberDto {
  @ApiProperty({ example: "trainer@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: [RoleKey.TRAINER, RoleKey.ASSISTANT_TRAINER] })
  @IsEnum([RoleKey.TRAINER, RoleKey.ASSISTANT_TRAINER], {
    message: "Role must be TRAINER or ASSISTANT_TRAINER",
  })
  roleKey!: RoleKey;
}
