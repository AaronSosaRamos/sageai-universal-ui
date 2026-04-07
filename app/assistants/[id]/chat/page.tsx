"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { AssistantSidebar } from "@/app/components/chat/AssistantSidebar";
import { MessageList } from "@/app/components/chat/MessageList";
import { ChatInput } from "@/app/components/chat/ChatInput";
import { FilePreview } from "@/app/components/chat/FilePreview";
import { DragDropOverlay } from "@/app/components/chat/DragDropOverlay";
import { useAssistantChat } from "@/app/hooks/useAssistantChat";
import { useSession } from "@/app/hooks/useSession";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { useDragAndDrop } from "@/app/hooks/useDragAndDrop";

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

  const assistantThreadId = assistantId ? `assistant_${assistantId}` : null;

  const { messages, setMessages, isTyping, isLoadingThread, sendMessage, reloadMessages } =
    useAssistantChat({
      token,
      assistantId,
    });

  const { sessionInfo, setSessionInfo, isInitializing: sessionInitializing } = useSession(
    token,
    assistantThreadId
  );

  const fileUpload = useFileUpload({
    token,
    sessionInfo,
    isInitializing: sessionInitializing,
    setMessages,
    setSessionInfo,
  });

  const dragDrop = useDragAndDrop(fileUpload.handleFiles);

  const dragHandlers = useMemo(
    () => ({
      onDragEnter: dragDrop.handleDragEnter,
      onDragLeave: dragDrop.handleDragLeave,
      onDragOver: dragDrop.handleDragOver,
      onDrop: dragDrop.handleDrop,
    }),
    [dragDrop]
  );

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

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    const ready = fileUpload.uploadedFiles.filter((f) => f.status === "uploaded" && f.uploadedPath);
    if (!trimmed && ready.length === 0) return;
    await sendMessage(trimmed, fileUpload.uploadedFiles);
    setInput("");
    await fileUpload.clearAllFiles();
  }, [input, sendMessage, fileUpload]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        fileUpload.handleFiles(files);
      }
      e.target.value = "";
    },
    [fileUpload]
  );

  if (!token) return null;

  return (
    <div
      className="fixed inset-0 overflow-hidden grid grid-rows-[auto_1fr_auto] bg-slate-950 transition-[grid-template-columns] duration-300 ease-in-out"
      style={{ gridTemplateColumns: isSidebarCollapsed ? "64px 1fr" : "320px 1fr" }}
      {...dragHandlers}
    >
      <DragDropOverlay isDragging={dragDrop.isDragging} />

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

      <div className="col-start-2">
        <ChatHeader token={token} />
      </div>

      <main className="col-start-2 min-h-0 overflow-hidden px-4 sm:px-6 h-[calc(100dvh-4rem-3rem)] flex flex-col">
        <div className="mx-auto w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-1 flex flex-col min-h-0">
          <MessageList messages={messages} isTyping={isTyping} isLoadingThread={isLoadingThread} />

          <div className="pb-6 shrink-0 flex flex-col gap-4">
            <FilePreview
              files={fileUpload.selectedFiles}
              token={token}
              onRemoveFile={fileUpload.removeFile}
              onClearAll={fileUpload.clearAllFiles}
            />

            <ChatInput
              value={input}
              isTyping={isTyping}
              isUploading={fileUpload.isUploading}
              isDragging={dragDrop.isDragging}
              onChange={setInput}
              onSend={handleSend}
              onFileSelect={handleFileSelect}
              hasUploadedFiles={fileUpload.uploadedFiles.length > 0}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
            />
          </div>
        </div>
      </main>

      <div className="col-start-2">
        <ChatFooter />
      </div>
    </div>
  );
}
