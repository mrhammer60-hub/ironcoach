import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { R2UploadService } from "../common/services/r2-upload.service";
import { SubmitCheckinDto } from "./dto/submit-checkin.dto";
import { ReviewCheckinDto } from "./dto/review-checkin.dto";

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly r2: R2UploadService,
  ) {}

  // ─── Check-ins ────────────────────────────────────────────────────────────

  async submitCheckin(userId: string, orgId: string, dto: SubmitCheckinDto): Promise<any> {
    const profile = await this.getProfile(userId);

    const checkin = await this.prisma.checkin.create({
      data: {
        organizationId: orgId,
        traineeProfileId: profile.id,
        trainerId: profile.assignedTrainerId || "",
        weightKg: dto.weightKg ?? null,
        waistCm: dto.waistCm ?? null,
        chestCm: dto.chestCm ?? null,
        hipsCm: dto.hipsCm ?? null,
        armsCm: dto.armsCm ?? null,
        thighsCm: dto.thighsCm ?? null,
        sleepScore: dto.sleepScore ?? null,
        energyScore: dto.energyScore ?? null,
        adherenceScore: dto.adherenceScore ?? null,
        notes: dto.notes ?? null,
      },
    });

    // Update weight on profile
    if (dto.weightKg) {
      await this.prisma.traineeProfile.update({
        where: { id: profile.id },
        data: { currentWeightKg: dto.weightKg },
      });
    }

    // Notify trainer
    if (profile.assignedTrainerId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true },
      });
      await this.notifications.send({
        userId: profile.assignedTrainerId,
        organizationId: orgId,
        type: "CHECKIN_REMINDER",
        title: `تسجيل وصول جديد من ${user?.firstName} 📏`,
        body: dto.notes?.slice(0, 100) || "تسجيل وصول أسبوعي جديد",
      });
    }

    return checkin;
  }

  async getMyCheckins(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    return this.prisma.checkin.findMany({
      where: { traineeProfileId: profile.id },
      orderBy: { submittedAt: "desc" },
      take: 20,
    });
  }

  async getPendingCheckins(orgId: string): Promise<any> {
    return this.prisma.checkin.findMany({
      where: { organizationId: orgId, reviewedAt: null },
      include: {
        traineeProfile: {
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  async getCheckinById(id: string): Promise<any> {
    const checkin = await this.prisma.checkin.findUnique({
      where: { id },
      include: {
        traineeProfile: {
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
        progressPhotos: true,
      },
    });
    if (!checkin) throw new NotFoundException("Check-in not found");
    return checkin;
  }

  async reviewCheckin(id: string, orgId: string, dto: ReviewCheckinDto): Promise<any> {
    const checkin = await this.prisma.checkin.findFirst({
      where: { id, organizationId: orgId },
      include: { traineeProfile: true },
    });
    if (!checkin) throw new NotFoundException("Check-in not found");

    const updated = await this.prisma.checkin.update({
      where: { id },
      data: { coachResponse: dto.coachResponse, reviewedAt: new Date() },
    });

    // Notify trainee
    await this.notifications.send({
      userId: checkin.traineeProfile.userId,
      organizationId: orgId,
      type: "CHECKIN_REMINDER",
      title: "ردّ مدربك على تسجيل وصولك 💬",
      body: dto.coachResponse.slice(0, 100),
    });

    return updated;
  }

  // ─── Photos ───────────────────────────────────────────────────────────────

  async getPhotoUploadUrls(userId: string, orgId: string) {
    const profile = await this.getProfile(userId);
    const types = ["front", "side", "back"] as const;

    const urls: Record<string, { uploadUrl: string; cdnUrl: string; key: string }> = {};

    for (const type of types) {
      const result = await this.r2.createPresignedUploadUrl({
        organizationId: orgId,
        uploadedByUserId: userId,
        context: "progress_photo",
        mimeType: "image/jpeg",
        sizeBytes: 8 * 1024 * 1024,
        filename: `${type}.jpg`,
      });
      urls[type] = { uploadUrl: result.uploadUrl, cdnUrl: result.cdnUrl, key: result.key };
    }

    return urls;
  }

  async savePhotos(
    userId: string,
    orgId: string,
    photos: Array<{ photoType: string; imageUrl: string; checkinId?: string }>,
  ): Promise<any> {
    const profile = await this.getProfile(userId);

    return this.prisma.progressPhoto.createMany({
      data: photos.map((p) => ({
        organizationId: orgId,
        traineeProfileId: profile.id,
        checkinId: p.checkinId ?? null,
        photoType: p.photoType,
        imageUrl: p.imageUrl,
      })),
    });
  }

  async getMyPhotos(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    return this.prisma.progressPhoto.findMany({
      where: { traineeProfileId: profile.id },
      orderBy: { capturedAt: "desc" },
      take: 30,
    });
  }

  // ─── Trainee Progress Overview (Coach view) ──────────────────────────────

  async getTraineeProgress(traineeId: string, orgId: string): Promise<any> {
    const profile = await this.prisma.traineeProfile.findFirst({
      where: { id: traineeId, organizationId: orgId },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    if (!profile) throw new NotFoundException("Trainee not found");

    const [measurements, checkins, strengthPRs, photos, workoutCount, recentLogs] =
      await Promise.all([
        this.prisma.bodyMeasurement.findMany({
          where: { traineeProfileId: traineeId },
          orderBy: { recordedAt: "desc" },
          take: 12,
        }),
        this.prisma.checkin.findMany({
          where: { traineeProfileId: traineeId },
          orderBy: { submittedAt: "desc" },
          take: 8,
        }),
        this.prisma.strengthPR.findMany({
          where: { traineeProfileId: traineeId },
          include: { exercise: { select: { nameEn: true, nameAr: true } } },
          orderBy: { achievedAt: "desc" },
        }),
        this.prisma.progressPhoto.findMany({
          where: { traineeProfileId: traineeId },
          orderBy: { capturedAt: "desc" },
          take: 12,
        }),
        this.prisma.workoutLog.count({
          where: { traineeProfileId: traineeId, completedAt: { not: null } },
        }),
        this.prisma.workoutLog.findMany({
          where: { traineeProfileId: traineeId, completedAt: { not: null } },
          orderBy: { completedAt: "desc" },
          take: 1,
          select: { completedAt: true },
        }),
      ]);

    const current = measurements[0];
    const starting = measurements[measurements.length - 1];

    return {
      trainee: {
        id: profile.id,
        name: `${profile.user.firstName} ${profile.user.lastName}`,
        avatarUrl: profile.user.avatarUrl,
        goal: profile.goal,
      },
      currentStats: current
        ? {
            weightKg: Number(current.weightKg),
            bodyFatPct: current.bodyFatPercentage ? Number(current.bodyFatPercentage) : null,
            waistCm: current.waistCm ? Number(current.waistCm) : null,
          }
        : null,
      startingStats: starting
        ? {
            weightKg: Number(starting.weightKg),
            bodyFatPct: starting.bodyFatPercentage ? Number(starting.bodyFatPercentage) : null,
          }
        : null,
      delta: current && starting
        ? { weightKg: Number(current.weightKg) - Number(starting.weightKg) }
        : null,
      weightHistory: measurements.map((m) => ({
        date: m.recordedAt,
        weightKg: Number(m.weightKg),
      })),
      strengthPRs: strengthPRs.map((pr) => ({
        exerciseId: pr.exerciseId,
        exerciseName: pr.exercise.nameEn,
        exerciseNameAr: pr.exercise.nameAr,
        weightKg: Number(pr.weightKg),
        reps: pr.reps,
        achievedAt: pr.achievedAt,
      })),
      workoutStats: {
        totalCompleted: workoutCount,
        lastSessionAt: recentLogs[0]?.completedAt ?? null,
      },
      checkins: checkins.map((c) => ({
        id: c.id,
        submittedAt: c.submittedAt,
        weightKg: c.weightKg ? Number(c.weightKg) : null,
        notes: c.notes,
        coachResponse: c.coachResponse,
        reviewedAt: c.reviewedAt,
      })),
      photos: photos.map((p) => ({
        id: p.id,
        photoType: p.photoType,
        imageUrl: p.imageUrl,
        capturedAt: p.capturedAt,
      })),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getProfile(userId: string) {
    const profile = await this.prisma.traineeProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException("Trainee profile not found");
    return profile;
  }
}
