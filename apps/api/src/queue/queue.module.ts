import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_URL
          ? new URL(process.env.REDIS_URL).hostname
          : "localhost",
        port: process.env.REDIS_URL
          ? parseInt(new URL(process.env.REDIS_URL).port || "6379")
          : 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue(
      { name: "notifications" },
      { name: "emails" },
      { name: "announcements" },
      { name: "webhooks" },
      { name: "upload-cleanup" },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
