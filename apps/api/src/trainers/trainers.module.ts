import { Module } from "@nestjs/common";
import { TrainersController } from "./trainers.controller";
import { TrainersService } from "./trainers.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [BillingModule],
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}
