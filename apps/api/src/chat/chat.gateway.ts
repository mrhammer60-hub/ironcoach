import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import type { JwtPayload } from "../common/decorators";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
  },
  namespace: "/chat",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization?.replace("Bearer ", "") as string);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      client.data.user = payload;

      // Join all user's conversation rooms
      const participations =
        await this.prisma.conversationParticipant.findMany({
          where: { userId: payload.sub },
          select: { conversationId: true },
        });

      for (const p of participations) {
        client.join(`conversation:${p.conversationId}`);
      }

      this.logger.log(`Client connected: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as JwtPayload | undefined;
    if (user) {
      this.logger.log(`Client disconnected: ${user.sub}`);
    }
  }

  @SubscribeMessage("join_conversation")
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { convoId: string },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user) throw new WsException("unauthorized");

    await this.chatService.ensureParticipant(data.convoId, user.sub);
    client.join(`conversation:${data.convoId}`);
    return { event: "joined", data: { convoId: data.convoId } };
  }

  @SubscribeMessage("send_message")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      convoId: string;
      content?: string;
      mediaUrl?: string;
      mediaType?: string;
    },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user) throw new WsException("unauthorized");

    const message = await this.chatService.sendMessage(data.convoId, user.sub, {
      body: data.content,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType as any,
    });

    // Emit to room (including sender for confirmation)
    this.server
      .to(`conversation:${data.convoId}`)
      .emit("message_received", message);

    // Send push to offline recipients
    const recipientIds = await this.chatService.getRecipientIds(
      data.convoId,
      user.sub,
    );

    for (const recipientId of recipientIds) {
      const recipientSockets = await this.server.in(`conversation:${data.convoId}`).fetchSockets();
      const isOnline = recipientSockets.some(
        (s) => (s.data.user as JwtPayload)?.sub === recipientId,
      );

      if (!isOnline) {
        const sender = await this.prisma.user.findUnique({
          where: { id: user.sub },
          select: { firstName: true },
        });

        await this.notificationsService.send({
          userId: recipientId,
          organizationId: user.orgId ?? "",
          type: "MESSAGE_RECEIVED",
          title: sender?.firstName ?? "رسالة جديدة",
          body: data.content?.slice(0, 100) ?? "📎 مرفق",
        });
      }
    }

    return message;
  }

  @SubscribeMessage("typing")
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { convoId: string },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user) throw new WsException("unauthorized");

    client.to(`conversation:${data.convoId}`).emit("user_typing", {
      convoId: data.convoId,
      userId: user.sub,
    });
  }

  @SubscribeMessage("read_messages")
  async handleReadMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { convoId: string },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user) throw new WsException("unauthorized");

    await this.chatService.markAsRead(data.convoId, user.sub);

    client.to(`conversation:${data.convoId}`).emit("messages_read", {
      convoId: data.convoId,
      userId: user.sub,
      readAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage("sync_since")
  async handleSyncSince(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { since: string },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user) throw new WsException("unauthorized");

    const since = new Date(data.since);

    const participations =
      await this.prisma.conversationParticipant.findMany({
        where: { userId: user.sub },
        select: { conversationId: true },
      });

    for (const p of participations) {
      const missed = await this.prisma.message.findMany({
        where: {
          conversationId: p.conversationId,
          createdAt: { gt: since },
          senderUserId: { not: user.sub },
        },
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (missed.length > 0) {
        client.emit("missed_messages", {
          conversationId: p.conversationId,
          messages: missed,
        });
      }
    }
  }
}
