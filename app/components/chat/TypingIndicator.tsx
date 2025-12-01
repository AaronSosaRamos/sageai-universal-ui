"use client";

import { Avatar } from "./Avatar";
import { memo } from "react";

function TypingIndicatorComponent() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <Avatar sender="bot" />
      <div className="rounded-2xl px-5 py-3 border-2 inline-flex items-center gap-2 shadow-md bg-white/80 backdrop-blur-sm" style={{ borderColor: "#E2E8F0" }}>
        <span className="sr-only">Escribiendo…</span>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-500"
              style={{
                animation: `typing 1.4s infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export const TypingIndicator = memo(TypingIndicatorComponent);
