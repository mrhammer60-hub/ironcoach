import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class AddDayDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  dayNumber!: number;

  @ApiPropertyOptional({ example: "Upper Body Push" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ example: "CHEST" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  focusArea?: string;
}
