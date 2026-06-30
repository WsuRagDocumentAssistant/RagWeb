import React, { useEffect, useRef } from "react";
import { MessageBubble } from "@/shared";
import "../styles/ChatMessages.css";

export default function ChatMessages({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages.at(-1)?.content]);

  if (messages.length === 0) {
    return (
      <div className="messages-empty">
        <span className="messages-empty-icon">🤖</span>
        <h2 className="messages-empty-title">AI RAG Assistant</h2>
        <p className="messages-empty-desc">
          파일을 업로드하고 AI에게 질문해보세요.<br />
          좌측 사이드바의 <span>임베딩 파일</span> 메뉴에서 파일을 추가할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="messages-scroll">
      {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
      <div ref={bottomRef} />
    </div>
  );
}
