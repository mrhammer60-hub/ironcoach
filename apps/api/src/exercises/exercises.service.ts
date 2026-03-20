import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    orgId: string,
    query: {
      muscleGroup?: string;
      difficulty?: string;
      equipment?: string;
      search?: string;
      isGlobal?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<any> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ organizationId: orgId }, { isGlobal: true }],
    };

    if (query.muscleGroup) where.muscleGroup = query.muscleGroup;
    if (query.difficulty) where.difficultyLevel = query.difficulty;
    if (query.equipment) {
      where.equipment = { contains: query.equipment, mode: "insensitive" };
    }
    if (query.search) {
      where.AND = [
        {
          OR: [
            { nameEn: { contains: query.search, mode: "insensitive" } },
            { nameAr: { contains: query.search, mode: "insensitive" } },
          ],
        },
      ];
    }
    if (query.isGlobal !== undefined) {
      where.isGlobal = query.isGlobal === "true";
    }

    const [items, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          muscleGroup: true,
          difficultyLevel: true,
          equipment: true,
          imageUrl: true,
          defaultSets: true,
          defaultReps: true,
          isGlobal: true,
        },
        orderBy: { nameEn: "asc" },
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return { items, total, page, limit, hasNextPage: skip + limit < total };
  }

  async getById(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        substitutions: {
          include: {
            substituteExercise: {
              select: { id: true, nameEn: true, nameAr: true, muscleGroup: true },
            },
          },
        },
      },
    });

    if (!exercise) throw new NotFoundException("Exercise not found");
    return exercise;
  }

  async create(orgId: string, userId: string, dto: CreateExerciseDto): Promise<any> {
    return this.prisma.exercise.create({
      data: {
        organizationId: orgId,
        createdByUserId: userId,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        muscleGroup: dto.muscleGroup,
        secondaryMuscles: dto.secondaryMuscles ?? [],
        difficultyLevel: dto.difficultyLevel,
        equipment: dto.equipment ?? null,
        imageUrl: dto.imageUrl ?? null,
        videoUrl: dto.videoUrl ?? null,
        instructionsEn: dto.instructionsEn ?? null,
        instructionsAr: dto.instructionsAr ?? null,
        tipsEn: dto.tipsEn ?? null,
        tipsAr: dto.tipsAr ?? null,
        defaultSets: dto.defaultSets,
        defaultReps: dto.defaultReps,
        defaultRestSeconds: dto.defaultRestSeconds,
        tempo: dto.tempo ?? null,
        isGlobal: false,
      },
    });
  }

  async update(id: string, orgId: string, dto: UpdateExerciseDto): Promise<any> {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id, OR: [{ organizationId: orgId }, { isGlobal: true }] },
    });

    if (!exercise) throw new NotFoundException("Exercise not found");

    return this.prisma.exercise.update({ where: { id }, data: dto });
  }

  async remove(id: string, orgId: string, role: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException("Exercise not found");

    if (exercise.isGlobal && role !== "ADMIN") {
      throw new NotFoundException("Only admins can delete global exercises");
    }

    if (!exercise.isGlobal && exercise.organizationId !== orgId) {
      throw new NotFoundException("Exercise not found");
    }

    await this.prisma.exercise.delete({ where: { id } });
    return { message: "Exercise deleted" };
  }

  async getSubstitutes(id: string) {
    return this.prisma.exerciseSubstitution.findMany({
      where: { exerciseId: id },
      include: {
        substituteExercise: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            muscleGroup: true,
            difficultyLevel: true,
            equipment: true,
          },
        },
      },
    });
  }
}
