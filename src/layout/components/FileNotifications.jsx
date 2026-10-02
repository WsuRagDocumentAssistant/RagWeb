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

// 서버 알림을 다시 읽는 주기. 다른 사람이 남긴 알림(기능 개선 요청 답변)이나 화면을 닫은 사이
// 끝난 문서 색인 알림도 이 주기 안에 뜬다.
const POLL_MS = 30_000;

export default function FileNotifications() {
  const navigate = useNavigate();
  const token = useAppState((s) => s.token);
  const notifications = useAppState((s) => s.notifications);
  const fetchNotifications = useAppState((s) => s.fetchNotifications);
  const notificationError = useAppState((s) => s.notificationError);
  const markNotificationRead = useAppState((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppState((s) => s.markAllNotificationsRead);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 로그인해 있는 동안 주기적으로 서버 목록을 받는다. 계정이 바뀌면(토큰) 처음부터 다시.
  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_MS);
    return () => clearInterval(timer);
  }, [token, fetchNotifications]);

  // 패널을 열 때도 한 번 — 30초를 기다리지 않고 최신 목록을 보여준다.
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

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
          {notificationError && (
            <p className="file-notifications-error" title={notificationError}>
              서버 알림을 불러오지 못했습니다 — {notificationError}
            </p>
          )}
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
