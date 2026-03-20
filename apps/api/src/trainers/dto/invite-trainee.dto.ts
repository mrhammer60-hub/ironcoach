import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class InviteTraineeDto {
  @ApiProperty({ example: "trainee@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "أحمد" })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: "الخالدي" })
  @IsString()
  @MinLength(2)
  lastName!: string;
}
