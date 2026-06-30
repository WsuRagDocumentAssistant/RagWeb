import React, { useState, useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import "../styles/ChatInput.css";

export default function ChatInput({ onSend, isLoading, selectedFileCount }) {
  const [text, setText] = useState("");
  const ref = useRef(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <div className="chat-input-wrap">
      {selectedFileCount > 0 && (
        <div className="file-chip">📎 파일 {selectedFileCount}개 연결됨</div>
      )}
      <div className="input-row">
        <textarea
          ref={ref}
          className="chat-textarea"
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요… (Shift+Enter 줄바꿈)"
          rows={1}
        />
        <button className={`send-btn ${canSend ? "active" : "disabled"}`} onClick={handleSend} disabled={!canSend}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
        </button>
      </div>
    </div>
  );
}
