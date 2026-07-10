import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, MessageSquare, FileText, SlidersHorizontal, Globe, BookOpen, Upload, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { DictionaryPanel } from "@/features/dictionary";
import "../styles/ChatSessionSidebar.css";

const COLLAPSED_KEY = "chat_sidebar_collapsed";

const NAV_ITEMS = [
  { path: "/documents", label: "문서 보기", icon: FileText },
  { path: "/prompt", label: "프롬프트 수정", icon: SlidersHorizontal },
  { path: "/external-api", label: "외부 API 연동", icon: Globe },
  { path: "/files", label: "파일 임베딩", icon: Upload },
];

export default function ChatSessionSidebar() {
  const sessions = useAppState((s) => s.sessions);
  const activeSessionId = useAppState((s) => s.activeSessionId);
  const createSession = useAppState((s) => s.createSession);
  const selectSession = useAppState((s) => s.selectSession);
  const deleteSession = useAppState((s) => s.deleteSession);
  const user = useAppState((s) => s.user);
  const sidebarOpen = useAppState((s) => s.sidebarOpen);
  const closeSidebar = useAppState((s) => s.closeSidebar);
  const dictPanelOpen = useAppState((s) => s.dictPanelOpen);
  const toggleDictPanel = useAppState((s) => s.toggleDictPanel);

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
    createSession();
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
            className={["sidebar-nav-btn", isChatPage && "active"].filter(Boolean).join(" ")}
            onClick={handleNewChat}
            title="새 채팅"
          >
            <Plus size={16} />
            {!isCollapsed && "새 채팅"}
          </button>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
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

          <div className="sidebar-nav-item-wrap">
            <button
              className={["sidebar-nav-btn", dictPanelOpen && "active"].filter(Boolean).join(" ")}
              onClick={toggleDictPanel}
              title="사전 보기"
            >
              <BookOpen size={16} />
              {!isCollapsed && "사전 보기"}
            </button>
            <DictionaryPanel />
          </div>
        </div>

        {!isCollapsed && (
          <div className="session-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={["session-item", isChatPage && session.id === activeSessionId && "active"].filter(Boolean).join(" ")}
                onClick={() => handleSelectSession(session.id)}
              >
                <MessageSquare size={14} className="session-icon" />
                <span className="session-title">{session.title}</span>
                <button
                  className="session-delete-btn"
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  title="대화 삭제"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="user-info-btn" title={displayName}>
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
