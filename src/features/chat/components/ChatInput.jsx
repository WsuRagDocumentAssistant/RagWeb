import React, { useState, useRef } from "react";
import { ArrowUp, Loader2, Plus } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/ChatInput.css";

const MODEL_LABEL = {
  claude: "Claude",
  gemini: "Gemini",
  gpt: "GPT",
};

const CHECKABLE_PROVIDERS = ["claude", "gemini", "gpt"];

export default function ChatInput({ onSend, onUpload, isLoading }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedProviders = useAppState((s) => s.selectedProviders);
  const toggleProvider = useAppState((s) => s.toggleProvider);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  };

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <div className="chat-input-wrap">
      <div className="input-row">
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
        <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="파일 첨부">
          <Plus size={18} />
        </button>
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="텍스트를 입력해주세요"
          rows={1}
        />
        <button className={`send-btn ${canSend ? "active" : "disabled"}`} onClick={handleSend} disabled={!canSend}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
        </button>
      </div>
      <div className="model-select-row">
        <span className="model-select-label">모델 선택</span>
        <div className="model-checkbox-group">
          {CHECKABLE_PROVIDERS.map((p) => (
            <label
              key={p}
              className={`model-checkbox ${selectedProviders.includes(p) ? "checked" : ""}`}
            >
              <input
                type="checkbox"
                checked={selectedProviders.includes(p)}
                onChange={() => toggleProvider(p)}
              />
              {MODEL_LABEL[p]}
            </label>
          ))}
        </div>
        {selectedProviders.length === 2 && (
          <span className="model-compare-hint">2개 모델 비교 중</span>
        )}
      </div>
    </div>
  );
}
