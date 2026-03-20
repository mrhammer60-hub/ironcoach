import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class AddExerciseDto {
  @ApiProperty()
  @IsUUID()
  exerciseId!: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(20)
  sets!: number;

  @ApiProperty({ example: "8-10" })
  @IsString()
  @MaxLength(20)
  reps!: string;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(0)
  @Max(600)
  restSeconds!: number;

  @ApiPropertyOptional({ example: "3-1-1-0" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tempo?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rpe?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
