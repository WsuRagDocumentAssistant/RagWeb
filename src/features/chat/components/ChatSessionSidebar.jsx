import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, MessageSquare, FolderCog, BookOpen, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/ChatSessionSidebar.css";

const COLLAPSED_KEY = "chat_sidebar_collapsed";

export default function ChatSessionSidebar() {
  const sessions = useAppState((s) => s.sessions);
  const activeSessionId = useAppState((s) => s.activeSessionId);
  const createSession = useAppState((s) => s.createSession);
  const selectSession = useAppState((s) => s.selectSession);
  const deleteSession = useAppState((s) => s.deleteSession);
  const user = useAppState((s) => s.user);
  const sidebarOpen = useAppState((s) => s.sidebarOpen);
  const closeSidebar = useAppState((s) => s.closeSidebar);

  const navigate = useNavigate();
  const location = useLocation();
  const isFilesPage = location.pathname === "/files";
  const isDictionaryPage = location.pathname === "/dictionary";

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

  const handleNavigateFiles = () => {
    navigate("/files");
    closeSidebar();
  };

  const handleNavigateDictionary = () => {
    navigate("/dictionary");
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
            className={["files-nav-btn", isFilesPage && "active"].filter(Boolean).join(" ")}
            onClick={handleNavigateFiles}
            title="파일 관리"
          >
            <FolderCog size={16} />
            {!isCollapsed && "파일 관리"}
          </button>
          <button
            className={["files-nav-btn", isDictionaryPage && "active"].filter(Boolean).join(" ")}
            onClick={handleNavigateDictionary}
            title="사전"
          >
            <BookOpen size={16} />
            {!isCollapsed && "사전"}
          </button>
        </div>

        {isCollapsed ? (
          <button className="collapsed-new-btn" onClick={handleNewChat} title="새 대화">
            <Plus size={16} />
          </button>
        ) : (
          <button className="new-session-btn" onClick={handleNewChat}>
            <Plus size={16} />
            새 대화
          </button>
        )}

        {!isCollapsed && (
          <div className="session-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={["session-item", !isFilesPage && !isDictionaryPage && session.id === activeSessionId && "active"].filter(Boolean).join(" ")}
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
