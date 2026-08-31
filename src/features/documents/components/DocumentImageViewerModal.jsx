import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { X, Image as ImageIcon, Upload, PenSquare, Maximize2, Save } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/DocumentImageViewerModal.css";

const THUMB_COLORS = ["#eef0ff", "#e9f7ef", "#fff4e5", "#fdecec", "#e6f4ff"];

function buildPlaceholderSvg(color, index, caption) {
  const escaped = String(caption ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" width="480" height="320">
    <rect width="480" height="320" fill="${color}" />
    <text x="240" y="150" font-size="22" text-anchor="middle" fill="#4f46e5">이미지 ${index}</text>
    <text x="240" y="180" font-size="13" text-anchor="middle" fill="#4f46e5">${escaped}</text>
  </svg>`;
}

export default function DocumentImageViewerModal({ file, onClose }) {
  const navigate = useNavigate();
  const documentImagesMap = useAppState((s) => s.documentImages);
  const ensureDocumentImages = useAppState((s) => s.ensureDocumentImages);
  const fetchDocumentImages = useAppState((s) => s.fetchDocumentImages);
  const saveDocumentImage = useAppState((s) => s.saveDocumentImage);
  const uploadDocumentImage = useAppState((s) => s.uploadDocumentImage);

  const images = documentImagesMap[file.id] ?? [];
  const [selectedId, setSelectedId] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const imageInputRef = useRef(null);

  // 저장 버튼을 누르기 전까지는 화면에서만 수정하는 임시 편집본 — 다른 이미지로 넘어가면 초기화된다.
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const list = ensureDocumentImages(file);
    setSelectedId((cur) => cur ?? list[0]?.id ?? null);
    // 서버에 실제 이미지 목록이 있으면 백그라운드에서 받아와 위 더미 목록을 교체한다.
    fetchDocumentImages(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  // 더미 목록이 실제 서버 목록으로 교체되면 id 체계가 달라져 기존 선택이 무효해질 수 있다 —
  // 그 경우 선택을 잃고 "선택 안 됨" 상태로 남지 않도록 첫 번째 이미지로 다시 맞춰준다.
  useEffect(() => {
    if (images.length > 0 && !images.some((img) => img.id === selectedId)) {
      setSelectedId(images[0].id);
    }
  }, [images, selectedId]);

  const selected = images.find((img) => img.id === selectedId) ?? null;

  useEffect(() => {
    setDraft(selected ? { ...selected } : null);
    setDirty(false);
  }, [selectedId, selected?.id]);

  const update = (changes) => {
    if (!draft) return;
    setDraft((d) => ({ ...d, ...changes }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!draft) return;
    await saveDocumentImage(file.id, draft.id, draft);
    setDirty(false);
    toast.success("변경사항을 저장했습니다.");
  };

  const handleImageChange = async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked || !draft) return;
    if (draft.imageUrl) URL.revokeObjectURL(draft.imageUrl);
    const previewUrl = URL.createObjectURL(picked);
    const imageId = draft.id;
    update({ imageUrl: previewUrl });
    await uploadDocumentImage(file.id, imageId, picked, previewUrl);
    // draft는 전역 상태를 구독하지 않는 편집 스냅샷이라 서버가 준 최종 URL로 직접 맞춰준다
    // (다른 이미지로 넘어가지 않았을 때만 — 그 사이 넘어갔으면 이 draft는 이미 버려진 것).
    const latest = useAppState.getState().documentImages[file.id]?.find((img) => img.id === imageId);
    if (latest?.imageUrl && latest.imageUrl !== previewUrl) {
      setDraft((d) => (d?.id === imageId ? { ...d, imageUrl: latest.imageUrl } : d));
    }
  };

  const openInImageEditor = () => {
    if (!draft) return;
    const color = THUMB_COLORS[draft.index % THUMB_COLORS.length];
    const svgText = buildPlaceholderSvg(color, draft.index, draft.caption);
    navigate("/image-editor", {
      state: { svgText, fileName: `${file.name}_이미지${draft.index}.svg` },
    });
  };

  const previewStyle = draft?.imageUrl ? undefined : { backgroundColor: THUMB_COLORS[(draft?.index ?? 0) % THUMB_COLORS.length] };

  return (
    <div className="div-backdrop" onClick={onClose}>
      <div className="div-modal" onClick={(e) => e.stopPropagation()}>
        <div className="div-modal-header">
          <div>
            <h2>{file.name}</h2>
            <p>이미지 {images.length}장</p>
          </div>
          <button className="div-close-btn" onClick={onClose} title="닫기">
            <X size={16} />
          </button>
        </div>

        <div className="div-modal-body">
          <div className="div-thumb-list">
            {images.map((img) => (
              <button
                key={img.id}
                className={`div-thumb ${selectedId === img.id ? "active" : ""}`}
                onClick={() => setSelectedId(img.id)}
              >
                <div
                  className="div-thumb-preview"
                  style={img.imageUrl ? undefined : { backgroundColor: THUMB_COLORS[img.index % THUMB_COLORS.length] }}
                >
                  {img.imageUrl ? (
                    <img src={img.imageUrl} alt={img.caption} />
                  ) : (
                    <ImageIcon size={18} />
                  )}
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
            {!draft ? (
              <p className="div-viewer-empty">왼쪽에서 이미지를 선택하면 상세 설명을 볼 수 있습니다.</p>
            ) : (
              <>
                <button className="div-viewer-preview" style={previewStyle} onClick={() => setZoomed(true)} title="클릭하면 확대됩니다">
                  {draft.imageUrl ? (
                    <img src={draft.imageUrl} alt={draft.caption} />
                  ) : (
                    <>
                      <ImageIcon size={40} />
                      <span>이미지 {draft.index}</span>
                    </>
                  )}
                  <span className="div-viewer-zoom-hint"><Maximize2 size={12} /> 클릭하면 확대</span>
                </button>

                <div className="div-viewer-actions">
                  <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
                  <button className="div-action-btn" onClick={() => imageInputRef.current?.click()}>
                    <Upload size={13} /> 이미지 변경
                  </button>
                  <button className="div-action-btn" onClick={openInImageEditor}>
                    <PenSquare size={13} /> 이미지 편집기에서 열기
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="div-meta-col">
            {!draft ? null : (
              <>
                <div className="div-viewer-section">
                  <span className="div-viewer-tag">문서 제목</span>
                  <p>{file.name}</p>
                </div>

                <div className="div-viewer-section">
                  <span className="div-viewer-tag">문서 구조</span>
                  <div className="div-title-fields">
                    <label>
                      <span>대제목</span>
                      <input
                        type="text"
                        value={draft.majorTitle ?? ""}
                        onChange={(e) => update({ majorTitle: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>중제목</span>
                      <input
                        type="text"
                        value={draft.midTitle ?? ""}
                        onChange={(e) => update({ midTitle: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>소제목</span>
                      <input
                        type="text"
                        value={draft.minorTitle ?? ""}
                        onChange={(e) => update({ minorTitle: e.target.value })}
                      />
                    </label>
                  </div>
                  <textarea
                    className="div-viewer-textarea"
                    rows={2}
                    placeholder="이미지에 대한 부연 설명을 입력하세요."
                    value={draft.note ?? ""}
                    onChange={(e) => update({ note: e.target.value })}
                  />
                </div>

                <div className="div-viewer-section">
                  <span className="div-viewer-tag">AI 한줄 요약</span>
                  <textarea
                    className="div-viewer-textarea"
                    rows={2}
                    value={draft.aiSummary}
                    onChange={(e) => update({ aiSummary: e.target.value })}
                  />
                </div>

                <div className="div-viewer-section">
                  <span className="div-viewer-tag">핵심 시각 정보</span>
                  <textarea
                    className="div-viewer-textarea"
                    rows={3}
                    placeholder="한 줄에 하나씩 입력하세요."
                    value={draft.keyFacts.join("\n")}
                    onChange={(e) => update({ keyFacts: e.target.value.split("\n") })}
                  />
                </div>

                <div className="div-viewer-section">
                  <span className="div-viewer-tag">이미지 내 주요 문구 · 키워드</span>
                  <textarea
                    className="div-viewer-textarea"
                    rows={2}
                    placeholder="쉼표(,)로 구분해서 입력하세요."
                    value={draft.keyPhrases.join(", ")}
                    onChange={(e) => update({ keyPhrases: e.target.value.split(",").map((v) => v.trim()) })}
                  />
                </div>

                <div className="div-meta-save-row">
                  <button className="div-save-btn" onClick={handleSave} disabled={!dirty}>
                    <Save size={13} /> {dirty ? "저장" : "저장됨"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {zoomed && draft && (
        <div className="div-lightbox" onClick={(e) => { e.stopPropagation(); setZoomed(false); }}>
          <button className="div-close-btn div-lightbox-close" onClick={() => setZoomed(false)} title="닫기">
            <X size={20} />
          </button>
          <div className="div-lightbox-content" style={previewStyle} onClick={(e) => e.stopPropagation()}>
            {draft.imageUrl ? (
              <img src={draft.imageUrl} alt={draft.caption} />
            ) : (
              <>
                <ImageIcon size={72} />
                <span>이미지 {draft.index}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
