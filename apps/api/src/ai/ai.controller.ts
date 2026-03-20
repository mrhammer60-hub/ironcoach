import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { CurrentUser } from "../common/decorators";

@ApiTags("AI")
@ApiBearerAuth()
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("generate-workout")
  @ApiOperation({ summary: "Generate workout program suggestion for trainee" })
  async generateWorkout(
    @Body() body: { traineeProfileId: string },
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.aiService.generateWorkoutProgram(body.traineeProfileId, orgId);
  }

  @Post("generate-nutrition")
  @ApiOperation({ summary: "Generate nutrition plan suggestion for trainee" })
  async generateNutrition(
    @Body() body: { traineeProfileId: string },
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.aiService.generateNutritionPlan(body.traineeProfileId, orgId);
  }

  @Get("insights/:traineeProfileId")
  @ApiOperation({ summary: "Get AI-powered insights for a trainee" })
  async getInsights(
    @Param("traineeProfileId") traineeProfileId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.aiService.getTraineeInsights(traineeProfileId, orgId);
  }
}
