import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { jwtConfig } from "../config/jwt.config";
import { RoleKey } from "@ironcoach/db";

@Injectable()
export class ImpersonationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async impersonate(orgId: string, adminId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { owner: { select: { id: true, email: true } } },
    });

    if (!org) throw new NotFoundException("Organization not found");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const impersonationToken = this.jwtService.sign(
      {
        sub: org.owner.id,
        orgId: org.id,
        role: RoleKey.OWNER,
        email: org.owner.email,
        isImpersonation: true,
        adminId,
      },
      {
        secret: jwtConfig.accessSecret,
        expiresIn: "1h",
      },
    );

    // Log to audit
    await this.prisma.auditLog.create({
      data: {
        actorUserId: adminId,
        action: "IMPERSONATE_ORG",
        entityType: "Organization",
        entityId: orgId,
        metadataJson: { orgName: org.name, ownerEmail: org.owner.email } as any,
      },
    });

    return { impersonationToken, expiresAt };
  }
}
