import React from "react";
import { useAppState } from "@/core/AppState";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

export default function ChatPage() {
  const messages = useAppState((s) => s.messages);
  const chatLoading = useAppState((s) => s.chatLoading);
  const selectedFileIds = useAppState((s) => s.selectedFileIds);
  const sendMessage = useAppState((s) => s.sendMessage);

  return (
    <div className="chat-panel">
      <ChatMessages messages={messages} />
      <ChatInput
        onSend={sendMessage}
        isLoading={chatLoading}
        selectedFileCount={selectedFileIds.length}
      />
    </div>
  );
}
