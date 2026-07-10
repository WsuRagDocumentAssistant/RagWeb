import React, { useState, useRef } from "react";
import { ArrowUp, Loader2, Plus, ChevronDown } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/ChatInput.css";

const MODEL_LABEL = {
  claude: "Claude",
  gpt: "GPT",
  gemini: "Gemini",
  local: "로컬 모델",
};

export default function ChatInput({ onSend, onUpload, isLoading }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const provider = useAppState((s) => s.provider);
  const setProvider = useAppState((s) => s.setProvider);

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
        <label className="model-select">
          모델 선택
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            {Object.entries(MODEL_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="model-select-caret" />
        </label>
      </div>
    </div>
  );
}
