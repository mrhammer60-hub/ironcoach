import { Module } from "@nestjs/common";
import { TraineesController } from "./trainees.controller";
import { TraineesService } from "./trainees.service";
import { CalorieCalculatorService } from "./calorie-calculator.service";

@Module({
  controllers: [TraineesController],
  providers: [TraineesService, CalorieCalculatorService],
  exports: [TraineesService, CalorieCalculatorService],
})
export class TraineesModule {}
