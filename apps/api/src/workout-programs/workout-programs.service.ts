import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { AddWeekDto } from "./dto/add-week.dto";
import { AddDayDto } from "./dto/add-day.dto";
import { AddExerciseDto } from "./dto/add-exercise.dto";
import { UpdateDayExerciseDto } from "./dto/update-exercise.dto";
import { AssignProgramDto } from "./dto/assign-program.dto";
import { DuplicateProgramDto } from "./dto/duplicate-program.dto";
import { ApplyTemplateDto } from "./dto/apply-template.dto";
import { AssignmentStatus } from "@ironcoach/db";

@Injectable()
export class WorkoutProgramsService {
  private readonly logger = new Logger(WorkoutProgramsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, trainerId: string, dto: CreateProgramDto): Promise<any> {
    return this.prisma.workoutProgram.create({
      data: {
        organizationId: orgId,
        trainerId,
        title: dto.title,
        description: dto.description ?? null,
        goal: dto.goal ?? null,
        level: dto.level ?? null,
        durationWeeks: dto.durationWeeks,
        isTemplate: dto.isTemplate ?? false,
      },
    });
  }

  async list(orgId: string): Promise<any> {
    return this.prisma.workoutProgram.findMany({
      where: { organizationId: orgId, status: "active" },
      include: {
        _count: { select: { weeks: true, assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string, orgId: string): Promise<any> {
    const program = await this.prisma.workoutProgram.findFirst({
      where: { id, organizationId: orgId },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: {
            days: {
              orderBy: { dayNumber: "asc" },
              include: {
                exercises: {
                  orderBy: { sortOrder: "asc" },
                  include: {
                    exercise: {
                      select: {
                        id: true,
                        nameEn: true,
                        nameAr: true,
                        muscleGroup: true,
                        imageUrl: true,
                        videoUrl: true,
                        instructionsEn: true,
                        instructionsAr: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            traineeProfile: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!program) throw new NotFoundException("Program not found");
    return program;
  }

  async update(id: string, orgId: string, dto: Partial<CreateProgramDto>): Promise<any> {
    const program = await this.prisma.workoutProgram.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!program) throw new NotFoundException("Program not found");

    return this.prisma.workoutProgram.update({ where: { id }, data: dto });
  }

  async remove(id: string, orgId: string) {
    const program = await this.prisma.workoutProgram.findFirst({
      where: { id, organizationId: orgId },
      include: { _count: { select: { assignments: true } } },
    });

    if (!program) throw new NotFoundException("Program not found");
    if (program._count.assignments > 0) {
      throw new BadRequestException(
        "Cannot delete a program with active assignments",
      );
    }

    await this.prisma.workoutProgram.delete({ where: { id } });
    return { message: "Program deleted" };
  }

  async addWeek(programId: string, orgId: string, dto: AddWeekDto): Promise<any> {
    await this.ensureProgramOwnership(programId, orgId);
    return this.prisma.workoutWeek.create({
      data: {
        workoutProgramId: programId,
        weekNumber: dto.weekNumber,
        title: dto.title ?? null,
      },
    });
  }

  async addDay(
    programId: string,
    weekId: string,
    orgId: string,
    dto: AddDayDto,
  ): Promise<any> {
    await this.ensureProgramOwnership(programId, orgId);
    return this.prisma.workoutDay.create({
      data: {
        workoutWeekId: weekId,
        dayNumber: dto.dayNumber,
        title: dto.title ?? null,
        focusArea: dto.focusArea ?? null,
      },
    });
  }

  async addExerciseToDay(
    programId: string,
    dayId: string,
    orgId: string,
    dto: AddExerciseDto,
  ): Promise<any> {
    await this.ensureProgramOwnership(programId, orgId);
    return this.prisma.workoutDayExercise.create({
      data: {
        workoutDayId: dayId,
        exerciseId: dto.exerciseId,
        sortOrder: dto.sortOrder,
        sets: dto.sets,
        reps: dto.reps,
        restSeconds: dto.restSeconds,
        tempo: dto.tempo ?? null,
        rpe: dto.rpe ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async updateDayExercise(
    programId: string,
    exerciseDetailId: string,
    orgId: string,
    dto: UpdateDayExerciseDto,
  ): Promise<any> {
    await this.ensureProgramOwnership(programId, orgId);
    return this.prisma.workoutDayExercise.update({
      where: { id: exerciseDetailId },
      data: dto,
    });
  }

  async removeDayExercise(
    programId: string,
    exerciseDetailId: string,
    orgId: string,
  ) {
    await this.ensureProgramOwnership(programId, orgId);
    await this.prisma.workoutDayExercise.delete({
      where: { id: exerciseDetailId },
    });
    return { message: "Exercise removed from day" };
  }

  async assignToTrainee(
    programId: string,
    orgId: string,
    dto: AssignProgramDto,
  ) {
    await this.ensureProgramOwnership(programId, orgId);

    // Validate trainee belongs to same org
    const trainee = await this.prisma.traineeProfile.findFirst({
      where: { id: dto.traineeProfileId, organizationId: orgId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!trainee) {
      throw new ForbiddenException(
        "Trainee does not belong to your organization",
      );
    }

    // Deactivate existing active assignments for this trainee
    await this.prisma.traineeWorkoutAssignment.updateMany({
      where: {
        traineeProfileId: dto.traineeProfileId,
        status: AssignmentStatus.ACTIVE,
      },
      data: { status: AssignmentStatus.COMPLETED },
    });

    const assignment = await this.prisma.traineeWorkoutAssignment.create({
      data: {
        organizationId: orgId,
        traineeProfileId: dto.traineeProfileId,
        workoutProgramId: programId,
        startsOn: new Date(dto.startsOn),
        endsOn: dto.endsOn ? new Date(dto.endsOn) : null,
        status: AssignmentStatus.ACTIVE,
      },
    });

    // TODO [Step 09]: Send push notification to trainee
    this.logger.log(
      `TODO [Step 09]: Push notification to ${trainee.user.firstName}: "وصلك برنامج تدريبي جديد 💪"`,
    );

    // TODO [Step 17]: Send email via Resend
    this.logger.log(
      `TODO [Step 17]: Send program-assigned email to trainee`,
    );

    return assignment;
  }

  async duplicate(
    programId: string,
    orgId: string,
    trainerId: string,
    dto: DuplicateProgramDto,
  ): Promise<any> {
    const original = await this.prisma.workoutProgram.findFirst({
      where: { id: programId, organizationId: orgId },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: {
            days: {
              orderBy: { dayNumber: "asc" },
              include: { exercises: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
      },
    });

    if (!original) throw new NotFoundException("Program not found");

    return this.prisma.$transaction(async (tx) => {
      const newProgram = await tx.workoutProgram.create({
        data: {
          organizationId: orgId,
          trainerId,
          title: dto.title ?? `${original.title} (نسخة)`,
          description: original.description,
          goal: original.goal,
          level: original.level,
          durationWeeks: original.durationWeeks,
          isTemplate: dto.saveAsTemplate ?? false,
          status: "active",
        },
      });

      for (const week of original.weeks) {
        const newWeek = await tx.workoutWeek.create({
          data: {
            workoutProgramId: newProgram.id,
            weekNumber: week.weekNumber,
            title: week.title,
          },
        });

        for (const day of week.days) {
          const newDay = await tx.workoutDay.create({
            data: {
              workoutWeekId: newWeek.id,
              dayNumber: day.dayNumber,
              title: day.title,
              focusArea: day.focusArea,
            },
          });

          if (day.exercises.length > 0) {
            await tx.workoutDayExercise.createMany({
              data: day.exercises.map((ex) => ({
                workoutDayId: newDay.id,
                exerciseId: ex.exerciseId,
                sortOrder: ex.sortOrder,
                sets: ex.sets,
                reps: ex.reps,
                restSeconds: ex.restSeconds,
                tempo: ex.tempo,
                rpe: ex.rpe,
                notes: ex.notes,
              })),
            });
          }
        }
      }

      return tx.workoutProgram.findUnique({
        where: { id: newProgram.id },
        include: {
          weeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              days: {
                orderBy: { dayNumber: "asc" },
                include: { exercises: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      });
    });
  }

  async saveAsTemplate(programId: string, orgId: string): Promise<any> {
    const program = await this.prisma.workoutProgram.findFirst({
      where: { id: programId, organizationId: orgId },
    });
    if (!program) throw new NotFoundException("Program not found");

    return this.prisma.workoutProgram.update({
      where: { id: programId },
      data: { isTemplate: true },
    });
  }

  async listTemplates(orgId: string): Promise<any> {
    return this.prisma.workoutProgram.findMany({
      where: { organizationId: orgId, isTemplate: true, status: "active" },
      include: {
        _count: { select: { weeks: true, assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async applyTemplate(
    templateId: string,
    orgId: string,
    trainerId: string,
    dto: ApplyTemplateDto,
  ): Promise<any> {
    // Validate trainee belongs to same org
    const trainee = await this.prisma.traineeProfile.findFirst({
      where: { id: dto.traineeProfileId, organizationId: orgId },
      include: { user: { select: { id: true, firstName: true } } },
    });

    if (!trainee) {
      throw new ForbiddenException("Trainee does not belong to your organization");
    }

    // Duplicate the template as a non-template program
    const program = await this.duplicate(templateId, orgId, trainerId, {
      saveAsTemplate: false,
    });

    // Deactivate existing active assignments
    await this.prisma.traineeWorkoutAssignment.updateMany({
      where: {
        traineeProfileId: dto.traineeProfileId,
        status: AssignmentStatus.ACTIVE,
      },
      data: { status: AssignmentStatus.COMPLETED },
    });

    // Assign to trainee
    const assignment = await this.prisma.traineeWorkoutAssignment.create({
      data: {
        organizationId: orgId,
        traineeProfileId: dto.traineeProfileId,
        workoutProgramId: program.id,
        startsOn: new Date(dto.startDate),
        status: AssignmentStatus.ACTIVE,
      },
    });

    this.logger.log(
      `TODO [Step 09]: Push notification to trainee: "وصلك برنامج تدريبي جديد 💪"`,
    );

    return { program, assignment };
  }

  private async ensureProgramOwnership(programId: string, orgId: string) {
    const program = await this.prisma.workoutProgram.findFirst({
      where: { id: programId, organizationId: orgId },
    });
    if (!program) throw new NotFoundException("Program not found");
  }
}
