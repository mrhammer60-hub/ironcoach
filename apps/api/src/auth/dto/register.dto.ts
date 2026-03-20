import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "أحمد", minLength: 2 })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: "الخالدي", minLength: 2 })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({ example: "coach@ironcoach.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "StrongPass1", minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  @Matches(/[0-9]/, { message: "Password must contain at least one digit" })
  password!: string;

  @ApiPropertyOptional({ example: "+966501234567" })
  @IsOptional()
  @IsString()
  phone?: string;
}
