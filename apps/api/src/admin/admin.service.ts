import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RoleKey, SubscriptionStatus } from "@ironcoach/db";
import { AnnouncementDto } from "./dto/announcement.dto";
import { redis } from "../config/redis.config";
import { stripe } from "../config/stripe.config";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getDashboard(): Promise<any> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalOrganizations,
      activeSubscriptions,
      totalTrainers,
      totalTrainees,
      newOrgsThisMonth,
      churnedThisMonth,
      recentSignups,
      recentActivity,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.subscription.count({
        where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
      }),
      this.prisma.organizationMember.count({
        where: { roleKey: { in: [RoleKey.OWNER, RoleKey.TRAINER] }, status: "active" },
      }),
      this.prisma.organizationMember.count({
        where: { roleKey: RoleKey.TRAINEE, status: "active" },
      }),
      this.prisma.organization.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.CANCELED, updatedAt: { gte: monthStart } },
      }),
      this.prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          subscription: { include: { plan: { select: { code: true } } } },
        },
      }),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    // Calculate MRR from active subscriptions
    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
      include: { plan: true },
    });
    const mrr = activeSubs.reduce((sum, s) => sum + Number(s.plan.monthlyPrice), 0);

    // Plan distribution from active subscriptions
    const planDist: Record<string, number> = {};
    for (const s of activeSubs) {
      const code = (s.plan as any)?.code || "UNKNOWN";
      planDist[code] = (planDist[code] || 0) + 1;
    }
    const planDistribution = Object.entries(planDist).map(([planCode, count]) => ({
      planCode,
      count,
    }));

    // Monthly growth: organizations created per month for last 12 months
    const monthlyGrowth = await this.buildMonthlyGrowth();

    return {
      totalOrganizations,
      activeSubscriptions,
      totalTrainers,
      totalTrainees,
      mrr,
      newOrgsThisMonth,
      churnedThisMonth,
      planDistribution,
      monthlyGrowth,
      recentActivity: recentActivity.map((log) => ({
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        actorName: log.actor
          ? `${log.actor.firstName ?? ""} ${log.actor.lastName ?? ""}`.trim() || "System"
          : "System",
        createdAt: log.createdAt,
      })),
      recentSignups: recentSignups.map((org) => ({
        orgName: org.name,
        planCode: org.subscription?.plan?.code ?? null,
        createdAt: org.createdAt,
      })),
    };
  }

  private async buildMonthlyGrowth(): Promise<{ month: string; count: number }[]> {
    const now = new Date();
    const results: { month: string; count: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = start.toLocaleString("en-US", { month: "short" });

      const count = await this.prisma.organization.count({
        where: { createdAt: { gte: start, lt: end } },
      });

      results.push({ month: monthLabel, count });
    }

    return results;
  }

  async getRevenue(): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [activeSubs, failedInvoices, cancelledRecent] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
        include: { plan: true },
      }),
      this.prisma.invoice.count({
        where: { status: "failed", createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.CANCELED, updatedAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const mrr = activeSubs.reduce((sum, s) => sum + Number(s.plan.monthlyPrice), 0);
    const totalActiveStart = activeSubs.length + cancelledRecent;
    const churnRate = totalActiveStart > 0
      ? Math.round((cancelledRecent / totalActiveStart) * 100)
      : 0;

    return {
      mrr,
      arr: mrr * 12,
      activeSubscriptions: activeSubs.length,
      failedPaymentsLast30Days: failedInvoices,
      cancelledLast30Days: cancelledRecent,
      churnRate,
    };
  }

  async listCoaches(query: {
    status?: string;
    plan?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { owner: { email: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: { select: { email: true, firstName: true, lastName: true } },
          subscription: { include: { plan: { select: { code: true, name: true } } } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { items, total, page, limit, hasNextPage: skip + limit < total };
  }

  async getCoachDetail(orgId: string): Promise<any> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        subscription: { include: { plan: true } },
        _count: { select: { members: true } },
      },
    });
    if (!org) throw new NotFoundException("Organization not found");

    const traineeCount = await this.prisma.organizationMember.count({
      where: { organizationId: orgId, roleKey: RoleKey.TRAINEE, status: "active" },
    });

    return { ...org, stats: { activeTrainees: traineeCount } };
  }

  async suspendOrg(orgId: string, reason?: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException("Organization not found");

    await this.prisma.organization.update({
      where: { id: orgId },
      data: { status: "suspended" },
    });

    this.logger.log(`TODO [Step 17]: Send suspension email to org ${orgId}, reason: ${reason}`);
    return { message: "Organization suspended" };
  }

  async unsuspendOrg(orgId: string) {
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { status: "active" },
    });
    return { message: "Organization restored" };
  }

  async deleteOrg(orgId: string, confirmationPhrase: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException("Organization not found");

    if (confirmationPhrase !== `DELETE ${org.name}`) {
      throw new BadRequestException("Confirmation phrase does not match");
    }

    await this.prisma.organization.delete({ where: { id: orgId } });
    return { message: "Organization permanently deleted" };
  }

  async sendAnnouncement(dto: AnnouncementDto, adminId: string) {
    let userIds: string[] = [];

    if (dto.target === "all_coaches") {
      const members = await this.prisma.organizationMember.findMany({
        where: { roleKey: { in: [RoleKey.OWNER, RoleKey.TRAINER] }, status: "active" },
        select: { userId: true },
      });
      userIds = members.map((m) => m.userId);
    } else if (dto.target === "all_trainees") {
      const members = await this.prisma.organizationMember.findMany({
        where: { roleKey: RoleKey.TRAINEE, status: "active" },
        select: { userId: true },
      });
      userIds = members.map((m) => m.userId);
    } else if (dto.target === "all_users") {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (dto.target.startsWith("plan_")) {
      const planCode = dto.target.replace("plan_", "");
      const subs = await this.prisma.subscription.findMany({
        where: {
          plan: { code: planCode as any },
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        },
        include: { organization: { select: { ownerUserId: true } } },
      });
      userIds = subs.map((s) => s.organization.ownerUserId);
    }

    // Queue notifications in batches (non-blocking)
    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      for (const userId of batch) {
        // In production, this would use BullMQ queue
        await this.notificationsService.send({
          userId,
          organizationId: "",
          type: "MESSAGE_RECEIVED",
          title: dto.title,
          body: dto.body,
        });
      }
    }

    this.logger.log(`Announcement sent to ${userIds.length} users by admin ${adminId}`);
    return { message: `Announcement queued for ${userIds.length} users` };
  }

  async getAuditLogs(query: {
    action?: string;
    entityType?: string;
    actorUserId?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.actorUserId) where.actorUserId = query.actorUserId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: { actor: { select: { email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit, hasNextPage: skip + limit < total };
  }

  async getFeatureFlags(): Promise<any> {
    return this.prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  }

  async toggleFeatureFlag(id: string, isEnabled: boolean): Promise<any> {
    return this.prisma.featureFlag.update({
      where: { id },
      data: { isEnabled },
    });
  }

  async getSystemHealth() {
    const checks: Record<string, string> = {};

    // Postgres
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.postgres = "ok";
    } catch (e) {
      checks.postgres = `error: ${e}`;
    }

    // Redis
    try {
      await redis.ping();
      checks.redis = "ok";
    } catch (e) {
      checks.redis = `error: ${e}`;
    }

    // Stripe
    try {
      await stripe.balance.retrieve();
      checks.stripe = "ok";
    } catch (e) {
      checks.stripe = `error: ${e}`;
    }

    return checks;
  }

  // Trainees
  async getAllTrainees(query: { search?: string; page: number; limit: number }): Promise<any> {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.traineeProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true, createdAt: true } },
          organization: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.traineeProfile.count({ where }),
    ]);

    return { items, total, page, limit, hasNextPage: skip + limit < total };
  }

  // Support
  async listTickets(page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        skip,
        take: limit,
        include: {
          openedBy: { select: { email: true, firstName: true, lastName: true } },
          assignedAdmin: { select: { email: true, firstName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supportTicket.count(),
    ]);
    return { items, total, page, limit, hasNextPage: skip + limit < total };
  }

  async assignTicket(ticketId: string, adminId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedAdminId: adminId },
    });
  }

  async resolveTicket(ticketId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  }

  // Global exercises
  async listGlobalExercises(page: number = 1, limit: number = 50): Promise<any> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where: { isGlobal: true },
        skip,
        take: limit,
        orderBy: { nameEn: "asc" },
      }),
      this.prisma.exercise.count({ where: { isGlobal: true } }),
    ]);
    return { items, total, page, limit, hasNextPage: skip + limit < total };
  }

  async approveExerciseAsGlobal(exerciseId: string): Promise<any> {
    return this.prisma.exercise.update({
      where: { id: exerciseId },
      data: { isGlobal: true, organizationId: null },
    });
  }
}
