import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class RegisterTokenDto {
  @ApiProperty({ example: "ExponentPushToken[xxxxxx]" })
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiProperty({ example: "ios", enum: ["ios", "android", "web"] })
  @IsString()
  platform!: string;
}
