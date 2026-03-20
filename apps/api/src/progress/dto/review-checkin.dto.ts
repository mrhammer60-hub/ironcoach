import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class ReviewCheckinDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  coachResponse!: string;
}
