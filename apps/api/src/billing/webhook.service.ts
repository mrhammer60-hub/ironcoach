import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../emails/email.service";
import { stripe } from "../config/stripe.config";
import { SubscriptionStatus } from "@ironcoach/db";
import Stripe from "stripe";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.logger.error("STRIPE_WEBHOOK_SECRET not configured");
      return;
    }

    // 1. Verify Stripe signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${err}`,
      );
    }

    // 2. Idempotency check — reject already-processed events
    const alreadyProcessed =
      await this.prisma.processedStripeEvent.findUnique({
        where: { stripeEventId: event.id },
      });

    if (alreadyProcessed) {
      this.logger.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    // 3. Mark as processing (race-condition safe via unique constraint)
    try {
      await this.prisma.processedStripeEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
        },
      });
    } catch (e: any) {
      if (e.code === "P2002") {
        // Concurrent request already inserted — return 200
        return;
      }
      throw e;
    }

    // 4. Process event and record duration
    const start = Date.now();
    try {
      await this.processEvent(event);
    } catch (err) {
      this.logger.error(
        `Failed to process event ${event.id} (${event.type}): ${err}`,
      );
      // Return 200 to prevent Stripe retry storm — log for manual investigation
    } finally {
      await this.prisma.processedStripeEvent.update({
        where: { stripeEventId: event.id },
        data: { durationMs: Date.now() - start },
      });
    }
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing webhook: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.payment_succeeded":
        await this.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        break;
      case "invoice.payment_failed":
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) {
      throw new Error("Checkout session missing organizationId metadata");
    }

    const stripeSubscriptionId = session.subscription as string;
    const stripeCustomerId = session.customer as string;

    const stripeSub =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const stripePriceId = stripeSub.items.data[0]?.price?.id;

    await this.prisma.$transaction(async (tx) => {
      const plans = await tx.plan.findMany({ where: { isActive: true } });
      const plan = plans.find((p) => {
        const features = p.featuresJson as Record<string, unknown>;
        return features.stripePriceId === stripePriceId;
      });

      if (!plan) {
        throw new Error(`No plan found for Stripe price: ${stripePriceId}`);
      }

      await tx.subscription.upsert({
        where: { organizationId },
        update: {
          planId: plan.id,
          stripeCustomerId,
          stripeSubscriptionId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(
            stripeSub.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: false,
        },
        create: {
          organizationId,
          planId: plan.id,
          stripeCustomerId,
          stripeSubscriptionId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(
            stripeSub.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        },
      });
    });

    this.logger.log(`Subscription activated for org ${organizationId}`);

    // Send subscription-confirmed email
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { owner: true, subscription: { include: { plan: true } } },
    });
    if (org?.owner?.email) {
      await this.emailService.send(org.owner.email, "subscription-confirmed", {
        firstName: org.owner.firstName,
        planName: org.subscription?.plan?.name ?? "Pro",
      });
    }
  }

  private async handleSubscriptionUpdated(sub: Stripe.Subscription) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: sub.id },
    });

    if (!subscription) {
      this.logger.warn(`No local subscription for Stripe sub: ${sub.id}`);
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: this.mapStripeStatus(sub.status),
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });

    this.logger.log(
      `Subscription updated for org ${subscription.organizationId}: ${sub.status}`,
    );
  }

  private async handleSubscriptionDeleted(sub: Stripe.Subscription) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: sub.id },
    });

    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELED, cancelAtPeriodEnd: false },
    });

    this.logger.log(
      `Subscription canceled for org ${subscription.organizationId}`,
    );
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = invoice.subscription as string;
    if (!stripeSubscriptionId) return;

    await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({
        where: { stripeSubscriptionId },
      });

      if (!subscription) return;

      // Upsert invoice record (idempotent)
      await tx.invoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        update: { status: "paid", paidAt: new Date() },
        create: {
          organizationId: subscription.organizationId,
          subscriptionId: subscription.id,
          stripeInvoiceId: invoice.id,
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency,
          status: "paid",
          issuedAt: new Date((invoice.created ?? 0) * 1000),
          paidAt: new Date(),
        },
      });

      // Restore ACTIVE if was PAST_DUE
      if (subscription.status === SubscriptionStatus.PAST_DUE) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.ACTIVE },
        });
        this.logger.log(
          `Subscription reactivated for org ${subscription.organizationId}`,
        );
      }
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = invoice.subscription as string;
    if (!stripeSubscriptionId) return;

    await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({
        where: { stripeSubscriptionId },
        include: { organization: { include: { owner: true } } },
      });

      if (!subscription) return;

      await tx.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.PAST_DUE },
      });

      // Upsert invoice record (idempotent)
      await tx.invoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        update: { status: "failed" },
        create: {
          organizationId: subscription.organizationId,
          subscriptionId: subscription.id,
          stripeInvoiceId: invoice.id,
          amount: (invoice.amount_due ?? 0) / 100,
          currency: invoice.currency,
          status: "failed",
          issuedAt: new Date((invoice.created ?? 0) * 1000),
        },
      });
    });

    // Send dunning email based on attempt count
    const failedSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
      include: { organization: { include: { owner: true } } },
    });
    if (failedSub?.organization?.owner?.email) {
      const attemptCount = invoice.attempt_count ?? 1;
      const template = attemptCount >= 3 ? "dunning-day7" : attemptCount >= 2 ? "dunning-day3" : "payment-failed";
      await this.emailService.send(failedSub.organization.owner.email, template, {
        firstName: failedSub.organization.owner.firstName,
        attemptCount,
      });
    }
  }

  private mapStripeStatus(
    status: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      trialing: SubscriptionStatus.TRIALING,
      incomplete: SubscriptionStatus.INCOMPLETE,
    };
    return map[status] ?? SubscriptionStatus.ACTIVE;
  }
}
