import React from "react";
import { Loader2 } from "lucide-react";
import { formatBytes } from "../utils/format";
import "../styles/FileItem.css";

const STATUS = {
  uploading: { label: "업로드 중", color: "#d97706" },
  processing: { label: "처리 중",  color: "#4285f4" },
  ready:      { label: "준비됨",   color: "#22c55e" },
  error:      { label: "오류",     color: "#ef4444" },
};

export default function FileItem({ file }) {
  const isBusy = file.status === "uploading" || file.status === "processing";
  const s = STATUS[file.status] ?? { label: file.status ?? "알 수 없음", color: "#555570" };

  return (
    <div className="file-item">
      <div className="file-icon">📄</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="file-name">{file.name}</div>
        <div className="file-meta">
          <span className="file-size">{formatBytes(file.size)}</span>
          <span className="status-chip" style={{ color: s.color, backgroundColor: `${s.color}18` }}>
            {isBusy && <Loader2 size={10} className="animate-spin" />}
            {s.label}
          </span>
        </div>
        {file.errorMessage && <div className="file-error-msg">{file.errorMessage}</div>}
      </div>
    </div>
  );
}
