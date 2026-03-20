import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { WebhookService } from "./webhook.service";
import { SeatLimitGuard } from "./guards/seat-limit.guard";

@Module({
  controllers: [BillingController],
  providers: [BillingService, WebhookService, SeatLimitGuard],
  exports: [BillingService, SeatLimitGuard],
})
export class BillingModule {}
