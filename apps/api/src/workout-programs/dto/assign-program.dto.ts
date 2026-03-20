import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class AssignProgramDto {
  @ApiProperty()
  @IsUUID()
  traineeProfileId!: string;

  @ApiProperty({ example: "2026-03-20" })
  @IsDateString()
  startsOn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsOn?: string;
}
