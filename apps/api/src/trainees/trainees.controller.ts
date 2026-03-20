import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TraineesService } from "./trainees.service";
import { OnboardDto } from "./dto/onboard.dto";
import { AssessmentDto } from "./dto/assessment.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CurrentUser, Roles } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { RoleKey } from "@ironcoach/db";

@ApiTags("Trainees")
@ApiBearerAuth()
@Controller("trainees")
@UseGuards(OrganizationGuard)
@Roles(RoleKey.TRAINEE)
export class TraineesController {
  constructor(private readonly traineesService: TraineesService) {}

  @Post("onboard")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Complete onboarding with body assessment" })
  @ApiResponse({ status: 200, description: "Onboarding complete with TDEE calculation" })
  async onboard(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: OnboardDto,
  ) {
    return this.traineesService.onboard(userId, orgId, dto);
  }

  @Get("me")
  @ApiOperation({ summary: "Get own trainee profile" })
  async getMyProfile(@CurrentUser("sub") userId: string) {
    return this.traineesService.getMyProfile(userId);
  }

  @Put("me")
  @ApiOperation({ summary: "Update personal info" })
  async updateProfile(
    @CurrentUser("sub") userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.traineesService.updateProfile(userId, dto);
  }

  @Post("me/assessment")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Submit body measurements" })
  @ApiResponse({ status: 201, description: "Assessment recorded" })
  async submitAssessment(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: AssessmentDto,
  ) {
    return this.traineesService.submitAssessment(userId, orgId, dto);
  }

  @Get("me/assessments")
  @ApiOperation({ summary: "Get assessment history" })
  async getAssessments(@CurrentUser("sub") userId: string) {
    return this.traineesService.getAssessments(userId);
  }

  @Get("me/progress")
  @ApiOperation({ summary: "Get progress trends" })
  async getProgress(@CurrentUser("sub") userId: string) {
    return this.traineesService.getProgress(userId);
  }
}
