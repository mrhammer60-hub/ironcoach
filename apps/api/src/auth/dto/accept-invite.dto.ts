import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class AcceptInviteDto {
  @ApiProperty({ description: "Invite token from the invite link" })
  @IsString()
  token!: string;

  @ApiProperty({ example: "StrongPass1", minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  @Matches(/[0-9]/, { message: "Password must contain at least one digit" })
  password!: string;

  @ApiProperty({ example: "أحمد", minLength: 2 })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: "الخالدي", minLength: 2 })
  @IsString()
  @MinLength(2)
  lastName!: string;
}
