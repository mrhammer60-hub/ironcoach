import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class SetEntryDto {
  @ApiProperty()
  @IsUUID()
  exerciseId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  setNumber!: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  repsCompleted!: number;

  @ApiPropertyOptional({ example: 80.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rpe?: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  isCompleted!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}

export class LogSetsDto {
  @ApiProperty({ type: [SetEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetEntryDto)
  sets!: SetEntryDto[];
}
