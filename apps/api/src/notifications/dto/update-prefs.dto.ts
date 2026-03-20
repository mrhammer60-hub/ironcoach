import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, Matches, Max, Min } from "class-validator";

export class UpdatePrefsDto {
  // Push toggles
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pushWorkoutAssigned?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pushMealPlanAssigned?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pushMessageReceived?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pushWorkoutCompleted?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pushCheckinReceived?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pushWeeklyReminder?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pushDailyWorkoutReminder?: boolean;

  // Email toggles
  @ApiPropertyOptional() @IsOptional() @IsBoolean() emailWorkoutAssigned?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() emailMealPlanAssigned?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() emailWeeklySummary?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() emailMarketingUpdates?: boolean;

  // Quiet hours
  @ApiPropertyOptional() @IsOptional() @IsBoolean() quietHoursEnabled?: boolean;
  @ApiPropertyOptional({ example: "22:00" })
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) quietHoursStart?: string;
  @ApiPropertyOptional({ example: "08:00" })
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) quietHoursEnd?: string;

  // Reminder scheduling
  @ApiPropertyOptional({ example: "08:00" })
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) workoutReminderTime?: string;
  @ApiPropertyOptional({ example: 1, description: "0=Sun, 1=Mon...6=Sat" })
  @IsOptional() @IsInt() @Min(0) @Max(6) weeklyCheckinDay?: number;
  @ApiPropertyOptional({ example: "08:00" })
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) weeklyCheckinTime?: string;
}
