import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { SortableHeaderCell, useSortableRows } from "@/shared";
import * as adminService from "../services/AdminService";
import "../styles/AdminUsersPage.css";

const ROLES = ["admin", "user"];
const ROLE_LABEL = { admin: "관리자", user: "일반 사용자" };

// 최상위 관리자 계정은 권한 관리 대상 목록에 노출하지 않는다 (역할을 바꾸거나 볼 수 없음).
const SUPER_ADMIN_EMAIL = "admin@wsu.ac.kr";

// 계정 검색은 이미 받아둔 목록을 화면에서 거른다 — 교번·이름·소속 어디에 들어 있어도 찾는다.
const ACCOUNT_SEARCH_KEYS = ["email", "name", "department"];

function RoleSelect({ value, onChange }) {
  return (
    <select className="admin-users-role-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
      ))}
    </select>
  );
}

function SearchBox({ value, onChange, onSubmit, placeholder, buttonLabel }) {
  return (
    <form
      className="admin-search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Search size={14} className="admin-search-icon" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {buttonLabel && <button type="submit">{buttonLabel}</button>}
    </form>
  );
}

/** 계정 목록: 계정 검색 + 역할 변경 */
function AccountSection() {
  const userDirectory = useAppState((s) => s.userDirectory);
  const fetchUserDirectory = useAppState((s) => s.fetchUserDirectory);
  const setUserRole = useAppState((s) => s.setUserRole);
  const [query, setQuery] = useState("");

  // 서버에서 최신 계정 목록을 가져온다 (실패하면 기존에 로드해둔 로컬 목록을 그대로 둔다).
  useEffect(() => {
    fetchUserDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return userDirectory
      .filter((u) => u.email !== SUPER_ADMIN_EMAIL)
      .filter((u) => !q || ACCOUNT_SEARCH_KEYS.some((k) => String(u[k] ?? "").toLowerCase().includes(q)));
  }, [userDirectory, query]);
  const { sorted: rows, sortKey, sortDir, toggleSort } = useSortableRows(matched, "name");

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>계정 권한 관리</h2>
        <SearchBox value={query} onChange={setQuery} placeholder="교번 · 이름 · 소속으로 계정 검색" />
      </div>

      <div className="admin-users-table">
        <div className="admin-users-table-head">
          <SortableHeaderCell label="교번" sortKey="email" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="이름" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="소속" sortKey="department" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="역할" sortKey="role" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} className="admin-users-col-role" />
        </div>

        {rows.map((u) => (
          <div key={u.id} className="admin-users-row">
            <span className="admin-users-id" title={u.email}>{u.email}</span>
            <span className="admin-users-name" title={u.name}>{u.name}</span>
            <span className={`admin-users-dept ${u.department ? "" : "muted"}`} title={u.department ?? ""}>
              {u.department || "-"}
            </span>
            <RoleSelect value={u.role} onChange={(role) => setUserRole(u.email, role)} />
          </div>
        ))}
        {rows.length === 0 && <div className="admin-users-empty">{query ? "검색 결과가 없습니다." : "계정이 없습니다."}</div>}
      </div>
    </section>
  );
}

/** 사용자 검색: 학교 DB 뷰에서 구성원을 찾고, 가입한 사람이면 바로 역할을 바꾼다 */
function SchoolSearchSection() {
  const setUserRole = useAppState((s) => s.setUserRole);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState(null); // null = 아직 검색 전
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async () => {
    if (keyword.trim().length < 2) {
      setError("검색어를 두 글자 이상 입력하세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.searchSchoolUsers(keyword.trim());
      setResults(data?.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사용자 검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (person, role) => {
    setResults((prev) => prev.map((p) => (p.id === person.id ? { ...p, account: { ...p.account, role } } : p)));
    await setUserRole(person.account.email, role);
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>사용자 검색</h2>
        <SearchBox
          value={keyword}
          onChange={setKeyword}
          onSubmit={search}
          placeholder="학교 구성원 검색 (학번/교번 · 이름 · 소속)"
          buttonLabel={loading ? "검색 중..." : "검색"}
        />
      </div>
      {error && <p className="admin-search-error">{error}</p>}

      {results && (
        <div className="admin-users-table">
          <div className="admin-users-table-head admin-school-grid">
            <span>교번</span>
            <span>이름</span>
            <span>소속</span>
            <span>구분</span>
            <span className="admin-users-col-role">역할</span>
          </div>

          {results.map((p) => (
            <div key={p.id} className="admin-users-row admin-school-grid">
              <span className="admin-users-id" title={p.id}>{p.id}</span>
              <span className="admin-users-name" title={p.name}>{p.name}</span>
              <span className={`admin-users-dept ${p.department ? "" : "muted"}`} title={p.department ?? ""}>
                {p.department || "-"}
              </span>
              <span className="admin-users-dept">{p.status || "-"}</span>
              {p.account && p.account.email !== SUPER_ADMIN_EMAIL ? (
                <RoleSelect value={p.account.role} onChange={(role) => changeRole(p, role)} />
              ) : (
                <span className="admin-users-unregistered" title="RAG 시스템에 계정이 없어 역할을 줄 수 없습니다.">
                  {p.account ? "최상위 관리자" : "미가입"}
                </span>
              )}
            </div>
          ))}
          {results.length === 0 && <div className="admin-users-empty">검색 결과가 없습니다.</div>}
        </div>
      )}
    </section>
  );
}

export default function AdminUsersPage() {
  const user = useAppState((s) => s.user);

  if (user?.role !== "admin") return <Navigate to="/chat" replace />;

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h1>설정 관리</h1>
        <p>계정의 역할을 바꿔 문서 등록(비정형)·외부 API 등록(정형) 화면 접근 권한을 부여하거나 회수합니다.</p>
      </div>

      <AccountSection />
      <SchoolSearchSection />
    </div>
  );
}
