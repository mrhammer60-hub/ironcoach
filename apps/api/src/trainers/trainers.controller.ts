import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TrainersService } from "./trainers.service";
import { InviteTraineeDto } from "./dto/invite-trainee.dto";
import { CurrentUser, Roles } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { SeatLimitGuard } from "../billing/guards/seat-limit.guard";
import { RoleKey } from "@ironcoach/db";

@ApiTags("Trainers")
@ApiBearerAuth()
@Controller("trainers")
@UseGuards(OrganizationGuard)
@Roles(RoleKey.OWNER, RoleKey.TRAINER)
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Coach dashboard stats" })
  async getDashboard(@CurrentUser("orgId") orgId: string) {
    return this.trainersService.getDashboard(orgId);
  }

  @Get("trainees")
  @ApiOperation({ summary: "List trainees with filters" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "goal", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getTrainees(
    @CurrentUser("orgId") orgId: string,
    @Query("status") status?: string,
    @Query("goal") goal?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.trainersService.getTrainees(orgId, {
      status,
      goal,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post("trainees/invite")
  @UseGuards(SeatLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Invite a trainee (seat limit enforced)" })
  @ApiResponse({ status: 201, description: "Trainee invited" })
  @ApiResponse({ status: 402, description: "Seat limit reached" })
  @ApiResponse({ status: 409, description: "Already a member" })
  async inviteTrainee(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: InviteTraineeDto,
  ) {
    return this.trainersService.inviteTrainee(orgId, userId, dto);
  }

  @Get("trainees/:id")
  @ApiOperation({ summary: "Get trainee detail" })
  async getTrainee(
    @CurrentUser("orgId") orgId: string,
    @Param("id") id: string,
  ) {
    return this.trainersService.getTrainee(orgId, id);
  }

  @Delete("trainees/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove trainee (soft delete)" })
  async removeTrainee(
    @CurrentUser("orgId") orgId: string,
    @Param("id") id: string,
  ) {
    return this.trainersService.removeTrainee(orgId, id);
  }
}
