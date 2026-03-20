# Prompt 23 — Stripe Webhook Idempotency

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 05 complete (billing module exists).
> **أضفه مباشرة بعد الخطوة 05.**

---

## Problem

Stripe يُعيد إرسال الـ webhook إذا لم يتلقَّ `200` خلال 30 ثانية.
بدون idempotency: نفس الـ event يُعالَج مرتين → اشتراك مكرر، invoice مكررة، إيميل مكرر.

---

## Solution: Processed Events Table

### أضف لـ `packages/db/prisma/schema.prisma`

```prisma
model ProcessedStripeEvent {
  id          String   @id @default(uuid())
  stripeEventId String @unique               // e.g. "evt_1ABC..."
  eventType   String                          // e.g. "checkout.session.completed"
  processedAt DateTime @default(now())
  durationMs  Int?                            // how long processing took

  @@index([stripeEventId])
  @@index([processedAt])
}
```

---

## Updated Webhook Handler

### `apps/api/src/billing/webhook.service.ts` — استبدل الـ handler الحالي

```typescript
@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    // 1. Verify Stripe signature — MUST be first, before any DB access
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      )
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`)
    }

    // 2. Idempotency check — reject already-processed events
    const alreadyProcessed = await this.prisma.processedStripeEvent.findUnique({
      where: { stripeEventId: event.id },
    })
    if (alreadyProcessed) {
      // Return 200 silently — Stripe will stop retrying
      return
    }

    // 3. Mark as processing BEFORE handling
    // Use upsert to handle rare race condition on concurrent retries
    try {
      await this.prisma.processedStripeEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
        },
      })
    } catch (e) {
      // P2002 = unique constraint violation = already inserted by concurrent request
      if (e.code === 'P2002') return
      throw e
    }

    // 4. Process event inside a transaction
    const start = Date.now()
    try {
      await this.processEvent(event)
    } catch (err) {
      // Log to Sentry but still return 200 to prevent Stripe retry storm
      // Manual investigation required for failed events
      Sentry.captureException(err, { extra: { eventId: event.id, eventType: event.type } })
    } finally {
      // Record processing duration for monitoring
      await this.prisma.processedStripeEvent.update({
        where: { stripeEventId: event.id },
        data: { durationMs: Date.now() - start },
      })
    }
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.organizationId
        if (!orgId) throw new Error('Missing organizationId in session metadata')

        await this.prisma.$transaction(async (tx) => {
          // Get plan from session
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
          const priceId = lineItems.data[0]?.price?.id
          const plan = await tx.plan.findFirst({
            where: { featuresJson: { path: ['stripePriceId'], equals: priceId } },
          })
          if (!plan) throw new Error(`No plan found for priceId: ${priceId}`)

          // Upsert subscription
          await tx.subscription.upsert({
            where: { organizationId: orgId },
            create: {
              organizationId: orgId,
              planId: plan.id,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            update: {
              planId: plan.id,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: 'ACTIVE',
            },
          })
        })

        // Send confirmation email (outside transaction — non-critical)
        const org = await this.prisma.organization.findUnique({
          where: { id: orgId },
          include: { owner: true },
        })
        if (org?.owner?.email) {
          await this.emailService.send(org.owner.email, 'subscription-confirmed', {
            firstName: org.owner.firstName,
            planName: 'plan name here',
            renewalDate: 'next renewal date',
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await this.prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: this.mapStripeStatus(sub.status),
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await this.prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELED', cancelAtPeriodEnd: false },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await this.prisma.$transaction(async (tx) => {
          const subscription = await tx.subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
            include: { organization: { include: { owner: true } } },
          })
          if (!subscription) return

          // Create invoice record
          await tx.invoice.create({
            data: {
              organizationId: subscription.organizationId,
              subscriptionId: subscription.id,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'paid',
              issuedAt: new Date(invoice.created * 1000),
              paidAt: new Date(),
            },
          })

          // Restore ACTIVE if was PAST_DUE
          if (subscription.status === 'PAST_DUE') {
            await tx.subscription.update({
              where: { id: subscription.id },
              data: { status: 'ACTIVE' },
            })
          }
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await this.prisma.$transaction(async (tx) => {
          const subscription = await tx.subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
            include: { organization: { include: { owner: true } } },
          })
          if (!subscription) return

          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
          })

          await tx.invoice.create({
            data: {
              organizationId: subscription.organizationId,
              subscriptionId: subscription.id,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_due / 100,
              currency: invoice.currency,
              status: 'failed',
              issuedAt: new Date(invoice.created * 1000),
            },
          })
        })

        // Queue dunning email
        await this.queueDunningEmail(invoice)
        break
      }

      default:
        // Unknown event type — ignore silently
        break
    }
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      trialing: 'TRIALING',
      incomplete: 'INCOMPLETE',
    }
    return map[status] ?? 'ACTIVE'
  }

  private async queueDunningEmail(invoice: Stripe.Invoice): Promise<void> {
    // Queued via BullMQ — not blocking
    await this.emailQueue.add('dunning', {
      stripeInvoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      attemptCount: invoice.attempt_count,
    }, { delay: 0 })
  }
}
```

---

## Dunning Sequence (BullMQ)

### `apps/api/src/billing/jobs/dunning.job.ts`

```typescript
@Processor('emails')
export class DunningJob {
  @Process('dunning')
  async handle(job: Job<DunningPayload>): Promise<void> {
    const { attemptCount, subscriptionId } = job.data

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      include: { organization: { include: { owner: true } } },
    })
    if (!subscription || subscription.status !== 'PAST_DUE') return

    const email = subscription.organization.owner.email
    const firstName = subscription.organization.owner.firstName

    // Day 1 → payment-failed template
    // Day 3 → dunning-day3 template
    // Day 7 → dunning-day7 template
    const template = attemptCount === 1
      ? 'payment-failed'
      : attemptCount === 2
      ? 'dunning-day3'
      : 'dunning-day7'

    await this.emailService.send(email, template, { firstName })

    // Also send push notification
    await this.notificationService.send({
      userId: subscription.organization.ownerUserId,
      organizationId: subscription.organizationId,
      type: NotificationType.PAYMENT_FAILED,
      title: 'فشل سداد الاشتراك ⚠️',
      body: 'يرجى تحديث بيانات الدفع للحفاظ على الوصول',
    })
  }
}
```

---

## Cleanup Old Events (Monthly)

```typescript
// BullMQ scheduled job — runs first day of each month
@Process('cleanup-stripe-events')
async cleanup(): Promise<void> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  await this.prisma.processedStripeEvent.deleteMany({
    where: { processedAt: { lt: ninetyDaysAgo } },
  })
}
```

---

## Output Requirements

- Same Stripe event sent twice → processed once, second returns `200` silently
- Race condition (2 concurrent requests with same event) → one wins via `P2002`, other returns `200`
- Failed event processing → logged to Sentry, `200` returned to Stripe
- `ProcessedStripeEvent` table cleaned up monthly
- `pnpm test billing:webhook` covers: new event, duplicate event, race condition
