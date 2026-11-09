import React, { useMemo, useState } from "react";
import { Search, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { SortableHeaderCell, useSortableRows } from "@/shared";
import DocumentImageViewerModal from "./DocumentImageViewerModal";
import "../styles/DocumentsPage.css";

// 내부·외부 문서 구분. 기준은 "누가 만든 문서인가" — 등록 화면이 정하고 서버가 scope 로 돌려준다.
// 둘 다 같은 방식으로 색인·검색되고, 답변 출처에 구분이 붙는다.
const SCOPES = [
  { key: "all", label: "전체" },
  {
    key: "internal",
    label: "내부 문서",
    desc: "우리 학교가 만든 문서(규정·지침·계획서·회의자료 등). 문서 권한이 있는 담당자가 내부 문서 등록에서 올린다.",
  },
  {
    key: "external",
    label: "외부 문서",
    desc: "학교 밖 기관이 만든 문서(교육부·대교협 공문·지침·통계 보고서 등). 관리자가 외부 문서 등록에서 올린다.",
  },
];
const scopeOf = (f) => (f.scope === "external" ? "external" : "internal");

export default function DocumentsPage() {
  const files = useAppState((s) => s.files);
  const deleteFile = useAppState((s) => s.deleteFile);
  const downloadFile = useAppState((s) => s.downloadFile);

  const [query, setQuery] = useState("");
  const [viewingFile, setViewingFile] = useState(null);
  const [scope, setScope] = useState("all");

  const counts = useMemo(() => {
    const external = files.filter((f) => scopeOf(f) === "external").length;
    return { all: files.length, internal: files.length - external, external };
  }, [files]);

  const filteredBase = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files
      .filter((f) => scope === "all" || scopeOf(f) === scope)
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      // 정렬 키로 쓰려고 구분 이름을 붙여 둔다.
      .map((f) => ({ ...f, scopeLabel: scopeOf(f) === "external" ? "외부" : "내부" }));
  }, [files, query, scope]);
  const activeScope = SCOPES.find((s) => s.key === scope);

  const { sorted: filtered, sortKey, sortDir, toggleSort } = useSortableRows(filteredBase);

  return (
    <div className="documents-page">
      <div className="doc-page-header">
        <h1>문서 목록</h1>
        <p>등록된 문서와 임베딩(RAG 지식) 상태를 확인할 수 있습니다.</p>
      </div>

      <div className="doc-scope-tabs" role="tablist">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={scope === s.key}
            className={`doc-scope-tab${scope === s.key ? " active" : ""}`}
            title={s.desc}
            onClick={() => setScope(s.key)}
          >
            {s.label} <span className="doc-scope-count">{counts[s.key]}</span>
          </button>
        ))}
      </div>
      {activeScope?.desc ? (
        <p className="doc-scope-desc">{activeScope.desc}</p>
      ) : (
        <ul className="doc-scope-desc doc-scope-defs">
          {SCOPES.filter((s) => s.desc).map((s) => (
            <li key={s.key}><strong>{s.label}</strong> — {s.desc}</li>
          ))}
        </ul>
      )}

      <div className="doc-toolbar">
        <div className="doc-search">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="문서명 검색" />
        </div>
        <span className="doc-total">총 <strong>{filtered.length}</strong>건</span>
      </div>

      <div className="doc-table">
        <div className="doc-table-head">
          <SortableHeaderCell label="구분" sortKey="scopeLabel" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="문서명 (source)" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="파일명" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="업무구분" sortKey="workCategory" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="생산연도" sortKey="productionYear" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="등록자" sortKey="uploaderName" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="청크" sortKey="chunks" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <span>액션</span>
        </div>

        <div className="doc-table-body">
          {filtered.length === 0 ? (
            <p className="doc-empty">표시할 문서가 없습니다.</p>
          ) : (
            filtered.map((f) => (
              <div key={f.id} className="doc-table-row">
                <span className={`doc-scope-badge doc-scope-badge-${scopeOf(f)}`}>{f.scopeLabel}</span>
                <span className="doc-table-name" title={f.name}>{f.name}</span>
                <span className="doc-table-filename" title={f.name}>{f.name}</span>
                <span className={`doc-table-category ${!f.workCategory ? "muted" : ""}`}>
                  {f.workCategory || "-"}
                </span>
                <span>{f.productionYear || "-"}</span>
                <span className={f.uploaderName ? "" : "muted"} title={f.uploaderName || ""}>{f.uploaderName || "-"}</span>
                <span>{f.chunks ?? "-"}</span>
                <span className="doc-table-actions">
                  <button className="doc-table-btn" title="이미지 보기" onClick={() => setViewingFile(f)}>
                    <ImageIcon size={14} />
                  </button>
                  <button className="doc-table-btn" title="다운로드" onClick={() => downloadFile(f.id)}>
                    <Download size={14} />
                  </button>
                  <button className="doc-table-btn doc-table-btn-danger" title="삭제" onClick={() => deleteFile(f.id)}>
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {viewingFile && (
        <DocumentImageViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />
      )}
    </div>
  );
}
