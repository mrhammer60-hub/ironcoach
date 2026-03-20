import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../emails/email.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { RoleKey } from "@ironcoach/db";

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findBySubdomain(subdomain: string) {
    const org = await this.prisma.organization.findUnique({
      where: { subdomain },
      include: {
        organizationSetting: {
          select: { brandPrimaryColor: true, brandLogoUrl: true },
        },
        trainerProfiles: {
          take: 1,
          select: { bio: true },
        },
      },
    });

    if (!org) return null;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      subdomain: org.subdomain,
      logoUrl: org.organizationSetting?.brandLogoUrl ?? org.logoUrl,
      brandColor: org.organizationSetting?.brandPrimaryColor ?? org.brandColor ?? "#c8f135",
      bio: org.trainerProfiles[0]?.bio ?? null,
    };
  }

  async getMyOrganization(orgId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    // Count trainees
    const [totalTrainees, activeTrainees] = await Promise.all([
      this.prisma.organizationMember.count({
        where: { organizationId: orgId, roleKey: RoleKey.TRAINEE },
      }),
      this.prisma.organizationMember.count({
        where: { organizationId: orgId, roleKey: RoleKey.TRAINEE, status: "active" },
      }),
    ]);

    const maxTrainees = organization.subscription?.plan?.maxTrainees ?? 0;

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logoUrl: organization.logoUrl,
      brandColor: organization.brandColor,
      subdomain: organization.subdomain,
      customDomain: organization.customDomain,
      subscription: organization.subscription
        ? {
            status: organization.subscription.status,
            plan: {
              code: organization.subscription.plan.code,
              name: organization.subscription.plan.name,
              maxTrainees: organization.subscription.plan.maxTrainees,
            },
            currentPeriodEnd: organization.subscription.currentPeriodEnd,
          }
        : null,
      stats: {
        totalTrainees,
        activeTrainees,
        seatsUsed: activeTrainees,
        seatsAvailable: Math.max(0, maxTrainees - activeTrainees),
      },
    };
  }

  async updateOrganization(orgId: string, dto: UpdateOrganizationDto) {
    // Check slug uniqueness if provided
    if (dto.slug) {
      const existing = await this.prisma.organization.findFirst({
        where: { slug: dto.slug, id: { not: orgId } },
      });
      if (existing) {
        throw new ConflictException("Slug already taken");
      }
    }

    // Check subdomain uniqueness if provided
    if (dto.subdomain) {
      const existing = await this.prisma.organization.findFirst({
        where: { subdomain: dto.subdomain, id: { not: orgId } },
      });
      if (existing) {
        throw new ConflictException("Subdomain already taken");
      }
    }

    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.subdomain !== undefined && { subdomain: dto.subdomain }),
        ...(dto.brandColor !== undefined && { brandColor: dto.brandColor }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      },
    });
  }

  async getMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
  }

  async inviteMember(orgId: string, invitedById: string, dto: InviteMemberDto) {
    // Check seat limit
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new BadRequestException("No active subscription");
    }

    const activeMemberCount = await this.prisma.organizationMember.count({
      where: { organizationId: orgId, status: "active" },
    });

    if (activeMemberCount >= subscription.plan.maxTrainees) {
      throw new BadRequestException({
        code: "SEAT_LIMIT_REACHED",
        current: activeMemberCount,
        max: subscription.plan.maxTrainees,
        message: "Seat limit reached. Upgrade your plan to add more members.",
      });
    }

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

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      // User exists — create membership directly
      const member = await this.prisma.organizationMember.create({
        data: {
          organizationId: orgId,
          userId: existingUser.id,
          roleKey: dto.roleKey,
          invitedById,
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      return { member, invited: false };
    }

    // User does not exist — create invite token and send email
    const crypto = await import("crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });

    await this.prisma.inviteToken.create({
      data: {
        token: rawToken,
        tokenHash,
        email: dto.email.toLowerCase(),
        roleKey: dto.roleKey,
        organizationId: orgId,
        invitedByUserId: invitedById,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const inviteLink = `${frontendUrl}/accept-invite?token=${rawToken}`;

    await this.emailService.send(dto.email, "invite-trainee", {
      coachName: org?.name ?? "Your Coach",
      inviteLink,
    });

    return {
      member: null,
      invited: true,
      email: dto.email,
      message: "Invitation email sent",
    };
  }

  async removeMember(orgId: string, memberId: string, requestingUserId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundException("Member not found");
    }

    // Owner cannot remove themselves
    if (member.roleKey === RoleKey.OWNER) {
      throw new BadRequestException("Cannot remove the organization owner");
    }

    await this.prisma.organizationMember.delete({
      where: { id: memberId },
    });

    return { message: "Member removed successfully" };
  }
}
