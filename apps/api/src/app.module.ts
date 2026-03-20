import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { BillingModule } from "./billing/billing.module";
import { TrainersModule } from "./trainers/trainers.module";
import { TraineesModule } from "./trainees/trainees.module";
import { ExercisesModule } from "./exercises/exercises.module";
import { WorkoutProgramsModule } from "./workout-programs/workout-programs.module";
import { WorkoutLogsModule } from "./workout-logs/workout-logs.module";
import { NutritionModule } from "./nutrition/nutrition.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ChatModule } from "./chat/chat.module";
import { UploadModule } from "./common/services/upload.module";
import { QueueModule } from "./queue/queue.module";
import { AdminModule } from "./admin/admin.module";
import { EmailModule } from "./emails/email.module";
import { ProgressModule } from "./progress/progress.module";
import { AiModule } from "./ai/ai.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";
import { AuditLogInterceptor } from "./common/interceptors/audit-log.interceptor";
import { SanitizeLogInterceptor } from "./common/interceptors/sanitize-log.interceptor";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 10 },
      { name: "medium", ttl: 60000, limit: 100 },
      { name: "long", ttl: 3600000, limit: 1000 },
    ]),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    BillingModule,
    TrainersModule,
    TraineesModule,
    ExercisesModule,
    WorkoutProgramsModule,
    WorkoutLogsModule,
    NutritionModule,
    NotificationsModule,
    ChatModule,
    UploadModule,
    QueueModule,
    AdminModule,
    EmailModule,
    ProgressModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    // Global JWT guard — use @Public() to skip
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global roles guard — use @Roles() to restrict
    { provide: APP_GUARD, useClass: RolesGuard },
    // Global rate limiting
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global exception filter for Prisma errors
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    // Wrap all responses in { success, data, meta }
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
    // Audit log for mutating requests
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    // Sanitize sensitive data from logs
    { provide: APP_INTERCEPTOR, useClass: SanitizeLogInterceptor },
  ],
})
export class AppModule {}
