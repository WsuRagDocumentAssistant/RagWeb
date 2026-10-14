import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { UploadCloud, FileText, Trash2 } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { PERMISSIONS, hasPermission } from "@/config/permissions";
import { formatBytes, ComboBoxInput, SortableHeaderCell, useSortableRows } from "@/shared";
import { DOCUMENT_ACCEPT, DOCUMENT_REJECT_MESSAGE, documentRejectDescription, isAllowedDocument } from "../documentRules";
import { toCategoryOptions } from "../categories";
import "../styles/FileManagementPage.css";

const genQueueId = () => `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
// 등록 버튼 한 번에 같이 올린 문서 묶음. 서버가 문서마다 올린 사람과 함께 기록한다(document_uploads).
const genBatchId = () => `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * 등록 화면(내부·외부)에 보일 문서: 내가 마지막으로 등록한 묶음만. 등록 직후 올리는 중인 문서도
 * 같은 묶음이라 바로 보인다. 다른 사람이 올린 문서와 예전 문서는 문서 목록 화면에서 본다.
 * 순서는 마지막으로 올린 시각(lastUploadedAt) — 같은 파일을 다시 올리면 문서 등록일(uploadedAt)은 옛 값이다.
 * 올리는 중인 문서는 그 값이 아직 없어 uploadedAt(지금)을 쓴다.
 * @param {{ uploadedBy?: string, batchId?: string | null, uploadedAt?: number, lastUploadedAt?: number | null, id: string }[]} files
 * @param {string | undefined} userId
 */
function latestBatchOf(files, userId) {
  const mine = files.filter((f) => userId && f.uploadedBy === userId);
  if (mine.length === 0) return [];
  const at = (f) => f.lastUploadedAt ?? f.uploadedAt ?? 0;
  const latest = mine.reduce((a, b) => (at(b) > at(a) ? b : a));
  return latest.batchId ? mine.filter((f) => f.batchId === latest.batchId) : [latest];
}
const currentYearStr = () => String(new Date().getFullYear());
const emptyMetadata = () => ({
  workCategory: "",
  task: "",
  department: "",
  reportType: "",
  productionYear: currentYearStr(),
});

const STATUS_LABEL = {
  uploading: "업로드 중",
  processing: "분석 중",
  ready: "분석 완료",
  error: "오류",
};

// 입력 카테고리는 서버(설정 관리 > 문서 카테고리 관리)에서 받는다. 못 받았으면 기본값으로 대신한다.
function useCategoryOptions() {
  const rows = useAppState((s) => s.documentCategories);
  const fetchDocumentCategories = useAppState((s) => s.fetchDocumentCategories);
  useEffect(() => {
    fetchDocumentCategories();
  }, [fetchDocumentCategories]);
  return useMemo(() => toCategoryOptions(rows), [rows]);
}

function MetadataFields({ values, onChange }) {
  const {
    workCategories, taskPairs, taskBasedWorkCategories, departmentsByWorkCategory, allDepartments, reportTypes,
  } = useCategoryOptions();
  const isTaskBased = taskBasedWorkCategories.includes(values.workCategory);
  const taskOptions = (taskPairs[values.workCategory] ?? []).map((p) => p.task);
  const directDepartmentOptions = departmentsByWorkCategory[values.workCategory] ?? allDepartments;

  const handleWorkCategoryChange = (v) => {
    onChange("workCategory", v);
    onChange("task", "");
    onChange("department", "");
  };

  const handleTaskChange = (v) => {
    onChange("task", v);
    const match = (taskPairs[values.workCategory] ?? []).find((p) => p.task === v);
    if (match?.department) onChange("department", match.department);
  };

  return (
    <div className="fm-meta-fields">
      <label className="fm-meta-field">
        <span>업무구분</span>
        <ComboBoxInput
          value={values.workCategory}
          onChange={handleWorkCategoryChange}
          options={workCategories}
          placeholder="업무구분 선택"
          allowCustom={false}
        />
      </label>

      {isTaskBased ? (
        <label className="fm-meta-field">
          <span>수행업무</span>
          <ComboBoxInput
            value={values.task}
            onChange={handleTaskChange}
            options={taskOptions}
            placeholder="수행업무 선택"
            allowCustom={false}
          />
        </label>
      ) : (
        <label className="fm-meta-field">
          <span>수행부서</span>
          <ComboBoxInput
            value={values.department}
            onChange={(v) => onChange("department", v)}
            options={directDepartmentOptions}
            placeholder="수행부서 선택"
            allowCustom={false}
          />
        </label>
      )}

      {isTaskBased && (
        <label className="fm-meta-field">
          <span>수행부서</span>
          <ComboBoxInput
            value={values.department}
            onChange={(v) => onChange("department", v)}
            options={allDepartments}
            placeholder="수행업무를 고르면 자동으로 채워집니다"
            allowCustom={false}
          />
        </label>
      )}

      <label className="fm-meta-field">
        <span>보고서명</span>
        <ComboBoxInput
          value={values.reportType}
          onChange={(v) => onChange("reportType", v)}
          options={reportTypes}
          placeholder="보고서명 선택"
          allowCustom={false}
        />
      </label>

      <label className="fm-meta-field fm-meta-field-date">
        <span>생산연도</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="예: 2026"
          value={values.productionYear}
          onChange={(e) => onChange("productionYear", e.target.value)}
        />
      </label>
    </div>
  );
}

// 등록 화면이 둘이다. 같은 업로드·색인을 쓰고, 외부 문서는 문서 정보(메타데이터) 입력란이 없다.
// 서버는 외부 문서에 표시를 붙이고(external_documents) 목록에 scope 로 돌려준다 — 화면마다 자기 문서만 보인다.
const PAGES = {
  internal: {
    title: "내부 문서 등록",
    description: "학교 내부 문서를 등록하면 챗봇이 그 내용을 찾아 답변합니다. 업무구분·부서 등 문서 정보를 함께 입력합니다.",
  },
  external: {
    title: "외부 문서 등록",
    description: "외부에서 받은 문서(xlsx 등)를 등록하면 챗봇이 그 내용을 찾아 답변합니다. 문서 정보 입력 없이 바로 등록합니다.",
  },
};

/** @param {{ scope?: "internal" | "external" }} props */
export default function FileManagementPage({ scope = "internal" }) {
  const isExternal = scope === "external";
  const page = PAGES[scope];
  const user = useAppState((s) => s.user);
  const allFiles = useAppState((s) => s.files);
  const files = useMemo(() => {
    const inScope = allFiles.filter((f) => (f.scope ?? "internal") === scope);
    return latestBatchOf(inScope, user?.id);
  }, [allFiles, scope, user?.id]);
  const fetchFiles = useAppState((s) => s.fetchFiles);
  const uploadFile = useAppState((s) => s.uploadFile);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const [queue, setQueue] = useState([]); // { id, file, override: null | metadata }
  const [shared, setShared] = useState(emptyMetadata());
  const [individualId, setIndividualId] = useState(null); // 개별 설정 중인 문서 하나만 유지

  useEffect(() => { fetchFiles(); }, []);

  // 내부 문서: 관리자 또는 "문서 정보 입력" 권한을 받은 계정 / 외부 문서: 관리자만(외부 API 등록과 같다)
  const allowed = isExternal ? user?.role === "admin" : hasPermission(user, PERMISSIONS.DOCUMENT_INPUT);
  if (!allowed) return <Navigate to="/chat" replace />;

  const addFilesToQueue = (fileList) => {
    const files = Array.from(fileList);
    const rejected = files.filter((file) => !isAllowedDocument(file));
    if (rejected.length > 0) {
      toast.error(DOCUMENT_REJECT_MESSAGE, { description: documentRejectDescription(rejected) });
    }
    const items = files.filter(isAllowedDocument).map((file) => ({ id: genQueueId(), file, override: null }));
    if (items.length > 0) setQueue((q) => [...q, ...items]);
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
    if (isExternal) return; // 외부 문서는 입력할 정보가 없다
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
    const batchId = genBatchId();
    clearQueue();
    for (const item of items) {
      await uploadFile(item.file, isExternal ? { scope, batchId } : { ...(item.override ?? shared), scope, batchId });
    }
  };

  const total = files.length;
  const readyCount = files.filter((f) => f.status === "ready").length;
  const processingCount = files.filter((f) => f.status === "uploading" || f.status === "processing").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  // 현재 등록된 문서 목록 — 건수 제한 없이 전부 보여주고, 표 헤더를 눌러 정렬할 수 있다.
  const { sorted: currentFiles, sortKey, sortDir, toggleSort } = useSortableRows(files, "uploadedAt", "desc");

  const activeIndividualItem = queue.find((it) => it.id === individualId);

  return (
    <div className="file-management-page">
      <div className="fm-header">
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={DOCUMENT_ACCEPT}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

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
                {!isExternal && (
                  <p className="fm-queue-hint">문서를 누르면 오른쪽에서 그 문서만의 정보를 따로 입력할 수 있습니다.</p>
                )}
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
          {isExternal ? (
            <>
              <div className="fm-col-head">
                <span>외부 문서 등록</span>
              </div>
              <p className="fm-meta-hint">
                외부 문서는 업무구분·부서 같은 문서 정보 없이 등록합니다. 답변의 출처에는 <strong>외부 문서</strong>로 표시됩니다.
              </p>
            </>
          ) : individualId === null ? (
            <>
              <div className="fm-col-head">
                <span>문서 정보 입력</span>
                <span className="fm-col-head-sub">선택한 문서 전체에 적용됩니다</span>
              </div>
              <MetadataFields values={shared} onChange={updateShared} />
              <p className="fm-meta-hint">
                위 정보는 선택한 문서 전체에 적용됩니다. 문서마다 다르게 넣으려면 왼쪽에서 <strong>문서를 클릭</strong>하세요.
                목록에 정해진 값만 고를 수 있습니다.
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
          <span>내가 마지막으로 등록한 문서 <strong>{currentFiles.length}</strong>건</span>
          <span className="fm-progress-head-sub">전체 문서는 문서 목록에서 볼 수 있습니다.</span>
        </div>

        <div className={`fm-progress-table${isExternal ? " fm-progress-table-external" : ""}`}>
          <div className="fm-progress-table-head">
            <SortableHeaderCell label="문서명" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
            {isExternal ? (
              <SortableHeaderCell label="등록일" sortKey="uploadedAt" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
            ) : (
              <>
                <SortableHeaderCell label="업무구분" sortKey="workCategory" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <SortableHeaderCell label="수행업무/부서" sortKey="task" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              </>
            )}
            <SortableHeaderCell label="상태" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          </div>
          {currentFiles.length === 0 ? (
            <p className="fm-empty">등록된 문서가 없습니다.</p>
          ) : (
            currentFiles.map((f) => (
              <div key={f.id} className="fm-progress-row">
                <span className="fm-progress-name" title={f.name}>{f.name}</span>
                {isExternal ? (
                  <span className="fm-progress-cell">{f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : "-"}</span>
                ) : (
                  <>
                    <span className="fm-progress-cell" title={f.workCategory}>{f.workCategory || "-"}</span>
                    <span className="fm-progress-cell" title={f.task || f.department}>{f.task || f.department || "-"}</span>
                  </>
                )}
                <span className={`fm-status-pill fm-status-pill-${f.status}`}>{STATUS_LABEL[f.status]}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
