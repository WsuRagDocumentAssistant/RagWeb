import React, { useState, useRef } from "react";
import { ArrowUp, Loader2, Plus, X } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/ChatInput.css";

const MODEL_LABEL = {
  claude: "Claude",
  gemini: "Gemini",
  gpt: "GPT",
};

const CHECKABLE_PROVIDERS = ["claude", "gemini", "gpt"];

export default function ChatInput({ onSend, onUpload, isLoading, pendingImage, setPendingImage }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedProviders = useAppState((s) => s.selectedProviders);
  const toggleProvider = useAppState((s) => s.toggleProvider);

  const removePendingImage = () => {
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !pendingImage) || isLoading) return;
    if (pendingImage) {
      const image = pendingImage;
      const reader = new FileReader();
      reader.onload = () => onSend(trimmed, reader.result);
      reader.readAsDataURL(image.file);
      removePendingImage();
    } else {
      onSend(trimmed);
    }
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
    e.target.value = "";
    if (!file) return;
    // 이미지는 문서 등록(임베딩)이 아니라 채팅 메시지에 붙는 첨부 미리보기로만 사용한다.
    if (file.type.startsWith("image/")) {
      setPendingImage((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return { file, previewUrl: URL.createObjectURL(file) };
      });
      return;
    }
    onUpload(file);
  };

  const canSend = (text.trim().length > 0 || !!pendingImage) && !isLoading;

  return (
    <div className="chat-input-wrap">
      {pendingImage && (
        <div className="chat-pending-image">
          <img src={pendingImage.previewUrl} alt="첨부 이미지 미리보기" />
          <span className="chat-pending-image-name">{pendingImage.file.name}</span>
          <button className="chat-pending-image-remove" onClick={removePendingImage} title="첨부 취소">
            <X size={13} />
          </button>
        </div>
      )}
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
      </div>
    </div>
  );
}
