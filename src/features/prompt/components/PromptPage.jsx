import React, { useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/core/AppState";
import "../styles/PromptPage.css";

export default function PromptPage() {
  const systemPrompt = useAppState((s) => s.systemPrompt);
  const promptWeight = useAppState((s) => s.promptWeight);
  const setSystemPrompt = useAppState((s) => s.setSystemPrompt);
  const setPromptWeight = useAppState((s) => s.setPromptWeight);
  const resetPrompt = useAppState((s) => s.resetPrompt);

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="prompt-page">
      <div className="prompt-row">
        <input
          className="prompt-input"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="프롬프트 입력"
        />
        <input
          className="prompt-weight-slider"
          type="range"
          min="0"
          max="100"
          value={promptWeight}
          onChange={(e) => setPromptWeight(Number(e.target.value))}
          title={`프롬프트 비중 ${promptWeight}%`}
        />
        <div className="prompt-info-wrap">
          <button
            type="button"
            className="prompt-info-btn"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={14} />
          </button>
          {showTooltip && (
            <span className="prompt-tooltip">사용자 프롬프트가<br />대답에 주는 비중</span>
          )}
        </div>
      </div>
      <div className="prompt-actions">
        <button className="prompt-action-btn" onClick={resetPrompt}>초기화</button>
        <button className="prompt-action-btn" onClick={() => toast.info("설정 기능은 준비 중입니다.")}>설정</button>
      </div>
    </div>
  );
}
