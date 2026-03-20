import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class SuspendOrgDto {
  @ApiPropertyOptional({ example: "Violation of terms of service" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class DeleteOrgDto {
  @ApiPropertyOptional({ example: "DELETE Ahmed Fitness" })
  @IsString()
  confirmationPhrase!: string;
}
