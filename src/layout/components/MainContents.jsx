import React from "react";
import { useAppState } from "@/core/AppState";
import { ChatInput, ChatMessages } from "@/features/chat";
import { FileList } from "@/features/files";
import "../styles/MainContents.css";

export default function MainContents() {
  const activeTab = useAppState((s) => s.activeTab);
  const messages = useAppState((s) => s.messages);
  const chatLoading = useAppState((s) => s.chatLoading);
  const selectedFileIds = useAppState((s) => s.selectedFileIds);
  const sendMessage = useAppState((s) => s.sendMessage);
  const toggleFileSelection = useAppState((s) => s.toggleFileSelection);
  const files = useAppState((s) => s.files);
  const fileLoading = useAppState((s) => s.fileLoading);
  const uploadProgress = useAppState((s) => s.uploadProgress);
  const uploadFile = useAppState((s) => s.uploadFile);

  return (
    <main className="main-contents">
      {activeTab === "chat" ? (
        <div className="chat-panel">
          <ChatMessages messages={messages} />
          <ChatInput
            onSend={sendMessage}
            isLoading={chatLoading}
            selectedFileCount={selectedFileIds.length}
          />
        </div>
      ) : (
        <div className="files-panel">
          <FileList
            files={files}
            isLoading={fileLoading}
            uploadProgress={uploadProgress}
            selectedFileIds={selectedFileIds}
            onToggleSelect={toggleFileSelection}
            onUpload={uploadFile}
          />
        </div>
      )}
    </main>
  );
}
