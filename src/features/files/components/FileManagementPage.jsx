import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Upload, Trash2, Loader2 } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { formatBytes } from "@/shared";
import "../styles/FileManagementPage.css";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "ready", label: "처리완료" },
  { key: "processing", label: "처리중" },
  { key: "error", label: "오류" },
];

const STATUS_LABEL = {
  uploading: "업로드 중",
  processing: "처리 중",
  ready: "처리완료",
  error: "오류",
};

export default function FileManagementPage() {
  const files = useAppState((s) => s.files);
  const fetchFiles = useAppState((s) => s.fetchFiles);
  const uploadFile = useAppState((s) => s.uploadFile);
  const deleteFile = useAppState((s) => s.deleteFile);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const fileInputRef = useRef(null);

  useEffect(() => { fetchFiles(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      const matchesQuery = !q || f.name.toLowerCase().includes(q);
      const matchesFilter =
        filter === "all" ? true :
        filter === "processing" ? (f.status === "uploading" || f.status === "processing") :
        f.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [files, query, filter]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  return (
    <div className="file-management-page">
      <div className="fm-toolbar">
        <div className="fm-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="파일 검색..."
          />
        </div>
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
        <button className="fm-upload-btn" onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} />
          업로드
        </button>
      </div>

      <div className="fm-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={["fm-filter-chip", filter === f.key && "active"].filter(Boolean).join(" ")}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="fm-list">
        {filtered.length === 0 ? (
          <p className="fm-empty">표시할 파일이 없습니다.</p>
        ) : (
          filtered.map((file) => {
            const isBusy = file.status === "uploading" || file.status === "processing";
            return (
              <div key={file.id} className={`fm-row fm-row-${file.status}`}>
                <span className="fm-row-name">{file.name}</span>
                <span className="fm-row-meta">
                  {formatBytes(file.size)} · {STATUS_LABEL[file.status] ?? file.status}
                  {isBusy && <Loader2 size={12} className="animate-spin" />}
                </span>
                <button className="fm-row-delete" onClick={() => deleteFile(file.id)} title="삭제">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
