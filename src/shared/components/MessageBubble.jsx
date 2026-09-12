import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Check, Copy, Loader2, X } from "lucide-react";
import "../styles/MessageBubble.css";

// AI 답변에 <u>/<mark>처럼 강조용 원본 HTML 태그가 섞여 오는 경우가 있어 렌더링해줘야 하지만,
// 외부 검색 결과를 인용하는 응답이라 XSS 방지를 위해 허용 태그만 화이트리스트로 통과시킨다.
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u", "mark"],
};

export default function MessageBubble({ message, isSelected, onSelect }) {
  const [copied, setCopied] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const isUser = message.role === "user";
  const hasError = !!message.error;
  const isClickable = !isUser && !message.isStreaming && !hasError && !!onSelect;
  const canCopy = !message.isStreaming && !hasError && !!message.content;

  // 확대된 그림은 ESC로도 닫을 수 있어야 한다.
  useEffect(() => {
    if (!zoomedImage) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setZoomedImage(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [zoomedImage]);

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
    <>
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
                <button
                  type="button"
                  className="bubble-attachment-btn"
                  onClick={(e) => { e.stopPropagation(); setZoomedImage({ url: message.attachmentUrl, name: "첨부 이미지" }); }}
                >
                  <img src={message.attachmentUrl} alt="첨부 이미지" className="bubble-attachment" />
                </button>
              )}
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.images && message.images.length > 0 && (
                <div className="bubble-images">
                  {message.images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      className="bubble-image-item"
                      onClick={(e) => { e.stopPropagation(); setZoomedImage(img); }}
                      title={img.aiSummary || img.caption || img.name}
                    >
                      <img src={img.url} alt={img.aiSummary || img.caption || img.name} />
                      {(img.aiSummary || img.caption) && (
                        <span className="bubble-image-caption">{img.aiSummary || img.caption}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
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
    {zoomedImage && (
      <div className="bubble-image-lightbox" onClick={() => setZoomedImage(null)}>
        <button
          type="button"
          className="bubble-image-lightbox-close"
          onClick={() => setZoomedImage(null)}
          title="닫기"
        >
          <X size={20} />
        </button>
        <img
          src={zoomedImage.url}
          alt={zoomedImage.aiSummary || zoomedImage.caption || zoomedImage.name}
          onClick={(e) => e.stopPropagation()}
        />
        {(zoomedImage.aiSummary || zoomedImage.caption) && (
          <p className="bubble-image-lightbox-caption" onClick={(e) => e.stopPropagation()}>
            {zoomedImage.aiSummary || zoomedImage.caption}
          </p>
        )}
      </div>
    )}
    </>
  );
}
