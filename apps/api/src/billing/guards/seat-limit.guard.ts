import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { JwtPayload } from "../../common/decorators";
import { RoleKey } from "@ironcoach/db";

@Injectable()
export class SeatLimitGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user?.orgId) return true;

    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: user.orgId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new HttpException(
        { code: "NO_SUBSCRIPTION", message: "No active subscription" },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const activeTrainees = await this.prisma.organizationMember.count({
      where: {
        organizationId: user.orgId,
        roleKey: RoleKey.TRAINEE,
        status: "active",
      },
    });

    if (activeTrainees >= subscription.plan.maxTrainees) {
      throw new HttpException(
        {
          code: "SEAT_LIMIT_REACHED",
          current: activeTrainees,
          max: subscription.plan.maxTrainees,
          message: "Trainee seat limit reached. Upgrade your plan to add more trainees.",
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
