import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WorkoutLogsService } from "./workout-logs.service";
import { StartSessionDto } from "./dto/start-session.dto";
import { LogSetsDto } from "./dto/log-sets.dto";
import { CompleteSessionDto } from "./dto/complete-session.dto";
import { CurrentUser, Roles } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { RoleKey } from "@ironcoach/db";

@ApiTags("Workout Logs")
@ApiBearerAuth()
@Controller("workout-logs")
@UseGuards(OrganizationGuard)
export class WorkoutLogsController {
  constructor(private readonly service: WorkoutLogsService) {}

  @Post()
  @Roles(RoleKey.TRAINEE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Start a workout session" })
  async startSession(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: StartSessionDto,
  ) {
    return this.service.startSession(userId, orgId, dto);
  }

  @Get("today")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Get today's assigned workout" })
  async getTodayWorkout(@CurrentUser("sub") userId: string) {
    return this.service.getTodayWorkout(userId);
  }

  @Get("me")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Get own workout log history" })
  async getMyLogs(@CurrentUser("sub") userId: string) {
    return this.service.getMyLogs(userId);
  }

  @Put(":id/sets")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Log set data" })
  async logSets(
    @Param("id") id: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: LogSetsDto,
  ) {
    return this.service.logSets(id, userId, dto);
  }

  @Put(":id/complete")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Mark workout session as complete" })
  async completeSession(
    @Param("id") id: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.service.completeSession(id, userId, dto);
  }

  @Get("trainee/:traineeId")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Coach views trainee workout logs" })
  async getTraineeLogs(
    @Param("traineeId") traineeId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.getTraineeLogs(traineeId, orgId);
  }
}
