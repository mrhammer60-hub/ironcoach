"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, EmptyState, Avatar, Button } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";
import { useSocket } from "@/hooks/useSocket";

function getUserIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(/ironcoach_access=([^;]*)/);
    if (!match) return null;
    return JSON.parse(atob(match[1].split(".")[1])).sub;
  } catch {
    return null;
  }
}

export default function TraineeChatPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const myId = useRef<string | null>(null);
  const { joinConversation, onMessage } = useSocket();
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    myId.current = getUserIdFromCookie();
  }, []);

  // Fetch conversations
  const { data: conversations } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: () => api.get<any[]>("/chat/conversations"),
    staleTime: 30 * 1000, // 30s — messages change frequently
  });

  const convo = conversations?.[0];
  const convoId = convo?.id;

  // Fetch messages when convo exists
  const { data: messagesData } = useQuery({
    queryKey: ["chat", "messages", convoId],
    queryFn: () => api.get<any>(`/chat/${convoId}/messages`),
    enabled: !!convoId,
    refetchInterval: 15000, // Fallback polling; primary updates via socket
  });

  const messages: any[] = [...((messagesData as any)?.items ?? [])].reverse();

  // Mark as read when conversation loads
  useEffect(() => {
    if (convoId) {
      api.put(`/chat/${convoId}/read`).catch(() => {});
    }
  }, [convoId]);

  // Socket.io real-time messages
  useEffect(() => {
    if (!convoId) return;
    joinConversation(convoId);
    const unsub = onMessage((msg: any) => {
      queryClient.setQueryData(["chat", "messages", convoId], (old: any) => {
        if (!old) return old;
        const exists = old.items?.some((m: any) => m.id === msg.id);
        if (exists) return old;
        return { ...old, items: [...(old.items ?? []), msg] };
      });
    });
    return unsub;
  }, [convoId, joinConversation, onMessage, queryClient]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Send message mutation with optimistic update
  const sendMutation = useMutation({
    mutationFn: (body: string) => api.post(`/chat/${convoId}/messages`, { body }),
    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: ["chat", "messages", convoId] });

      const previous = queryClient.getQueryData(["chat", "messages", convoId]);

      const optimisticMsg = {
        id: `optimistic-${Date.now()}`,
        body,
        senderUserId: myId.current,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(["chat", "messages", convoId], (old: any) => ({
        ...old,
        items: [...(old?.items ?? []), optimisticMsg],
      }));

      return { previous };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["chat", "messages", convoId], context.previous);
      }
      toast("error", isAr ? "فشل إرسال الرسالة" : "Failed to send message");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", convoId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });

  const handleSend = () => {
    const body = input.trim();
    if (!body || !convoId) return;
    setInput("");
    sendMutation.mutate(body);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <h1 className="text-xl font-bold mb-4">{t("trainee.myCoach")} 💬</h1>

      {convo ? (
        <>
          {/* Coach header */}
          <Card className="flex items-center gap-3 mb-3" padding="sm">
            <Avatar
              name={convo.participant?.name || ""}
              src={convo.participant?.avatarUrl}
              size="sm"
            />
            <div>
              <p className="font-semibold text-[13px]">{convo.participant?.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {isAr ? "المدرب" : "Coach"}
              </p>
            </div>
          </Card>

          {/* Messages */}
          <div className="flex-1 overflow-auto space-y-2 mb-3 px-1">
            <p className="text-center text-[12px] text-[var(--text-muted)] py-4">
              {isAr ? "بداية المحادثة" : "Start of conversation"}
            </p>

            {messages.map((msg: any) => {
              const isMine = msg.senderUserId === myId.current;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-xl text-[13px] ${
                      isMine
                        ? "bg-[var(--accent)] text-[var(--accent-text)]"
                        : "bg-[var(--bg-input)] text-[var(--text-primary)]"
                    }`}
                  >
                    <p>{msg.body}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMine
                          ? "text-[var(--accent-text)]/60"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString(
                            isAr ? "ar" : "en",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : ""}
                    </p>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <p className="text-[11px] text-[var(--text-muted)] animate-pulse">{isAr ? "يكتب..." : "Typing..."}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isAr ? "اكتب رسالتك..." : "Type a message..."}
              className="flex-1 input-base px-3 py-2 text-[13px]"
            />
            <Button size="sm" onClick={handleSend} disabled={!input.trim()}>
              {isAr ? "إرسال" : "Send"} →
            </Button>
          </div>
        </>
      ) : (
        <EmptyState icon="💬" title={t("empty.messages")} />
      )}
    </div>
  );
}
