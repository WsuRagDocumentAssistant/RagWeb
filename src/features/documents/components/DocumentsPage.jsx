import React, { useMemo, useState } from "react";
import { Search, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { SortableHeaderCell, useSortableRows } from "@/shared";
import DocumentImageViewerModal from "./DocumentImageViewerModal";
import "../styles/DocumentsPage.css";

export default function DocumentsPage() {
  const files = useAppState((s) => s.files);
  const deleteFile = useAppState((s) => s.deleteFile);

  const [query, setQuery] = useState("");
  const [viewingFile, setViewingFile] = useState(null);

  const filteredBase = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => !q || f.name.toLowerCase().includes(q));
  }, [files, query]);

  const { sorted: filtered, sortKey, sortDir, toggleSort } = useSortableRows(filteredBase);

  return (
    <div className="documents-page">
      <div className="doc-page-header">
        <h1>문서 목록</h1>
        <p>등록된 문서와 임베딩(RAG 지식) 상태를 확인할 수 있습니다.</p>
      </div>

      <div className="doc-toolbar">
        <div className="doc-search">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="문서명 검색" />
        </div>
        <span className="doc-total">총 <strong>{files.length}</strong>건</span>
      </div>

      <div className="doc-table">
        <div className="doc-table-head">
          <SortableHeaderCell label="문서명 (source)" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="파일명" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="업무구분" sortKey="workCategory" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="생산연도" sortKey="productionYear" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="청크" sortKey="chunks" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <span>액션</span>
        </div>

        <div className="doc-table-body">
          {filtered.length === 0 ? (
            <p className="doc-empty">표시할 문서가 없습니다.</p>
          ) : (
            filtered.map((f) => (
              <div key={f.id} className="doc-table-row">
                <span className="doc-table-name" title={f.name}>{f.name}</span>
                <span className="doc-table-filename" title={f.name}>{f.name}</span>
                <span className={`doc-table-category ${!f.workCategory ? "muted" : ""}`}>
                  {f.workCategory || "-"}
                </span>
                <span>{f.productionYear || "-"}</span>
                <span>{f.chunks ?? "-"}</span>
                <span className="doc-table-actions">
                  <button className="doc-table-btn" title="이미지 보기" onClick={() => setViewingFile(f)}>
                    <ImageIcon size={14} />
                  </button>
                  <button className="doc-table-btn" title="다운로드">
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
