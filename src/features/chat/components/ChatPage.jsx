import React, { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useAppState } from "@/core/AppState";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import "../styles/ChatPage.css";

export default function ChatPage() {
  const messages = useAppState((s) => s.messages);
  const chatLoading = useAppState((s) => s.chatLoading);
  const sendMessage = useAppState((s) => s.sendMessage);
  const uploadFile = useAppState((s) => s.uploadFile);

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

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
    Array.from(e.dataTransfer.files ?? []).forEach((file) => uploadFile(file));
  };

  return (
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

      <ChatMessages messages={messages} />

      <ChatInput onSend={sendMessage} onUpload={uploadFile} isLoading={chatLoading} />
    </div>
  );
}
