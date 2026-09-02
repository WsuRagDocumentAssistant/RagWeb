import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, FileSearch, Loader2, Paperclip, Plus, X } from "lucide-react";
import { useAppState } from "@/core/AppState";
import DocumentPickerModal from "./DocumentPickerModal";
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
  const attachMenuRef = useRef(null);

  const selectedProviders = useAppState((s) => s.selectedProviders);
  const toggleProvider = useAppState((s) => s.toggleProvider);
  const selectedDocumentIds = useAppState((s) => s.selectedDocumentIds);
  const setSelectedDocumentIds = useAppState((s) => s.setSelectedDocumentIds);

  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!attachMenuOpen) return;
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) setAttachMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [attachMenuOpen]);

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
      {selectedDocumentIds.length > 0 && (
        <div className="chat-doc-scope">
          <FileSearch size={13} />
          <span>선택한 문서 {selectedDocumentIds.length}개 안에서만 검색</span>
          <button
            className="chat-doc-scope-clear"
            onClick={() => setSelectedDocumentIds([])}
            title="검색 범위 해제"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div className="input-row">
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
        <div className="attach-menu-wrap" ref={attachMenuRef}>
          <button className="attach-btn" onClick={() => setAttachMenuOpen((v) => !v)} title="추가">
            <Plus size={18} />
          </button>
          {attachMenuOpen && (
            <div className="attach-menu">
              <button
                className="attach-menu-item"
                onClick={() => { setAttachMenuOpen(false); fileInputRef.current?.click(); }}
              >
                <Paperclip size={14} />
                파일 또는 사진 추가
              </button>
              <button
                className="attach-menu-item"
                onClick={() => { setAttachMenuOpen(false); setPickerOpen(true); }}
              >
                <FileSearch size={14} />
                검색 문서 선택
              </button>
            </div>
          )}
        </div>
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

      {pickerOpen && (
        <DocumentPickerModal
          initialSelected={selectedDocumentIds}
          onClose={() => setPickerOpen(false)}
          onConfirm={setSelectedDocumentIds}
        />
      )}
    </div>
  );
}
