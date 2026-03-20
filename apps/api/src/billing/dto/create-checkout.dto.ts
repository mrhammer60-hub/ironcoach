import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { PlanCode } from "@ironcoach/db";

export class CreateCheckoutDto {
  @ApiProperty({ enum: PlanCode, example: "STARTER" })
  @IsEnum(PlanCode)
  planCode!: PlanCode;
}
