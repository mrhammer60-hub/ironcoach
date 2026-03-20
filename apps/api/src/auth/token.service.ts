import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { jwtConfig } from "../config/jwt.config";
import type { JwtPayload } from "../common/decorators";

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwt.sign(payload);
  }

  async generateRefreshToken(
    userId: string,
    deviceInfo?: string,
    ip?: string,
  ): Promise<string> {
    const raw = crypto.randomBytes(64).toString("hex");
    const tokenHash = this.hashToken(raw);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        deviceInfo: deviceInfo || null,
        ipAddress: ip || null,
      },
    });

    return raw;
  }

  async rotateRefreshToken(
    rawToken: string,
    deviceInfo?: string,
    ip?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(rawToken);

    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            organizationMembers: {
              where: { status: "active" },
              take: 1,
            },
          },
        },
      },
    });

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    if (!existing.user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    // Determine org/role from membership
    const membership = existing.user.organizationMembers[0];
    const payload: JwtPayload = {
      sub: existing.userId,
      orgId: membership?.organizationId || "",
      role: membership?.roleKey || "ADMIN",
      email: existing.user.email,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(
      existing.userId,
      deviceInfo,
      ip,
    );

    return { accessToken, refreshToken };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);

    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (existing && !existing.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(raw: string): string {
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}
