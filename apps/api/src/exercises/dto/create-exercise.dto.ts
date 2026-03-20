import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { DifficultyLevel, MuscleGroup } from "@ironcoach/db";

export class CreateExerciseDto {
  @ApiProperty({ example: "Barbell Bench Press" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameEn!: string;

  @ApiProperty({ example: "ضغط البنش بالبار" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameAr!: string;

  @ApiProperty({ enum: MuscleGroup })
  @IsEnum(MuscleGroup)
  muscleGroup!: MuscleGroup;

  @ApiPropertyOptional({ example: ["TRICEPS", "SHOULDERS"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryMuscles?: string[];

  @ApiProperty({ enum: DifficultyLevel })
  @IsEnum(DifficultyLevel)
  difficultyLevel!: DifficultyLevel;

  @ApiPropertyOptional({ example: "Barbell, Bench" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  equipment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructionsEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructionsAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  tipsEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  tipsAr?: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(20)
  defaultSets!: number;

  @ApiProperty({ example: "8-10" })
  @IsString()
  @MaxLength(20)
  defaultReps!: string;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(0)
  @Max(600)
  defaultRestSeconds!: number;

  @ApiPropertyOptional({ example: "3-1-1-0" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tempo?: string;
}
