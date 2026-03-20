import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class AssessmentDto {
  @ApiProperty({ example: 80.5 })
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg!: number;

  @ApiPropertyOptional({ example: 18.5 })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(60)
  bodyFatPercentage?: number;

  @ApiPropertyOptional({ example: 82 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(200)
  waistCm?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(200)
  chestCm?: number;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(200)
  hipsCm?: number;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(80)
  armsCm?: number;

  @ApiPropertyOptional({ example: 58 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(100)
  thighsCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
