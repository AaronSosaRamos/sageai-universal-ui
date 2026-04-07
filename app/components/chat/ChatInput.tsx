"use client";

import { Send, Loader2, Paperclip, Sparkles } from "lucide-react";
import { useRef, memo, useCallback, useState } from "react";

interface ChatInputProps {
  value: string;
  isTyping: boolean;
  isUploading: boolean;
  isDragging: boolean;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Oculta el botón de adjuntar archivos (ej. chat con asistente personalizado) */
  hideFileUpload?: boolean;
  /** Permite enviar con solo archivos (sin texto) */
  hasUploadedFiles?: boolean;
  /** accept del input file (p. ej. PDF, Word, Excel) */
  accept?: string;
}

function ChatInputComponent({ 
  value, 
  isTyping, 
  isUploading, 
  isDragging,
  onChange, 
  onSend,
  onFileSelect,
  hideFileUpload = false,
  hasUploadedFiles = false,
  accept,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    onChange(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || hasUploadedFiles) && !isTyping && !isUploading) {
        onSend();
      }
    }
  }, [value, hasUploadedFiles, isTyping, isUploading, onSend]);

  const canSend = (value.trim().length > 0 || hasUploadedFiles) && !isTyping && !isUploading;

  return (
    <div className="pb-6 shrink-0 flex flex-col gap-3">
      <div
        className={`relative rounded-2xl border-2 shadow-lg overflow-hidden transition-all duration-200 ${
          isDragging 
            ? "border-emerald-400 bg-emerald-900/20" 
            : isFocused
            ? "border-emerald-500 bg-slate-800"
            : "border-slate-700 bg-slate-800"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onFileSelect}
          accept={accept}
        />
        
        <div className="flex items-end gap-2 p-3">
          {!hideFileUpload && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                isUploading || isTyping
                  ? "bg-slate-700 cursor-not-allowed"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
              disabled={isUploading || isTyping}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5 text-slate-300" />
              )}
            </button>
          )}

          <div className="flex-1 min-h-[44px] max-h-[200px] relative">
            <textarea
              ref={textareaRef}
              value={value}
              rows={1}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Escribe tu mensaje..."
              className="w-full resize-none bg-transparent outline-none py-2.5 px-3 text-white text-sm overflow-y-auto rounded-xl transition-all placeholder:text-slate-500"
              style={{
                minHeight: '44px',
                maxHeight: '200px'
              }}
              disabled={isTyping || isUploading}
            />
          </div>

          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={`px-5 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 flex-shrink-0 ${
              canSend 
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md hover:shadow-lg hover:scale-105" 
                : "bg-slate-600"
            }`}
          >
            {isTyping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        {isDragging ? (
          <>
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Suelta los archivos aquí</span>
          </>
        ) : (
          <span>
            Presiona <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono text-xs">Enter</kbd> para enviar
          </span>
        )}
      </div>
    </div>
  );
}

export const ChatInput = memo(ChatInputComponent);
