# Prompt 21 — File Upload Security

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 07 complete (R2 upload service exists).
> **هذا الـ prompt ناقص كلياً من الحزمة الأصلية.**

---

## Task

تأمين كل عمليات رفع الملفات في المنصة — التحقق من نوع الملف الفعلي، حدود الحجم، والحماية من الملفات الخبيثة.

---

## Part A: Upload Security Service

### `apps/api/src/common/services/upload-security.service.ts`

```typescript
@Injectable()
export class UploadSecurityService {

  // Allowed MIME types per upload context
  private readonly ALLOWED_TYPES = {
    exercise_image:   ['image/jpeg', 'image/webp', 'image/png'],
    exercise_video:   ['video/mp4', 'video/webm'],
    progress_photo:   ['image/jpeg', 'image/webp', 'image/png'],
    chat_image:       ['image/jpeg', 'image/webp', 'image/png', 'image/gif'],
    chat_file:        ['application/pdf', 'image/jpeg', 'image/webp', 'image/png'],
    avatar:           ['image/jpeg', 'image/webp', 'image/png'],
    coach_logo:       ['image/jpeg', 'image/webp', 'image/png', 'image/svg+xml'],
  } as const

  // Max file sizes in bytes
  private readonly MAX_SIZES = {
    exercise_image:   2 * 1024 * 1024,   //  2 MB
    exercise_video:  50 * 1024 * 1024,   // 50 MB
    progress_photo:   8 * 1024 * 1024,   //  8 MB
    chat_image:       5 * 1024 * 1024,   //  5 MB
    chat_file:       10 * 1024 * 1024,   // 10 MB
    avatar:           2 * 1024 * 1024,   //  2 MB
    coach_logo:       2 * 1024 * 1024,   //  2 MB
  }

  // Magic bytes (file signatures) for validation
  // These cannot be faked by renaming the file
  private readonly MAGIC_BYTES: Record<string, number[][]> = {
    'image/jpeg':  [[0xFF, 0xD8, 0xFF]],
    'image/webp':  [[0x52, 0x49, 0x46, 0x46]],  // RIFF header
    'image/png':   [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif':   [[0x47, 0x49, 0x46, 0x38]],
    'image/svg+xml': [],  // SVG is text — validate differently
    'video/mp4':   [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
                    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]],
    'video/webm':  [[0x1A, 0x45, 0xDF, 0xA3]],
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],  // %PDF
  }

  validateUploadRequest(params: {
    context: keyof typeof this.ALLOWED_TYPES
    mimeType: string
    sizeBytes: number
    filename: string
  }): void {
    const { context, mimeType, sizeBytes, filename } = params

    // 1. Validate MIME type against allowed list for this context
    const allowed = this.ALLOWED_TYPES[context] as readonly string[]
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException(
        `نوع الملف غير مسموح به. الأنواع المقبولة: ${allowed.join(', ')}`
      )
    }

    // 2. Validate file size
    const maxSize = this.MAX_SIZES[context]
    if (sizeBytes > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(0)
      throw new BadRequestException(`حجم الملف يتجاوز الحد المسموح (${maxMB} MB)`)
    }

    // 3. Validate file extension matches MIME type
    const ext = filename.split('.').pop()?.toLowerCase()
    const validExtensions = this.getValidExtensions(mimeType)
    if (ext && validExtensions.length > 0 && !validExtensions.includes(ext)) {
      throw new BadRequestException('امتداد الملف لا يتطابق مع نوعه الفعلي')
    }

    // 4. Reject dangerous file names
    if (this.isDangerousFilename(filename)) {
      throw new BadRequestException('اسم الملف غير صالح')
    }
  }

  async validateFileSignature(
    firstBytes: Buffer,
    expectedMimeType: string
  ): Promise<boolean> {
    const signatures = this.MAGIC_BYTES[expectedMimeType]
    if (!signatures || signatures.length === 0) return true  // Skip for SVG

    return signatures.some(sig =>
      sig.every((byte, i) => firstBytes[i] === byte)
    )
  }

  private getValidExtensions(mimeType: string): string[] {
    const map: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/webp': ['webp'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/svg+xml': ['svg'],
      'video/mp4': ['mp4'],
      'video/webm': ['webm'],
      'application/pdf': ['pdf'],
    }
    return map[mimeType] ?? []
  }

  private isDangerousFilename(filename: string): boolean {
    // Block path traversal and dangerous patterns
    const dangerous = /(\.\.|\/|\\|<|>|:|"|'|\||\?|\*|%00)/
    const dangerousExtensions = /\.(exe|bat|sh|php|py|rb|js|ts|html|htm|svg|xml)$/i
    return dangerous.test(filename) || dangerousExtensions.test(filename)
  }

  // Generate safe, unique R2 key for storage
  generateStorageKey(params: {
    organizationId: string
    context: string
    originalFilename: string
  }): string {
    const { organizationId, context, originalFilename } = params
    const ext = originalFilename.split('.').pop()?.toLowerCase() ?? 'bin'
    const uuid = crypto.randomUUID()
    const date = new Date().toISOString().slice(0, 10)  // YYYY-MM-DD
    // Example: orgs/org-123/exercise-images/2026-03-17/abc-def.jpg
    return `orgs/${organizationId}/${context}/${date}/${uuid}.${ext}`
  }
}
```

---

## Part B: Secure Presigned URL Generation

### Update `apps/api/src/common/services/r2-upload.service.ts`

```typescript
@Injectable()
export class R2UploadService {
  constructor(private readonly uploadSecurity: UploadSecurityService) {}

  async createPresignedUploadUrl(params: {
    organizationId: string
    context: UploadContext
    mimeType: string
    sizeBytes: number
    filename: string
  }): Promise<{ uploadUrl: string; cdnUrl: string; key: string; expiresAt: Date }> {

    // Validate before issuing URL
    this.uploadSecurity.validateUploadRequest({
      context: params.context,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      filename: params.filename,
    })

    const key = this.uploadSecurity.generateStorageKey({
      organizationId: params.organizationId,
      context: params.context,
      originalFilename: params.filename,
    })

    const expiresIn = 15 * 60  // 15 minutes

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      ContentType: params.mimeType,
      ContentLength: params.sizeBytes,
      // Prevent overwriting existing files
      IfNoneMatch: '*',
      // Tag for lifecycle policies
      Tagging: `context=${params.context}&orgId=${params.organizationId}`,
    })

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
      // Enforce content type in presigned URL
      signableHeaders: new Set(['content-type', 'content-length']),
    })

    const cdnUrl = `${env.R2_PUBLIC_URL}/${key}`
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    // Track in MediaAsset table (status: pending — confirmed after upload)
    await this.prisma.mediaAsset.create({
      data: {
        organizationId: params.organizationId,
        uploadedByUserId: params.uploadedByUserId,
        bucket: env.R2_BUCKET,
        key,
        cdnUrl,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
        entityType: params.context,
      },
    })

    return { uploadUrl, cdnUrl, key, expiresAt }
  }

  // Called by client after upload completes to verify file exists
  async confirmUpload(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key })
      const result = await this.s3Client.send(command)
      // Mark MediaAsset as confirmed
      await this.prisma.mediaAsset.update({
        where: { key },
        data: { confirmedAt: new Date(), sizeBytes: result.ContentLength },
      })
      return true
    } catch {
      return false
    }
  }

  // Cleanup orphaned uploads (MediaAssets without confirmedAt older than 1 hour)
  // Runs as a scheduled BullMQ job daily
  async cleanupUnconfirmedUploads(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const orphaned = await this.prisma.mediaAsset.findMany({
      where: { confirmedAt: null, createdAt: { lt: oneHourAgo } },
    })
    for (const asset of orphaned) {
      await this.s3Client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: asset.key }))
      await this.prisma.mediaAsset.delete({ where: { id: asset.id } })
    }
  }
}
```

---

## Part C: Add `confirmedAt` to MediaAsset

In `02-database.md` MediaAsset model, add:
```prisma
confirmedAt  DateTime?   // null until client confirms upload completed
```

---

## Part D: Upload Confirmation Endpoint

Add to `apps/api/src/exercises/exercises.controller.ts` and similar:

```typescript
// After client uploads directly to R2, they call this to confirm
@Post('confirm-upload')
@UseGuards(JwtAuthGuard)
async confirmUpload(@Body() body: { key: string }) {
  const confirmed = await this.r2UploadService.confirmUpload(body.key)
  if (!confirmed) throw new BadRequestException('الملف لم يُرفع بعد')
  return { success: true, cdnUrl: `${env.R2_PUBLIC_URL}/${body.key}` }
}
```

---

## Part E: Client-Side Upload Flow

### `apps/web/lib/upload.ts`

```typescript
export async function uploadFile(params: {
  file: File
  context: UploadContext
  onProgress?: (pct: number) => void
}): Promise<string> {
  const { file, context, onProgress } = params

  // 1. Get presigned URL from API
  const { uploadUrl, cdnUrl, key } = await api.post<PresignedUrlResponse>(
    `/${context}/upload-url`,
    {
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }
  )

  // 2. Upload directly to R2 with progress tracking
  await uploadWithProgress(uploadUrl, file, file.type, onProgress)

  // 3. Confirm upload with API
  await api.post('/confirm-upload', { key })

  return cdnUrl
}

async function uploadWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) resolve()
      else reject(new Error(`Upload failed: ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Upload network error'))
    xhr.send(file)
  })
}
```

---

## Part F: Add `upload-security` to BullMQ scheduled jobs

In `apps/api/src/queue/jobs/cleanup-uploads.job.ts`:
```typescript
@Processor('upload-cleanup')
export class CleanupUploadsJob {
  @Process()
  async handle() {
    await this.r2UploadService.cleanupUnconfirmedUploads()
  }
}
// Runs daily at 3:00 AM
```

---

## Output Requirements

- Presigned URL is rejected if MIME type is not in allowed list
- File extension must match MIME type — `image.jpg` with MIME `video/mp4` is rejected
- Max sizes enforced at URL generation time (not just client-side)
- Dangerous filenames (path traversal, executable extensions) rejected
- Unconfirmed uploads cleaned up automatically after 1 hour
- `UploadSecurityService` has unit tests covering all rejection cases
