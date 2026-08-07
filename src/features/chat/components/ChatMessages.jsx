import React, { useEffect, useMemo, useRef } from "react";
import { GitMerge } from "lucide-react";
import { MessageBubble } from "@/shared";
import "../styles/ChatMessages.css";

const MODEL_LABEL = {
  claude: "Claude",
  gemini: "Gemini",
  gpt: "GPT",
  local: "로컬 모델",
  merged: "병합 결과",
};

function groupIntoTurns(messages) {
  const turns = [];
  let current = null;
  messages.forEach((msg) => {
    if (msg.role === "user") {
      current = { user: msg, assistants: [] };
      turns.push(current);
    } else if (current) {
      current.assistants.push(msg);
    } else {
      turns.push({ user: null, assistants: [msg] });
    }
  });
  return turns;
}

export default function ChatMessages({ messages, selectedMessageId, onSelectMessage, onMergeTurn }) {
  const bottomRef = useRef(null);
  const turns = useMemo(() => groupIntoTurns(messages), [messages]);

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
          <span>+ 버튼</span>을 누르거나 파일을 이 화면에 드래그해서 추가할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="messages-scroll">
      {turns.map((turn, i) => {
        const compareAssistants = turn.assistants.filter((m) => m.provider && m.provider !== "merged");
        const mergedMsg = turn.assistants.find((m) => m.provider === "merged");
        const isCompare = compareAssistants.length >= 2;

        return (
          <div key={turn.user?.id ?? `turn-${i}`} className="message-turn">
            {turn.user && <MessageBubble message={turn.user} />}

            {isCompare ? (
              <>
                <div className="compare-grid">
                  {compareAssistants.map((m) => (
                    <div key={m.id} className="compare-column">
                      <span className="compare-column-label">{MODEL_LABEL[m.provider] ?? m.provider}</span>
                      <MessageBubble
                        message={m}
                        isSelected={m.id === selectedMessageId}
                        onSelect={onSelectMessage}
                      />
                    </div>
                  ))}
                </div>

                {!mergedMsg && compareAssistants.every((m) => !m.isStreaming) && (
                  <button className="merge-btn" onClick={() => onMergeTurn?.(turn.user?.turnId)}>
                    <GitMerge size={13} />
                    두 결과 병합하기
                  </button>
                )}

                {mergedMsg && (
                  <div className="compare-column compare-merged">
                    <span className="compare-column-label">{MODEL_LABEL.merged}</span>
                    <MessageBubble
                      message={mergedMsg}
                      isSelected={mergedMsg.id === selectedMessageId}
                      onSelect={onSelectMessage}
                    />
                  </div>
                )}
              </>
            ) : (
              turn.assistants.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isSelected={m.id === selectedMessageId}
                  onSelect={onSelectMessage}
                />
              ))
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
