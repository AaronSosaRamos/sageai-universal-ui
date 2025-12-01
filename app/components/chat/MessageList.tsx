"use client";

import { useRef, useEffect, useMemo, memo } from "react";
import { MessageBubble, type ChatMessage } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ThreadLoader } from "./ThreadLoader";

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isLoadingThread?: boolean;
}

function MessageListComponent({ messages, isTyping, isLoadingThread = false }: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickRef = useRef(true);

  // Memoize messages to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => messages, [messages]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (!messages.length && !isTyping) return;
    const last = messages[messages.length - 1];
    const userTriggered = last?.sender === "user";
    if (shouldStickRef.current || userTriggered) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages, isTyping]);

  // Show loader when loading thread
  if (isLoadingThread) {
    return <ThreadLoader />;
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const threshold = 24;
          const atBottom = el.scrollHeight - (el.scrollTop + el.clientHeight) <= threshold;
          shouldStickRef.current = atBottom;
        }}
        className="flex-1 min-h-0 overflow-y-auto py-6 px-2 custom-scrollbar"
        style={{ scrollBehavior: "smooth" }}
      >
        {memoizedMessages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              ¡Comienza una conversación!
            </h3>
            <p className="text-gray-500">
              Escribe un mensaje para comenzar
            </p>
          </div>
        )}
        
        {memoizedMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {isTyping && <TypingIndicator />}
      </div>
    </div>
  );
}

export const MessageList = memo(MessageListComponent);
