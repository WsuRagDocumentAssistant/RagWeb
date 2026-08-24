import React, { useMemo, useState } from "react";
import { Search, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { stripNumberPrefix } from "@/shared";
import DocumentImageViewerModal from "./DocumentImageViewerModal";
import "../styles/DocumentsPage.css";

export default function DocumentsPage() {
  const files = useAppState((s) => s.files);
  const deleteFile = useAppState((s) => s.deleteFile);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [viewingFile, setViewingFile] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(files.map((f) => f.area).filter(Boolean));
    return ["전체", ...set];
  }, [files]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      const matchesQuery = !q || f.name.toLowerCase().includes(q);
      const matchesCategory = category === "전체" || f.area === category;
      return matchesQuery && matchesCategory;
    });
  }, [files, query, category]);

  return (
    <div className="documents-page">
      <div className="doc-page-header">
        <h1>문서 목록</h1>
        <p>등록된 문서와 임베딩(RAG 지식) 상태를 확인할 수 있습니다. 카테고리는 문서 등록 시 입력한 영역을 따릅니다.</p>
      </div>

      <div className="doc-toolbar">
        <div className="doc-search">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="문서명 검색" />
        </div>
        <select className="doc-category-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c === "전체" ? "전체 카테고리" : stripNumberPrefix(c)}</option>
          ))}
        </select>
        <span className="doc-total">총 <strong>{files.length}</strong>건</span>
      </div>

      <div className="doc-table">
        <div className="doc-table-head">
          <span>문서명 (source)</span>
          <span>파일명</span>
          <span>카테고리</span>
          <span>기준 날짜</span>
          <span>청크</span>
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
                <span className={`doc-table-category ${!f.area ? "muted" : ""}`}>
                  {f.area ? stripNumberPrefix(f.area) : "-"}
                </span>
                <span>{f.docDate || "-"}</span>
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
