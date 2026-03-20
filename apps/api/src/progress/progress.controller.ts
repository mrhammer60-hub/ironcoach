import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProgressService } from "./progress.service";
import { SubmitCheckinDto } from "./dto/submit-checkin.dto";
import { ReviewCheckinDto } from "./dto/review-checkin.dto";
import { CurrentUser, Roles } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { RoleKey } from "@ironcoach/db";

@ApiTags("Progress")
@ApiBearerAuth()
@Controller("progress")
@UseGuards(OrganizationGuard)
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Post("checkins")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Submit weekly check-in" })
  async submitCheckin(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: SubmitCheckinDto,
  ) {
    return this.service.submitCheckin(userId, orgId, dto);
  }

  @Get("checkins/me")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Own check-in history" })
  async getMyCheckins(@CurrentUser("sub") userId: string) {
    return this.service.getMyCheckins(userId);
  }

  @Get("checkins/pending")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Pending check-ins for review" })
  async getPendingCheckins(@CurrentUser("orgId") orgId: string) {
    return this.service.getPendingCheckins(orgId);
  }

  @Get("checkins/:id")
  @ApiOperation({ summary: "Single check-in detail" })
  async getCheckinById(@Param("id") id: string) {
    return this.service.getCheckinById(id);
  }

  @Put("checkins/:id/review")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Add coach response to check-in" })
  async reviewCheckin(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: ReviewCheckinDto,
  ) {
    return this.service.reviewCheckin(id, orgId, dto);
  }

  @Post("photos/upload-url")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Get presigned URLs for progress photos" })
  async getPhotoUploadUrls(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.getPhotoUploadUrls(userId, orgId);
  }

  @Post("photos")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Save progress photo records" })
  async savePhotos(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() body: { photos: Array<{ photoType: string; imageUrl: string; checkinId?: string }> },
  ) {
    return this.service.savePhotos(userId, orgId, body.photos);
  }

  @Get("photos/me")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Own photo history" })
  async getMyPhotos(@CurrentUser("sub") userId: string) {
    return this.service.getMyPhotos(userId);
  }

  @Get("trainee/:traineeId")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Full progress overview for a trainee" })
  async getTraineeProgress(
    @Param("traineeId") traineeId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.getTraineeProgress(traineeId, orgId);
  }
}
