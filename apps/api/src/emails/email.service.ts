import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { welcomeCoach } from "./templates/welcome-coach";
import { welcomeTrainee } from "./templates/welcome-trainee";
import { inviteTrainee } from "./templates/invite-trainee";
import { resetPassword } from "./templates/reset-password";
import { verifyEmail } from "./templates/verify-email";
import { subscriptionConfirmed } from "./templates/subscription-confirmed";
import { paymentFailed } from "./templates/payment-failed";
import { dunningDay3 } from "./templates/dunning-day3";
import { dunningDay7 } from "./templates/dunning-day7";
import { workoutAssigned } from "./templates/workout-assigned";
import { nutritionAssigned } from "./templates/nutrition-assigned";
import { weeklySummary } from "./templates/weekly-summary";
import { subscriptionExpiring } from "./templates/subscription-expiring";
import { accountSuspended } from "./templates/account-suspended";

export type EmailTemplate =
  | "welcome-coach"
  | "welcome-trainee"
  | "invite-trainee"
  | "reset-password"
  | "verify-email"
  | "subscription-confirmed"
  | "payment-failed"
  | "dunning-day3"
  | "dunning-day7"
  | "workout-assigned"
  | "nutrition-assigned"
  | "weekly-summary"
  | "subscription-expiring"
  | "account-suspended";

const TEMPLATE_MAP: Record<
  EmailTemplate,
  (props: any) => { subject: string; html: string }
> = {
  "welcome-coach": welcomeCoach,
  "welcome-trainee": welcomeTrainee,
  "invite-trainee": inviteTrainee,
  "reset-password": resetPassword,
  "verify-email": verifyEmail,
  "subscription-confirmed": subscriptionConfirmed,
  "payment-failed": paymentFailed,
  "dunning-day3": dunningDay3,
  "dunning-day7": dunningDay7,
  "workout-assigned": workoutAssigned,
  "nutrition-assigned": nutritionAssigned,
  "weekly-summary": weeklySummary,
  "subscription-expiring": subscriptionExpiring,
  "account-suspended": accountSuspended,
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
    this.from =
      process.env.EMAIL_FROM || "IronCoach <noreply@ironcoach.com>";
  }

  async send(
    to: string,
    template: EmailTemplate,
    props: Record<string, unknown>,
  ): Promise<void> {
    const renderer = TEMPLATE_MAP[template];
    if (!renderer) {
      this.logger.error(`Unknown email template: ${template}`);
      return;
    }

    const { subject, html } = renderer(props);

    if (
      process.env.NODE_ENV === "development" &&
      process.env.FORCE_SEND_EMAILS !== "true"
    ) {
      this.logger.log(
        `[DEV] Email to ${to} | Template: ${template} | Subject: ${subject}`,
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${template}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
    }
  }
}
