import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { AssignPlanDto } from "./dto/assign-plan.dto";
import { AddMealDto } from "./dto/add-meal.dto";
import { UpdateMealDto } from "./dto/update-meal.dto";
import { AddMealItemDto } from "./dto/add-meal-item.dto";
import { UpdateMealItemDto } from "./dto/update-meal-item.dto";
import { LogMealDto } from "./dto/log-meal.dto";
import { AssignmentStatus } from "@ironcoach/db";
import { getTodayInTimezone } from "@ironcoach/shared";

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Plans ──────────────────────────────────────────────────────────────────

  async listPlans(orgId: string, role: string, userId: string): Promise<any> {
    if (role === "TRAINEE") {
      const profile = await this.prisma.traineeProfile.findUnique({
        where: { userId },
      });
      if (!profile) throw new NotFoundException("Trainee profile not found");

      return this.prisma.nutritionPlan.findMany({
        where: { organizationId: orgId, traineeProfileId: profile.id, isActive: true },
        include: { _count: { select: { meals: true } } },
        orderBy: { createdAt: "desc" },
      });
    }

    return this.prisma.nutritionPlan.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { meals: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createPlan(orgId: string, trainerId: string, dto: CreatePlanDto): Promise<any> {
    return this.prisma.nutritionPlan.create({
      data: {
        organizationId: orgId,
        trainerId,
        traineeProfileId: dto.traineeProfileId ?? null,
        title: dto.title,
        goal: dto.goal ?? null,
        caloriesTarget: dto.caloriesTarget,
        proteinG: dto.proteinG,
        carbsG: dto.carbsG,
        fatsG: dto.fatsG,
        waterMl: dto.waterMl ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async getPlanById(id: string, orgId: string): Promise<any> {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { id, organizationId: orgId },
      include: {
        meals: {
          orderBy: { mealOrder: "asc" },
          include: {
            items: {
              include: {
                food: {
                  select: { id: true, nameEn: true, nameAr: true },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            traineeProfile: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    if (!plan) throw new NotFoundException("Nutrition plan not found");
    return plan;
  }

  async updatePlan(id: string, orgId: string, dto: UpdatePlanDto): Promise<any> {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!plan) throw new NotFoundException("Nutrition plan not found");

    return this.prisma.nutritionPlan.update({ where: { id }, data: dto });
  }

  async deletePlan(id: string, orgId: string) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { id, organizationId: orgId },
      include: { _count: { select: { assignments: true } } },
    });
    if (!plan) throw new NotFoundException("Nutrition plan not found");
    if (plan._count.assignments > 0) {
      throw new BadRequestException("Cannot delete a plan with active assignments");
    }

    await this.prisma.nutritionPlan.delete({ where: { id } });
    return { message: "Plan deleted" };
  }

  async assignPlan(planId: string, orgId: string, dto: AssignPlanDto) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { id: planId, organizationId: orgId },
    });
    if (!plan) throw new NotFoundException("Nutrition plan not found");

    const trainee = await this.prisma.traineeProfile.findFirst({
      where: { id: dto.traineeProfileId, organizationId: orgId },
    });
    if (!trainee) throw new ForbiddenException("Trainee not in your organization");

    // Deactivate existing active nutrition assignments
    await this.prisma.traineeNutritionAssignment.updateMany({
      where: { traineeProfileId: dto.traineeProfileId, status: AssignmentStatus.ACTIVE },
      data: { status: AssignmentStatus.COMPLETED },
    });

    const assignment = await this.prisma.traineeNutritionAssignment.create({
      data: {
        organizationId: orgId,
        traineeProfileId: dto.traineeProfileId,
        nutritionPlanId: planId,
        startsOn: new Date(dto.startDate),
        endsOn: dto.endDate ? new Date(dto.endDate) : null,
        status: AssignmentStatus.ACTIVE,
      },
    });

    this.logger.log(
      `TODO [Step 09]: Push notification to trainee: "وصلتك خطة غذائية جديدة 🥗"`,
    );

    return assignment;
  }

  async duplicatePlan(planId: string, orgId: string, trainerId: string, title?: string): Promise<any> {
    const original = await this.prisma.nutritionPlan.findFirst({
      where: { id: planId, organizationId: orgId },
      include: { meals: { include: { items: true }, orderBy: { mealOrder: "asc" } } },
    });

    if (!original) throw new NotFoundException("Nutrition plan not found");

    return this.prisma.$transaction(async (tx) => {
      const newPlan = await tx.nutritionPlan.create({
        data: {
          organizationId: orgId,
          trainerId,
          title: title ?? `${original.title} (نسخة)`,
          goal: original.goal,
          caloriesTarget: original.caloriesTarget,
          proteinG: original.proteinG,
          carbsG: original.carbsG,
          fatsG: original.fatsG,
          waterMl: original.waterMl,
          notes: original.notes,
        },
      });

      for (const meal of original.meals) {
        const newMeal = await tx.nutritionPlanMeal.create({
          data: {
            nutritionPlanId: newPlan.id,
            title: meal.title,
            titleAr: meal.titleAr,
            mealOrder: meal.mealOrder,
            timeSuggestion: meal.timeSuggestion,
            calories: meal.calories,
            proteinG: meal.proteinG,
            carbsG: meal.carbsG,
            fatsG: meal.fatsG,
            notes: meal.notes,
          },
        });

        if (meal.items.length > 0) {
          await tx.nutritionPlanMealItem.createMany({
            data: meal.items.map((item) => ({
              nutritionPlanMealId: newMeal.id,
              foodId: item.foodId,
              customFoodName: item.customFoodName,
              quantityGrams: item.quantityGrams,
              calories: item.calories,
              proteinG: item.proteinG,
              carbsG: item.carbsG,
              fatsG: item.fatsG,
            })),
          });
        }
      }

      return newPlan;
    });
  }

  // ─── Meals ──────────────────────────────────────────────────────────────────

  async addMeal(planId: string, orgId: string, dto: AddMealDto): Promise<any> {
    await this.ensurePlanOwnership(planId, orgId);
    return this.prisma.nutritionPlanMeal.create({
      data: {
        nutritionPlanId: planId,
        title: dto.title,
        titleAr: dto.titleAr ?? null,
        mealOrder: dto.mealOrder,
        timeSuggestion: dto.timeSuggestion ?? null,
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatsG: 0,
        notes: dto.notes ?? null,
      },
    });
  }

  async updateMeal(mealId: string, dto: UpdateMealDto): Promise<any> {
    return this.prisma.nutritionPlanMeal.update({
      where: { id: mealId },
      data: dto,
    });
  }

  async deleteMeal(mealId: string) {
    await this.prisma.nutritionPlanMeal.delete({ where: { id: mealId } });
    return { message: "Meal removed" };
  }

  // ─── Meal Items ─────────────────────────────────────────────────────────────

  async addMealItem(mealId: string, dto: AddMealItemDto): Promise<any> {
    let calories = 0, proteinG = 0, carbsG = 0, fatsG = 0;

    if (dto.foodId) {
      const food = await this.prisma.food.findUnique({ where: { id: dto.foodId } });
      if (!food) throw new NotFoundException("Food not found");

      const factor = dto.quantityGrams / 100;
      calories = Math.round(Number(food.caloriesPer100g) * factor);
      proteinG = Math.round(Number(food.proteinG) * factor * 10) / 10;
      carbsG = Math.round(Number(food.carbsG) * factor * 10) / 10;
      fatsG = Math.round(Number(food.fatsG) * factor * 10) / 10;
    }

    const item = await this.prisma.nutritionPlanMealItem.create({
      data: {
        nutritionPlanMealId: mealId,
        foodId: dto.foodId ?? null,
        customFoodName: dto.customFoodName ?? null,
        quantityGrams: dto.quantityGrams,
        calories,
        proteinG,
        carbsG,
        fatsG,
      },
    });

    await this.recalculateMealTotals(mealId);
    return item;
  }

  async updateMealItem(itemId: string, dto: UpdateMealItemDto): Promise<any> {
    const existing = await this.prisma.nutritionPlanMealItem.findUnique({
      where: { id: itemId },
      include: { food: true },
    });
    if (!existing) throw new NotFoundException("Meal item not found");

    let calories = Number(existing.calories);
    let proteinG = Number(existing.proteinG);
    let carbsG = Number(existing.carbsG);
    let fatsG = Number(existing.fatsG);

    if (existing.food) {
      const factor = dto.quantityGrams / 100;
      calories = Math.round(Number(existing.food.caloriesPer100g) * factor);
      proteinG = Math.round(Number(existing.food.proteinG) * factor * 10) / 10;
      carbsG = Math.round(Number(existing.food.carbsG) * factor * 10) / 10;
      fatsG = Math.round(Number(existing.food.fatsG) * factor * 10) / 10;
    }

    const updated = await this.prisma.nutritionPlanMealItem.update({
      where: { id: itemId },
      data: { quantityGrams: dto.quantityGrams, calories, proteinG, carbsG, fatsG },
    });

    await this.recalculateMealTotals(existing.nutritionPlanMealId);
    return updated;
  }

  async deleteMealItem(itemId: string) {
    const item = await this.prisma.nutritionPlanMealItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException("Meal item not found");

    await this.prisma.nutritionPlanMealItem.delete({ where: { id: itemId } });
    await this.recalculateMealTotals(item.nutritionPlanMealId);
    return { message: "Item removed" };
  }

  // ─── Today ──────────────────────────────────────────────────────────────────

  async getToday(userId: string, orgId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone ?? "Asia/Riyadh";

    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException("Trainee profile not found");

    const { start, end } = getTodayInTimezone(tz);

    // Find active assignment
    const assignment = await this.prisma.traineeNutritionAssignment.findFirst({
      where: {
        traineeProfileId: profile.id,
        status: AssignmentStatus.ACTIVE,
        startsOn: { lte: end },
        OR: [{ endsOn: null }, { endsOn: { gte: start } }],
      },
      include: {
        nutritionPlan: {
          include: {
            meals: {
              orderBy: { mealOrder: "asc" },
              include: {
                items: {
                  include: {
                    food: { select: { nameEn: true, nameAr: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return { plan: null, meals: [], todayLog: null };
    }

    const plan = assignment.nutritionPlan;

    // Get today's meal logs
    const logs = await this.prisma.mealLog.findMany({
      where: {
        traineeProfileId: profile.id,
        loggedAt: { gte: start, lte: end },
      },
    });

    const totalCalories = logs.reduce((s, l) => s + Number(l.calories), 0);
    const totalProtein = logs.reduce((s, l) => s + Number(l.proteinG), 0);
    const totalCarbs = logs.reduce((s, l) => s + Number(l.carbsG), 0);
    const totalFats = logs.reduce((s, l) => s + Number(l.fatsG), 0);

    return {
      plan: {
        id: plan.id,
        title: plan.title,
        caloriesTarget: plan.caloriesTarget,
        proteinG: plan.proteinG,
        carbsG: plan.carbsG,
        fatsG: plan.fatsG,
      },
      meals: plan.meals,
      todayLog: {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFats: Math.round(totalFats),
        remainingCalories: Math.max(0, plan.caloriesTarget - totalCalories),
        remainingProtein: Math.max(0, plan.proteinG - totalProtein),
        percentComplete:
          plan.caloriesTarget > 0
            ? Math.min(100, Math.round((totalCalories / plan.caloriesTarget) * 100))
            : 0,
      },
    };
  }

  // ─── Foods ──────────────────────────────────────────────────────────────────

  async searchFoods(query: { search?: string; barcode?: string; page?: number; limit?: number }): Promise<any> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.barcode) {
      where.barcode = query.barcode;
    } else if (query.search && query.search.length >= 2) {
      where.OR = [
        { nameEn: { contains: query.search, mode: "insensitive" } },
        { nameAr: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.food.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          caloriesPer100g: true,
          proteinG: true,
          carbsG: true,
          fatsG: true,
        },
        orderBy: { nameEn: "asc" },
      }),
      this.prisma.food.count({ where }),
    ]);

    return { items, total, page, limit, hasNextPage: skip + limit < total };
  }

  // ─── Meal Logs ──────────────────────────────────────────────────────────────

  async logMeal(userId: string, orgId: string, dto: LogMealDto): Promise<any> {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException("Trainee profile not found");

    return this.prisma.mealLog.create({
      data: {
        organizationId: orgId,
        traineeProfileId: profile.id,
        nutritionPlanMealId: dto.nutritionPlanMealId ?? null,
        calories: dto.calories,
        proteinG: dto.proteinG,
        carbsG: dto.carbsG,
        fatsG: dto.fatsG,
        notes: dto.notes ?? null,
      },
    });
  }

  async getMealLogs(userId: string, orgId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone ?? "Asia/Riyadh";

    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException("Trainee profile not found");

    const { start, end } = getTodayInTimezone(tz);

    return this.prisma.mealLog.findMany({
      where: {
        traineeProfileId: profile.id,
        organizationId: orgId,
        loggedAt: { gte: start, lte: end },
      },
      orderBy: { loggedAt: "desc" },
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async recalculateMealTotals(mealId: string) {
    const items = await this.prisma.nutritionPlanMealItem.findMany({
      where: { nutritionPlanMealId: mealId },
    });

    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + Number(item.calories),
        proteinG: acc.proteinG + Number(item.proteinG),
        carbsG: acc.carbsG + Number(item.carbsG),
        fatsG: acc.fatsG + Number(item.fatsG),
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 },
    );

    await this.prisma.nutritionPlanMeal.update({
      where: { id: mealId },
      data: {
        calories: Math.round(totals.calories),
        proteinG: Math.round(totals.proteinG * 10) / 10,
        carbsG: Math.round(totals.carbsG * 10) / 10,
        fatsG: Math.round(totals.fatsG * 10) / 10,
      },
    });
  }

  // ─── USDA External Search ──────────────────────────────────────────────────

  async searchExternalFoods(query: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=DEMO_KEY&pageSize=10`,
      );
      const data = (await response.json()) as any;

      return (
        data.foods?.map((food: any) => ({
          nameEn: food.description,
          nameAr: food.description,
          caloriesPer100g:
            food.foodNutrients?.find((n: any) => n.nutrientId === 1008)?.value ?? 0,
          proteinG:
            food.foodNutrients?.find((n: any) => n.nutrientId === 1003)?.value ?? 0,
          carbsG:
            food.foodNutrients?.find((n: any) => n.nutrientId === 1005)?.value ?? 0,
          fatsG:
            food.foodNutrients?.find((n: any) => n.nutrientId === 1004)?.value ?? 0,
          source: "usda",
          fdcId: food.fdcId,
        })) ?? []
      );
    } catch (err) {
      this.logger.error(`USDA search failed: ${err}`);
      return [];
    }
  }

  async importExternalFood(fdcId: string, nameAr: string): Promise<any> {
    const results = await this.searchExternalFoods(fdcId);
    const food = results[0];
    if (!food) throw new NotFoundException("Food not found in USDA database");

    return this.prisma.food.create({
      data: {
        nameEn: food.nameEn,
        nameAr: nameAr || food.nameEn,
        caloriesPer100g: Math.round(food.caloriesPer100g),
        proteinG: Math.round(food.proteinG * 10) / 10,
        carbsG: Math.round(food.carbsG * 10) / 10,
        fatsG: Math.round(food.fatsG * 10) / 10,
        isVerified: false,
      },
    });
  }

  private async ensurePlanOwnership(planId: string, orgId: string) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { id: planId, organizationId: orgId },
    });
    if (!plan) throw new NotFoundException("Nutrition plan not found");
  }
}
