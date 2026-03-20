import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";
import { GoalType } from "@ironcoach/db";

export class CreatePlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  traineeProfileId?: string;

  @ApiProperty({ example: "Lean Cut Plan" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional({ enum: GoalType })
  @IsOptional()
  @IsEnum(GoalType)
  goal?: GoalType;

  @ApiProperty({ example: 2200 })
  @IsInt()
  @Min(800)
  @Max(8000)
  caloriesTarget!: number;

  @ApiProperty({ example: 165 })
  @IsInt()
  @Min(0)
  proteinG!: number;

  @ApiProperty({ example: 220 })
  @IsInt()
  @Min(0)
  carbsG!: number;

  @ApiProperty({ example: 65 })
  @IsInt()
  @Min(0)
  fatsG!: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  waterMl?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
