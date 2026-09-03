import React, { useState } from "react";
import { Search, X, FileText } from "lucide-react";
import { TUTORIAL_DUMMY_FILES } from "../data/tutorialDummyData";
import "../../chat/styles/DocumentPickerModal.css";

// 실제 문서 목록에 의존하면 계정에 등록된 문서가 없을 때 모달 내용이 비어 보인다 —
// 튜토리얼에서는 항상 같은 예시 문서 목록(더미 데이터)을 보여준다. 클릭해서 체크는 되지만
// 실제 검색 범위에는 반영되지 않는, 설명용 화면이다.
export default function TutorialDocumentPickerDemo() {
  const [selected, setSelected] = useState(() => new Set([TUTORIAL_DUMMY_FILES[0].id]));

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = TUTORIAL_DUMMY_FILES.every((f) => selected.has(f.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(TUTORIAL_DUMMY_FILES.map((f) => f.id)));

  return (
    <div className="dpm-backdrop">
      <div className="dpm-modal">
        <div className="dpm-header">
          <div>
            <h2>검색 문서 선택</h2>
            <p>선택한 문서 안에서만 답을 찾도록 검색 범위를 좁힙니다. 아무것도 선택하지 않으면 전체 문서에서 찾습니다.</p>
          </div>
          <button className="dpm-close-btn" title="닫기">
            <X size={16} />
          </button>
        </div>

        <div className="dpm-toolbar">
          <div className="dpm-search">
            <Search size={14} />
            <input readOnly value="" placeholder="문서명 검색" />
          </div>
          <button className="dpm-search-btn">검색</button>
        </div>

        <label className="dpm-select-all">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          모든 문서 선택
          <span className="dpm-select-all-count">{selected.size}개 선택됨</span>
        </label>

        <div className="dpm-list">
          {TUTORIAL_DUMMY_FILES.map((f) => (
            <label key={f.id} className={`dpm-item ${selected.has(f.id) ? "checked" : ""}`}>
              <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggle(f.id)} />
              <FileText size={14} className="dpm-item-icon" />
              <span className="dpm-item-name" title={f.name}>{f.name}</span>
              <span className="dpm-item-year">{f.productionYear}</span>
            </label>
          ))}
        </div>

        <div className="dpm-footer">
          <button className="dpm-cancel-btn">취소</button>
          <button className="dpm-confirm-btn">선택 ({selected.size})</button>
        </div>
      </div>
    </div>
  );
}
