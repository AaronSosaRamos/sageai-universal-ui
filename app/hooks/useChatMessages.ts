import { useState, useCallback, useEffect, useRef } from "react";
import api from "@/lib/axios";
import type { ChatMessage } from "../components/chat/MessageBubble";
import type { FileInfo } from "../components/chat/FilePreview";

interface UseChatMessagesProps {
  token: string | null;
  sessionInfo: { session_uuid: string; inner_uuid: string } | null;
}

export function useChatMessages({ token, sessionInfo }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const lastThreadId = useRef<string | null>(null);

  // Helper function to process URLs for display
  const processUrlsForDisplay = useCallback((text: string): string => {
    // First, handle URLs that already have "File Type:" annotation
    text = text.replace(/(https?:\/\/[^\s\)]+)\s*\(File Type:\s*(\w+)\)/gi, (match, url, fileType) => {
      // Check if it's a file URL (contains /files/)
      if (url.includes('/files/')) {
        // Extract filename from URL
        const fileNameMatch = url.match(/\/([^\/]+\.\w+)(?:\?|$)/);
        if (fileNameMatch) {
          const fileName = fileNameMatch[1];
          return `${fileName} (File Type: ${fileType})`;
        }
        return match;
      }
      // Regular website URL - remove File Type annotation
      return url;
    });

    // Then handle plain URLs without annotation
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    return text.replace(urlRegex, (url) => {
      // Check if it's a file URL (contains /files/ and has file extension)
      if (url.includes('/files/')) {
        const fileNameMatch = url.match(/\/([^\/]+\.\w+)(?:\?|$)/);
        if (fileNameMatch) {
          const fileName = fileNameMatch[1];
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'file';
          return `${fileName} (File Type: ${fileExtension})`;
        }
      }
      // Regular website URL - return as is
      return url;
    });
  }, []);

  // Helper function to process URLs for sending to supervisor
  const processUrlsForSending = useCallback((text: string): string => {
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    return text.replace(urlRegex, (url) => {
      // Check if it's a file URL (contains /files/ and has file extension)
      if (url.includes('/files/')) {
        const fileNameMatch = url.match(/\/([^\/]+\.\w+)(?:\?|$)/);
        if (fileNameMatch) {
          const fileExtension = fileNameMatch[1].split('.').pop()?.toLowerCase() || 'file';
          return `${url} (File Type: ${fileExtension})`;
        }
      }
      // Regular website URLs don't need File Type annotation
      return url;
    });
  }, []);

  // Load messages when thread changes
  useEffect(() => {
    if (!sessionInfo?.inner_uuid || !token) {
      setMessages([]);
      return;
    }

    // If thread changed, load messages from database
    if (lastThreadId.current !== sessionInfo.inner_uuid) {
      setIsLoadingThread(true);
      const loadMessages = async () => {
        try {
          const res = await fetch(`/api/threads/${sessionInfo.inner_uuid}/messages`, {
            headers: {
              'Token': token,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              // Convert database messages to ChatMessage format and process URLs
              interface DbMessage {
                id: string;
                sender: string;
                text: string;
                timestamp: number;
              }
              const formattedMessages: ChatMessage[] = data.messages.map((msg: DbMessage) => ({
                id: msg.id,
                sender: msg.sender,
                text: processUrlsForDisplay(msg.text),
                timestamp: msg.timestamp,
              }));
              setMessages(formattedMessages);
            } else {
              // No messages, show welcome message
              setMessages([{
                id: crypto.randomUUID(),
                sender: "bot",
                text: "¡Hola! Soy tu asistente. ¿En qué puedo ayudarte hoy?",
                timestamp: Date.now(),
              }]);
            }
          } else {
            // Error loading, show welcome message
            setMessages([{
              id: crypto.randomUUID(),
              sender: "bot",
              text: "¡Hola! Soy tu asistente. ¿En qué puedo ayudarte hoy?",
              timestamp: Date.now(),
            }]);
          }
        } catch (error) {
          console.error("Error loading messages:", error);
          // Error loading, show welcome message
          setMessages([{
            id: crypto.randomUUID(),
            sender: "bot",
            text: "¡Hola! Soy tu asistente. ¿En qué puedo ayudarte hoy?",
            timestamp: Date.now(),
          }]);
        } finally {
          setIsLoadingThread(false);
        }
      };

      loadMessages();
      lastThreadId.current = sessionInfo.inner_uuid;
    }
  }, [sessionInfo?.inner_uuid, token, processUrlsForDisplay]);

  const callSupervisor = useCallback(async (userText: string): Promise<string> => {
    if (!token) {
      throw new Error("No hay sesión activa");
    }

    if (!sessionInfo?.session_uuid || !sessionInfo?.inner_uuid) {
      throw new Error("Sesión no inicializada correctamente");
    }

    console.log("Calling supervisor with:", {
      query: userText.substring(0, 100),
      session_uuid: sessionInfo.session_uuid,
      inner_uuid: sessionInfo.inner_uuid
    });

    const res = await fetch("/api/supervisor", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Token": token } : {})
      },
      body: JSON.stringify({ 
        query: userText,
        session_uuid: sessionInfo.session_uuid,
        inner_uuid: sessionInfo.inner_uuid
      }),
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Supervisor error response:", {
        status: res.status,
        statusText: res.statusText,
        error: err
      });
      throw new Error(`Error ${res.status}: ${JSON.stringify(err)}`);
    }
    
    const data = await res.json();
    console.log("Supervisor response received:", data);
    return data.response;
  }, [token, sessionInfo]);

  const sendMessage = useCallback(async (text: string, uploadedFiles: FileInfo[] = []) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Process URLs in the message
    const messageWithUrlTypes = processUrlsForSending(trimmed);

    const fileUrls = uploadedFiles.map(f => ({
      url: api.defaults.baseURL + f.uploadedPath!,
      type: (() => {
        if (f.type === 'image') return 'img';
        if (f.type === 'audio') return 'mp3';
        if (f.file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
        if (f.file.name.toLowerCase().endsWith('.docx')) return 'docx';
        if (f.file.name.toLowerCase().endsWith('.xlsx')) return 'xlsx';
        if (f.file.name.toLowerCase().endsWith('.xls')) return 'xls';
        return 'other';
      })()
    }));

    const fileInfo = fileUrls.length > 0 
      ? "\n\nFiles:\n" + fileUrls
          .map(f => `- ${f.url} (File Type: ${f.type})`)
          .join("\n")
      : "";

    const fullMessage = messageWithUrlTypes + fileInfo;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: processUrlsForDisplay(fullMessage),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);
    let replyText = "";
    
    try {
      replyText = await callSupervisor(fullMessage);
    } catch (error) {
      console.error("Error calling supervisor:", error);
      replyText = error instanceof Error 
        ? `Error: ${error.message}` 
        : "Ocurrió un error al procesar tu solicitud. Inténtalo nuevamente.";
    }
    
    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "bot",
      text: processUrlsForDisplay(replyText),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  }, [callSupervisor, processUrlsForDisplay, processUrlsForSending]);

  return {
    messages,
    setMessages,
    isTyping,
    isLoadingThread,
    sendMessage
  };
}

