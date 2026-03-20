import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StartSessionDto } from "./dto/start-session.dto";
import { LogSetsDto } from "./dto/log-sets.dto";
import { CompleteSessionDto } from "./dto/complete-session.dto";
import { getTodayInTimezone } from "@ironcoach/shared";

@Injectable()
export class WorkoutLogsService {
  private readonly logger = new Logger(WorkoutLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async startSession(
    userId: string,
    orgId: string,
    dto: StartSessionDto,
  ): Promise<any> {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException("Trainee profile not found");

    // Validate day belongs to an active assignment
    const day = await this.prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId },
      include: {
        workoutWeek: {
          include: {
            workoutProgram: {
              include: {
                assignments: {
                  where: {
                    traineeProfileId: profile.id,
                    status: "ACTIVE",
                  },
                },
              },
            },
          },
        },
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
              },
            },
          },
        },
      },
    });

    if (
      !day ||
      day.workoutWeek.workoutProgram.assignments.length === 0
    ) {
      throw new BadRequestException(
        "This workout day is not part of your active assignment",
      );
    }

    const log = await this.prisma.workoutLog.create({
      data: {
        organizationId: orgId,
        traineeProfileId: profile.id,
        workoutDayId: dto.workoutDayId,
        startedAt: new Date(),
      },
      include: {
        workoutDay: {
          include: {
            exercises: {
              orderBy: { sortOrder: "asc" },
              include: { exercise: true },
            },
          },
        },
      },
    });

    return log;
  }

  async getTodayWorkout(userId: string): Promise<any> {
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
    const assignment =
      await this.prisma.traineeWorkoutAssignment.findFirst({
        where: {
          traineeProfileId: profile.id,
          status: "ACTIVE",
          startsOn: { lte: end },
          OR: [{ endsOn: null }, { endsOn: { gte: start } }],
        },
        include: {
          workoutProgram: {
            include: {
              weeks: {
                orderBy: { weekNumber: "asc" },
                include: {
                  days: {
                    orderBy: { dayNumber: "asc" },
                    include: {
                      exercises: {
                        orderBy: { sortOrder: "asc" },
                        include: { exercise: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!assignment) {
      return { assignment: null, day: null, log: null };
    }

    // Calculate which day of the program "today" is
    const daysSinceStart = Math.floor(
      (start.getTime() - assignment.startsOn.getTime()) / 86_400_000,
    );

    // Find the matching workout day
    const allDays = assignment.workoutProgram.weeks.flatMap((w) =>
      w.days.map((d) => ({
        ...d,
        weekNumber: w.weekNumber,
        globalDayIndex: (w.weekNumber - 1) * 7 + d.dayNumber - 1,
      })),
    );

    const totalProgramDays = allDays.length;
    if (totalProgramDays === 0) {
      return { assignment, day: null, log: null };
    }

    const todayIndex = daysSinceStart % totalProgramDays;
    const todayDay = allDays[todayIndex] ?? allDays[0];

    // Check if there's already a log for today
    const existingLog = await this.prisma.workoutLog.findFirst({
      where: {
        traineeProfileId: profile.id,
        workoutDayId: todayDay.id,
        startedAt: { gte: start, lte: end },
      },
      include: {
        sets: true,
      },
    });

    return { assignment, day: todayDay, log: existingLog };
  }

  async getMyLogs(userId: string): Promise<any> {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException("Trainee profile not found");

    return this.prisma.workoutLog.findMany({
      where: { traineeProfileId: profile.id },
      include: {
        workoutDay: { select: { title: true, focusArea: true } },
        _count: { select: { sets: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });
  }

  async logSets(logId: string, userId: string, dto: LogSetsDto): Promise<any> {
    await this.getOwnLog(logId, userId);

    // Replace sets for the affected exercises (deleteMany + createMany)
    const exerciseIds = [...new Set(dto.sets.map((s) => s.exerciseId))];
    await this.prisma.workoutLogSet.deleteMany({
      where: {
        workoutLogId: logId,
        exerciseId: { in: exerciseIds },
      },
    });

    await this.prisma.workoutLogSet.createMany({
      data: dto.sets.map((s) => ({
        workoutLogId: logId,
        exerciseId: s.exerciseId,
        setNumber: s.setNumber,
        repsCompleted: s.repsCompleted,
        weightKg: s.weightKg ?? null,
        rpe: s.rpe ?? null,
        isCompleted: s.isCompleted,
        notes: s.notes ?? null,
      })),
    });

    // Calculate completion percentage
    const totalSets = await this.prisma.workoutLogSet.count({
      where: { workoutLogId: logId },
    });
    const completedSets = await this.prisma.workoutLogSet.count({
      where: { workoutLogId: logId, isCompleted: true },
    });

    return {
      logId,
      totalSets,
      completedSets,
      completionPct:
        totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    };
  }

  async completeSession(
    logId: string,
    userId: string,
    dto: CompleteSessionDto,
  ): Promise<any> {
    const log = await this.getOwnLog(logId, userId);

    const completedAt = new Date();
    const durationMinutes = Math.round(
      (completedAt.getTime() - log.startedAt.getTime()) / 60_000,
    );

    const updated = await this.prisma.workoutLog.update({
      where: { id: logId },
      data: {
        completedAt,
        durationMinutes,
        difficultyRating: dto.difficultyRating,
        traineeNotes: dto.traineeNotes ?? null,
      },
    });

    // TODO [Step 09]: Emit Socket.io event workout_completed
    this.logger.log(
      `TODO [Step 09]: Emit workout_completed for log ${logId}`,
    );

    // TODO [Step 09]: Send push notification to trainer
    this.logger.log(
      `TODO [Step 09]: Push notification to trainer about completed workout`,
    );

    return updated;
  }

  async getTraineeLogs(traineeId: string, orgId: string): Promise<any> {
    return this.prisma.workoutLog.findMany({
      where: { traineeProfileId: traineeId, organizationId: orgId },
      include: {
        workoutDay: { select: { title: true, focusArea: true } },
        _count: { select: { sets: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });
  }

  private async getOwnLog(logId: string, userId: string) {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException("Trainee profile not found");

    const log = await this.prisma.workoutLog.findFirst({
      where: { id: logId, traineeProfileId: profile.id },
    });
    if (!log) throw new NotFoundException("Workout log not found");
    return log;
  }
}
