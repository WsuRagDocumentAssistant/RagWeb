import React, { useEffect, useMemo, useRef } from "react";
import { Check, ThumbsUp } from "lucide-react";
import { MessageBubble } from "@/shared";
import "../styles/ChatMessages.css";

const MODEL_LABEL = {
  claude: "Claude",
  gemini: "Gemini",
  gpt: "GPT",
  local: "로컬 모델",
  merged: "병합 결과",
};

const MODEL_COLOR = {
  claude: "#d97757",
  gemini: "#2563eb",
  gpt: "#10a37f",
  local: "#6b6b80",
  merged: "#4f46e5",
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

export default function ChatMessages({ messages, selectedMessageId, onSelectMessage, onMergeTurn, onChoosePreference }) {
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
        const chosenMsg = compareAssistants.find((m) => m.preferred);
        const isCompare = compareAssistants.length >= 2;
        const allDone = compareAssistants.every((m) => !m.isStreaming);
        const resolved = !!chosenMsg || !!mergedMsg;

        return (
          <div key={turn.user?.id ?? `turn-${i}`} className="message-turn">
            {turn.user && <MessageBubble message={turn.user} />}

            {isCompare ? (
              <>
                <div className="compare-grid">
                  {compareAssistants.map((m) => {
                    const accent = MODEL_COLOR[m.provider] ?? "#4f46e5";
                    return (
                      <div
                        key={m.id}
                        className={[
                          "compare-card",
                          m.preferred && "preferred",
                          chosenMsg && !m.preferred && "dimmed",
                        ].filter(Boolean).join(" ")}
                        style={{ "--accent": accent }}
                      >
                        <div className="compare-card-header">
                          <span className="compare-card-label">{MODEL_LABEL[m.provider] ?? m.provider}</span>
                          {m.preferred && (
                            <span className="compare-card-badge">
                              <Check size={11} /> 선택됨
                            </span>
                          )}
                        </div>
                        <MessageBubble
                          message={m}
                          isSelected={m.id === selectedMessageId}
                          onSelect={onSelectMessage}
                        />
                      </div>
                    );
                  })}
                </div>

                {allDone && !resolved && (
                  <div className="compare-actions">
                    <div className="preference-bar">
                      <span className="preference-bar-label">어떤 응답이 더 나은가요?</span>
                      <div className="preference-buttons">
                        {compareAssistants.map((m) => (
                          <button
                            key={m.id}
                            className="preference-btn"
                            style={{ "--accent": MODEL_COLOR[m.provider] ?? "#4f46e5" }}
                            onClick={() => onChoosePreference?.(turn.user?.turnId, m.id)}
                          >
                            <ThumbsUp size={13} />
                            {MODEL_LABEL[m.provider] ?? m.provider}
                          </button>
                        ))}
                        <button
                          className="preference-btn"
                          onClick={() => onMergeTurn?.(turn.user?.turnId)}
                        >
                          병합
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {chosenMsg && (
                  <div className="compare-resolved" style={{ "--accent": MODEL_COLOR[chosenMsg.provider] ?? "#4f46e5" }}>
                    <span className="compare-resolved-label">선택한 답변 ({MODEL_LABEL[chosenMsg.provider] ?? chosenMsg.provider})</span>
                    <MessageBubble
                      message={chosenMsg}
                      isSelected={chosenMsg.id === selectedMessageId}
                      onSelect={onSelectMessage}
                    />
                  </div>
                )}

                {mergedMsg && (
                  <div className="compare-merged">
                    <div className="compare-card">
                      <div className="compare-card-header">
                        <span className="compare-card-label">{MODEL_LABEL.merged}</span>
                      </div>
                      <MessageBubble
                        message={mergedMsg}
                        isSelected={mergedMsg.id === selectedMessageId}
                        onSelect={onSelectMessage}
                      />
                    </div>
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
