import React, { useMemo, useState } from "react";
import { Search, Trash2, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/core/AppState";
import { DUMMY_EXTERNAL_APIS } from "@/shared";
import "../styles/ExternalApiPage.css";

const SOURCES = ["전체", "Naver", "정부24", "Google", "기타"];
const CATEGORIES = ["전체", "검색", "행정", "미분류"];
const FORM_SOURCES = SOURCES.slice(1);
const FORM_CATEGORIES = CATEGORIES.slice(1);

const emptyForm = () => ({ url: "", source: FORM_SOURCES[0], category: FORM_CATEGORIES[0] });

function StatusRing({ status }) {
  if (status === "error") return <span className="ea-ring ea-ring-error">오류</span>;
  if (status === "processing") return <span className="ea-ring ea-ring-processing">50%</span>;
  return <span className="ea-ring ea-ring-ready">100%</span>;
}

export default function ExternalApiPage() {
  const pushNotification = useAppState((s) => s.pushNotification);
  const [apis, setApis] = useState(DUMMY_EXTERNAL_APIS);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null이면 신규 등록 모드
  const [form, setForm] = useState(emptyForm());
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apis.filter((a) => {
      const matchesQuery = !q || a.url.toLowerCase().includes(q);
      const matchesSource = source === "전체" || a.source === source;
      const matchesCategory = category === "전체" || a.category === category;
      return matchesQuery && matchesSource && matchesCategory;
    });
  }, [apis, query, source, category]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEditForm = (api) => {
    setEditingId(api.id);
    setForm({ url: api.url, source: api.source, category: api.category });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.url.trim()) return;
    if (editingId) {
      setApis((prev) =>
        prev.map((a) =>
          a.id === editingId ? { ...a, url: form.url.trim(), source: form.source, category: form.category } : a,
        ),
      );
      toast.success("API 정보를 수정했습니다.");
      pushNotification("API 정보를 수정했습니다.", { type: "success", link: "/external-api" });
    } else {
      setApis((prev) => [
        { id: `${Date.now()}`, url: form.url.trim(), source: form.source, category: form.category, status: "processing" },
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
          <input
            className="ea-add-input"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="API URL 입력"
            autoFocus
          />
          <select
            className="ea-add-select"
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
          >
            {FORM_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="ea-add-select"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {FORM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="ea-add-submit">{editingId ? "저장" : "추가"}</button>
          <button type="button" className="ea-add-cancel" onClick={closeForm}>취소</button>
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
              <button className="ea-row-edit" onClick={() => openEditForm(api)} title="수정">
                <Pencil size={14} />
              </button>
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
