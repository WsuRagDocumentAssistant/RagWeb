import React from "react";
import { FileText } from "lucide-react";
import { MessageBubble } from "@/shared";
import { TUTORIAL_MERGE_DEMO } from "../data/tutorialDummyData";
import "../../chat/styles/ChatMessages.css";

const MODEL_LABEL = { gpt: "GPT", claude: "Claude", gemini: "Gemini", merged: "병합 결과" };
const MODEL_COLOR = { gpt: "#10a37f", claude: "#d97757", gemini: "#2563eb", merged: "#4f46e5" };

function SourceTags({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="tutorial-merge-sources">
      {sources.map((name) => (
        <span key={name} className="tutorial-merge-source-tag">
          <FileText size={11} /> {name}
        </span>
      ))}
    </div>
  );
}

// 세 모델의 답변을 하나로 병합한 결과가 실제로 어떤 모습인지, 서버 응답을 기다리지 않고도
// 항상 같은 예시로 보여주기 위한 튜토리얼 전용 데모(더미 데이터 기반).
export default function TutorialMergeDemo() {
  const { question, answers, merged } = TUTORIAL_MERGE_DEMO;

  return (
    <div className="tutorial-demo-backdrop">
      <div className="tutorial-demo-panel tutorial-merge-demo">
        <div className="tutorial-merge-question">{question}</div>

        <div className="compare-stack">
          {answers.map((m) => (
            <div key={m.id} className="compare-card" style={{ "--accent": MODEL_COLOR[m.provider] }}>
              <div className="compare-card-header">
                <span className="compare-card-label">{MODEL_LABEL[m.provider]}</span>
              </div>
              <MessageBubble message={m} />
              <SourceTags sources={m.sources} />
            </div>
          ))}
        </div>

        <div className="compare-merged">
          <div className="compare-card" style={{ "--accent": MODEL_COLOR.merged }}>
            <div className="compare-card-header">
              <span className="compare-card-label">
                {MODEL_LABEL.merged} ({MODEL_LABEL[merged.mergerProvider]})
              </span>
            </div>
            <MessageBubble message={merged} />
            <SourceTags sources={merged.sources} />
          </div>
        </div>
      </div>
    </div>
  );
}
