import React, { useState } from "react";
import { Plus, Trash2, MessageSquare, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "1");

  const displayName = user?.name || user?.email || "사용자";
  const initial = displayName.charAt(0).toUpperCase();

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <aside className={["chat-session-sidebar", collapsed && "collapsed"].filter(Boolean).join(" ")}>
      <div className="session-sidebar-header">
        {!collapsed && (
          <button className="new-session-btn" onClick={createSession}>
            <Plus size={16} />
            새 대화
          </button>
        )}
        <button className="collapse-btn" onClick={toggleCollapsed} title={collapsed ? "펼치기" : "접기"}>
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {collapsed ? (
        <button className="collapsed-new-btn" onClick={createSession} title="새 대화">
          <Plus size={16} />
        </button>
      ) : (
        <div className="session-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={["session-item", session.id === activeSessionId && "active"].filter(Boolean).join(" ")}
              onClick={() => selectSession(session.id)}
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
        {!collapsed && (
          <span className="user-info-text">
            <span className="user-name">{displayName}</span>
            {user?.email && user?.name && <span className="user-email">{user.email}</span>}
          </span>
        )}
      </button>
    </aside>
  );
}
