import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class LogMealDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  nutritionPlanMealId?: string;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @Min(0)
  calories!: number;

  @ApiProperty({ example: 35 })
  @IsNumber()
  @Min(0)
  proteinG!: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  carbsG!: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0)
  fatsG!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
