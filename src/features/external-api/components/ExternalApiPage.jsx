import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Search, Trash2, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/core/AppState";
import { ComboBoxInput, SortableHeaderCell, useSortableRows } from "@/shared";
import "../styles/ExternalApiPage.css";

const SOURCES = ["전체", "Naver", "정부24", "Google", "기타"];
const FORM_SOURCES = SOURCES.slice(1);
const DEFAULT_REFRESH_INTERVAL_MINUTES = 5;

// 각 API가 갱신 주기를 지켰는지 확인하는 주기 — 개별 API의 갱신 주기(분 단위)와는 별개다.
// 이 값보다 짧은 갱신 주기를 걸어도 실제로는 이 간격으로만 확인된다.
const REFRESH_CHECK_INTERVAL_MS = 30 * 1000; // 30초

const emptyForm = () => ({
  title: "",
  url: "",
  source: FORM_SOURCES[0],
  apiKey: "",
  fetchedAt: new Date().toISOString(),
  refreshIntervalMinutes: DEFAULT_REFRESH_INTERVAL_MINUTES,
});

// 표에는 API 키 전체를 노출하지 않고 끝 4자리만 보여준다.
const maskApiKey = (key) => (key ? `•••• ${key.slice(-4)}` : "-");

// <input type="datetime-local">에 넣을 수 있는 "YYYY-MM-DDTHH:mm" 형식으로 변환한다.
const toDatetimeLocalValue = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// 표에 보여줄 "YYYY-MM-DD HH:mm" 형식.
const formatFetchedAt = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatRefreshInterval = (minutes) => {
  if (minutes % 1440 === 0) return `${minutes / 1440}일마다`;
  if (minutes % 60 === 0) return `${minutes / 60}시간마다`;
  return `${minutes}분마다`;
};

export default function ExternalApiPage() {
  const user = useAppState((s) => s.user);
  const apis = useAppState((s) => s.externalApis);
  const fetchExternalApis = useAppState((s) => s.fetchExternalApis);
  const saveExternalApi = useAppState((s) => s.saveExternalApi);
  const deleteExternalApi = useAppState((s) => s.deleteExternalApi);
  const syncExternalApi = useAppState((s) => s.syncExternalApi);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("전체");
  const [editingId, setEditingId] = useState(null); // null이면 신규 등록 모드
  const [form, setForm] = useState(emptyForm());
  const [refreshing, setRefreshing] = useState(false);

  const filteredBase = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apis.filter((a) => {
      const matchesQuery = !q || a.title.toLowerCase().includes(q) || a.url.toLowerCase().includes(q);
      const matchesSource = source === "전체" || a.source === source;
      return matchesQuery && matchesSource;
    });
  }, [apis, query, source]);

  const { sorted: filtered, sortKey, sortDir, toggleSort } = useSortableRows(filteredBase, "fetchedAt", "desc");

  // 최초 진입 시 서버에서 목록을 가져온다 (실패하면 에러 토스트를 띄우고 목록은 비워둔다).
  useEffect(() => {
    fetchExternalApis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const ok = await fetchExternalApis();
    if (ok) toast.success("API 목록을 새로고침했습니다.");
    setTimeout(() => setRefreshing(false), 400);
  };

  // 30초마다 이 화면이 켜져 있는 클라이언트 시계 기준으로 각 API의 갱신 주기가 지났는지 확인해서,
  // 지난 항목만 개별적으로 새로고침한다. (이 페이지가 열려있는 동안에만 동작한다.)
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      useAppState.getState().externalApis.forEach((a) => {
        const isDue = now.getTime() - new Date(a.fetchedAt).getTime() >= a.refreshIntervalMinutes * 60 * 1000;
        if (isDue) syncExternalApi(a.id, a.title);
      });
    }, REFRESH_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user?.role !== "admin") return <Navigate to="/chat" replace />;

  const openEditForm = (api) => {
    setEditingId(api.id);
    setForm({
      title: api.title,
      url: api.url,
      source: api.source,
      apiKey: api.apiKey,
      fetchedAt: api.fetchedAt,
      refreshIntervalMinutes: api.refreshIntervalMinutes,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim() || !form.apiKey.trim() || !form.fetchedAt) return;
    if (!form.refreshIntervalMinutes || form.refreshIntervalMinutes < 1) return;
    await saveExternalApi({
      ...form,
      id: editingId ?? undefined,
      title: form.title.trim(),
      url: form.url.trim(),
      apiKey: form.apiKey.trim(),
    });
    resetForm();
  };

  const handleDelete = (id) => deleteExternalApi(id);

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
        <button className="ea-refresh-btn" onClick={handleRefresh} title="전체 새로고침">
          <RefreshCw size={14} className={refreshing ? "ea-spin" : ""} />
        </button>
      </div>

      <div className="ea-filters">
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <form className="ea-add-form" onSubmit={handleSubmit}>
          <div className="ea-add-form-head">
            <span>{editingId ? "API 정보 수정" : "API 등록"}</span>
            {editingId && <span className="ea-add-form-head-sub">선택한 API의 정보를 수정하고 있습니다</span>}
          </div>
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
              <span>API Key</span>
              <input
                className="ea-add-input"
                type="password"
                autoComplete="off"
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder="API 키 입력"
                required
              />
            </label>
            <label className="ea-add-field">
              <span>갱신 주기 (분)</span>
              <input
                className="ea-add-input"
                type="number"
                min="1"
                step="1"
                value={form.refreshIntervalMinutes}
                onChange={(e) => setForm((f) => ({ ...f, refreshIntervalMinutes: Number(e.target.value) }))}
                placeholder="예: 5"
                required
              />
            </label>
            <label className="ea-add-field">
              <span>데이터 가져온 날짜</span>
              <input
                className="ea-add-input"
                type="datetime-local"
                value={toDatetimeLocalValue(form.fetchedAt)}
                disabled
                title="실제로 데이터를 가져온 시각이 자동으로 기록되며 직접 수정할 수 없습니다."
              />
            </label>
          </div>
          <div className="ea-add-form-actions">
            <button type="submit" className="ea-add-submit">{editingId ? "저장" : "추가"}</button>
            {editingId && (
              <button type="button" className="ea-add-cancel" onClick={resetForm}>취소</button>
            )}
          </div>
        </form>

      <div className="ea-table">
        <div className="ea-table-head">
          <SortableHeaderCell label="문서 타이틀" sortKey="title" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="URL" sortKey="url" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="API Key" sortKey="apiKey" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="갱신 주기" sortKey="refreshIntervalMinutes" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="가져온 날짜" sortKey="fetchedAt" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <span>관리</span>
        </div>

        <div className="ea-table-body">
          {filtered.length === 0 ? (
            <p className="ea-empty">등록된 API가 없습니다.</p>
          ) : (
            filtered.map((api) => (
              <div key={api.id} className="ea-table-row">
                <span className="ea-row-title" title={api.title}>{api.title}</span>
                <span className="ea-row-meta" title={api.url}>{api.url}</span>
                <span className="ea-row-apikey">{maskApiKey(api.apiKey)}</span>
                <span className="ea-row-interval">{formatRefreshInterval(api.refreshIntervalMinutes)}</span>
                <span className="ea-row-date">{formatFetchedAt(api.fetchedAt)}</span>
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
