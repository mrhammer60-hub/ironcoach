import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class AddWeekDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  weekNumber!: number;

  @ApiPropertyOptional({ example: "Week 1 — Foundation" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}
