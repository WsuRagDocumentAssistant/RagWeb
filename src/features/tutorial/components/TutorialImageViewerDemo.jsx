import React, { useState } from "react";
import { X, Image as ImageIcon, Upload, PenSquare, Download, Maximize2, Save } from "lucide-react";
import {
  TUTORIAL_DUMMY_IMAGE_FILE_NAME,
  TUTORIAL_DUMMY_IMAGES,
  TUTORIAL_DUMMY_IMAGE_META,
} from "../data/tutorialDummyData";
import "../../documents/styles/DocumentImageViewerModal.css";

const THUMB_COLORS = ["#eef0ff", "#e9f7ef", "#fff4e5", "#fdecec", "#e6f4ff"];

// 실제 문서 이미지는 서버가 채워줘야 보이는데, 문서에 이미지가 없거나 서버 연결이 안 되면
// 썸네일 목록이 비어 튜토리얼 설명이 헛돌게 된다 — 튜토리얼에서는 항상 같은 예시(더미 데이터)로 보여준다.
export default function TutorialImageViewerDemo() {
  const [selectedId, setSelectedId] = useState(TUTORIAL_DUMMY_IMAGES[0].id);
  const selected = TUTORIAL_DUMMY_IMAGES.find((img) => img.id === selectedId) ?? TUTORIAL_DUMMY_IMAGES[0];
  const meta = TUTORIAL_DUMMY_IMAGE_META;

  return (
    <div className="div-backdrop">
      <div className="div-modal">
        <div className="div-modal-header">
          <div>
            <h2>{TUTORIAL_DUMMY_IMAGE_FILE_NAME}</h2>
            <p>이미지 {TUTORIAL_DUMMY_IMAGES.length}장</p>
          </div>
          <button className="div-close-btn" title="닫기">
            <X size={16} />
          </button>
        </div>

        <div className="div-modal-body">
          <div className="div-thumb-list">
            {TUTORIAL_DUMMY_IMAGES.map((img) => (
              <button
                key={img.id}
                className={`div-thumb ${selectedId === img.id ? "active" : ""}`}
                onClick={() => setSelectedId(img.id)}
              >
                <div className="div-thumb-preview" style={{ backgroundColor: THUMB_COLORS[img.index % THUMB_COLORS.length] }}>
                  <ImageIcon size={18} />
                </div>
                <div className="div-thumb-text">
                  <span className="div-thumb-label">이미지 {img.index} 미리보기</span>
                  <span className="div-thumb-caption">{img.caption}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="div-image-col">
            <div className="div-viewer-title">이미지 보기</div>
            <button
              className="div-viewer-preview"
              style={{ backgroundColor: THUMB_COLORS[selected.index % THUMB_COLORS.length] }}
              title="클릭하면 확대됩니다"
            >
              <ImageIcon size={40} />
              <span>이미지 {selected.index}</span>
              <span className="div-viewer-zoom-hint"><Maximize2 size={12} /> 클릭하면 확대</span>
            </button>

            <div className="div-viewer-actions">
              <button className="div-action-btn"><Upload size={13} /> 이미지 변경</button>
              <button className="div-action-btn"><PenSquare size={13} /> 이미지 편집기에서 열기</button>
              <button className="div-action-btn"><Download size={13} /> 이미지 다운로드</button>
            </div>
          </div>

          <div className="div-meta-col">
            <div className="div-viewer-section">
              <span className="div-viewer-tag">문서 제목</span>
              <p>{TUTORIAL_DUMMY_IMAGE_FILE_NAME}</p>
            </div>

            <div className="div-viewer-section">
              <span className="div-viewer-tag">문서 구조</span>
              <div className="div-title-fields">
                <label><span>대제목</span><input readOnly value={meta.majorTitle} /></label>
                <label><span>중제목</span><input readOnly value={meta.midTitle} /></label>
                <label><span>소제목</span><input readOnly value={meta.minorTitle} /></label>
              </div>
              <textarea className="div-viewer-textarea" rows={2} readOnly value={meta.note} />
            </div>

            <div className="div-viewer-section">
              <span className="div-viewer-tag">AI 한줄 요약</span>
              <textarea className="div-viewer-textarea" rows={2} readOnly value={meta.aiSummary} />
            </div>

            <div className="div-viewer-section">
              <span className="div-viewer-tag">핵심 시각 정보</span>
              <textarea className="div-viewer-textarea" rows={3} readOnly value={meta.keyFacts.join("\n")} />
            </div>

            <div className="div-viewer-section">
              <span className="div-viewer-tag">이미지 내 주요 문구 · 키워드</span>
              <textarea className="div-viewer-textarea" rows={2} readOnly value={meta.keyPhrases.join(", ")} />
            </div>

            <div className="div-meta-save-row">
              <button className="div-save-btn" disabled>
                <Save size={13} /> 저장됨
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
