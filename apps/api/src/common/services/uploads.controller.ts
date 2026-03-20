import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { R2UploadService } from "./r2-upload.service";
import { CurrentUser } from "../decorators";
import { OrganizationGuard } from "../guards/organization.guard";
import type { UploadContext } from "./upload-security.service";

@ApiTags("Uploads")
@ApiBearerAuth()
@Controller("uploads")
@UseGuards(OrganizationGuard)
export class UploadsController {
  constructor(private readonly r2: R2UploadService) {}

  @Post("presign")
  @ApiOperation({ summary: "Get presigned upload URL" })
  async presign(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Body()
    body: {
      filename: string;
      mimeType: string;
      sizeBytes: number;
      context: UploadContext;
    },
  ) {
    return this.r2.createPresignedUploadUrl({
      organizationId: orgId,
      uploadedByUserId: userId,
      context: body.context,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      filename: body.filename,
    });
  }

  @Post("confirm")
  @ApiOperation({ summary: "Confirm upload completed" })
  async confirm(@Body() body: { key: string }) {
    const confirmed = await this.r2.confirmUpload(body.key);
    if (!confirmed) {
      throw new BadRequestException("الملف لم يُرفع بعد");
    }
    return { confirmed: true };
  }
}
