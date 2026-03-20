import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { stripe } from "../config/stripe.config";
import { PlanCode } from "@ironcoach/db";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCheckout(orgId: string, planCode: PlanCode) {
    const plan = await this.prisma.plan.findUnique({
      where: { code: planCode },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException("Plan not found");
    }

    const featuresJson = plan.featuresJson as Record<string, unknown>;
    const stripePriceId = featuresJson.stripePriceId as string | undefined;

    if (!stripePriceId) {
      throw new BadRequestException("Plan does not have a Stripe price configured");
    }

    // Get or create Stripe customer
    let subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    let customerId: string;

    if (subscription?.stripeCustomerId) {
      customerId = subscription.stripeCustomerId;
    } else {
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        include: { owner: true },
      });

      const customer = await stripe.customers.create({
        email: org!.owner.email,
        metadata: { organizationId: orgId },
      });

      customerId = customer.id;
    }

    const successUrl =
      process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/billing/success";
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL || "http://localhost:3000/billing/cancel";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { organizationId: orgId },
    });

    return { url: session.url };
  }

  async getSubscription(orgId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
      include: { plan: true },
    });

    if (!subscription) {
      return { subscription: null };
    }

    const activeTrainees = await this.prisma.organizationMember.count({
      where: { organizationId: orgId, roleKey: "TRAINEE", status: "active" },
    });

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        plan: {
          code: subscription.plan.code,
          name: subscription.plan.name,
          monthlyPrice: Number(subscription.plan.monthlyPrice),
          maxTrainees: subscription.plan.maxTrainees,
        },
      },
      usage: {
        activeTrainees,
        maxTrainees: subscription.plan.maxTrainees,
        percentUsed: Math.round(
          (activeTrainees / subscription.plan.maxTrainees) * 100,
        ),
      },
    };
  }

  async createPortalSession(orgId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new BadRequestException("No Stripe customer found");
    }

    const returnUrl =
      process.env.STRIPE_PORTAL_RETURN_URL || "http://localhost:3000/billing";

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async upgradePlan(orgId: string, planCode: PlanCode) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException("No active subscription to upgrade");
    }

    const newPlan = await this.prisma.plan.findUnique({
      where: { code: planCode },
    });

    if (!newPlan || !newPlan.isActive) {
      throw new NotFoundException("Plan not found");
    }

    const featuresJson = newPlan.featuresJson as Record<string, unknown>;
    const stripePriceId = featuresJson.stripePriceId as string | undefined;

    if (!stripePriceId) {
      throw new BadRequestException("Plan does not have a Stripe price configured");
    }

    // Get current Stripe subscription to find the item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );

    const itemId = stripeSubscription.items.data[0]?.id;
    if (!itemId) {
      throw new BadRequestException("No subscription item found");
    }

    // Update with proration
    const updated = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{ id: itemId, price: stripePriceId }],
        proration_behavior: "create_prorations",
      },
    );

    // Update local DB
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { planId: newPlan.id },
    });

    return {
      message: "Plan upgraded successfully",
      newPlan: { code: newPlan.code, name: newPlan.name },
      stripeStatus: updated.status,
    };
  }

  async cancelSubscription(orgId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException("No active subscription to cancel");
    }

    // Cancel at period end (not immediately)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return {
      message: "Subscription will be canceled at the end of the billing period",
      cancelAt: subscription.currentPeriodEnd,
    };
  }
}
