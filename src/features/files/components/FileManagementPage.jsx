import React, { useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, FileText, Trash2 } from "lucide-react";
import { useAppState } from "@/core/AppState";
import {
  DOCUMENT_AREAS,
  DOCUMENT_TASKS,
  DOCUMENT_TYPES,
  DOCUMENT_SUB_TYPES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_SUB_CATEGORIES,
  formatBytes,
  stripNumberPrefix,
} from "@/shared";
import "../styles/FileManagementPage.css";

const RECENT_LIST_LIMIT = 10;

const genQueueId = () => `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const emptyMetadata = () => ({ area: "", task: "", docType: "", subType: "", category: "", subCategory: "", docDate: todayStr() });

const STATUS_LABEL = {
  uploading: "업로드 중",
  processing: "분석 중",
  ready: "분석 완료",
  error: "오류",
};

function MetadataFields({ values, onChange }) {
  return (
    <div className="fm-meta-fields">
      <label className="fm-meta-field">
        <span>영역</span>
        <select value={values.area} onChange={(e) => onChange("area", e.target.value)}>
          <option value="">선택 안 함</option>
          {DOCUMENT_AREAS.map((v) => <option key={v} value={v}>{stripNumberPrefix(v)}</option>)}
        </select>
      </label>
      <label className="fm-meta-field">
        <span>세부 과제</span>
        <select value={values.task} onChange={(e) => onChange("task", e.target.value)}>
          <option value="">선택 안 함</option>
          {DOCUMENT_TASKS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>
      <label className="fm-meta-field">
        <span>구분</span>
        <select value={values.docType} onChange={(e) => onChange("docType", e.target.value)}>
          <option value="">선택 안 함</option>
          {DOCUMENT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>
      <label className="fm-meta-field">
        <span>세부구분</span>
        <select value={values.subType} onChange={(e) => onChange("subType", e.target.value)}>
          <option value="">선택 안 함</option>
          {DOCUMENT_SUB_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>
      <label className="fm-meta-field">
        <span>유형</span>
        <select value={values.category} onChange={(e) => onChange("category", e.target.value)}>
          <option value="">선택 안 함</option>
          {DOCUMENT_CATEGORIES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>
      <label className="fm-meta-field">
        <span>세부 유형</span>
        <select value={values.subCategory} onChange={(e) => onChange("subCategory", e.target.value)}>
          <option value="">선택 안 함</option>
          {DOCUMENT_SUB_CATEGORIES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>
      <label className="fm-meta-field fm-meta-field-date">
        <span>기준 날짜</span>
        <input type="date" value={values.docDate} onChange={(e) => onChange("docDate", e.target.value)} />
      </label>
    </div>
  );
}

export default function FileManagementPage() {
  const files = useAppState((s) => s.files);
  const fetchFiles = useAppState((s) => s.fetchFiles);
  const uploadFile = useAppState((s) => s.uploadFile);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const [queue, setQueue] = useState([]); // { id, file, override: null | metadata }
  const [shared, setShared] = useState(emptyMetadata());
  const [individualId, setIndividualId] = useState(null); // 개별 설정 중인 문서 하나만 유지
  const [areaFilter, setAreaFilter] = useState("전체");

  useEffect(() => { fetchFiles(); }, []);

  const addFilesToQueue = (fileList) => {
    const items = Array.from(fileList).map((file) => ({ id: genQueueId(), file, override: null }));
    setQueue((q) => [...q, ...items]);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) addFilesToQueue(e.target.files);
    e.target.value = "";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
  };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFilesToQueue(e.dataTransfer.files);
  };

  const removeQueued = (id) => {
    setQueue((q) => q.filter((it) => it.id !== id));
    setIndividualId((cur) => (cur === id ? null : cur));
  };
  const clearQueue = () => {
    setQueue([]);
    setIndividualId(null);
  };

  const updateShared = (field, value) => setShared((s) => ({ ...s, [field]: value }));

  const toggleIndividual = (id) => {
    if (individualId === id) {
      // 선택 해제 → 공통 정보로 복귀
      setQueue((q) => q.map((it) => (it.id === id ? { ...it, override: null } : it)));
      setIndividualId(null);
      return;
    }
    // 이전에 개별 설정 중이던 문서는 공통 정보로 되돌리고, 새로 선택한 문서만 개별 설정으로 전환
    setQueue((q) =>
      q.map((it) => {
        if (it.id === individualId) return { ...it, override: null };
        if (it.id === id) return { ...it, override: it.override ?? { ...shared } };
        return it;
      }),
    );
    setIndividualId(id);
  };
  const updateOverride = (id, field, value) => {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, override: { ...it.override, [field]: value } } : it)));
  };

  const handleRegister = async () => {
    if (queue.length === 0) return;
    const items = queue;
    clearQueue();
    for (const item of items) {
      await uploadFile(item.file, item.override ?? shared);
    }
  };

  const total = files.length;
  const readyCount = files.filter((f) => f.status === "ready").length;
  const processingCount = files.filter((f) => f.status === "uploading" || f.status === "processing").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  // 문서 업로드 아래 목록은 최근 10건까지만 보여주고, 새 문서가 임베딩되면 가장 오래된 것부터 밀려난다.
  const recentFiles = useMemo(() => {
    return [...files]
      .filter((f) => areaFilter === "전체" || f.area === areaFilter)
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, RECENT_LIST_LIMIT);
  }, [files, areaFilter]);

  const activeIndividualItem = queue.find((it) => it.id === individualId);

  return (
    <div className="file-management-page">
      <div className="fm-header">
        <h1>문서 등록</h1>
        <p>문서를 등록하면 챗봇이 그 내용을 찾아 답변합니다.</p>
      </div>

      <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />

      <div className="fm-register-grid">
        <div className="fm-upload-col">
          <div className="fm-col-head">
            <span>업로드할 문서 <strong>{queue.length}개</strong> 선택됨</span>
            <div className="fm-col-head-actions">
              <button className="fm-ghost-btn" onClick={() => fileInputRef.current?.click()}>파일 추가</button>
              <button className="fm-ghost-btn" onClick={clearQueue} disabled={queue.length === 0}>모두 지우기</button>
            </div>
          </div>

          <div
            className={["fm-dropzone", isDragging && "dragging", queue.length > 0 && "compact"].filter(Boolean).join(" ")}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud size={queue.length > 0 ? 16 : 22} />
            <span>파일을 올리거나 클릭해서 추가하세요</span>
          </div>

          <div className="fm-queue-list">
            {queue.length === 0 ? (
              <p className="fm-empty">추가된 파일이 없습니다.</p>
            ) : (
              <>
                <p className="fm-queue-hint">문서를 누르면 오른쪽에서 그 문서만의 정보를 따로 입력할 수 있습니다.</p>
                {queue.map((item) => {
                  const isIndividual = individualId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`fm-queue-item ${isIndividual ? "individual" : ""}`}
                      onClick={() => toggleIndividual(item.id)}
                    >
                      <div className="fm-queue-item-row">
                        <FileText size={16} className="fm-queue-item-icon" />
                        <div className="fm-queue-item-info">
                          <span className="fm-queue-item-name">{item.file.name}</span>
                          <span className="fm-queue-item-size">{formatBytes(item.file.size)}</span>
                        </div>
                        <button
                          className="fm-icon-btn"
                          onClick={(e) => { e.stopPropagation(); removeQueued(item.id); }}
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="fm-meta-col">
          {individualId === null ? (
            <>
              <div className="fm-col-head">
                <span>문서 정보 입력</span>
                <span className="fm-col-head-sub">선택한 문서 전체에 적용됩니다</span>
              </div>
              <MetadataFields values={shared} onChange={updateShared} />
              <p className="fm-meta-hint">
                위 정보는 선택한 문서 전체에 적용됩니다. 문서마다 다르게 넣으려면 왼쪽에서 <strong>문서를 클릭</strong>하세요.
              </p>
            </>
          ) : (
            <>
              <div className="fm-col-head">
                <span>개별 정보 설정</span>
                <span className="fm-col-head-sub">이 문서에만 적용됩니다</span>
              </div>
              {activeIndividualItem?.override && (
                <MetadataFields
                  values={activeIndividualItem.override}
                  onChange={(field, value) => updateOverride(individualId, field, value)}
                />
              )}
              <p className="fm-meta-hint">
                위 정보는 <strong>{activeIndividualItem?.file.name}</strong>에만 적용됩니다. 왼쪽에서 같은 문서를 다시 클릭하면 공통 정보로 되돌아갑니다.
              </p>
            </>
          )}

          <button className="fm-register-btn" onClick={handleRegister} disabled={queue.length === 0}>
            문서 등록
          </button>
        </div>
      </div>

      <div className="fm-status-bar">
        <span className="fm-status-item"><i className="fm-dot fm-dot-total" />전체 <strong>{total}</strong>건</span>
        <span className="fm-status-item"><i className="fm-dot fm-dot-ready" />분석완료 <strong>{readyCount}</strong>건</span>
        <span className="fm-status-item"><i className="fm-dot fm-dot-processing" />분석중 <strong>{processingCount}</strong>건</span>
        <span className="fm-status-item"><i className="fm-dot fm-dot-error" />오류 <strong>{errorCount}</strong>건</span>
      </div>

      <div className="fm-progress-section">
        <div className="fm-progress-head">
          <span>최근 등록 문서 <strong>{recentFiles.length}</strong>건 (최대 {RECENT_LIST_LIMIT}건)</span>
          <div className="fm-progress-filters">
            <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
              <option value="전체">모든 영역</option>
              {DOCUMENT_AREAS.map((v) => <option key={v} value={v}>{stripNumberPrefix(v)}</option>)}
            </select>
          </div>
        </div>

        <div className="fm-progress-table">
          <div className="fm-progress-table-head">
            <span>문서명</span>
            <span>영역</span>
            <span>세부 과제</span>
            <span>상태</span>
          </div>
          {recentFiles.length === 0 ? (
            <p className="fm-empty">등록된 문서가 없습니다.</p>
          ) : (
            recentFiles.map((f) => (
              <div key={f.id} className="fm-progress-row">
                <span className="fm-progress-name" title={f.name}>{f.name}</span>
                <span className="fm-progress-cell" title={f.area}>{f.area ? stripNumberPrefix(f.area) : "-"}</span>
                <span className="fm-progress-cell" title={f.task}>{f.task || "-"}</span>
                <span className={`fm-status-pill fm-status-pill-${f.status}`}>{STATUS_LABEL[f.status]}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
