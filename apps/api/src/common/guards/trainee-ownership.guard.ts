import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { JwtPayload } from "../decorators";

@Injectable()
export class TraineeOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    const traineeId =
      request.params.traineeId || request.params.traineeProfileId;

    if (!traineeId) return true;

    const trainee = await this.prisma.traineeProfile.findUnique({
      where: { id: traineeId },
    });

    if (!trainee) {
      throw new NotFoundException("Trainee not found");
    }

    if (trainee.organizationId !== user.orgId) {
      throw new ForbiddenException(
        "Trainee does not belong to your organization",
      );
    }

    return true;
  }
}
