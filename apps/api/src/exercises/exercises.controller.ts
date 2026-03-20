import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExercisesService } from "./exercises.service";
import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";
import { CurrentUser, Roles } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { RoleKey } from "@ironcoach/db";

@ApiTags("Exercises")
@ApiBearerAuth()
@Controller("exercises")
@UseGuards(OrganizationGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: "List exercises with filters" })
  async list(
    @CurrentUser("orgId") orgId: string,
    @Query("muscleGroup") muscleGroup?: string,
    @Query("difficulty") difficulty?: string,
    @Query("equipment") equipment?: string,
    @Query("search") search?: string,
    @Query("isGlobal") isGlobal?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.exercisesService.list(orgId, {
      muscleGroup,
      difficulty,
      equipment,
      search,
      isGlobal,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get exercise detail" })
  async getById(@Param("id") id: string) {
    return this.exercisesService.getById(id);
  }

  @Post()
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Create exercise" })
  async create(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: CreateExerciseDto,
  ) {
    return this.exercisesService.create(orgId, userId, dto);
  }

  @Put(":id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Update exercise" })
  async update(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.exercisesService.update(id, orgId, dto);
  }

  @Delete(":id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER, RoleKey.ADMIN)
  @ApiOperation({ summary: "Delete exercise" })
  async remove(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("role") role: string,
  ) {
    return this.exercisesService.remove(id, orgId, role);
  }

  @Get(":id/substitutes")
  @ApiOperation({ summary: "Get exercise substitutions" })
  async getSubstitutes(@Param("id") id: string) {
    return this.exercisesService.getSubstitutes(id);
  }
}
