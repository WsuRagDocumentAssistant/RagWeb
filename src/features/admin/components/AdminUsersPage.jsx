import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAppState } from "@/core/AppState";
import { SortableHeaderCell, useSortableRows } from "@/shared";
import "../styles/AdminUsersPage.css";

const ROLES = ["admin", "user"];
const ROLE_LABEL = { admin: "관리자", user: "일반 사용자" };

// 최상위 관리자 계정은 권한 관리 대상 목록에 노출하지 않는다 (역할을 바꾸거나 볼 수 없음).
const SUPER_ADMIN_EMAIL = "admin@wsu.ac.kr";

export default function AdminUsersPage() {
  const user = useAppState((s) => s.user);
  const userDirectory = useAppState((s) => s.userDirectory);
  const fetchUserDirectory = useAppState((s) => s.fetchUserDirectory);
  const setUserRole = useAppState((s) => s.setUserRole);

  // 서버에서 최신 계정 목록을 가져온다 (실패하면 스토어가 로컬/더미 목록을 그대로 둔다).
  useEffect(() => {
    fetchUserDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const manageableUsers = userDirectory.filter((u) => u.email !== SUPER_ADMIN_EMAIL);
  const { sorted: rows, sortKey, sortDir, toggleSort } = useSortableRows(manageableUsers, "name");

  if (user?.role !== "admin") return <Navigate to="/chat" replace />;

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h1>권한 관리</h1>
        <p>계정의 역할을 바꿔 문서 등록(비정형)·외부 API 등록(정형) 화면 접근 권한을 부여하거나 회수합니다.</p>
      </div>

      <div className="admin-users-table">
        <div className="admin-users-table-head">
          <SortableHeaderCell label="계정" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          <SortableHeaderCell label="역할" sortKey="role" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} className="admin-users-col-role" />
        </div>

        {rows.map((u) => (
          <div key={u.id} className="admin-users-row">
            <span className="admin-users-account">
              <span className="admin-users-name">{u.name}</span>
              <span className="admin-users-email">{u.email}</span>
            </span>
            <select
              className="admin-users-role-select"
              value={u.role}
              onChange={(e) => setUserRole(u.email, e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
