import React, { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Search, Trash2, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/core/AppState";
import { DUMMY_EXTERNAL_APIS, EXTERNAL_API_FORMATS, ComboBoxInput, SortableHeaderCell, useSortableRows } from "@/shared";
import "../styles/ExternalApiPage.css";

const SOURCES = ["전체", "Naver", "정부24", "Google", "기타"];
const CATEGORIES = ["전체", "검색", "행정", "미분류"];
const FORM_SOURCES = SOURCES.slice(1);
const FORM_CATEGORIES = CATEGORIES.slice(1);

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  title: "",
  site: "",
  url: "",
  source: FORM_SOURCES[0],
  category: FORM_CATEGORIES[0],
  format: EXTERNAL_API_FORMATS[0],
  fetchedAt: todayStr(),
});

function StatusRing({ status }) {
  if (status === "error") return <span className="ea-ring ea-ring-error">오류</span>;
  if (status === "processing") return <span className="ea-ring ea-ring-processing">50%</span>;
  return <span className="ea-ring ea-ring-ready">100%</span>;
}

export default function ExternalApiPage() {
  const user = useAppState((s) => s.user);
  const pushNotification = useAppState((s) => s.pushNotification);
  const [apis, setApis] = useState(DUMMY_EXTERNAL_APIS);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null이면 신규 등록 모드
  const [form, setForm] = useState(emptyForm());
  const [refreshing, setRefreshing] = useState(false);

  const filteredBase = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apis.filter((a) => {
      const matchesQuery = !q || a.title.toLowerCase().includes(q) || a.url.toLowerCase().includes(q);
      const matchesSource = source === "전체" || a.source === source;
      const matchesCategory = category === "전체" || a.category === category;
      return matchesQuery && matchesSource && matchesCategory;
    });
  }, [apis, query, source, category]);

  const { sorted: filtered, sortKey, sortDir, toggleSort } = useSortableRows(filteredBase, "fetchedAt", "desc");

  if (user?.role !== "admin") return <Navigate to="/chat" replace />;

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEditForm = (api) => {
    setEditingId(api.id);
    setForm({
      title: api.title,
      site: api.site,
      url: api.url,
      source: api.source,
      category: api.category,
      format: api.format,
      fetchedAt: api.fetchedAt,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim() || !form.fetchedAt) return;
    if (editingId) {
      setApis((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...form, title: form.title.trim(), url: form.url.trim() } : a)),
      );
      toast.success("API 정보를 수정했습니다.");
      pushNotification("API 정보를 수정했습니다.", { type: "success", link: "/external-api" });
    } else {
      setApis((prev) => [
        { id: `${Date.now()}`, ...form, title: form.title.trim(), url: form.url.trim(), status: "processing" },
        ...prev,
      ]);
    }
    closeForm();
  };

  const handleDelete = (id) => setApis((prev) => prev.filter((a) => a.id !== id));

  const handleRefresh = () => {
    setRefreshing(true);
    setApis(DUMMY_EXTERNAL_APIS);
    toast.success("API 목록을 새로고침했습니다.");
    pushNotification("API 목록을 새로고침했습니다.", { type: "success", link: "/external-api" });
    setTimeout(() => setRefreshing(false), 400);
  };

  return (
    <div className="external-api-page">
      <div className="ea-page-header">
        <h1>외부 API 등록 (정형)</h1>
        <p>공공데이터 등 정형 데이터(XML, JSON, XLSX 등)를 제공하는 외부 API를 등록하고 관리합니다.</p>
      </div>

      <div className="ea-toolbar">
        <div className="ea-search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색" />
          <Search size={14} />
        </div>
        <button className="ea-refresh-btn" onClick={handleRefresh} title="새로고침">
          <RefreshCw size={14} className={refreshing ? "ea-spin" : ""} />
        </button>
        <button className="ea-register-btn" onClick={openAddForm}>등록</button>
      </div>

      <div className="ea-filters">
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {formOpen && (
        <form className="ea-add-form" onSubmit={handleSubmit}>
          <div className="ea-add-form-grid">
            <label className="ea-add-field">
              <span>문서 타이틀</span>
              <input
                className="ea-add-input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="예: 공공데이터 개방 포털"
                autoFocus
                required
              />
            </label>
            <label className="ea-add-field">
              <span>사이트</span>
              <input
                className="ea-add-input"
                value={form.site}
                onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}
                placeholder="예: data.go.kr"
              />
            </label>
            <label className="ea-add-field ea-add-field-wide">
              <span>API URL</span>
              <input
                className="ea-add-input"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="API 경로 입력"
                required
              />
            </label>
            <label className="ea-add-field">
              <span>소스</span>
              <ComboBoxInput
                value={form.source}
                onChange={(v) => setForm((f) => ({ ...f, source: v }))}
                options={FORM_SOURCES}
                placeholder="예: Naver"
              />
            </label>
            <label className="ea-add-field">
              <span>구분</span>
              <select
                className="ea-add-select"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {FORM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="ea-add-field">
              <span>데이터 형식</span>
              <ComboBoxInput
                value={form.format}
                onChange={(v) => setForm((f) => ({ ...f, format: v }))}
                options={EXTERNAL_API_FORMATS}
                placeholder="예: JSON"
              />
            </label>
            <label className="ea-add-field">
              <span>데이터 가져온 날짜</span>
              <input
                className="ea-add-input"
                type="date"
                value={form.fetchedAt}
                onChange={(e) => setForm((f) => ({ ...f, fetchedAt: e.target.value }))}
                required
              />
            </label>
          </div>
          <div className="ea-add-form-actions">
            <button type="submit" className="ea-add-submit">{editingId ? "저장" : "추가"}</button>
            <button type="button" className="ea-add-cancel" onClick={closeForm}>취소</button>
          </div>
        </form>
      )}

      <div className="ea-table">
        <div className="ea-table-head">
          <SortableHeaderCell label="문서 타이틀" sortKey="title" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="사이트 / URL" sortKey="site" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="형식" sortKey="format" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="가져온 날짜" sortKey="fetchedAt" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="상태" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <span>관리</span>
        </div>

        <div className="ea-table-body">
          {filtered.length === 0 ? (
            <p className="ea-empty">등록된 API가 없습니다.</p>
          ) : (
            filtered.map((api) => (
              <div key={api.id} className="ea-table-row">
                <span className="ea-row-title" title={api.title}>{api.title}</span>
                <span className="ea-row-meta" title={`${api.site} · ${api.url}`}>{api.site} · {api.url}</span>
                <span className="ea-row-format">{api.format}</span>
                <span className="ea-row-date">{api.fetchedAt}</span>
                <StatusRing status={api.status} />
                <span className="ea-row-actions">
                  <button className="ea-row-edit" onClick={() => openEditForm(api)} title="수정">
                    <Pencil size={14} />
                  </button>
                  <button className="ea-row-delete" onClick={() => handleDelete(api.id)} title="삭제">
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
