import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, File as FileIcon, FileSearch, Loader2, Paperclip, Plus, X } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { formatBytes } from "@/shared";
import { ALLOWED_IMAGE_TYPES, MAX_ATTACHMENT_SIZE, isAllowedQueryFile } from "../attachmentRules";
import DocumentPickerModal from "./DocumentPickerModal";
import "../styles/ChatInput.css";

const MODEL_LABEL = {
  claude: "Claude",
  gemini: "Gemini",
  gpt: "GPT",
};

const CHECKABLE_PROVIDERS = ["claude", "gemini", "gpt"];

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({ onSend, isLoading, pendingImage, setPendingImage, pendingFile, setPendingFile }) {
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

  const removePendingFile = () => setPendingFile(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !pendingImage && !pendingFile) || isLoading) return;

    const imageDataUrl = pendingImage ? await readAsDataUrl(pendingImage.file) : undefined;
    const fileAttachment = pendingFile
      ? {
          name: pendingFile.file.name,
          mimeType: pendingFile.file.type || "application/octet-stream",
          size: pendingFile.file.size,
          content: (await readAsDataUrl(pendingFile.file)).split(",")[1] ?? "",
        }
      : undefined;

    onSend(trimmed, imageDataUrl, fileAttachment);
    removePendingImage();
    removePendingFile();
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
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error(`첨부 파일은 ${formatBytes(MAX_ATTACHMENT_SIZE)}까지만 가능합니다. (${file.name})`);
      return;
    }
    // 이미지는 문서 등록(임베딩)이 아니라 채팅 메시지에 붙는 첨부 미리보기로만 사용한다.
    if (file.type.startsWith("image/")) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`이미지는 PNG/JPEG/GIF/WEBP만 첨부할 수 있습니다. (${file.name})`);
        return;
      }
      setPendingImage((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return { file, previewUrl: URL.createObjectURL(file) };
      });
      return;
    }
    // 이미지가 아닌 파일도 문서 등록(임베딩)이 아니라, 이 질문에만 첨부되는 참고 자료로 다룬다.
    if (!isAllowedQueryFile(file)) {
      toast.error(`파일은 PDF만 첨부할 수 있습니다. (${file.name})`);
      return;
    }
    setPendingFile({ file });
  };

  const canSend = (text.trim().length > 0 || !!pendingImage || !!pendingFile) && !isLoading;

  return (
    <div className="chat-input-wrap">
      {(pendingImage || pendingFile) && (
        <div className="chat-pending-row">
          {pendingImage && (
            <div className="chat-pending-card chat-pending-card-image">
              <img src={pendingImage.previewUrl} alt="첨부 이미지 미리보기" />
              <button className="chat-pending-card-remove" onClick={removePendingImage} title="첨부 취소">
                <X size={12} />
              </button>
            </div>
          )}
          {pendingFile && (
            <div className="chat-pending-card chat-pending-card-file">
              <span className="chat-pending-card-file-icon">
                <FileIcon size={18} />
              </span>
              <span className="chat-pending-card-file-name" title={pendingFile.file.name}>{pendingFile.file.name}</span>
              <span className="chat-pending-card-file-size">{formatBytes(pendingFile.file.size)}</span>
              <button className="chat-pending-card-remove" onClick={removePendingFile} title="첨부 취소">
                <X size={12} />
              </button>
            </div>
          )}
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
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
