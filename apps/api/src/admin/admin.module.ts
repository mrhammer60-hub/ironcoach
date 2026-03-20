import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { ImpersonationService } from "./impersonation.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, ImpersonationService],
})
export class AdminModule {}
