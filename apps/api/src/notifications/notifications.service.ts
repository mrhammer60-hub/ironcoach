import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ExpoPushService } from "./expo-push.service";
import { NotificationType } from "@ironcoach/db";
import type { UpdatePrefsDto } from "./dto/update-prefs.dto";

interface SendNotificationParams {
  userId: string;
  organizationId: string;
  type: string;
  title: string;
  body: string;
  dataJson?: Record<string, unknown>;
}

// Maps NotificationType → pref field names
const TOGGLE_MAP: Record<
  string,
  { push: string; email: string }
> = {
  WORKOUT_ASSIGNED: { push: "pushWorkoutAssigned", email: "emailWorkoutAssigned" },
  MEAL_PLAN_ASSIGNED: { push: "pushMealPlanAssigned", email: "emailMealPlanAssigned" },
  MESSAGE_RECEIVED: { push: "pushMessageReceived", email: "pushMessageReceived" },
  WORKOUT_COMPLETED: { push: "pushWorkoutCompleted", email: "emailWorkoutAssigned" },
  CHECKIN_REMINDER: { push: "pushWeeklyReminder", email: "emailWeeklySummary" },
  PAYMENT_FAILED: { push: "pushMessageReceived", email: "emailPaymentFailed" },
  PLAN_EXPIRING: { push: "pushMessageReceived", email: "emailPaymentFailed" },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expoPush: ExpoPushService,
  ) {}

  // ─── Send (with preference check) ────────────────────────────────────────

  async send(params: SendNotificationParams) {
    // Always save to in-app notification center
    await this.prisma.notification.create({
      data: {
        userId: params.userId,
        organizationId: params.organizationId,
        type: params.type as NotificationType,
        title: params.title,
        body: params.body,
        dataJson: (params.dataJson as any) ?? undefined,
      },
    });

    // Check push preference before sending
    const allowPush = await this.shouldSend(params.userId, params.type, "push");

    if (allowPush) {
      await this.expoPush.sendPush(
        params.userId,
        params.title,
        params.body,
        params.dataJson,
      );
    }
  }

  // ─── Preference Check ────────────────────────────────────────────────────

  async shouldSend(
    userId: string,
    type: string,
    channel: "push" | "email",
  ): Promise<boolean> {
    // Payment-related notifications can never be disabled
    if (type === "PAYMENT_FAILED" && channel === "email") return true;

    const prefs = await this.getPrefs(userId);

    // Check quiet hours for push
    if (channel === "push" && prefs.quietHoursEnabled) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });
      const tz = user?.timezone ?? "Asia/Riyadh";

      if (this.isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd, tz)) {
        this.logger.log(
          `Notification suppressed for user ${userId} (quiet hours)`,
        );
        return false;
      }
    }

    // Check per-type toggle
    const toggle = TOGGLE_MAP[type];
    if (!toggle) return true;

    const field = channel === "push" ? toggle.push : toggle.email;
    return (prefs as any)[field] !== false;
  }

  private isInQuietHours(
    start: string,
    end: string,
    timezone: string,
  ): boolean {
    const now = new Date();
    const localTime = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const [h, m] = localTime.split(":").map(Number);
    const currentMins = h * 60 + m;

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (startMins > endMins) {
      // Crosses midnight: e.g. 22:00 → 08:00
      return currentMins >= startMins || currentMins < endMins;
    }
    return currentMins >= startMins && currentMins < endMins;
  }

  // ─── Preferences CRUD ────────────────────────────────────────────────────

  async getPrefs(userId: string): Promise<any> {
    return this.prisma.userNotificationPrefs.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePrefs(userId: string, dto: UpdatePrefsDto): Promise<any> {
    return this.prisma.userNotificationPrefs.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  async resetPrefs(userId: string): Promise<any> {
    // Delete existing → next getPrefs will create with defaults
    await this.prisma.userNotificationPrefs
      .delete({ where: { userId } })
      .catch(() => {});

    return this.getPrefs(userId);
  }

  // ─── Notifications List ──────────────────────────────────────────────────

  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return { items, total, page, limit, hasNextPage: skip + limit < total };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: "All notifications marked as read" };
  }

  async markOneRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: "Notification marked as read" };
  }

  async registerToken(userId: string, token: string, platform: string) {
    return this.prisma.pushToken.upsert({
      where: { userId_platform: { userId, platform } },
      update: { token },
      create: { userId, token, platform },
    });
  }
}
