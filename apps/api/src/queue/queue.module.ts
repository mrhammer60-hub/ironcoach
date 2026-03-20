import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

const hasRedis = !!process.env.REDIS_URL;

const bullImports = hasRedis
  ? [
      BullModule.forRoot({
        connection: {
          host: new URL(process.env.REDIS_URL!).hostname,
          port: parseInt(new URL(process.env.REDIS_URL!).port || "6379"),
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
    ]
  : [];

@Module({
  imports: bullImports,
  exports: hasRedis ? [BullModule] : [],
})
export class QueueModule {}
