import React, { useMemo, useState } from "react";
import { Search, Download, X } from "lucide-react";
import "../styles/DocumentsPage.css";

const MOCK_DOCUMENTS = [
  { id: "1", period: "2026.06.01 ~ 2026.08.31", name: "RAG 기반 어쩌구 프로젝트.hwpx", team: "학생 지원팀", category: "SW 지원 문서" },
  { id: "2", period: "2026.06.01 ~ 2026.08.31", name: "RAG 기반 어쩌구 프로젝트.hwpx", team: "학생 지원팀", category: "SW 지원 문서" },
  { id: "3", period: "2026.06.01 ~ 2026.08.31", name: "RAG 기반 어쩌구 프로젝트.hwpx", team: "학생 지원팀", category: "SW 지원 문서" },
];

const TEAMS = ["전체", "학생 지원팀"];
const CATEGORIES = ["전체", "SW 지원 문서"];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("전체");
  const [category, setCategory] = useState("전체");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      const matchesQuery = !q || d.name.toLowerCase().includes(q);
      const matchesTeam = team === "전체" || d.team === team;
      const matchesCategory = category === "전체" || d.category === category;
      return matchesQuery && matchesTeam && matchesCategory;
    });
  }, [documents, query, team, category]);

  const handleDelete = (id) => setDocuments((docs) => docs.filter((d) => d.id !== id));

  return (
    <div className="documents-page">
      <div className="doc-search">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색" />
        <button className="doc-search-btn" title="검색">
          <Search size={14} />
        </button>
      </div>

      <div className="doc-filters">
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="doc-list">
        {filtered.length === 0 ? (
          <p className="doc-empty">표시할 문서가 없습니다.</p>
        ) : (
          filtered.map((doc) => (
            <div key={doc.id} className="doc-row">
              <span className="doc-row-period">{doc.period}</span>
              <span className="doc-row-name">{doc.name}</span>
              <span className="doc-row-team">{doc.team}</span>
              <span className="doc-row-category">{doc.category}</span>
              <button className="doc-row-btn" title="다운로드">
                <Download size={14} />
              </button>
              <button className="doc-row-btn doc-row-delete" onClick={() => handleDelete(doc.id)} title="삭제">
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
