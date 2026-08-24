import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Loader2 } from "lucide-react";
import "../styles/MessageBubble.css";

export default function MessageBubble({ message, isSelected, onSelect }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const hasError = !!message.error;
  const isClickable = !isUser && !message.isStreaming && !hasError && !!onSelect;
  const canCopy = !message.isStreaming && !hasError && !!message.content;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 접근 실패 시 조용히 무시 */
    }
  };

  return (
    <div className={`bubble-row ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`bubble-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={[
            "bubble",
            isUser ? "bubble-user" : "bubble-assistant",
            hasError && "bubble-error",
            isClickable && "bubble-clickable",
            isSelected && "bubble-selected",
          ].filter(Boolean).join(" ")}
          onClick={isClickable ? () => onSelect(message.id) : undefined}
        >
          {message.isStreaming && message.content === "" ? (
            <Loader2 size={16} className="animate-spin text-[#9b9bff]" />
          ) : hasError ? (
            <span style={{ color: "#f87171" }}>{message.error}</span>
          ) : (
            <>
              {message.attachmentUrl && (
                <img src={message.attachmentUrl} alt="첨부 이미지" className="bubble-attachment" />
              )}
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>
            </>
          )}
        </div>

        {canCopy && (
          <button className="bubble-copy-btn" onClick={handleCopy} title="복사">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "복사됨" : "복사"}
          </button>
        )}
      </div>
    </div>
  );
}
