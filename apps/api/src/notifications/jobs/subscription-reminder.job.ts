import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../emails/email.service";
import { NotificationsService } from "../notifications.service";

@Injectable()
export class SubscriptionReminderJob {
  private readonly logger = new Logger(SubscriptionReminderJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  @Cron("0 9 * * *") // Every day at 9:00 AM UTC
  async execute() {
    this.logger.log("Running subscription expiry reminder job");

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const startOfDay = new Date(threeDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(threeDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    const expiring = await this.prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        organization: {
          include: { owner: { select: { id: true, email: true, firstName: true } } },
        },
      },
    });

    for (const sub of expiring) {
      await this.notificationsService.send({
        userId: sub.organization.owner.id,
        organizationId: sub.organizationId,
        type: "PLAN_EXPIRING",
        title: "اشتراكك ينتهي قريباً ⏰",
        body: "اشتراكك ينتهي خلال 3 أيام. جدّد الآن للحفاظ على الوصول.",
      });

      await this.emailService.send(sub.organization.owner.email, "subscription-expiring", {
        firstName: sub.organization.owner.firstName,
        daysLeft: 3,
      });
    }

    this.logger.log(`Sent expiry reminders for ${expiring.length} subscriptions`);
  }
}
