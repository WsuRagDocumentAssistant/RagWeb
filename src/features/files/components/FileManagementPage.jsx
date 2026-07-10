import React, { useEffect, useRef, useState } from "react";
import { UploadCloud, Trash2 } from "lucide-react";
import { useAppState } from "@/core/AppState";
import "../styles/FileManagementPage.css";

const STATUS_LABEL = {
  uploading: "업로드 중",
  processing: "처리 중",
  ready: "처리완료",
  error: "오류",
};

function StatusRing({ status, progress }) {
  if (status === "error") {
    return <span className="fm-ring fm-ring-error">오류</span>;
  }
  if (status === "ready") {
    return <span className="fm-ring fm-ring-ready">100%</span>;
  }
  const pct = status === "uploading" ? progress : 50;
  return <span className="fm-ring fm-ring-processing">{pct}%</span>;
}

export default function FileManagementPage() {
  const files = useAppState((s) => s.files);
  const fetchFiles = useAppState((s) => s.fetchFiles);
  const uploadFile = useAppState((s) => s.uploadFile);
  const deleteFile = useAppState((s) => s.deleteFile);
  const uploadProgress = useAppState((s) => s.uploadProgress);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => { fetchFiles(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    Array.from(e.dataTransfer.files ?? []).forEach((file) => uploadFile(file));
  };

  return (
    <div className="file-management-page">
      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
      <div
        className={["fm-dropzone", isDragging && "dragging"].filter(Boolean).join(" ")}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud size={28} />
        <span>파일을 올려주세요</span>
      </div>

      <div className="fm-list">
        {files.length === 0 ? (
          <p className="fm-empty">임베딩된 파일이 없습니다.</p>
        ) : (
          files.map((file) => (
            <div key={file.id} className="fm-row">
              <span className="fm-row-name">{file.name}</span>
              <span className="fm-row-status" title={STATUS_LABEL[file.status] ?? file.status}>
                <StatusRing status={file.status} progress={uploadProgress} />
              </span>
              <button className="fm-row-delete" onClick={() => deleteFile(file.id)} title="삭제">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
