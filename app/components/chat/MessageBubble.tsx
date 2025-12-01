"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { Copy, Check, MoreVertical, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
  AnchorHTMLAttributes,
  BlockquoteHTMLAttributes,
  OlHTMLAttributes,
  LiHTMLAttributes,
} from "react";
import { Avatar, type Sender } from "./Avatar";

export type ChatMessage = {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
};

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubbleComponent({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const containerWidthClasses = isUser
    ? "max-w-[88%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%]"
    : "max-w-[96%] sm:max-w-[92%] md:max-w-[88%] lg:max-w-[84%]";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    } catch {
      // noop
    }
  }, [message.text]);

  const preprocessMath = useCallback((text: string): string => {
    let out = text.replace(/\r\n?/g, "\n");
  
    out = out.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_m, body) => `\n\n$$\n${body.trim()}\n$$\n\n`);
    out = out.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_m, body) => `$${body.trim()}$`);
  
    type Seg = { ph: string; val: string };
    const codeBlocks: Seg[] = [];
    const codeInline: Seg[] = [];
    const mathDisplay: Seg[] = [];
    const mathInline: Seg[] = [];
  
    const stash = (arr: Seg[], val: string, tag: string) => {
      const ph = `@@${tag}${arr.length}@@`;
      arr.push({ ph, val });
      return ph;
    };
  
    out = out.replace(/```[\s\S]*?```/g, m => stash(codeBlocks, m, "CODEB"));
    out = out.replace(/`[^`]*`/g, m => stash(codeInline, m, "CODEI"));
    out = out.replace(/\$\$[\s\S]*?\$\$/g, m => stash(mathDisplay, m, "MATHD"));
    out = out.replace(/\$[^$\n]*?\$/g, m => stash(mathInline, m, "MATHI"));
  
    out = out.replace(/\(\s*([^\n()]{1,200})\s*\)/g, (m, inner) => {
      const s = inner.trim();
      if (
        /^\\[A-Za-z]+/.test(s) ||
        /\\(frac|int|sum|sqrt|left|right|omega|alpha|beta|cdot|times)\b/.test(s) ||
        /[\^_]/.test(s)
      ) return `$${s}$`;
      return m;
    });
  
    out = out.replace(/^(\s*\d+\.)\s*(?=\$)/gm, "$1 ");
  
    const restore = (arr: Seg[]) => arr.reduce((acc, { ph, val }) => acc.replace(ph, val), out);
    out = restore(mathInline);
    out = restore(mathDisplay);
    out = restore(codeInline);
    out = restore(codeBlocks);
  
    out = out.replace(/\s*\$\$\s*([\s\S]*?)\s*\$\$\s*/g, (_m, b) => `\n\n$$\n${b.trim()}\n$$\n\n`);
  
    return out;
  }, []);
  
  const processedText = useMemo(() => preprocessMath(message.text), [message.text, preprocessMath]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`w-full flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`${containerWidthClasses} flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <Avatar sender={message.sender} />
        
        <div
          className={`relative group rounded-2xl px-5 py-3 text-sm w-fit max-w-full ${
            isUser 
              ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-[#005E44] shadow-lg" 
              : "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg"
          }`}
        >
          {/* Menu button - only show on hover */}
          <div className={`absolute ${isUser ? "-left-10" : "-right-10"} top-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5 text-gray-600" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`absolute ${isUser ? "left-0" : "right-0"} top-10 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50`}
                >
                  <button
                    onClick={handleCopy}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  {!isUser && (
                    <>
                      <div className="border-t border-gray-200" />
                      <button className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Útil</span>
                      </button>
                      <button className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>No útil</span>
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message content */}
          <div className={`prose prose-slate max-w-none prose-p:my-3 prose-p:leading-relaxed prose-pre:my-4 prose-pre:p-4 prose-pre:rounded-xl prose-pre:bg-slate-900/95 prose-pre:text-slate-100 prose-pre:shadow-lg prose-code:before:hidden prose-code:after:hidden prose-code:px-2 prose-code:py-1 prose-code:bg-slate-100 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:font-medium prose-h1:text-2xl prose-h1:font-bold prose-h1:my-4 prose-h2:text-xl prose-h2:font-bold prose-h2:my-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:my-2 prose-h4:text-base prose-h4:font-semibold prose-h4:my-2 prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5 prose-li:leading-relaxed prose-blockquote:my-4 prose-blockquote:pl-4 prose-blockquote:border-l-4 prose-blockquote:italic prose-blockquote:opacity-90 prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2 prose-a:transition-colors prose-hr:my-6 overflow-x-auto ${
            isUser 
              ? "prose-headings:text-[#005E44] prose-a:text-[#006644] prose-a:hover:text-[#008855] prose-blockquote:text-[#005E44]/80 prose-blockquote:border-[#005E44]/40" 
              : "prose-headings:text-white prose-a:text-emerald-200 prose-a:hover:text-emerald-100 prose-blockquote:text-white/90 prose-blockquote:border-white/30"
          }`} style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
              components={{
                // Headings
                h1(props: HTMLAttributes<HTMLHeadingElement>) {
                  return <h1 className={`${isUser ? "text-[#005E44]" : "text-white"} font-bold text-2xl mt-4 mb-3`} {...props} />;
                },
                h2(props: HTMLAttributes<HTMLHeadingElement>) {
                  return <h2 className={`${isUser ? "text-[#005E44]" : "text-white"} font-bold text-xl mt-3 mb-2`} {...props} />;
                },
                h3(props: HTMLAttributes<HTMLHeadingElement>) {
                  return <h3 className={`${isUser ? "text-[#005E44]" : "text-white"} font-semibold text-lg mt-2 mb-2`} {...props} />;
                },
                h4(props: HTMLAttributes<HTMLHeadingElement>) {
                  return <h4 className={`${isUser ? "text-[#005E44]" : "text-white"} font-semibold text-base mt-2 mb-1`} {...props} />;
                },
                // Paragraphs
                p(props: HTMLAttributes<HTMLParagraphElement>) {
                  return <p className={`my-3 leading-relaxed ${isUser ? "text-[#005E44]" : "text-white"}`} {...props} />;
                },
                // Lists
                ul(props: HTMLAttributes<HTMLUListElement>) {
                  return <ul className={`my-3 ml-4 space-y-1.5 list-disc ${isUser ? "text-[#005E44]" : "text-white"}`} {...props} />;
                },
                ol(props: OlHTMLAttributes<HTMLOListElement>) {
                  return <ol className={`my-3 ml-4 space-y-1.5 list-decimal ${isUser ? "text-[#005E44]" : "text-white"}`} {...props} />;
                },
                li(props: LiHTMLAttributes<HTMLLIElement>) {
                  return <li className={`my-1.5 leading-relaxed pl-1 ${isUser ? "text-[#005E44]" : "text-white"}`} {...props} />;
                },
                // Code blocks
                pre(props: HTMLAttributes<HTMLPreElement>) {
                  return (
                    <pre className={`my-4 p-4 rounded-xl bg-slate-900/95 text-slate-100 shadow-lg overflow-x-auto font-mono text-sm leading-relaxed`} {...props} />
                  );
                },
                code(props: HTMLAttributes<HTMLElement>) {
                  const isInline = !props.className?.includes('language-');
                  if (isInline) {
                    return (
                      <code className={`px-2 py-1 bg-slate-100 rounded text-sm font-mono font-medium ${isUser ? "text-[#005E44]" : "text-slate-900"}`} {...props} />
                    );
                  }
                  return <code className="text-slate-100" {...props} />;
                },
                // Blockquotes
                blockquote(props: BlockquoteHTMLAttributes<HTMLQuoteElement>) {
                  return (
                    <blockquote 
                      className={`my-4 pl-4 border-l-4 italic opacity-90 ${
                        isUser 
                          ? "text-[#005E44]/80 border-[#005E44]/40" 
                          : "text-white/90 border-white/30"
                      }`} 
                      {...props} 
                    />
                  );
                },
                // Links
                a(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
                  return (
                    <a 
                      className={`underline decoration-2 underline-offset-2 transition-colors ${
                        isUser 
                          ? "text-[#006644] hover:text-[#008855]" 
                          : "text-emerald-200 hover:text-emerald-100"
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props} 
                    />
                  );
                },
                // Horizontal rule
                hr(props: HTMLAttributes<HTMLHRElement>) {
                  return <hr className={`my-6 ${isUser ? "border-yellow-300/30" : "border-white/20"}`} {...props} />;
                },
                // Tables
                table(props: TableHTMLAttributes<HTMLTableElement>) {
                  return (
                    <div className={`overflow-x-auto my-4 ${isUser ? "" : "rounded-lg border border-white/20 bg-white/10"}`}>
                      <table
                        className={`min-w-full table-auto border-collapse text-sm ${isUser ? "" : "text-white"}`}
                        {...props}
                      />
                    </div>
                  );
                },
                thead(props: HTMLAttributes<HTMLTableSectionElement>) {
                  return <thead className={`${isUser ? "" : "bg-white/10"}`} {...props} />;
                },
                th(props: ThHTMLAttributes<HTMLTableCellElement>) {
                  return (
                    <th
                      className={`border px-4 py-2.5 text-left font-semibold ${isUser ? "border-yellow-300/30 bg-yellow-50/50" : "border-white/20 bg-white/5"}`}
                      {...props}
                    />
                  );
                },
                td(props: TdHTMLAttributes<HTMLTableCellElement>) {
                  return (
                    <td
                      className={`border px-4 py-2.5 align-top ${isUser ? "border-yellow-300/30" : "border-white/20"}`}
                      {...props}
                    />
                  );
                },
                tr(props: HTMLAttributes<HTMLTableRowElement>) {
                  return <tr className={`${isUser ? "hover:bg-yellow-50/30" : "hover:bg-white/5"} transition-colors`} {...props} />;
                },
              }}
            >
              {processedText}
            </ReactMarkdown>
          </div>
          
          {/* Timestamp */}
          <p className={`mt-2 text-[10px] font-medium ${
            isUser ? "text-[#064e3b]/80" : "text-white/70"
          }`}>
            {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);
