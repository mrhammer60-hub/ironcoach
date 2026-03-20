import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BillingService } from "./billing.service";
import { WebhookService } from "./webhook.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { UpgradePlanDto } from "./dto/upgrade-plan.dto";
import { CurrentUser, Public, Roles } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";
import { RoleKey } from "@ironcoach/db";
import type { FastifyRequest } from "fastify";

@ApiTags("Billing")
@Controller("billing")
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post("create-checkout")
  @ApiBearerAuth()
  @UseGuards(OrganizationGuard)
  @Roles(RoleKey.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create a Stripe Checkout session" })
  @ApiResponse({ status: 200, description: "Returns checkout URL" })
  async createCheckout(
    @CurrentUser("orgId") orgId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.billingService.createCheckout(orgId, dto.planCode);
  }

  @Get("subscription")
  @ApiBearerAuth()
  @UseGuards(OrganizationGuard)
  @ApiOperation({ summary: "Get current subscription and usage" })
  @ApiResponse({ status: 200, description: "Subscription details" })
  async getSubscription(@CurrentUser("orgId") orgId: string) {
    return this.billingService.getSubscription(orgId);
  }

  @Post("portal")
  @ApiBearerAuth()
  @UseGuards(OrganizationGuard)
  @Roles(RoleKey.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create a Stripe Customer Portal session" })
  @ApiResponse({ status: 200, description: "Returns portal URL" })
  async createPortalSession(@CurrentUser("orgId") orgId: string) {
    return this.billingService.createPortalSession(orgId);
  }

  @Put("upgrade")
  @ApiBearerAuth()
  @UseGuards(OrganizationGuard)
  @Roles(RoleKey.OWNER)
  @ApiOperation({ summary: "Upgrade subscription plan" })
  @ApiResponse({ status: 200, description: "Plan upgraded" })
  async upgradePlan(
    @CurrentUser("orgId") orgId: string,
    @Body() dto: UpgradePlanDto,
  ) {
    return this.billingService.upgradePlan(orgId, dto.planCode);
  }

  @Delete("cancel")
  @ApiBearerAuth()
  @UseGuards(OrganizationGuard)
  @Roles(RoleKey.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel subscription at period end" })
  @ApiResponse({ status: 200, description: "Subscription scheduled for cancellation" })
  async cancelSubscription(@CurrentUser("orgId") orgId: string) {
    return this.billingService.cancelSubscription(orgId);
  }

  @Public()
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Stripe webhook handler" })
  @ApiResponse({ status: 200, description: "Webhook processed" })
  async handleWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() req: FastifyRequest,
  ) {
    const rawBody = (req as any).rawBody as Buffer;
    await this.webhookService.handleWebhook(signature, rawBody);
    return { received: true };
  }
}
