import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: "coach@ironcoach.com" })
  @IsEmail()
  email!: string;
}
