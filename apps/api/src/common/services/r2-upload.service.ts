import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaService } from "../../prisma/prisma.service";
import { UploadSecurityService, type UploadContext } from "./upload-security.service";

@Injectable()
export class R2UploadService {
  private readonly logger = new Logger(R2UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadSecurity: UploadSecurityService,
  ) {
    this.bucket = process.env.R2_BUCKET || "ironcoach";
    this.publicUrl = process.env.R2_PUBLIC_URL || "https://cdn.ironcoach.com";

    this.s3Client = new S3Client({
      region: "auto",
      endpoint:
        process.env.R2_ENDPOINT ||
        `https://${process.env.R2_ACCOUNT_ID || "account"}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY || "",
        secretAccessKey: process.env.R2_SECRET_KEY || "",
      },
    });
  }

  async createPresignedUploadUrl(params: {
    organizationId: string;
    uploadedByUserId: string;
    context: UploadContext;
    mimeType: string;
    sizeBytes: number;
    filename: string;
  }): Promise<{
    uploadUrl: string;
    cdnUrl: string;
    key: string;
    expiresAt: Date;
  }> {
    this.uploadSecurity.validateUploadRequest({
      context: params.context,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      filename: params.filename,
    });

    const key = this.uploadSecurity.generateStorageKey({
      organizationId: params.organizationId,
      context: params.context,
      originalFilename: params.filename,
    });

    const expiresIn = 15 * 60; // 15 minutes

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.mimeType,
      ContentLength: params.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    const cdnUrl = `${this.publicUrl}/${key}`;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Track in MediaAsset table (pending until confirmed)
    await this.prisma.mediaAsset.create({
      data: {
        organizationId: params.organizationId,
        uploadedByUserId: params.uploadedByUserId,
        bucket: this.bucket,
        key,
        cdnUrl,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
        entityType: params.context,
      },
    });

    return { uploadUrl, cdnUrl, key, expiresAt };
  }

  async confirmUpload(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const result = await this.s3Client.send(command);

      await this.prisma.mediaAsset.update({
        where: { key },
        data: {
          confirmedAt: new Date(),
          sizeBytes: result.ContentLength ?? 0,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async cleanupUnconfirmedUploads(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const orphaned = await this.prisma.mediaAsset.findMany({
      where: { confirmedAt: null, createdAt: { lt: oneHourAgo } },
    });

    for (const asset of orphaned) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: asset.key }),
        );
      } catch {
        this.logger.warn(`Failed to delete orphaned R2 object: ${asset.key}`);
      }
      await this.prisma.mediaAsset.delete({ where: { id: asset.id } });
    }

    if (orphaned.length > 0) {
      this.logger.log(`Cleaned up ${orphaned.length} unconfirmed uploads`);
    }
  }
}
