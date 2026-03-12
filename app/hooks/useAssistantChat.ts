import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "../components/chat/MessageBubble";

interface UseAssistantChatProps {
  token: string | null;
  assistantId: string | null;
}

export function useAssistantChat({ token, assistantId }: UseAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const lastAssistantId = useRef<string | null>(null);

  const threadId = assistantId ? `assistant_${assistantId}` : null;

  useEffect(() => {
    if (!threadId || !token || !assistantId) {
      setMessages([]);
      return;
    }

    if (lastAssistantId.current !== assistantId) {
      setIsLoadingThread(true);
      const loadMessages = async () => {
        try {
          const res = await fetch(`/api/threads/${threadId}/messages`, {
            headers: { Token: token },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              const formatted: ChatMessage[] = data.messages.map((msg: { id: string; sender: string; text: string; timestamp: number }) => ({
                id: msg.id,
                sender: msg.sender as "user" | "bot",
                text: msg.text,
                timestamp: msg.timestamp,
              }));
              setMessages(formatted);
            } else {
              setMessages([{
                id: crypto.randomUUID(),
                sender: "bot",
                text: "¡Hola! Soy tu asistente personalizado. ¿En qué puedo ayudarte?",
                timestamp: Date.now(),
              }]);
            }
          } else {
            setMessages([{
              id: crypto.randomUUID(),
              sender: "bot",
              text: "¡Hola! Soy tu asistente personalizado. ¿En qué puedo ayudarte?",
              timestamp: Date.now(),
            }]);
          }
        } catch {
          setMessages([{
            id: crypto.randomUUID(),
            sender: "bot",
            text: "¡Hola! Soy tu asistente personalizado. ¿En qué puedo ayudarte?",
            timestamp: Date.now(),
          }]);
        } finally {
          setIsLoadingThread(false);
          lastAssistantId.current = assistantId;
        }
      };
      loadMessages();
    }
  }, [threadId, token, assistantId]);

  const reloadMessages = useCallback(async () => {
    if (!threadId || !token || !assistantId) return;
    lastAssistantId.current = null; // Force reload
    setIsLoadingThread(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/messages`, {
        headers: { Token: token },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const formatted: ChatMessage[] = data.messages.map((msg: { id: string; sender: string; text: string; timestamp: number }) => ({
            id: msg.id,
            sender: msg.sender as "user" | "bot",
            text: msg.text,
            timestamp: msg.timestamp,
          }));
          setMessages(formatted);
        } else {
          setMessages([{
            id: crypto.randomUUID(),
            sender: "bot",
            text: "¡Hola! Soy tu asistente personalizado. ¿En qué puedo ayudarte?",
            timestamp: Date.now(),
          }]);
        }
      } else {
        setMessages([{
          id: crypto.randomUUID(),
          sender: "bot",
          text: "¡Hola! Soy tu asistente personalizado. ¿En qué puedo ayudarte?",
          timestamp: Date.now(),
        }]);
      }
    } catch {
      setMessages([{
        id: crypto.randomUUID(),
        sender: "bot",
        text: "¡Hola! Soy tu asistente personalizado. ¿En qué puedo ayudarte?",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoadingThread(false);
      lastAssistantId.current = assistantId;
    }
  }, [threadId, token, assistantId]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !token || !assistantId) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Token: token,
        },
        body: JSON.stringify({ query: trimmed, assistant_id: assistantId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || "Error al enviar mensaje");
      }

      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: data.response || "",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (e) {
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: e instanceof Error ? `Error: ${e.message}` : "Ocurrió un error. Inténtalo de nuevo.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [token, assistantId]);

  return { messages, isTyping, isLoadingThread, sendMessage, reloadMessages };
}
