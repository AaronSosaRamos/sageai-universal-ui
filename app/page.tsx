"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { ChatHeader } from "./components/chat/ChatHeader";
import { Sidebar } from "./components/chat/Sidebar";
import { MessageList } from "./components/chat/MessageList";
import { ChatInput } from "./components/chat/ChatInput";
import { FilePreview } from "./components/chat/FilePreview";
import { DragDropOverlay } from "./components/chat/DragDropOverlay";
import { ChatFooter } from "./components/chat/ChatFooter";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { useSession } from "./hooks/useSession";
import { useChatMessages } from "./hooks/useChatMessages";
import { useFileUpload } from "./hooks/useFileUpload";
import { useDragAndDrop } from "./hooks/useDragAndDrop";

export default function ChatScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [input, setInput] = useState("");
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load token from sessionStorage only on client side after mount
  useEffect(() => {
    setIsMounted(true);
    const storedToken = sessionStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Initialize session with current thread
  const { sessionInfo, setSessionInfo, isInitializing, changeThread } = useSession(token, currentThreadId);

  // Initialize chat messages with the real sessionInfo
  const { messages, setMessages, isTyping, isLoadingThread, sendMessage } = useChatMessages({ 
    token, 
    sessionInfo
  });

  // File upload
  const fileUpload = useFileUpload({
    token,
    sessionInfo,
    isInitializing,
    setMessages,
    setSessionInfo
  });

  // Drag and drop
  const dragDrop = useDragAndDrop(fileUpload.handleFiles);

  const handleSendMessage = useCallback(async () => {
    const trimmed = input.trim();
    const readyFiles = fileUpload.uploadedFiles.filter(
      (f) => f.status === "uploaded" && f.uploadedPath
    );
    if (!trimmed && readyFiles.length === 0) return;

    await sendMessage(trimmed, fileUpload.uploadedFiles);
    setInput("");
    await fileUpload.clearAllFiles();
  }, [input, sendMessage, fileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      fileUpload.handleFiles(files);
    }
  }, [fileUpload]);

  const handleThreadSelect = useCallback(async (threadId: string) => {
    setCurrentThreadId(threadId);
    setMessages([]); // Clear messages when switching threads
    await changeThread(threadId);
  }, [changeThread, setMessages]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // Memoize handlers to prevent unnecessary re-renders
  const dragHandlers = useMemo(() => ({
    onDragEnter: dragDrop.handleDragEnter,
    onDragLeave: dragDrop.handleDragLeave,
    onDragOver: dragDrop.handleDragOver,
    onDrop: dragDrop.handleDrop,
  }), [dragDrop]);

  // Show loading screen until component is mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <LoadingScreen message="Cargando..." />
    );
  }

  // Authentication views
  if (!token) {
    return <LoginScreen onLoginSuccess={setToken} />;
  }

  // Loading state
  if (isInitializing || !sessionInfo) {
    return (
      <LoadingScreen
        message="Iniciando sesión..."
        showRetryButton={!isInitializing && !sessionInfo}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden grid grid-rows-[auto_1fr_auto] bg-slate-950 relative transition-[grid-template-columns] duration-300 ease-in-out"
      style={{ gridTemplateColumns: isSidebarCollapsed ? "64px 1fr" : "320px 1fr" }}
      {...dragHandlers}
    >
      <DragDropOverlay isDragging={dragDrop.isDragging} />
      
      {/* Sidebar */}
      <div className="row-span-3 m-0 p-0 overflow-hidden min-w-0">
        <Sidebar 
          token={token} 
          currentThreadId={currentThreadId}
          onThreadSelect={handleThreadSelect}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Header */}
      <div className="col-start-2">
        <ChatHeader token={token} />
      </div>

      {/* Main content */}
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
              onSend={handleSendMessage}
              onFileSelect={handleFileSelect}
              hasUploadedFiles={fileUpload.uploadedFiles.length > 0}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
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
