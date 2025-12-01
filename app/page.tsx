"use client";

import { useState, useMemo, useCallback } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { RegisterScreen } from "./components/RegisterScreen";
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
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('token');
    }
    return null;
  });
  const [view, setView] = useState<'login' | 'register'>('login');
  const [input, setInput] = useState("");
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const handleSendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    sendMessage(trimmed, fileUpload.uploadedFiles);
    setInput("");
  }, [input, sendMessage, fileUpload.uploadedFiles]);

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

  // Authentication views
  if (!token) {
    if (view === 'register') {
      return (
        <RegisterScreen
          onBack={() => setView('login')}
          onRegisterSuccess={() => setView('login')}
        />
      );
    }
    return (
      <LoginScreen
        onLoginSuccess={setToken}
        onRegister={() => setView('register')}
      />
    );
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
      className="fixed inset-0 overflow-hidden grid grid-cols-[auto_1fr] grid-rows-[auto_1fr_auto] bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 relative"
      {...dragHandlers}
    >
      <DragDropOverlay isDragging={dragDrop.isDragging} />
      
      {/* Sidebar */}
      <div className="row-span-3 m-0 p-0 overflow-hidden">
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
