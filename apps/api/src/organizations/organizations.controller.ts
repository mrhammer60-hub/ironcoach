import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OrganizationsService } from "./organizations.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { CurrentUser, Public, Roles } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { RoleKey } from "@ironcoach/db";
import { NotFoundException } from "@nestjs/common";

@ApiTags("Organizations")
@ApiBearerAuth()
@Controller("organizations")
@UseGuards(OrganizationGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Public()
  @Get("by-subdomain/:subdomain")
  @ApiOperation({ summary: "Get public branding by subdomain" })
  async getBySubdomain(@Param("subdomain") subdomain: string) {
    const org = await this.organizationsService.findBySubdomain(subdomain);
    if (!org) throw new NotFoundException("Organization not found");
    return org;
  }

  @Get("me")
  @ApiOperation({ summary: "Get current organization with subscription summary" })
  @ApiResponse({ status: 200, description: "Organization details" })
  async getMyOrganization(@CurrentUser("orgId") orgId: string) {
    return this.organizationsService.getMyOrganization(orgId);
  }

  @Put("me")
  @Roles(RoleKey.OWNER)
  @ApiOperation({ summary: "Update organization branding" })
  @ApiResponse({ status: 200, description: "Organization updated" })
  async updateOrganization(
    @CurrentUser("orgId") orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(orgId, dto);
  }

  @Get("me/members")
  @ApiOperation({ summary: "List organization members" })
  @ApiResponse({ status: 200, description: "Members list" })
  async getMembers(@CurrentUser("orgId") orgId: string) {
    return this.organizationsService.getMembers(orgId);
  }

  @Post("me/members/invite")
  @Roles(RoleKey.OWNER, RoleKey.TRAINER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Invite a member by email" })
  @ApiResponse({ status: 201, description: "Member invited" })
  @ApiResponse({ status: 409, description: "Already a member" })
  async inviteMember(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(orgId, userId, dto);
  }

  @Delete("me/members/:memberId")
  @Roles(RoleKey.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove a member from the organization" })
  @ApiResponse({ status: 200, description: "Member removed" })
  @ApiResponse({ status: 400, description: "Cannot remove owner" })
  async removeMember(
    @CurrentUser("orgId") orgId: string,
    @CurrentUser("sub") userId: string,
    @Param("memberId") memberId: string,
  ) {
    return this.organizationsService.removeMember(orgId, memberId, userId);
  }
}
