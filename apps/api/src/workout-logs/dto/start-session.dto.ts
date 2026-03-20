import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class StartSessionDto {
  @ApiProperty()
  @IsUUID()
  workoutDayId!: string;
}
