import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class SubmitCheckinDto {
  @ApiPropertyOptional({ example: 80.5 }) @IsOptional() @IsNumber() @Min(30) @Max(300) weightKg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(30) @Max(200) waistCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(30) @Max(200) chestCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(30) @Max(200) hipsCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(10) @Max(80) armsCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(20) @Max(100) thighsCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) sleepScore?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) energyScore?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) adherenceScore?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
