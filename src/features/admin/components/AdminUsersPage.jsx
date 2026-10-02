import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAppState } from "@/core/AppState";
import AccountSection from "./AccountSection";
import CategorySection from "./CategorySection";
import "../styles/AdminUsersPage.css";

const OPEN_KEY = "admin_settings_open"; // 펼쳐 둔 구역을 새로고침해도 기억한다

const readOpen = () => {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) ?? "{}");
  } catch {
    return {};
  }
};

/** ▶ / ▼ 로 접고 펼치는 구역. 접혀 있으면 안의 화면을 만들지 않는다(목록 조회도 펼칠 때 한다). */
function Collapsible({ id, title, open, onToggle, children }) {
  return (
    <section className={`admin-collapse ${open ? "open" : ""}`}>
      <button type="button" className="admin-collapse-head" onClick={() => onToggle(id)} aria-expanded={open}>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <h2>{title}</h2>
      </button>
      {open && <div className="admin-collapse-body">{children}</div>}
    </section>
  );
}

export default function AdminUsersPage() {
  const user = useAppState((s) => s.user);
  const [open, setOpen] = useState(readOpen);

  const toggle = (id) =>
    setOpen((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next));
      } catch {
        /* 저장 실패는 무시 — 다음에 접힌 채로 열릴 뿐이다 */
      }
      return next;
    });

  if (user?.role !== "admin") return <Navigate to="/chat" replace />;

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <h1>설정 관리</h1>
      </div>

      <Collapsible id="accounts" title="계정 권한 관리" open={!!open.accounts} onToggle={toggle}>
        <AccountSection />
      </Collapsible>
      <Collapsible id="categories" title="문서 카테고리 관리" open={!!open.categories} onToggle={toggle}>
        <CategorySection />
      </Collapsible>
    </div>
  );
}
