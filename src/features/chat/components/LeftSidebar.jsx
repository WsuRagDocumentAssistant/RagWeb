import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, MessageSquare, FileText, Globe, BookOpen, Upload, Image, ShieldCheck, Lightbulb, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { PERMISSIONS, hasPermission } from "@/config/permissions";
import "../styles/LeftSidebar.css";

const COLLAPSED_KEY = "chat_sidebar_collapsed";

// 프롬프트 수정은 비활성화 — 라우트는 남겨두되 사이드바에는 노출하지 않음
// adminOnly: 관리자만 / permission: 관리자 또는 그 권한을 받은 계정
const NAV_ITEMS = [
  { path: "/documents", label: "문서 목록", icon: FileText },
  { path: "/external-api", label: "외부 API 등록 (정형)", icon: Globe, adminOnly: true },
  { path: "/files", label: "문서 등록 (비정형)", icon: Upload, permission: PERMISSIONS.DOCUMENT_INPUT },
  { path: "/image-editor", label: "이미지 편집기", icon: Image },
  { path: "/dictionary", label: "검색어 관리", icon: BookOpen },
  { path: "/admin", label: "설정 관리", icon: ShieldCheck, adminOnly: true },
  { path: "/feature-requests", label: "기능 개선 요청", icon: Lightbulb },
];

export default function LeftSidebar() {
  const sessions = useAppState((s) => s.sessions);
  const activeSessionId = useAppState((s) => s.activeSessionId);
  const startNewChat = useAppState((s) => s.startNewChat);
  const selectSession = useAppState((s) => s.selectSession);
  const deleteSession = useAppState((s) => s.deleteSession);
  const user = useAppState((s) => s.user);
  const isAdmin = user?.role === "admin";
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.permission ? hasPermission(user, item.permission) : !item.adminOnly || isAdmin,
  );
  const sidebarOpen = useAppState((s) => s.sidebarOpen);
  const closeSidebar = useAppState((s) => s.closeSidebar);
  const openSettings = useAppState((s) => s.openSettings);

  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "1");
  const isCollapsed = collapsed && !sidebarOpen;

  const displayName = user?.name || user?.email || "사용자";
  const initial = displayName.charAt(0).toUpperCase();

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  const handleNewChat = () => {
    startNewChat();
    navigate("/chat");
    closeSidebar();
  };

  const handleSelectSession = (id) => {
    selectSession(id);
    navigate("/chat");
    closeSidebar();
  };

  const handleNavigate = (path) => {
    navigate(path);
    closeSidebar();
  };

  return (
    <>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
      <aside className={["chat-session-sidebar", isCollapsed && "collapsed", sidebarOpen && "mobile-open"].filter(Boolean).join(" ")}>
        <div className="session-sidebar-header">
          <button className="collapse-btn" onClick={toggleCollapsed} title={collapsed ? "펼치기" : "접기"}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <div className="sidebar-nav-buttons">
          <button
            className={["sidebar-nav-btn", isChatPage && !activeSessionId && "active"].filter(Boolean).join(" ")}
            onClick={handleNewChat}
            title="새 채팅"
          >
            <Plus size={16} />
            {!isCollapsed && "새 채팅"}
          </button>
          {visibleNavItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={["sidebar-nav-btn", location.pathname === path && "active"].filter(Boolean).join(" ")}
              onClick={() => handleNavigate(path)}
              title={label}
            >
              <Icon size={16} />
              {!isCollapsed && label}
            </button>
          ))}
        </div>

        <div className="sidebar-divider" />

        <div className="session-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={["session-item", isChatPage && session.id === activeSessionId && "active"].filter(Boolean).join(" ")}
              onClick={() => handleSelectSession(session.id)}
              title={isCollapsed ? session.title : undefined}
            >
              <MessageSquare size={14} className="session-icon" />
              {!isCollapsed && (
                <>
                  <span className="session-title">{session.title}</span>
                  <button
                    className="session-delete-btn"
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                    title="대화 삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <button className="user-info-btn" title={displayName} onClick={openSettings}>
          <span className="user-avatar">{initial}</span>
          {!isCollapsed && (
            <span className="user-info-text">
              <span className="user-name">{displayName}</span>
              {user?.email && user?.name && <span className="user-email">{user.email}</span>}
            </span>
          )}
        </button>
      </aside>
    </>
  );
}
