import React, { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { formatBytes } from "@/shared";
import { ALLOWED_IMAGE_TYPES, MAX_ATTACHMENT_SIZE } from "../attachmentRules";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import RightSidebar from "./RightSidebar";
import "../styles/ChatPage.css";

const RIGHT_SIDEBAR_COLLAPSED_KEY = "chat_right_sidebar_collapsed";

export default function ChatPage() {
  const sessions = useAppState((s) => s.sessions);
  const activeSessionId = useAppState((s) => s.activeSessionId);
  const chatLoading = useAppState((s) => s.chatLoading);
  const sendMessage = useAppState((s) => s.sendMessage);
  const uploadFile = useAppState((s) => s.uploadFile);
  const mergeTurn = useAppState((s) => s.mergeTurn);
  const choosePreference = useAppState((s) => s.choosePreference);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];
  const isLoadingHistory = activeSession?.messagesLoaded === false;

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [pendingImage, setPendingImage] = useState(null); // { file, previewUrl } — 문서 등록이 아닌 채팅 첨부용
  const [pendingFile, setPendingFile] = useState(null); // { file } — 이미지가 아닌, 이 질문에만 첨부되는 참고 파일
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(
    () => localStorage.getItem(RIGHT_SIDEBAR_COLLAPSED_KEY) === "1",
  );

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId) ?? null,
    [messages, selectedMessageId],
  );

  const handleSelectMessage = (id) => {
    setSelectedMessageId(id);
    setRightSidebarCollapsed(false);
    localStorage.setItem(RIGHT_SIDEBAR_COLLAPSED_KEY, "0");
  };

  const toggleRightSidebarCollapsed = () => {
    setRightSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(RIGHT_SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    const imageFile = files.find((f) => f.type.startsWith("image/"));
    // 이미지는 문서 등록(임베딩)이 아니라 채팅 첨부 미리보기로만 사용한다. "+" 버튼으로 고를 때와
    // 동일하게 형식·크기 제한을 지킨다.
    if (imageFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        toast.error(`이미지는 PNG/JPEG/GIF/WEBP만 첨부할 수 있습니다. (${imageFile.name})`);
      } else if (imageFile.size > MAX_ATTACHMENT_SIZE) {
        toast.error(`첨부 파일은 ${formatBytes(MAX_ATTACHMENT_SIZE)}까지만 가능합니다. (${imageFile.name})`);
      } else {
        setPendingImage((prev) => {
          if (prev) URL.revokeObjectURL(prev.previewUrl);
          return { file: imageFile, previewUrl: URL.createObjectURL(imageFile) };
        });
      }
    }
    files.filter((f) => f !== imageFile).forEach((file) => uploadFile(file));
  };

  return (
    <>
      <div
        className="chat-panel"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="chat-dropzone-overlay">
            <UploadCloud size={32} />
            <p>여기에 파일을 놓아 업로드</p>
          </div>
        )}

        <ChatMessages
          messages={messages}
          isLoadingHistory={isLoadingHistory}
          selectedMessageId={selectedMessageId}
          onSelectMessage={handleSelectMessage}
          onMergeTurn={mergeTurn}
          onChoosePreference={choosePreference}
        />

        <ChatInput
          onSend={sendMessage}
          isLoading={chatLoading}
          pendingImage={pendingImage}
          setPendingImage={setPendingImage}
          pendingFile={pendingFile}
          setPendingFile={setPendingFile}
        />
      </div>

      <RightSidebar
        message={selectedMessage}
        collapsed={rightSidebarCollapsed}
        onToggleCollapsed={toggleRightSidebarCollapsed}
      />
    </>
  );
}
