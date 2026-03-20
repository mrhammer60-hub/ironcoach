import { BadRequestException, Injectable } from "@nestjs/common";
import * as crypto from "crypto";

export type UploadContext =
  | "exercise_image"
  | "exercise_video"
  | "progress_photo"
  | "chat_image"
  | "chat_file"
  | "avatar"
  | "coach_logo";

const ALLOWED_TYPES: Record<UploadContext, readonly string[]> = {
  exercise_image: ["image/jpeg", "image/webp", "image/png"],
  exercise_video: ["video/mp4", "video/webm"],
  progress_photo: ["image/jpeg", "image/webp", "image/png"],
  chat_image: ["image/jpeg", "image/webp", "image/png", "image/gif"],
  chat_file: ["application/pdf", "image/jpeg", "image/webp", "image/png"],
  avatar: ["image/jpeg", "image/webp", "image/png"],
  coach_logo: ["image/jpeg", "image/webp", "image/png", "image/svg+xml"],
};

const MAX_SIZES: Record<UploadContext, number> = {
  exercise_image: 2 * 1024 * 1024,
  exercise_video: 50 * 1024 * 1024,
  progress_photo: 8 * 1024 * 1024,
  chat_image: 5 * 1024 * 1024,
  chat_file: 10 * 1024 * 1024,
  avatar: 2 * 1024 * 1024,
  coach_logo: 2 * 1024 * 1024,
};

const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/svg+xml": [],
  "video/mp4": [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
  ],
  "video/webm": [[0x1a, 0x45, 0xdf, 0xa3]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
};

const EXTENSION_MAP: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
  "image/png": ["png"],
  "image/gif": ["gif"],
  "image/svg+xml": ["svg"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
  "application/pdf": ["pdf"],
};

@Injectable()
export class UploadSecurityService {
  validateUploadRequest(params: {
    context: UploadContext;
    mimeType: string;
    sizeBytes: number;
    filename: string;
  }): void {
    const { context, mimeType, sizeBytes, filename } = params;

    // 1. Validate MIME type
    const allowed = ALLOWED_TYPES[context];
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException(
        `نوع الملف غير مسموح به. الأنواع المقبولة: ${allowed.join(", ")}`,
      );
    }

    // 2. Validate file size
    const maxSize = MAX_SIZES[context];
    if (sizeBytes > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(0);
      throw new BadRequestException(
        `حجم الملف يتجاوز الحد المسموح (${maxMB} MB)`,
      );
    }

    // 3. Validate extension matches MIME
    const ext = filename.split(".").pop()?.toLowerCase();
    const validExts = EXTENSION_MAP[mimeType] ?? [];
    if (ext && validExts.length > 0 && !validExts.includes(ext)) {
      throw new BadRequestException(
        "امتداد الملف لا يتطابق مع نوعه الفعلي",
      );
    }

    // 4. Reject dangerous filenames
    if (this.isDangerousFilename(filename)) {
      throw new BadRequestException("اسم الملف غير صالح");
    }
  }

  validateFileSignature(
    firstBytes: Buffer,
    expectedMimeType: string,
  ): boolean {
    const signatures = MAGIC_BYTES[expectedMimeType];
    if (!signatures || signatures.length === 0) return true;

    return signatures.some((sig) =>
      sig.every((byte, i) => firstBytes[i] === byte),
    );
  }

  generateStorageKey(params: {
    organizationId: string;
    context: string;
    originalFilename: string;
  }): string {
    const ext =
      params.originalFilename.split(".").pop()?.toLowerCase() ?? "bin";
    const uuid = crypto.randomUUID();
    const date = new Date().toISOString().slice(0, 10);
    return `orgs/${params.organizationId}/${params.context}/${date}/${uuid}.${ext}`;
  }

  private isDangerousFilename(filename: string): boolean {
    const dangerous = /(\.\.|\/|\\|<|>|:|"|'|\||\?|\*|%00)/;
    const dangerousExtensions =
      /\.(exe|bat|sh|php|py|rb|js|ts|html|htm)$/i;
    return dangerous.test(filename) || dangerousExtensions.test(filename);
  }
}
