import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class AssignPlanDto {
  @ApiProperty()
  @IsUUID()
  traineeProfileId!: string;

  @ApiProperty({ example: "2026-03-20" })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
