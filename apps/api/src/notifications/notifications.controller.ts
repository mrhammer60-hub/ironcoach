import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { RegisterTokenDto } from "./dto/register-token.dto";
import { UpdatePrefsDto } from "./dto/update-prefs.dto";
import { CurrentUser } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
@UseGuards(OrganizationGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get("preferences")
  @ApiOperation({ summary: "Get notification preferences" })
  async getPreferences(@CurrentUser("sub") userId: string) {
    return this.service.getPrefs(userId);
  }

  @Put("preferences")
  @ApiOperation({ summary: "Update notification preferences" })
  async updatePreferences(
    @CurrentUser("sub") userId: string,
    @Body() dto: UpdatePrefsDto,
  ) {
    return this.service.updatePrefs(userId, dto);
  }

  @Post("preferences/reset")
  @ApiOperation({ summary: "Reset notification preferences to defaults" })
  async resetPreferences(@CurrentUser("sub") userId: string) {
    return this.service.resetPrefs(userId);
  }

  @Get()
  @ApiOperation({ summary: "List notifications" })
  async getNotifications(
    @CurrentUser("sub") userId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getNotifications(
      userId,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Put("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllRead(@CurrentUser("sub") userId: string) {
    return this.service.markAllRead(userId);
  }

  @Put(":id/read")
  @ApiOperation({ summary: "Mark one notification as read" })
  async markOneRead(
    @Param("id") id: string,
    @CurrentUser("sub") userId: string,
  ) {
    return this.service.markOneRead(id, userId);
  }

  @Post("tokens")
  @ApiOperation({ summary: "Register push notification token" })
  async registerToken(
    @CurrentUser("sub") userId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.service.registerToken(userId, dto.token, dto.platform);
  }
}
