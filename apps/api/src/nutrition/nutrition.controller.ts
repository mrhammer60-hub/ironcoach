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
import { NutritionService } from "./nutrition.service";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { AssignPlanDto } from "./dto/assign-plan.dto";
import { AddMealDto } from "./dto/add-meal.dto";
import { UpdateMealDto } from "./dto/update-meal.dto";
import { AddMealItemDto } from "./dto/add-meal-item.dto";
import { UpdateMealItemDto } from "./dto/update-meal-item.dto";
import { LogMealDto } from "./dto/log-meal.dto";
import { CurrentUser, Roles } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { RoleKey } from "@ironcoach/db";

@ApiTags("Nutrition")
@ApiBearerAuth()
@Controller("nutrition")
@UseGuards(OrganizationGuard)
export class NutritionController {
  constructor(private readonly service: NutritionService) {}

  // ─── Plans ────────────────────────────────────────────────────────────────

  @Get("plans")
  @ApiOperation({ summary: "List nutrition plans" })
  async listPlans(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("role") role: string,
    @CurrentUser("sub") userId: string,
  ) {
    return this.service.listPlans(orgId, role, userId);
  }

  @Post("plans")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Create nutrition plan" })
  async createPlan(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: CreatePlanDto,
  ) {
    return this.service.createPlan(orgId, userId, dto);
  }

  @Get("plans/:id")
  @ApiOperation({ summary: "Get plan with meals + items" })
  async getPlan(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.getPlanById(id, orgId);
  }

  @Put("plans/:id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Update plan macro targets" })
  async updatePlan(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.service.updatePlan(id, orgId, dto);
  }

  @Delete("plans/:id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Delete plan (if not assigned)" })
  async deletePlan(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.deletePlan(id, orgId);
  }

  @Post("plans/:id/assign")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Assign plan to trainee" })
  async assignPlan(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: AssignPlanDto,
  ) {
    return this.service.assignPlan(id, orgId, dto);
  }

  @Post("plans/:id/duplicate")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Duplicate nutrition plan" })
  async duplicatePlan(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Body() body: { title?: string },
  ) {
    return this.service.duplicatePlan(id, orgId, userId, body.title);
  }

  // ─── Meals ────────────────────────────────────────────────────────────────

  @Post("plans/:id/meals")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Add meal to plan" })
  async addMeal(
    @Param("id") id: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: AddMealDto,
  ) {
    return this.service.addMeal(id, orgId, dto);
  }

  @Put("meals/:id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Update meal" })
  async updateMeal(@Param("id") id: string, @Body() dto: UpdateMealDto) {
    return this.service.updateMeal(id, dto);
  }

  @Delete("meals/:id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Remove meal" })
  async deleteMeal(@Param("id") id: string) {
    return this.service.deleteMeal(id);
  }

  // ─── Meal Items ───────────────────────────────────────────────────────────

  @Post("meals/:id/items")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Add food item to meal" })
  async addMealItem(@Param("id") id: string, @Body() dto: AddMealItemDto) {
    return this.service.addMealItem(id, dto);
  }

  @Put("meal-items/:id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Update meal item quantity" })
  async updateMealItem(
    @Param("id") id: string,
    @Body() dto: UpdateMealItemDto,
  ) {
    return this.service.updateMealItem(id, dto);
  }

  @Delete("meal-items/:id")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @ApiOperation({ summary: "Remove meal item" })
  async deleteMealItem(@Param("id") id: string) {
    return this.service.deleteMealItem(id);
  }

  // ─── Today + Foods + Logs ─────────────────────────────────────────────────

  @Get("today")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Today's plan + macro totals" })
  async getToday(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.getToday(userId, orgId);
  }

  @Get("foods")
  @ApiOperation({ summary: "Search food database" })
  async searchFoods(
    @Query("search") search?: string,
    @Query("barcode") barcode?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.searchFoods({
      search,
      barcode,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post("logs")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Log a meal" })
  async logMeal(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
    @Body() dto: LogMealDto,
  ) {
    return this.service.logMeal(userId, orgId, dto);
  }

  @Get("logs")
  @Roles(RoleKey.TRAINEE)
  @ApiOperation({ summary: "Own meal logs (today)" })
  async getMealLogs(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.service.getMealLogs(userId, orgId);
  }

  // ─── External Food Search (USDA) ────────────────────────────────────────

  @Get("foods/search-external")
  @ApiOperation({ summary: "Search USDA food database" })
  async searchExternalFoods(@Query("q") query: string) {
    if (!query || query.length < 2) return [];
    return this.service.searchExternalFoods(query);
  }

  @Post("foods/import-external")
  @ApiOperation({ summary: "Import food from USDA database" })
  async importExternalFood(@Body() body: { fdcId: string; nameAr: string }) {
    return this.service.importExternalFood(body.fdcId, body.nameAr);
  }
}
