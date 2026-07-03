import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useAppState } from "@/core/AppState";
import { FileItem } from "@/shared";
import "../styles/FileNotifications.css";

export default function FileNotifications() {
  const files = useAppState((s) => s.files);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const pendingCount = files.filter((f) => f.status === "uploading" || f.status === "processing").length;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="file-notifications" ref={panelRef}>
      <button className="titlebar-menu-btn" onClick={() => setOpen((v) => !v)} title="파일 업로드 내역">
        <Bell size={18} />
        {pendingCount > 0 && <span className="notif-badge">{pendingCount}</span>}
      </button>

      {open && (
        <div className="file-notifications-panel">
          <h3 className="file-notifications-title">업로드한 파일</h3>
          {files.length === 0 ? (
            <p className="file-notifications-empty">업로드된 파일이 없습니다.</p>
          ) : (
            <div className="file-notifications-list">
              {files.map((file) => <FileItem key={file.id} file={file} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
