import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WorkoutProgramsService } from "./workout-programs.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { AddWeekDto } from "./dto/add-week.dto";
import { AddDayDto } from "./dto/add-day.dto";
import { AddExerciseDto } from "./dto/add-exercise.dto";
import { UpdateDayExerciseDto } from "./dto/update-exercise.dto";
import { AssignProgramDto } from "./dto/assign-program.dto";
import { DuplicateProgramDto } from "./dto/duplicate-program.dto";
import { ApplyTemplateDto } from "./dto/apply-template.dto";
import { CurrentUser, Roles } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { RoleKey } from "@ironcoach/db";

@ApiTags("Workout Programs")
@ApiBearerAuth()
@Controller("workout-programs")
@UseGuards(OrganizationGuard)
export class WorkoutProgramsController {
  constructor(private readonly service: WorkoutProgramsService) {}

  @Post()
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Create workout program" })
  async create(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateProgramDto,
  ) {
    return this.service.create(orgId, userId, dto);
  }

  @Get()
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "List programs" })
  async list(@CurrentUser("orgId") orgId: string) {
    return this.service.list(orgId);
  }

  @Get("templates")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "List saved templates" })
  async listTemplates(@CurrentUser("orgId") orgId: string) {
    return this.service.listTemplates(orgId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get full program tree" })
  async getById(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.getById(id, orgId);
  }

  @Put(":id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Update program metadata" })
  async update(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: CreateProgramDto,
  ) {
    return this.service.update(id, orgId, dto);
  }

  @Delete(":id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Delete program (if not assigned)" })
  async remove(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.remove(id, orgId);
  }

  @Post(":id/weeks")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Add week to program" })
  async addWeek(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: AddWeekDto,
  ) {
    return this.service.addWeek(id, orgId, dto);
  }

  @Post(":id/weeks/:wId/days")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Add day to week" })
  async addDay(
    @Param("id") id: string,
    @Param("wId") weekId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: AddDayDto,
  ) {
    return this.service.addDay(id, weekId, orgId, dto);
  }

  @Post(":id/weeks/:wId/days/:dId/exercises")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Add exercise to day" })
  async addExercise(
    @Param("id") id: string,
    @Param("dId") dayId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: AddExerciseDto,
  ) {
    return this.service.addExerciseToDay(id, dayId, orgId, dto);
  }

  @Put(":id/weeks/:wId/days/:dId/exercises/:edId")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Update exercise in day" })
  async updateExercise(
    @Param("id") id: string,
    @Param("edId") edId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: UpdateDayExerciseDto,
  ) {
    return this.service.updateDayExercise(id, edId, orgId, dto);
  }

  @Delete(":id/weeks/:wId/days/:dId/exercises/:edId")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Remove exercise from day" })
  async removeExercise(
    @Param("id") id: string,
    @Param("edId") edId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.removeDayExercise(id, edId, orgId);
  }

  @Post(":id/assign")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Assign program to trainee" })
  async assign(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: AssignProgramDto,
  ) {
    return this.service.assignToTrainee(id, orgId, dto);
  }

  @Post(":id/duplicate")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Duplicate a program (deep copy)" })
  async duplicate(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: DuplicateProgramDto,
  ) {
    return this.service.duplicate(id, orgId, userId, dto);
  }

  @Post(":id/save-as-template")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Save program as reusable template" })
  async saveAsTemplate(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.saveAsTemplate(id, orgId);
  }

  @Post("templates/:id/apply")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Apply template to trainee (copy + assign)" })
  async applyTemplate(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: ApplyTemplateDto,
  ) {
    return this.service.applyTemplate(id, orgId, userId, dto);
  }
}
