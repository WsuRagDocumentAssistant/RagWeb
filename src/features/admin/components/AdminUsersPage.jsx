import React, { useEffect, useMemo, useRef, useState } from "react";
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

// 계정은 이미 받아둔 목록을 화면에서 거른다 — 교번·이름·소속·구분 어디에 들어 있어도 찾는다.
const ACCOUNT_SEARCH_KEYS = ["email", "name", "department", "status"];

// 입력이 멈추고 이만큼 지나면 학교 사용자 사본도 검색한다.
const SCHOOL_SEARCH_DELAY_MS = 300;

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

const formatSyncedAt = (iso) => (iso ? new Date(iso).toLocaleString("ko-KR") : "동기화 기록 없음");

/** 계정 행 */
const accountRow = (u) => ({
  key: `account-${u.id}`,
  id: u.email,
  name: u.name,
  department: u.department,
  status: u.status,
  role: u.role,
  account: u,
});

/** 학교 구성원 행. 계정이 있으면 계정 행과 합친다(소속·구분은 학교 사본 값이 최신). */
const schoolRow = (p, account) => ({
  key: account ? `account-${account.id}` : `school-${p.id}`,
  id: account?.email ?? p.id,
  name: account?.name || p.name,
  department: p.department ?? account?.department,
  status: p.status ?? account?.status,
  role: account?.role ?? null,
  account: account ?? null,
});

/**
 * 계정 · 사용자 검색을 하나로.
 * 검색어가 없으면 등록된 계정 전체, 있으면 그 검색어에 맞는 계정과 학교 구성원(학교 사용자 사본)을
 * 한 표에 합쳐 보여준다. 가입하지 않은 구성원은 "미가입"으로 나온다.
 */
function UserSection() {
  const userDirectory = useAppState((s) => s.userDirectory);
  const fetchUserDirectory = useAppState((s) => s.fetchUserDirectory);
  const setUserRole = useAppState((s) => s.setUserRole);

  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]); // 학교 사본 검색 결과
  const [copy, setCopy] = useState(null); // 사본 상태 { count, syncedAt }
  const [notice, setNotice] = useState(null); // 학교 검색·동기화 실패 사유 (계정 목록은 그대로 보인다)
  const [searching, setSearching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const latest = useRef(0); // 늦게 온 이전 검색 응답은 버린다

  // 서버에서 최신 계정 목록을 가져온다 (실패하면 기존에 로드해둔 로컬 목록을 그대로 둔다).
  useEffect(() => {
    fetchUserDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keyword = query.trim();

  useEffect(() => {
    if (!keyword) {
      setPeople([]);
      setSearching(false);
      return;
    }
    const ticket = ++latest.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await adminService.searchSchoolUsers(keyword);
        if (ticket !== latest.current) return;
        setPeople(data?.users ?? []);
        setCopy(data?.copy ?? null);
        setNotice(null);
      } catch (err) {
        if (ticket !== latest.current) return;
        setPeople([]);
        setNotice(err instanceof Error ? err.message : "학교 구성원 검색에 실패했습니다.");
      } finally {
        if (ticket === latest.current) setSearching(false);
      }
    }, SCHOOL_SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  const sync = async () => {
    setSyncing(true);
    try {
      const status = await adminService.syncSchoolUsers();
      setCopy(status);
      setNotice(null);
      toast.success(`학교 사용자 ${status.count}명을 동기화했습니다.`);
      fetchUserDirectory(); // 계정 목록의 소속도 새 사본으로
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "동기화에 실패했습니다.");
    } finally {
      setSyncing(false);
    }
  };

  const merged = useMemo(() => {
    const accounts = userDirectory.filter((u) => u.email !== SUPER_ADMIN_EMAIL);
    const q = keyword.toLowerCase();
    const matched = accounts.filter(
      (u) => !q || ACCOUNT_SEARCH_KEYS.some((k) => String(u[k] ?? "").toLowerCase().includes(q)),
    );
    if (!q) return matched.map(accountRow);

    // 학교 검색 결과의 계정은 계정 목록(userDirectory) 것으로 바꾼다 — 역할·권한이 최신이다.
    const byEmail = new Map(accounts.map((u) => [u.email, u]));
    const rows = new Map(matched.map((u) => [`account-${u.id}`, accountRow(u)]));
    for (const p of people) {
      if (p.account?.email === SUPER_ADMIN_EMAIL) continue;
      // 계정 목록이 아직 옛것이면 검색 결과에 실린 계정 정보로 대신한다(권한은 다음 목록 조회 때 맞춰진다).
      const account = p.account && (byEmail.get(p.account.email) ?? { ...p.account, id: p.account.email, permissions: [] });
      const row = schoolRow(p, account);
      rows.set(row.key, row);
    }
    return [...rows.values()];
  }, [userDirectory, people, keyword]);

  const { sorted: rows, sortKey, sortDir, toggleSort } = useSortableRows(merged, "name");

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>계정 · 사용자</h2>
        <div className="admin-section-tools">
          <form className="admin-search" onSubmit={(e) => e.preventDefault()}>
            <Search size={14} className="admin-search-icon" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="교번 · 이름 · 소속으로 계정과 학교 구성원 검색"
            />
          </form>
          <button type="button" className="admin-sync-btn" onClick={sync} disabled={syncing} title="학교 DB에서 지금 다시 가져옵니다">
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "동기화 중..." : "지금 동기화"}
          </button>
        </div>
      </div>
      <p className="admin-copy-status">
        {keyword
          ? searching
            ? "학교 구성원을 찾는 중..."
            : `검색 결과 ${rows.length}명 (가입하지 않은 학교 구성원은 "미가입"으로 표시)`
          : `등록된 계정 ${rows.length}개 — 검색하면 학교 구성원도 함께 찾습니다.`}
        {copy && ` · 학교 사용자 ${copy.count}명, 마지막 동기화 ${formatSyncedAt(copy.syncedAt)}`}
      </p>
      {notice && <p className="admin-search-error">{notice}</p>}

      <div className="admin-users-table">
        <div className="admin-users-table-head admin-school-grid">
          <SortableHeaderCell label="교번" sortKey="id" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="이름" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="소속" sortKey="department" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="구분" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <span className="admin-users-col-center">{PERMISSION_LABEL[DOCUMENT_INPUT]}</span>
          <SortableHeaderCell label="역할" sortKey="role" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} className="admin-users-col-role" />
        </div>

        {rows.map((r) => (
          <div key={r.key} className="admin-users-row admin-school-grid">
            <span className="admin-users-id" title={r.id}>{r.id}</span>
            <span className="admin-users-name" title={r.name}>{r.name}</span>
            <span className={`admin-users-dept ${r.department ? "" : "muted"}`} title={r.department ?? ""}>
              {r.department || "-"}
            </span>
            <span className={`admin-users-dept ${r.status ? "" : "muted"}`}>{r.status || "-"}</span>
            {r.account ? (
              <PermissionToggle account={r.account} permission={DOCUMENT_INPUT} />
            ) : (
              <span className="admin-users-col-center muted">-</span>
            )}
            {r.account ? (
              <RoleSelect value={r.account.role} onChange={(role) => setUserRole(r.account.email, role)} />
            ) : (
              <span className="admin-users-unregistered" title="RAG 시스템에 계정이 없어 역할·권한을 줄 수 없습니다.">
                미가입
              </span>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="admin-users-empty">{keyword ? (searching ? "검색 중..." : "검색 결과가 없습니다.") : "계정이 없습니다."}</div>
        )}
      </div>
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

      <UserSection />
    </div>
  );
}
