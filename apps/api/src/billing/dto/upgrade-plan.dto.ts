import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { PlanCode } from "@ironcoach/db";

export class UpgradePlanDto {
  @ApiProperty({ enum: PlanCode, example: "GROWTH" })
  @IsEnum(PlanCode)
  planCode!: PlanCode;
}
