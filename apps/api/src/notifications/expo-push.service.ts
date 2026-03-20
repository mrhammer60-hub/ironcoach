import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

  constructor(private readonly prisma: PrismaService) {}

  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) return;

    const messages: PushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data: data ?? {},
      sound: "default",
    }));

    try {
      const expoToken = process.env.EXPO_ACCESS_TOKEN;
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(expoToken ? { Authorization: `Bearer ${expoToken}` } : {}),
        },
        body: JSON.stringify(messages),
      });

      const result = (await response.json()) as {
        data?: Array<{ status: string; details?: { error?: string } }>;
      };

      // Handle DeviceNotRegistered — delete stale tokens
      if (result.data) {
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i];
          if (
            ticket.status === "error" &&
            ticket.details?.error === "DeviceNotRegistered"
          ) {
            await this.prisma.pushToken.delete({
              where: { token: tokens[i].token },
            }).catch(() => {});

            this.logger.log(
              `Deleted stale push token for user ${userId}: ${tokens[i].token.slice(0, 20)}...`,
            );
          }
        }
      }
    } catch (err) {
      this.logger.error(`Failed to send push notification: ${err}`);
    }
  }
}
