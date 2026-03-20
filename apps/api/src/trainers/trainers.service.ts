import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { InviteTraineeDto } from "./dto/invite-trainee.dto";
import { RoleKey } from "@ironcoach/db";

@Injectable()
export class TrainersService {
  private readonly logger = new Logger(TrainersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(orgId: string) {
    const [activeTrainees, pendingCheckins, unreadMessages] = await Promise.all(
      [
        this.prisma.organizationMember.count({
          where: {
            organizationId: orgId,
            roleKey: RoleKey.TRAINEE,
            status: "active",
          },
        }),
        this.prisma.checkin.count({
          where: { organizationId: orgId, reviewedAt: null },
        }),
        this.prisma.message.count({
          where: {
            conversation: { organizationId: orgId },
            isRead: false,
          },
        }),
      ],
    );

    // Weekly completion rate (simplified — count completed workout logs this week)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [totalAssignments, completedLogs] = await Promise.all([
      this.prisma.traineeWorkoutAssignment.count({
        where: {
          workoutProgram: { organizationId: orgId },
          status: "ACTIVE",
        },
      }),
      this.prisma.workoutLog.count({
        where: {
          organizationId: orgId,
          completedAt: { not: null },
          startedAt: { gte: weekStart },
        },
      }),
    ]);

    const weeklyCompletionRate =
      totalAssignments > 0
        ? Math.round((completedLogs / totalAssignments) * 100)
        : 0;

    return {
      activeTrainees,
      pendingCheckins,
      unreadMessages,
      weeklyCompletionRate,
      recentActivity: [],
    };
  }

  async getTrainees(
    orgId: string,
    query: {
      status?: string;
      goal?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<any> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (query.goal) {
      where.goal = query.goal;
    }

    if (query.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search, mode: "insensitive" } },
          { lastName: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.traineeProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.traineeProfile.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
    };
  }

  async getTrainee(orgId: string, traineeProfileId: string): Promise<any> {
    const trainee = await this.prisma.traineeProfile.findFirst({
      where: { id: traineeProfileId, organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        calorieCalculations: { orderBy: { createdAt: "desc" }, take: 1 },
        bodyMeasurements: { orderBy: { recordedAt: "desc" }, take: 5 },
      },
    });

    if (!trainee) {
      throw new NotFoundException("Trainee not found");
    }

    return trainee;
  }

  async inviteTrainee(orgId: string, invitedById: string, dto: InviteTraineeDto) {
    // Check if already a member
    const existingMember = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        user: { email: dto.email.toLowerCase() },
      },
    });

    if (existingMember) {
      throw new ConflictException("User is already a member of this organization");
    }

    let user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      if (!user) {
        // Create user without password — they'll set it via invite link
        user = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash: "", // set during accept-invite
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        });
      }

      await tx.organizationMember.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          roleKey: RoleKey.TRAINEE,
          invitedById,
        },
      });

      const traineeProfile = await tx.traineeProfile.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          assignedTrainerId: invitedById,
        },
      });

      // Create invite token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await tx.inviteToken.create({
        data: {
          token: rawToken,
          tokenHash,
          organizationId: orgId,
          invitedByUserId: invitedById,
          email: dto.email.toLowerCase(),
          roleKey: RoleKey.TRAINEE,
          expiresAt,
        },
      });

      return { traineeProfile, rawToken };
    });

    this.logger.log(
      `TODO [Step 17]: Send invite email to ${dto.email} with token: ${result.rawToken}`,
    );

    return {
      traineeId: result.traineeProfile.id,
      inviteUrl: `/auth/accept-invite?token=${result.rawToken}`,
    };
  }

  async removeTrainee(orgId: string, traineeProfileId: string) {
    const trainee = await this.prisma.traineeProfile.findFirst({
      where: { id: traineeProfileId, organizationId: orgId },
    });

    if (!trainee) {
      throw new NotFoundException("Trainee not found");
    }

    // Soft delete — deactivate user's org membership
    await this.prisma.organizationMember.updateMany({
      where: { organizationId: orgId, userId: trainee.userId },
      data: { status: "inactive" },
    });

    return { message: "Trainee removed successfully" };
  }
}
