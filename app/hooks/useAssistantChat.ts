import { useState, useCallback, useEffect, useRef } from "react";
import api from "@/lib/axios";
import type { ChatMessage } from "../components/chat/MessageBubble";
import type { FileInfo } from "../components/chat/FilePreview";

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

  const sendMessage = useCallback(async (text: string, uploadedFiles: FileInfo[] = []) => {
    const trimmed = text.trim();
    const uploaded = uploadedFiles.filter((f) => f.status === "uploaded" && f.uploadedPath);
    if ((!trimmed && uploaded.length === 0) || !token || !assistantId) return;

    const promptLine =
      trimmed || "Analiza el contenido de los archivos adjuntos y responde según el system prompt del asistente.";

    const fileUrls = uploaded.map((f) => ({
      url: api.defaults.baseURL + f.uploadedPath!,
      type: (() => {
        const name = f.file.name.toLowerCase();
        if (f.type === "image") return "img";
        if (f.type === "audio") return "mp3";
        if (name.endsWith(".pdf")) return "pdf";
        if (name.endsWith(".docx")) return "docx";
        if (name.endsWith(".doc")) return "doc";
        if (name.endsWith(".xlsx")) return "xlsx";
        if (name.endsWith(".xls")) return "xls";
        return "other";
      })(),
    }));

    const fileInfo =
      fileUrls.length > 0
        ? "\n\nFiles:\n" + fileUrls.map((f) => `- ${f.url} (File Type: ${f.type})`).join("\n")
        : "";

    const fullQuery = promptLine + fileInfo;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: fullQuery,
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
        body: JSON.stringify({ query: fullQuery, assistant_id: assistantId }),
      });

      const data = (await res.json()) as { error?: string; detail?: string; response?: string };
      if (!res.ok) {
        const msg =
          (typeof data.detail === "string" && data.detail) ||
          data.error ||
          (res.status === 429
            ? "Has alcanzado el límite diario de interacciones. Vuelve mañana."
            : "Error al enviar mensaje");
        throw new Error(msg);
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

  return { messages, setMessages, isTyping, isLoadingThread, sendMessage, reloadMessages };
}
