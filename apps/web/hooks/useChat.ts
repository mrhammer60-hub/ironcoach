"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { socketManager, type SocketStatus } from "../lib/socket";
import { offlineQueue } from "../lib/offline-message-queue";
import { api } from "../lib/api";
import { queryKeys } from "../lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface ChatMessage {
  id: string;
  tempId?: string;
  conversationId: string;
  senderUserId: string;
  body: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  isRead: boolean;
  createdAt: string;
  isOptimistic?: boolean;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export function useChat(convoId: string, currentUserId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const socket = socketManager.getSocket();

  // Load initial messages via REST
  const { data } = useQuery({
    queryKey: queryKeys.chat.messages(convoId),
    queryFn: () =>
      api.get<{ items: ChatMessage[]; nextCursor: string | null }>(
        `/chat/${convoId}/messages`,
      ),
  });

  useEffect(() => {
    if (data?.items) {
      setMessages([...data.items].reverse());
    }
  }, [data]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join_conversation", { convoId });

    const onMessage = (msg: ChatMessage) => {
      if (msg.conversationId !== convoId) return;
      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (m) => !m.tempId || m.tempId !== (msg as any).tempId,
        );
        if (withoutOptimistic.some((m) => m.id === msg.id)) return withoutOptimistic;
        return [...withoutOptimistic, msg];
      });

      if (document.hasFocus() && msg.senderUserId !== currentUserId) {
        socket.emit("read_messages", { convoId });
      }
    };

    const onMissed = (data: {
      conversationId: string;
      messages: ChatMessage[];
    }) => {
      if (data.conversationId !== convoId) return;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = data.messages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newMsgs].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    };

    const onTyping = ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) {
        setIsTyping(true);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on("message_received", onMessage);
    socket.on("missed_messages", onMissed);
    socket.on("user_typing", onTyping);

    return () => {
      socket.off("message_received", onMessage);
      socket.off("missed_messages", onMissed);
      socket.off("user_typing", onTyping);
      clearTimeout(typingTimerRef.current);
    };
  }, [socket, convoId, currentUserId]);

  const sendMessage = useCallback(
    (content: string) => {
      const tempId = crypto.randomUUID();

      // Optimistic update
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          tempId,
          conversationId: convoId,
          senderUserId: currentUserId,
          body: content,
          mediaUrl: null,
          mediaType: null,
          isRead: false,
          createdAt: new Date().toISOString(),
          isOptimistic: true,
        },
      ]);

      if (!socket?.connected) {
        offlineQueue.enqueue({ tempId, convoId, content });
        return;
      }

      socket.emit("send_message", { convoId, content, tempId });
    },
    [socket, convoId, currentUserId],
  );

  const sendTyping = useCallback(() => {
    socket?.emit("typing", { convoId });
  }, [socket, convoId]);

  // Flush queue when reconnected
  useEffect(() => {
    return socketManager.onStatusChange((s) => {
      setStatus(s);
      if (s === "connected" && offlineQueue.length > 0 && socket) {
        offlineQueue.flush(socket);
      }
    });
  }, [socket]);

  return { messages, sendMessage, sendTyping, isTyping, status };
}
