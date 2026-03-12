"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { AssistantSidebar } from "@/app/components/chat/AssistantSidebar";
import { MessageList } from "@/app/components/chat/MessageList";
import { ChatInput } from "@/app/components/chat/ChatInput";
import { useAssistantChat } from "@/app/hooks/useAssistantChat";

export default function AssistantChatPage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = typeof params.id === "string" ? params.id : null;

  const [token, setToken] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = sessionStorage.getItem("token");
      if (!t) {
        router.push("/");
        return;
      }
      setToken(t);
    }
  }, [router]);

  const { messages, isTyping, isLoadingThread, sendMessage, reloadMessages } = useAssistantChat({
    token,
    assistantId,
  });

  const handleAssistantSelect = useCallback(
    (id: string) => {
      if (id !== assistantId) {
        router.push(`/assistants/${id}/chat`);
      }
    },
    [assistantId, router]
  );

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput("");
  }, [input, sendMessage]);

  const handleFileSelect = useCallback(() => {
    // No-op: asistente chat no soporta archivos
  }, []);

  if (!token) return null;

  return (
    <div
      className="fixed inset-0 overflow-hidden grid grid-rows-[auto_1fr_auto] bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 transition-[grid-template-columns] duration-300 ease-in-out"
      style={{ gridTemplateColumns: isSidebarCollapsed ? "64px 1fr" : "320px 1fr" }}
    >
      {/* Sidebar - mismo layout que chat principal */}
      <div className="row-span-3 m-0 p-0 overflow-hidden min-w-0">
        <AssistantSidebar
          token={token}
          currentAssistantId={assistantId}
          onAssistantSelect={handleAssistantSelect}
          onThreadDeleted={reloadMessages}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Header */}
      <div className="col-start-2">
        <ChatHeader token={token} />
      </div>

      {/* Main content - full screen como chat principal */}
      <main className="col-start-2 min-h-0 overflow-hidden px-4 sm:px-6 h-[calc(100dvh-4rem-3rem)] flex flex-col">
        <div className="mx-auto w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-1 flex flex-col min-h-0">
          <MessageList
            messages={messages}
            isTyping={isTyping}
            isLoadingThread={isLoadingThread}
          />

          <div className="pb-6 shrink-0">
            <ChatInput
              value={input}
              isTyping={isTyping}
              isUploading={false}
              isDragging={false}
              onChange={setInput}
              onSend={handleSend}
              onFileSelect={handleFileSelect}
              hideFileUpload
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="col-start-2">
        <ChatFooter />
      </div>
    </div>
  );
}
