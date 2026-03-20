import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsUUID } from "class-validator";

export class ApplyTemplateDto {
  @ApiProperty()
  @IsUUID()
  traineeProfileId!: string;

  @ApiProperty({ example: "2026-03-20" })
  @IsDateString()
  startDate!: string;
}
