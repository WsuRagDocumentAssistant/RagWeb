import React, { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { DUMMY_EXTERNAL_APIS } from "@/shared";
import "../styles/ExternalApiPage.css";

const SOURCES = ["전체", "Naver", "정부24", "Google"];
const CATEGORIES = ["전체", "검색", "행정"];

function StatusRing({ status }) {
  if (status === "error") return <span className="ea-ring ea-ring-error">오류</span>;
  if (status === "processing") return <span className="ea-ring ea-ring-processing">50%</span>;
  return <span className="ea-ring ea-ring-ready">100%</span>;
}

export default function ExternalApiPage() {
  const [apis, setApis] = useState(DUMMY_EXTERNAL_APIS);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apis.filter((a) => {
      const matchesQuery = !q || a.url.toLowerCase().includes(q);
      const matchesSource = source === "전체" || a.source === source;
      const matchesCategory = category === "전체" || a.category === category;
      return matchesQuery && matchesSource && matchesCategory;
    });
  }, [apis, query, source, category]);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setApis((prev) => [
      { id: `${Date.now()}`, url: newUrl.trim(), source: "기타", category: "미분류", status: "processing" },
      ...prev,
    ]);
    setNewUrl("");
    setIsAdding(false);
  };

  const handleDelete = (id) => setApis((prev) => prev.filter((a) => a.id !== id));

  return (
    <div className="external-api-page">
      <div className="ea-toolbar">
        <div className="ea-search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색" />
          <Search size={14} />
        </div>
        <button className="ea-register-btn" onClick={() => setIsAdding((v) => !v)}>등록</button>
      </div>

      <div className="ea-filters">
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isAdding && (
        <form className="ea-add-form" onSubmit={handleRegister}>
          <input
            className="ea-add-input"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="API URL 입력"
            autoFocus
          />
          <button type="submit" className="ea-add-submit">추가</button>
          <button type="button" className="ea-add-cancel" onClick={() => { setIsAdding(false); setNewUrl(""); }}>취소</button>
        </form>
      )}

      <div className="ea-list">
        {filtered.length === 0 ? (
          <p className="ea-empty">등록된 API가 없습니다.</p>
        ) : (
          filtered.map((api) => (
            <div key={api.id} className="ea-row">
              <span className="ea-row-url">{api.url}</span>
              <StatusRing status={api.status} />
              <button className="ea-row-delete" onClick={() => handleDelete(api.id)} title="삭제">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
