import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { ConversationType } from "@ironcoach/db";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string, orgId: string): Promise<any> {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: {
        userId,
        conversation: { organizationId: orgId },
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: { not: userId } },
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: "desc" } },
    });

    return Promise.all(
      participations.map(async (p) => {
        const convo = p.conversation;
        const other = convo.participants[0];
        const lastMsg = convo.messages[0];

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: convo.id,
            senderUserId: { not: userId },
            isRead: false,
          },
        });

        return {
          id: convo.id,
          type: convo.type,
          participant: other
            ? {
                id: other.user.id,
                name: `${other.user.firstName} ${other.user.lastName}`,
                avatarUrl: other.user.avatarUrl,
              }
            : null,
          lastMessage: lastMsg
            ? {
                body: lastMsg.body,
                mediaType: lastMsg.mediaType,
                sentAt: lastMsg.createdAt,
                isRead: lastMsg.isRead,
              }
            : null,
          unreadCount,
        };
      }),
    );
  }

  async getMessages(
    convoId: string,
    userId: string,
    cursor?: string,
    limit: number = 30,
  ): Promise<any> {
    await this.ensureParticipant(convoId, userId);

    const where: any = { conversationId: convoId };
    if (cursor) {
      where.createdAt = { lt: (await this.prisma.message.findUnique({ where: { id: cursor } }))?.createdAt };
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  async sendMessage(convoId: string, userId: string, dto: SendMessageDto): Promise<any> {
    await this.ensureParticipant(convoId, userId);

    const message = await this.prisma.message.create({
      data: {
        conversationId: convoId,
        senderUserId: userId,
        body: dto.body ?? null,
        mediaUrl: dto.mediaUrl ?? null,
        mediaType: dto.mediaType ?? null,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: convoId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async markAsRead(convoId: string, userId: string) {
    await this.ensureParticipant(convoId, userId);

    await this.prisma.message.updateMany({
      where: {
        conversationId: convoId,
        senderUserId: { not: userId },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId: convoId, userId },
      data: { lastReadAt: new Date() },
    });

    return { message: "Messages marked as read" };
  }

  async getOrCreateSupportConversation(userId: string, orgId: string): Promise<any> {
    // Find existing support conversation
    const existing = await this.prisma.conversation.findFirst({
      where: {
        organizationId: orgId,
        type: ConversationType.SUPPORT,
        participants: { some: { userId } },
      },
    });

    if (existing) return existing;

    // Create new support conversation
    return this.prisma.conversation.create({
      data: {
        organizationId: orgId,
        type: ConversationType.SUPPORT,
        participants: {
          create: [{ userId }],
        },
      },
    });
  }

  async ensureParticipant(convoId: string, userId: string, orgId?: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: convoId, userId } },
      include: { conversation: { select: { organizationId: true } } },
    });
    if (!participant) throw new ForbiddenException("Not a participant in this conversation");
    if (orgId && participant.conversation.organizationId !== orgId) {
      throw new ForbiddenException("Conversation does not belong to your organization");
    }
  }

  async getRecipientIds(convoId: string, excludeUserId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: convoId, userId: { not: excludeUserId } },
      select: { userId: true },
    });
    return participants.map((p) => p.userId);
  }
}
