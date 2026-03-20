import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { JwtPayload } from "../decorators";

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user?.orgId) return true; // Admin users may not have orgId

    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: user.orgId },
      include: { organization: true, plan: true },
    });

    if (!subscription) {
      throw new ForbiddenException("No active subscription found");
    }

    if (
      subscription.status !== "ACTIVE" &&
      subscription.status !== "TRIALING"
    ) {
      throw new ForbiddenException("subscription_inactive");
    }

    request.organization = {
      ...subscription.organization,
      subscription,
      plan: subscription.plan,
    };

    return true;
  }
}
