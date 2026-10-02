import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/core/AppState";
import { PERMISSIONS, PERMISSION_LABEL } from "@/config/permissions";
import { SortableHeaderCell, useSortableRows } from "@/shared";
import * as adminService from "../services/AdminService";
import "../styles/AdminUsersPage.css";

const ROLES = ["admin", "user"];
const ROLE_LABEL = { admin: "관리자", user: "일반 사용자" };

// 최상위 관리자 계정은 권한 관리 대상 목록에 노출하지 않는다 (역할을 바꾸거나 볼 수 없음).
const SUPER_ADMIN_EMAIL = "admin@wsu.ac.kr";

// 계정 검색은 이미 받아둔 목록을 화면에서 거른다 — 교번·이름·소속 어디에 들어 있어도 찾는다.
const ACCOUNT_SEARCH_KEYS = ["email", "name", "department"];

const DOCUMENT_INPUT = PERMISSIONS.DOCUMENT_INPUT;

function RoleSelect({ value, onChange }) {
  return (
    <select className="admin-users-role-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
      ))}
    </select>
  );
}

/** 역할과 별개인 권한 하나. 관리자는 모든 권한을 가지므로 켜진 채로 잠근다. */
function PermissionToggle({ account, permission }) {
  const setUserPermission = useAppState((s) => s.setUserPermission);
  const isAdmin = account.role === "admin";
  const checked = isAdmin || !!account.permissions?.includes(permission);
  return (
    <label className={`admin-perm-toggle ${isAdmin ? "locked" : ""}`} title={isAdmin ? "관리자는 모든 권한을 가집니다." : PERMISSION_LABEL[permission]}>
      <input
        type="checkbox"
        checked={checked}
        disabled={isAdmin}
        onChange={(e) => setUserPermission(account.email, permission, e.target.checked)}
      />
      <span>{checked ? "허용" : "-"}</span>
    </label>
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

/** 계정 목록: 계정 검색 + 역할·권한 변경 */
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
          <span className="admin-users-col-center">{PERMISSION_LABEL[DOCUMENT_INPUT]}</span>
          <SortableHeaderCell label="역할" sortKey="role" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} className="admin-users-col-role" />
        </div>

        {rows.map((u) => (
          <div key={u.id} className="admin-users-row">
            <span className="admin-users-id" title={u.email}>{u.email}</span>
            <span className="admin-users-name" title={u.name}>{u.name}</span>
            <span className={`admin-users-dept ${u.department ? "" : "muted"}`} title={u.department ?? ""}>
              {u.department || "-"}
            </span>
            <PermissionToggle account={u} permission={DOCUMENT_INPUT} />
            <RoleSelect value={u.role} onChange={(role) => setUserRole(u.email, role)} />
          </div>
        ))}
        {rows.length === 0 && <div className="admin-users-empty">{query ? "검색 결과가 없습니다." : "계정이 없습니다."}</div>}
      </div>
    </section>
  );
}

const formatSyncedAt = (iso) => (iso ? new Date(iso).toLocaleString("ko-KR") : "동기화 기록 없음");

/** 사용자 검색: 학교 사용자 사본에서 구성원을 찾고, 가입한 사람이면 바로 역할·권한을 바꾼다 */
function SchoolSearchSection() {
  const userDirectory = useAppState((s) => s.userDirectory);
  const setUserRole = useAppState((s) => s.setUserRole);
  const fetchUserDirectory = useAppState((s) => s.fetchUserDirectory);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState(null); // null = 아직 검색 전
  const [copy, setCopy] = useState(null); // 사본 상태 { count, syncedAt }
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // 역할·권한은 계정 목록(userDirectory)이 최신이다 — 검색 결과에서 바꿔도 같은 곳을 고친다.
  const accountOf = (person) =>
    person.account && (userDirectory.find((u) => u.email === person.account.email) ?? person.account);

  const search = async () => {
    if (!keyword.trim()) {
      setError("검색어를 입력하세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.searchSchoolUsers(keyword.trim());
      setResults(data?.users ?? []);
      setCopy(data?.copy ?? null);
    } catch (err) {
      setResults(null);
      setError(err instanceof Error ? err.message : "사용자 검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const status = await adminService.syncSchoolUsers();
      setCopy(status);
      toast.success(`학교 사용자 ${status.count}명을 동기화했습니다.`);
      fetchUserDirectory(); // 계정 목록의 소속도 새 사본으로
    } catch (err) {
      setError(err instanceof Error ? err.message : "동기화에 실패했습니다.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>사용자 검색</h2>
        <div className="admin-section-tools">
          <SearchBox
            value={keyword}
            onChange={setKeyword}
            onSubmit={search}
            placeholder="학교 구성원 검색 (학번/교번 · 이름 · 소속)"
            buttonLabel={loading ? "검색 중..." : "검색"}
          />
          <button type="button" className="admin-sync-btn" onClick={sync} disabled={syncing} title="학교 DB에서 지금 다시 가져옵니다">
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "동기화 중..." : "지금 동기화"}
          </button>
        </div>
      </div>
      {copy && (
        <p className="admin-copy-status">
          학교 사용자 {copy.count}명 · 마지막 동기화 {formatSyncedAt(copy.syncedAt)}
        </p>
      )}
      {error && <p className="admin-search-error">{error}</p>}

      {results && (
        <div className="admin-users-table">
          <div className="admin-users-table-head admin-school-grid">
            <span>교번</span>
            <span>이름</span>
            <span>소속</span>
            <span>구분</span>
            <span className="admin-users-col-center">{PERMISSION_LABEL[DOCUMENT_INPUT]}</span>
            <span className="admin-users-col-role">역할</span>
          </div>

          {results.map((p) => {
            const account = accountOf(p);
            const editable = account && account.email !== SUPER_ADMIN_EMAIL;
            return (
              <div key={p.id} className="admin-users-row admin-school-grid">
                <span className="admin-users-id" title={p.id}>{p.id}</span>
                <span className="admin-users-name" title={p.name}>{p.name}</span>
                <span className={`admin-users-dept ${p.department ? "" : "muted"}`} title={p.department ?? ""}>
                  {p.department || "-"}
                </span>
                <span className="admin-users-dept">{p.status || "-"}</span>
                {editable ? (
                  <PermissionToggle account={account} permission={DOCUMENT_INPUT} />
                ) : (
                  <span className="admin-users-col-center muted">-</span>
                )}
                {editable ? (
                  <RoleSelect value={account.role} onChange={(role) => setUserRole(account.email, role)} />
                ) : (
                  <span className="admin-users-unregistered" title="RAG 시스템에 계정이 없어 역할·권한을 줄 수 없습니다.">
                    {account ? "최상위 관리자" : "미가입"}
                  </span>
                )}
              </div>
            );
          })}
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
        <p>
          계정의 역할을 바꿔 외부 API 등록(정형)·설정 관리 화면 접근 권한을 부여하거나 회수합니다.
          "{PERMISSION_LABEL[DOCUMENT_INPUT]}" 권한을 받은 일반 사용자는 문서 등록(비정형) 화면을 쓸 수 있습니다.
        </p>
      </div>

      <AccountSection />
      <SchoolSearchSection />
    </div>
  );
}
