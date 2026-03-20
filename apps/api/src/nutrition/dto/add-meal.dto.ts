import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class AddMealDto {
  @ApiProperty({ example: "Breakfast" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional({ example: "الفطور" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  titleAr?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  mealOrder!: number;

  @ApiPropertyOptional({ example: "08:00" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  timeSuggestion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
