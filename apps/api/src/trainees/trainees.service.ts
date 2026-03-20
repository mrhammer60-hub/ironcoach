import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CalorieCalculatorService } from "./calorie-calculator.service";
import { OnboardDto } from "./dto/onboard.dto";
import { AssessmentDto } from "./dto/assessment.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class TraineesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calorieCalc: CalorieCalculatorService,
  ) {}

  async onboard(userId: string, orgId: string, dto: OnboardDto): Promise<any> {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Trainee profile not found");
    }

    const age = this.calorieCalc.calculateAge(dto.birthDate);
    const calculation = this.calorieCalc.calculate({
      gender: dto.gender,
      age,
      weightKg: dto.currentWeightKg,
      heightCm: dto.heightCm,
      activityLevel: dto.activityLevel,
      goal: dto.goal,
    });

    const [updatedProfile, calorieRecord] = await this.prisma.$transaction([
      this.prisma.traineeProfile.update({
        where: { id: profile.id },
        data: {
          gender: dto.gender,
          birthDate: new Date(dto.birthDate),
          heightCm: dto.heightCm,
          currentWeightKg: dto.currentWeightKg,
          targetWeightKg: dto.targetWeightKg ?? null,
          activityLevel: dto.activityLevel,
          goal: dto.goal,
          trainingDaysPerWeek: dto.trainingDaysPerWeek,
          injuriesNotes: dto.injuriesNotes ?? null,
          foodPreferences: dto.foodPreferences ?? null,
          allergies: dto.allergies ?? null,
          onboardingCompletedAt: new Date(),
        },
      }),
      this.prisma.calorieCalculation.create({
        data: {
          traineeProfileId: profile.id,
          bmr: calculation.bmr,
          tdee: calculation.tdee,
          targetCalories: calculation.targetCalories,
          proteinG: calculation.proteinG,
          carbsG: calculation.carbsG,
          fatsG: calculation.fatsG,
          goal: dto.goal,
          activityLevel: dto.activityLevel,
          activityFactor: calculation.activityFactor,
          goalAdjustment: calculation.goalAdjustment,
          weightKg: dto.currentWeightKg,
          heightCm: dto.heightCm,
          age,
          gender: dto.gender,
        },
      }),
    ]);

    return {
      profile: updatedProfile,
      calculation: {
        bmr: calculation.bmr,
        tdee: calculation.tdee,
        targetCalories: calculation.targetCalories,
        proteinG: calculation.proteinG,
        carbsG: calculation.carbsG,
        fatsG: calculation.fatsG,
      },
    };
  }

  async getMyProfile(userId: string): Promise<any> {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            timezone: true,
          },
        },
        calorieCalculations: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!profile) {
      throw new NotFoundException("Trainee profile not found");
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<any> {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Trainee profile not found");
    }

    const data: Record<string, any> = {};
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.heightCm !== undefined) data.heightCm = dto.heightCm;
    if (dto.currentWeightKg !== undefined) data.currentWeightKg = dto.currentWeightKg;
    if (dto.targetWeightKg !== undefined) data.targetWeightKg = dto.targetWeightKg;
    if (dto.activityLevel !== undefined) data.activityLevel = dto.activityLevel;
    if (dto.goal !== undefined) data.goal = dto.goal;
    if (dto.trainingDaysPerWeek !== undefined) data.trainingDaysPerWeek = dto.trainingDaysPerWeek;
    if (dto.injuriesNotes !== undefined) data.injuriesNotes = dto.injuriesNotes;
    if (dto.foodPreferences !== undefined) data.foodPreferences = dto.foodPreferences;
    if (dto.allergies !== undefined) data.allergies = dto.allergies;

    const updated = await this.prisma.traineeProfile.update({
      where: { id: profile.id },
      data,
    });

    // Update user timezone if provided
    if (dto.timezone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { timezone: dto.timezone },
      });
    }

    return updated;
  }

  async submitAssessment(userId: string, orgId: string, dto: AssessmentDto): Promise<any> {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Trainee profile not found");
    }

    // Update current weight on profile
    await this.prisma.traineeProfile.update({
      where: { id: profile.id },
      data: { currentWeightKg: dto.weightKg },
    });

    const measurement = await this.prisma.bodyMeasurement.create({
      data: {
        organizationId: orgId,
        traineeProfileId: profile.id,
        weightKg: dto.weightKg,
        bodyFatPercentage: dto.bodyFatPercentage ?? null,
        waistCm: dto.waistCm ?? null,
        chestCm: dto.chestCm ?? null,
        hipsCm: dto.hipsCm ?? null,
        armsCm: dto.armsCm ?? null,
        thighsCm: dto.thighsCm ?? null,
      },
    });

    return { measurement };
  }

  async getAssessments(userId: string): Promise<any> {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Trainee profile not found");
    }

    return this.prisma.bodyMeasurement.findMany({
      where: { traineeProfileId: profile.id },
      orderBy: { recordedAt: "desc" },
      take: 20,
    });
  }

  async getProgress(userId: string) {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Trainee profile not found");
    }

    const [weightHistory, strengthPRs, totalWorkoutsCompleted] =
      await Promise.all([
        this.prisma.bodyMeasurement.findMany({
          where: { traineeProfileId: profile.id },
          orderBy: { recordedAt: "desc" },
          take: 12,
          select: {
            recordedAt: true,
            weightKg: true,
            bodyFatPercentage: true,
          },
        }),
        this.prisma.strengthPR.findMany({
          where: { traineeProfileId: profile.id },
          include: {
            exercise: { select: { nameEn: true, nameAr: true } },
          },
          orderBy: { achievedAt: "desc" },
        }),
        this.prisma.workoutLog.count({
          where: {
            traineeProfileId: profile.id,
            completedAt: { not: null },
          },
        }),
      ]);

    return {
      weightHistory: weightHistory.map((m) => ({
        date: m.recordedAt,
        weightKg: Number(m.weightKg),
      })),
      bodyFatHistory: weightHistory
        .filter((m) => m.bodyFatPercentage !== null)
        .map((m) => ({
          date: m.recordedAt,
          bodyFatPct: Number(m.bodyFatPercentage),
        })),
      strengthPRs: strengthPRs.map((pr) => ({
        exerciseName: pr.exercise.nameEn,
        exerciseNameAr: pr.exercise.nameAr,
        weightKg: Number(pr.weightKg),
        date: pr.achievedAt,
      })),
      workoutStreak: 0, // TODO: calculate consecutive days
      totalWorkoutsCompleted,
    };
  }
}
