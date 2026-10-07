import React, { useState } from "react";
import { Check, ChevronDown, ChevronRight, FileText, Loader2, X } from "lucide-react";
import "../styles/ProgressSteps.css";

// 답변의 "처리 과정" — 질의가 무엇을 하고 있는지(어떤 문서를 보는지, 내부·외부 LLM 중 무엇이 쓰는지)를
// 단계마다 보여준다. Claude·ChatGPT·Gemini 의 생각 단계와 같은 자리다.
//
// 단계는 서버가 WebSocket 으로 보낸다(RagSystem streaming.step). 답변을 쓰는 동안에는 펼쳐 두고,
// 다 쓰면 한 줄("처리 과정 · N단계")로 접는다 — 눌러서 다시 펼쳐 볼 수 있다.

const MAX_ITEMS = 4; // 문서 칩은 이만큼만 보이고 나머지는 "+N"

/** @param {number | undefined} ms */
const seconds = (ms) => (ms == null ? null : `${(ms / 1000).toFixed(1)}초`);

/**
 * 이 말풍선에 보일 단계. 모델을 여러 개 비교하면 말풍선마다 자기 모델의 답변 단계만 보인다
 * (공통 단계 — 검색·초안 등 — 는 모두에게).
 * @param {{ key: string }[]} steps
 * @param {string | undefined} provider
 */
export function stepsFor(steps, provider) {
  return (steps ?? []).filter((s) => !s.key.startsWith("refine:") || !provider || s.key === `refine:${provider}`);
}

function StepIcon({ status }) {
  if (status === "running") return <Loader2 size={13} className="animate-spin step-icon step-running" />;
  if (status === "error") return <X size={13} className="step-icon step-error" />;
  return <Check size={13} className="step-icon step-done" />;
}

function Step({ step }) {
  const items = step.items ?? [];
  return (
    <li className={`progress-step progress-step-${step.status}`}>
      <StepIcon status={step.status} />
      <div className="progress-step-body">
        <div className="progress-step-line">
          <span className="progress-step-label">{step.label}</span>
          {step.detail && <span className="progress-step-detail">{step.detail}</span>}
          {step.ms != null && <span className="progress-step-time">{seconds(step.ms)}</span>}
        </div>
        {items.length > 0 && (
          <div className="progress-step-items">
            {items.slice(0, MAX_ITEMS).map((item, i) => (
              <span key={i} className="progress-step-item" title={item.heading || item.name}>
                <FileText size={11} />
                <span className="progress-step-item-name">{item.name}</span>
              </span>
            ))}
            {items.length > MAX_ITEMS && <span className="progress-step-more">+{items.length - MAX_ITEMS}</span>}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * @param {{ steps: { key: string, label: string, status: string, detail?: string, ms?: number,
 *   items?: { name: string, heading?: string }[] }[], active: boolean }} props
 *   active: 답변을 쓰는 중이면 true — 펼쳐 둔다
 */
export default function ProgressSteps({ steps, active }) {
  const [open, setOpen] = useState(false);
  if (!steps.length) return null;

  const expanded = active || open;
  const failed = steps.some((s) => s.status === "error");
  return (
    <div className={`progress-steps${active ? " progress-steps-active" : ""}`}>
      {!active && (
        <button
          type="button"
          className="progress-steps-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          처리 과정 · {steps.length}단계{failed ? " (일부 실패)" : ""}
        </button>
      )}
      {expanded && (
        <ol className="progress-step-list">
          {steps.map((step) => (
            <Step key={step.key} step={step} />
          ))}
        </ol>
      )}
    </div>
  );
}
