import React from "react";
import { Loader2 } from "lucide-react";
import "../styles/MessageBubble.css";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const hasError = !!message.error;

  return (
    <div className={`bubble-row ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && <div className="bubble-avatar">AI</div>}
      <div className={["bubble", isUser ? "bubble-user" : "bubble-assistant", hasError && "bubble-error"].filter(Boolean).join(" ")}>
        {message.isStreaming && message.content === "" ? (
          <Loader2 size={16} className="animate-spin text-[#9b9bff]" />
        ) : hasError ? (
          <span style={{ color: "#f87171" }}>{message.error}</span>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}
