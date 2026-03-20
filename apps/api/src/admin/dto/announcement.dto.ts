import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class AnnouncementDto {
  @ApiProperty({
    enum: ["all_coaches", "all_trainees", "all_users", "plan_STARTER", "plan_GROWTH", "plan_PRO"],
  })
  @IsString()
  target!: string;

  @ApiProperty({ example: "تحديث جديد 🎉" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: "تم إضافة ميزة جديدة..." })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  sendPush!: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  sendEmail!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emailSubject?: string;
}
