import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ThumbsUp, X } from "lucide-react";
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

// 병합을 "수행"할 모델은 답변 비교에 쓰인 모델로 한정할 이유가 없다 — 항상 전체 목록에서 고를 수 있게 한다.
const ALL_PROVIDERS = ["claude", "gemini", "gpt"];

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

export default function ChatMessages({ messages, isLoadingHistory, selectedMessageId, onSelectMessage, onMergeTurn, onChoosePreference }) {
  const bottomRef = useRef(null);
  const turns = useMemo(() => groupIntoTurns(messages), [messages]);

  // 병합 선택 팝오버 상태: { [turnId]: { selected: string[](메시지 id), merger: string(병합 수행 모델) } }
  const [mergePicker, setMergePicker] = useState({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages.at(-1)?.content]);

  const openMergePicker = (turnId, assistantIds, defaultMerger) => {
    setMergePicker((prev) => ({ ...prev, [turnId]: { selected: assistantIds, merger: defaultMerger } }));
  };

  const closeMergePicker = (turnId) => {
    setMergePicker((prev) => {
      const next = { ...prev };
      delete next[turnId];
      return next;
    });
  };

  const toggleMergeSelection = (turnId, id) => {
    setMergePicker((prev) => {
      const current = prev[turnId]?.selected ?? [];
      const nextSelected = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return { ...prev, [turnId]: { ...prev[turnId], selected: nextSelected } };
    });
  };

  const setMergeProvider = (turnId, provider) => {
    setMergePicker((prev) => ({ ...prev, [turnId]: { ...prev[turnId], merger: provider } }));
  };

  const confirmMerge = (turnId) => {
    const picker = mergePicker[turnId];
    if (!picker || picker.selected.length < 2 || !picker.merger) return;
    onMergeTurn?.(turnId, picker.selected, picker.merger);
    closeMergePicker(turnId);
  };

  if (isLoadingHistory) {
    return (
      <div className="messages-empty">
        <span className="messages-empty-icon">⏳</span>
        <h2 className="messages-empty-title">대화 내역을 불러오는 중...</h2>
      </div>
    );
  }

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
        const turnId = turn.user?.turnId;
        const pickerState = mergePicker[turnId];
        const isPickerOpen = pickerState !== undefined;

        return (
          <div key={turn.user?.id ?? `turn-${i}`} className="message-turn">
            {turn.user && <MessageBubble message={turn.user} />}

            {isCompare ? (
              <>
                <div className="compare-stack">
                  {compareAssistants.map((m) => {
                    const accent = MODEL_COLOR[m.provider] ?? "#4f46e5";
                    return (
                      <div
                        key={m.id}
                        className={[
                          "compare-card",
                          m.preferred && "preferred",
                          chosenMsg && !m.preferred && "dimmed",
                          m.id === selectedMessageId && "selected",
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
                            onClick={() => onChoosePreference?.(turnId, m.id)}
                          >
                            <ThumbsUp size={13} />
                            {MODEL_LABEL[m.provider] ?? m.provider}
                          </button>
                        ))}
                        <button
                          className="preference-btn"
                          onClick={() => openMergePicker(
                            turnId,
                            compareAssistants.map((m) => m.id),
                            compareAssistants[0]?.provider,
                          )}
                        >
                          병합
                        </button>
                      </div>
                    </div>

                    {isPickerOpen && (
                      <div className="merge-picker">
                        <div className="merge-picker-head">
                          <span className="merge-picker-label">병합할 답변 선택</span>
                          <button className="merge-picker-close" onClick={() => closeMergePicker(turnId)} title="닫기">
                            <X size={13} />
                          </button>
                        </div>
                        <div className="merge-picker-options">
                          {compareAssistants.map((m) => (
                            <label
                              key={m.id}
                              className={`merge-picker-option ${pickerState.selected.includes(m.id) ? "checked" : ""}`}
                              style={{ "--accent": MODEL_COLOR[m.provider] ?? "#4f46e5" }}
                            >
                              <input
                                type="checkbox"
                                checked={pickerState.selected.includes(m.id)}
                                onChange={() => toggleMergeSelection(turnId, m.id)}
                              />
                              {MODEL_LABEL[m.provider] ?? m.provider}
                            </label>
                          ))}
                        </div>

                        <div className="merge-picker-merger">
                          <span className="merge-picker-label">병합에 사용할 모델</span>
                          <div className="merge-picker-options">
                            {ALL_PROVIDERS.map((provider) => (
                              <label
                                key={provider}
                                className={`merge-picker-option ${pickerState.merger === provider ? "checked" : ""}`}
                                style={{ "--accent": MODEL_COLOR[provider] ?? "#4f46e5" }}
                              >
                                <input
                                  type="radio"
                                  name={`merger-${turnId}`}
                                  checked={pickerState.merger === provider}
                                  onChange={() => setMergeProvider(turnId, provider)}
                                />
                                {MODEL_LABEL[provider] ?? provider}
                              </label>
                            ))}
                          </div>
                        </div>

                        <button
                          className="merge-picker-confirm"
                          disabled={pickerState.selected.length < 2}
                          onClick={() => confirmMerge(turnId)}
                        >
                          선택한 {pickerState.selected.length}개 답변, {MODEL_LABEL[pickerState.merger] ?? pickerState.merger}(으)로 병합
                        </button>
                      </div>
                    )}
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
                    <div
                      className={["compare-card", mergedMsg.id === selectedMessageId && "selected"].filter(Boolean).join(" ")}
                      style={{ "--accent": MODEL_COLOR.merged }}
                    >
                      <div className="compare-card-header">
                        <span className="compare-card-label">
                          {MODEL_LABEL.merged}
                          {mergedMsg.mergerProvider && ` (${MODEL_LABEL[mergedMsg.mergerProvider] ?? mergedMsg.mergerProvider})`}
                        </span>
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
