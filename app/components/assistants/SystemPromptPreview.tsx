"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import type { HTMLAttributes } from "react";

interface SystemPromptPreviewProps {
  content: string;
  className?: string;
  maxLines?: number;
}

export function SystemPromptPreview({
  content,
  className = "",
  maxLines,
}: SystemPromptPreviewProps) {
  const proseClasses = `
    prose prose-slate max-w-none
    prose-p:my-2 prose-p:leading-relaxed prose-p:text-gray-700
    prose-pre:my-3 prose-pre:p-4 prose-pre:rounded-xl prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:shadow-md prose-pre:overflow-x-auto
    prose-code:before:hidden prose-code:after:hidden prose-code:px-1.5 prose-code:py-0.5 prose-code:bg-slate-100 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-slate-800
    prose-h1:text-xl prose-h1:font-bold prose-h1:mt-4 prose-h1:mb-2 prose-h1:text-slate-900
    prose-h2:text-lg prose-h2:font-bold prose-h2:mt-3 prose-h2:mb-2 prose-h2:text-slate-900
    prose-h3:text-base prose-h3:font-semibold prose-h3:mt-2 prose-h3:mb-1 prose-h3:text-slate-900
    prose-h4:text-sm prose-h4:font-semibold prose-h4:mt-2 prose-h4:mb-1 prose-h4:text-slate-900
    prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:leading-relaxed
    prose-blockquote:my-3 prose-blockquote:pl-4 prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:italic prose-blockquote:text-slate-600 prose-blockquote:bg-emerald-50/50 prose-blockquote:py-1 prose-blockquote:rounded-r
    prose-a:text-emerald-600 prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2 prose-a:hover:text-emerald-700
    prose-hr:my-4 prose-hr:border-slate-200
    prose-strong:font-semibold prose-strong:text-slate-900
    prose-table:my-3 prose-th:bg-slate-100 prose-th:px-3 prose-th:py-2 prose-th:font-semibold prose-th:text-slate-800 prose-th:border prose-th:border-slate-200
    prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-slate-200 prose-td:text-slate-700
  `;

  const lineClampClass = maxLines === 2 ? "line-clamp-2" : maxLines === 3 ? "line-clamp-3" : maxLines === 4 ? "line-clamp-4" : maxLines === 5 ? "line-clamp-5" : "";

  return (
    <div
      className={`${proseClasses} ${lineClampClass} overflow-x-auto ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
            <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900" {...props} />
          ),
          h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
            <h2 className="text-lg font-bold mt-3 mb-2 text-slate-900" {...props} />
          ),
          h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
            <h3 className="text-base font-semibold mt-2 mb-1 text-slate-900" {...props} />
          ),
          h4: (props: HTMLAttributes<HTMLHeadingElement>) => (
            <h4 className="text-sm font-semibold mt-2 mb-1 text-slate-900" {...props} />
          ),
          p: (props: HTMLAttributes<HTMLParagraphElement>) => (
            <p className="my-2 leading-relaxed text-gray-700" {...props} />
          ),
          ul: (props: HTMLAttributes<HTMLUListElement>) => (
            <ul className="my-2 ml-4 space-y-0.5 list-disc text-gray-700" {...props} />
          ),
          ol: (props: HTMLAttributes<HTMLOListElement>) => (
            <ol className="my-2 ml-4 space-y-0.5 list-decimal text-gray-700" {...props} />
          ),
          li: (props: HTMLAttributes<HTMLLIElement>) => (
            <li className="my-0.5 leading-relaxed pl-1 text-gray-700" {...props} />
          ),
          pre: (props: HTMLAttributes<HTMLPreElement>) => (
            <pre className="my-3 p-4 rounded-xl bg-slate-900 text-slate-100 shadow-md overflow-x-auto font-mono text-sm leading-relaxed" {...props} />
          ),
          code: (props: HTMLAttributes<HTMLElement>) => {
            const isInline = !props.className?.includes("language-");
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono text-slate-800" {...props} />
              );
            }
            return <code className="text-slate-100" {...props} />;
          },
          blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
            <blockquote
              className="my-3 pl-4 border-l-4 border-emerald-500 italic text-slate-600 bg-emerald-50/50 py-1 rounded-r"
              {...props}
            />
          ),
          a: (props: HTMLAttributes<HTMLAnchorElement>) => (
            <a
              className="text-emerald-600 underline decoration-2 underline-offset-2 hover:text-emerald-700"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          hr: (props: HTMLAttributes<HTMLHRElement>) => (
            <hr className="my-4 border-slate-200" {...props} />
          ),
          strong: (props: HTMLAttributes<HTMLElement>) => (
            <strong className="font-semibold text-slate-900" {...props} />
          ),
        }}
      >
        {content || "*Sin contenido*"}
      </ReactMarkdown>
    </div>
  );
}
