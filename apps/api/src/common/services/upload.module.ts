import { Global, Module } from "@nestjs/common";
import { UploadSecurityService } from "./upload-security.service";
import { R2UploadService } from "./r2-upload.service";
import { UploadsController } from "./uploads.controller";

@Global()
@Module({
  controllers: [UploadsController],
  providers: [UploadSecurityService, R2UploadService],
  exports: [UploadSecurityService, R2UploadService],
})
export class UploadModule {}
