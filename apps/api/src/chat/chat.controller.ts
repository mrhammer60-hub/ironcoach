import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { CurrentUser } from "../common/decorators";
import { OrganizationGuard } from "../common/guards/organization.guard";

@ApiTags("Chat")
@ApiBearerAuth()
@Controller("chat")
@UseGuards(OrganizationGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("conversations")
  @ApiOperation({ summary: "List conversations" })
  async getConversations(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.chatService.getConversations(userId, orgId);
  }

  @Get("support")
  @ApiOperation({ summary: "Get or create support conversation" })
  async getSupportConversation(
    @CurrentUser("sub") userId: string,
    @CurrentUser("orgId") orgId: string,
  ) {
    return this.chatService.getOrCreateSupportConversation(userId, orgId);
  }

  @Get(":convoId/messages")
  @ApiOperation({ summary: "Get message history (cursor-based)" })
  async getMessages(
    @Param("convoId") convoId: string,
    @CurrentUser("sub") userId: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.chatService.getMessages(
      convoId,
      userId,
      cursor,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Post(":convoId/messages")
  @ApiOperation({ summary: "Send message (REST fallback)" })
  async sendMessage(
    @Param("convoId") convoId: string,
    @CurrentUser("sub") userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(convoId, userId, dto);
  }

  @Put(":convoId/read")
  @ApiOperation({ summary: "Mark all messages as read" })
  async markAsRead(
    @Param("convoId") convoId: string,
    @CurrentUser("sub") userId: string,
  ) {
    return this.chatService.markAsRead(convoId, userId);
  }
}
