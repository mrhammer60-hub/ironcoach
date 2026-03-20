import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AdminService } from "./admin.service";
import { ImpersonationService } from "./impersonation.service";
import { CurrentUser, Roles } from "../common/decorators";
import { RoleKey } from "@ironcoach/db";
import { SuspendOrgDto, DeleteOrgDto } from "./dto/suspend-org.dto";
import { AnnouncementDto } from "./dto/announcement.dto";
import { ReplyTicketDto } from "./dto/reply-ticket.dto";

@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin")
@Roles(RoleKey.ADMIN)
@Throttle({ medium: { limit: 60, ttl: 60000 } })
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly impersonationService: ImpersonationService,
  ) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get("dashboard")
  @ApiOperation({ summary: "Platform-wide KPIs" })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get("revenue")
  @ApiOperation({ summary: "Revenue analytics" })
  async getRevenue() {
    return this.adminService.getRevenue();
  }

  // ─── Coaches ──────────────────────────────────────────────────────────────

  @Get("coaches")
  @ApiOperation({ summary: "List all organizations" })
  async listCoaches(
    @Query("status") status?: string,
    @Query("plan") plan?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.listCoaches({
      status,
      plan,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get("coaches/:orgId")
  @ApiOperation({ summary: "Organization detail" })
  async getCoachDetail(@Param("orgId") orgId: string) {
    return this.adminService.getCoachDetail(orgId);
  }

  @Put("coaches/:orgId/suspend")
  @ApiOperation({ summary: "Suspend organization" })
  async suspendOrg(
    @Param("orgId") orgId: string,
    @Body() dto: SuspendOrgDto,
  ) {
    return this.adminService.suspendOrg(orgId, dto.reason);
  }

  @Put("coaches/:orgId/unsuspend")
  @ApiOperation({ summary: "Restore organization" })
  async unsuspendOrg(@Param("orgId") orgId: string) {
    return this.adminService.unsuspendOrg(orgId);
  }

  @Delete("coaches/:orgId")
  @ApiOperation({ summary: "Hard delete organization (GDPR)" })
  async deleteOrg(
    @Param("orgId") orgId: string,
    @Body() dto: DeleteOrgDto,
  ) {
    return this.adminService.deleteOrg(orgId, dto.confirmationPhrase);
  }

  @Post("coaches/:orgId/impersonate")
  @ApiOperation({ summary: "Generate impersonation JWT (1 hour)" })
  async impersonate(
    @Param("orgId") orgId: string,
    @CurrentUser("sub") adminId: string,
  ) {
    return this.impersonationService.impersonate(orgId, adminId);
  }

  // ─── Trainees ────────────────────────────────────────────────────────────

  @Get("trainees")
  @ApiOperation({ summary: "List all trainees across organizations" })
  async getAllTrainees(
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getAllTrainees({
      search,
      page: parseInt(page || "1"),
      limit: parseInt(limit || "20"),
    });
  }

  // ─── Exercises ────────────────────────────────────────────────────────────

  @Get("exercises")
  @ApiOperation({ summary: "List global exercises" })
  async listExercises(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.listGlobalExercises(
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Post("exercises/:id/approve")
  @ApiOperation({ summary: "Approve exercise as global" })
  async approveExercise(@Param("id") id: string) {
    return this.adminService.approveExerciseAsGlobal(id);
  }

  // ─── Support ──────────────────────────────────────────────────────────────

  @Get("support")
  @ApiOperation({ summary: "List support tickets" })
  async listTickets(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.listTickets(
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Put("support/:ticketId/assign")
  @ApiOperation({ summary: "Assign ticket to admin" })
  async assignTicket(
    @Param("ticketId") ticketId: string,
    @CurrentUser("sub") adminId: string,
  ) {
    return this.adminService.assignTicket(ticketId, adminId);
  }

  @Put("support/:ticketId/resolve")
  @ApiOperation({ summary: "Resolve ticket" })
  async resolveTicket(@Param("ticketId") ticketId: string) {
    return this.adminService.resolveTicket(ticketId);
  }

  // ─── Announcements & System ───────────────────────────────────────────────

  @Post("announcements")
  @ApiOperation({ summary: "Send announcement to filtered users" })
  async sendAnnouncement(
    @Body() dto: AnnouncementDto,
    @CurrentUser("sub") adminId: string,
  ) {
    return this.adminService.sendAnnouncement(dto, adminId);
  }

  @Get("audit-logs")
  @ApiOperation({ summary: "Paginated audit logs" })
  async getAuditLogs(
    @Query("action") action?: string,
    @Query("entityType") entityType?: string,
    @Query("actorUserId") actorUserId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getAuditLogs({
      action,
      entityType,
      actorUserId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get("feature-flags")
  @ApiOperation({ summary: "List feature flags" })
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Put("feature-flags/:id")
  @ApiOperation({ summary: "Toggle feature flag" })
  async toggleFeatureFlag(
    @Param("id") id: string,
    @Body() body: { isEnabled: boolean },
  ) {
    return this.adminService.toggleFeatureFlag(id, body.isEnabled);
  }

  @Get("system/health")
  @ApiOperation({ summary: "System health check" })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
