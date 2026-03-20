import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "./token.service";
import { EmailService } from "../emails/email.service";
import { RegisterDto, LoginDto, ResetPasswordDto, AcceptInviteDto } from "./dto";
import type { JwtPayload } from "../common/decorators";
import { RoleKey } from "@ironcoach/db";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const slug = await this.generateUniqueSlug(dto.email);

    // Transaction: create User + Organization + OrganizationMember + TrainerProfile
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone || null,
        },
      });

      const orgName = `${dto.firstName}'s Coaching`;
      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          subdomain: slug,
          ownerUserId: user.id,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          roleKey: RoleKey.OWNER,
        },
      });

      await tx.trainerProfile.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
        },
      });

      return { user, organization };
    });

    // Generate tokens
    const payload: JwtPayload = {
      sub: result.user.id,
      orgId: result.organization.id,
      role: RoleKey.OWNER,
      email: result.user.email,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(
      result.user.id,
    );

    // Generate email verification token (log for now, send in Step 17)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    await this.prisma.user.update({
      where: { id: result.user.id },
      data: { emailVerificationToken: verificationHash },
    });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    await this.emailService.send(result.user.email, "verify-email", {
      firstName: result.user.firstName,
      verifyLink,
    });

    // Send welcome email
    await this.emailService.send(result.user.email, "welcome-coach", {
      firstName: result.user.firstName,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        avatarUrl: result.user.avatarUrl,
        role: RoleKey.OWNER,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        organizationMembers: {
          where: { status: "active" },
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    const membership = user.organizationMembers[0];

    // ADMIN users have no org membership — orgId should be null, not empty string
    const payload: JwtPayload = {
      sub: user.id,
      orgId: membership?.organizationId ?? null,
      role: membership?.roleKey || "ADMIN",
      email: user.email,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: membership?.roleKey || "ADMIN",
      },
      organization: membership
        ? {
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
          }
        : null,
    };
  }

  async refresh(rawToken: string) {
    return this.tokenService.rotateRefreshToken(rawToken);
  }

  async logout(rawToken: string) {
    await this.tokenService.revokeRefreshToken(rawToken);
  }

  async forgotPassword(email: string) {
    // Always return success to prevent user enumeration
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1); // 1 hour

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetHash,
          passwordResetExpiry: expiry,
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
      await this.emailService.send(user.email, "reset-password", {
        firstName: user.firstName,
        resetLink,
      });
    }

    return { message: "If that email exists, a reset link has been sent" };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(dto.token)
      .digest("hex");

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    // Revoke all refresh tokens for security
    await this.tokenService.revokeAllUserTokens(user.id);

    return { message: "Password reset successfully" };
  }

  async verifyEmail(token: string) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: tokenHash },
    });

    if (!user) {
      throw new BadRequestException("Invalid verification token");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      },
    });

    return { message: "Email verified successfully" };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        locale: true,
        timezone: true,
        organizationMembers: {
          where: { status: "active" },
          select: {
            roleKey: true,
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const membership = user.organizationMembers[0];
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      timezone: user.timezone,
      role: membership?.roleKey || "ADMIN",
      organization: membership
        ? {
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
          }
        : null,
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(dto.token)
      .digest("hex");

    const invite = await this.prisma.inviteToken.findUnique({
      where: { tokenHash },
      include: { organization: true },
    });

    if (!invite) {
      throw new BadRequestException("Invalid invite token");
    }

    if (invite.acceptedAt) {
      throw new BadRequestException("Invite has already been accepted");
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException("Invite token has expired");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create or update user
      let user = await tx.user.findUnique({
        where: { email: invite.email.toLowerCase() },
      });

      if (user) {
        // User exists but was invited — update password if not set
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            emailVerifiedAt: new Date(),
          },
        });
      } else {
        user = await tx.user.create({
          data: {
            email: invite.email.toLowerCase(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            emailVerifiedAt: new Date(),
          },
        });
      }

      // Create organization membership
      await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: invite.organizationId,
            userId: user.id,
          },
        },
        update: { roleKey: invite.roleKey },
        create: {
          organizationId: invite.organizationId,
          userId: user.id,
          roleKey: invite.roleKey,
          invitedById: invite.invitedByUserId,
        },
      });

      // Mark invite as accepted
      await tx.inviteToken.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return user;
    });

    // Generate tokens
    const payload: JwtPayload = {
      sub: result.id,
      orgId: invite.organizationId,
      role: invite.roleKey,
      email: result.email,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(result.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        avatarUrl: result.avatarUrl,
        role: invite.roleKey,
      },
      organization: {
        id: invite.organization.id,
        name: invite.organization.name,
        slug: invite.organization.slug,
      },
    };
  }

  private async generateUniqueSlug(email: string): Promise<string> {
    const prefix = email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    for (let attempt = 0; attempt < 5; attempt++) {
      const hex = crypto.randomBytes(2).toString("hex"); // 4-char hex
      const slug = `${prefix}-${hex}`;

      const existing = await this.prisma.organization.findFirst({
        where: { OR: [{ slug }, { subdomain: slug }] },
      });

      if (!existing) return slug;
    }

    // Fallback with longer random
    return `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
  }
}
