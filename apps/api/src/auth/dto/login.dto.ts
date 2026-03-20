import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "coach@ironcoach.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "StrongPass1" })
  @IsString()
  password!: string;
}
