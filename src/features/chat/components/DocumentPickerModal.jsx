import React, { useMemo, useState } from "react";
import { Search, X, FileText } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/DocumentPickerModal.css";

// 채팅의 "+" 메뉴 → "검색 문서 선택"에서 여는 문서 선택 창.
// 문서 목록의 "이미지 보기"와 같은 모달 톤을 쓰되, 이건 문서를 고르는 용도라 체크박스 목록 + 검색 + 전체선택으로 구성한다.
export default function DocumentPickerModal({ initialSelected, onClose, onConfirm }) {
  const files = useAppState((s) => s.files);
  const [queryInput, setQueryInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set(initialSelected ?? []));

  // 업로드 중/실패가 확실한 문서만 제외한다 — status를 "ready"로만 좁히면, 서버가 그 필드를
  // 안 채워 보내는 경우(비어있거나 다른 값) 문서가 전부 안 보이는 문제가 생긴다.
  const readyFiles = useMemo(
    () => files.filter((f) => f.status !== "uploading" && f.status !== "processing" && f.status !== "error"),
    [files],
  );

  const runSearch = () => setAppliedQuery(queryInput);

  const filtered = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    if (!q) return readyFiles;
    return readyFiles.filter((f) => f.name.toLowerCase().includes(q));
  }, [readyFiles, appliedQuery]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((f) => selected.has(f.id));

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((f) => next.delete(f.id));
      } else {
        filtered.forEach((f) => next.add(f.id));
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    onClose();
  };

  return (
    <div className="dpm-backdrop" onClick={onClose}>
      <div className="dpm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dpm-header">
          <div>
            <h2>검색 문서 선택</h2>
            <p>선택한 문서 안에서만 답을 찾도록 검색 범위를 좁힙니다. 아무것도 선택하지 않으면 전체 문서에서 찾습니다.</p>
          </div>
          <button className="dpm-close-btn" onClick={onClose} title="닫기">
            <X size={16} />
          </button>
        </div>

        <div className="dpm-toolbar">
          <div className="dpm-search">
            <Search size={14} />
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
              placeholder="문서명 검색"
            />
          </div>
          <button className="dpm-search-btn" onClick={runSearch}>
            검색
          </button>
        </div>

        <label className="dpm-select-all">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleAll}
            disabled={filtered.length === 0}
          />
          모든 문서 선택
          <span className="dpm-select-all-count">{selected.size}개 선택됨</span>
        </label>

        <div className="dpm-list">
          {filtered.length === 0 ? (
            <p className="dpm-empty">표시할 문서가 없습니다.</p>
          ) : (
            filtered.map((f) => (
              <label key={f.id} className={`dpm-item ${selected.has(f.id) ? "checked" : ""}`}>
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={() => toggleOne(f.id)}
                />
                <FileText size={14} className="dpm-item-icon" />
                <span className="dpm-item-name" title={f.name}>{f.name}</span>
                {f.productionYear && <span className="dpm-item-year">{f.productionYear}</span>}
              </label>
            ))
          )}
        </div>

        <div className="dpm-footer">
          <button className="dpm-cancel-btn" onClick={onClose}>취소</button>
          <button className="dpm-confirm-btn" onClick={handleConfirm}>
            선택 ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
