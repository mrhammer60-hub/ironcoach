import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications.service";
import { RoleKey } from "@ironcoach/db";

@Injectable()
export class CheckinReminderJob {
  private readonly logger = new Logger(CheckinReminderJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron("0 8 * * 1") // Every Monday at 8:00 AM UTC
  async execute() {
    this.logger.log("Running weekly check-in reminder job");

    const activeTrainees = await this.prisma.organizationMember.findMany({
      where: { roleKey: RoleKey.TRAINEE, status: "active" },
      include: {
        user: { select: { id: true } },
        organization: { select: { id: true } },
      },
    });

    for (const member of activeTrainees) {
      await this.notificationsService.send({
        userId: member.user.id,
        organizationId: member.organization.id,
        type: "CHECKIN_REMINDER",
        title: "تذكير أسبوعي 📏",
        body: "حان وقت تسجيل قياساتك الأسبوعية",
      });
    }

    this.logger.log(`Sent check-in reminders to ${activeTrainees.length} trainees`);
  }
}
