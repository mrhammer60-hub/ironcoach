import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: "NewStrongPass1", minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  @Matches(/[0-9]/, { message: "Password must contain at least one digit" })
  password!: string;
}
