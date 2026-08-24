import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, XCircle, Info } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { formatRelativeTime } from "@/shared";
import "../styles/FileNotifications.css";

const TYPE_ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export default function FileNotifications() {
  const navigate = useNavigate();
  const notifications = useAppState((s) => s.notifications);
  const markNotificationRead = useAppState((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppState((s) => s.markAllNotificationsRead);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="file-notifications" ref={panelRef}>
      <button className="titlebar-menu-btn" onClick={() => setOpen((v) => !v)} title="알림">
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="file-notifications-panel">
          <div className="file-notifications-header">
            <h3 className="file-notifications-title">알림</h3>
            {unreadCount > 0 && (
              <button className="file-notifications-mark-all" onClick={markAllNotificationsRead}>
                모두 읽음
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="file-notifications-empty">알림이 없습니다.</p>
          ) : (
            <div className="file-notifications-list">
              {notifications.map((notif) => {
                const Icon = TYPE_ICON[notif.type] ?? Info;
                return (
                  <button
                    key={notif.id}
                    className={`notif-item notif-item-${notif.type} ${notif.read ? "" : "unread"}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <Icon size={16} className="notif-item-icon" />
                    <span className="notif-item-body">
                      <span className="notif-item-message">{notif.message}</span>
                      <span className="notif-item-time">{formatRelativeTime(notif.createdAt)}</span>
                    </span>
                    {!notif.read && <i className="notif-item-dot" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
