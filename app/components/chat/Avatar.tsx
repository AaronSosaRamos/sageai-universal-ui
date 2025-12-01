"use client";

import { memo } from "react";

export type Sender = "user" | "bot";

interface AvatarProps {
  sender: Sender;
}

function AvatarComponent({ sender }: AvatarProps) {
  const isUser = sender === "user";
  return (
    <div
      className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-md border-2 flex-shrink-0 ${
        isUser ? "bg-gradient-to-br from-yellow-400 to-yellow-500" : "bg-gradient-to-br from-emerald-600 to-teal-600"
      }`}
      style={{
        color: isUser ? "#005E44" : "#FFFFFF",
        borderColor: isUser ? "#eab308" : "#064e3b",
      }}
      aria-label={isUser ? "Usuario" : "Asistente"}
    >
      <span className="drop-shadow-sm">
        {isUser ? "Tú" : "AI"}
      </span>
    </div>
  );
}

export const Avatar = memo(AvatarComponent);
