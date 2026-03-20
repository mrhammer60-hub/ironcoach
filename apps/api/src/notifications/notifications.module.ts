import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { ExpoPushService } from "./expo-push.service";
import { CheckinReminderJob } from "./jobs/checkin-reminder.job";
import { SubscriptionReminderJob } from "./jobs/subscription-reminder.job";

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ExpoPushService,
    CheckinReminderJob,
    SubscriptionReminderJob,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
