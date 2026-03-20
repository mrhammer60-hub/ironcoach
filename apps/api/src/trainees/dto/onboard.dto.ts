import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { ActivityLevel, Gender, GoalType } from "@ironcoach/db";

export class OnboardDto {
  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: "1995-06-15" })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: 175 })
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm!: number;

  @ApiProperty({ example: 82 })
  @IsNumber()
  @Min(30)
  @Max(300)
  currentWeightKg!: number;

  @ApiPropertyOptional({ example: 78 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  targetWeightKg?: number;

  @ApiProperty({ enum: ActivityLevel })
  @IsEnum(ActivityLevel)
  activityLevel!: ActivityLevel;

  @ApiProperty({ enum: GoalType })
  @IsEnum(GoalType)
  goal!: GoalType;

  @ApiProperty({ example: 4, minimum: 1, maximum: 7 })
  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  injuriesNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  foodPreferences?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  allergies?: string;
}
