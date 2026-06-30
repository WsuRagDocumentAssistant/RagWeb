import React, { useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { FileItem } from "@/shared";
import "../styles/FileList.css";

export default function FileList({ files, isLoading, uploadProgress, selectedFileIds, onToggleSelect, onUpload }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  };

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h2 className="file-list-title">임베딩 파일</h2>
        <button className="upload-btn" onClick={() => inputRef.current?.click()} disabled={isLoading}>
          <Upload size={14} />
          파일 업로드
        </button>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="upload-progress">
          <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
          <span className="upload-progress-label">{uploadProgress}%</span>
        </div>
      )}

      <input ref={inputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />

      {files.length === 0 && !isLoading ? (
        <div className="file-list-empty">
          <span className="file-list-empty-icon">📁</span>
          <p>업로드된 파일이 없습니다</p>
          <p className="file-list-empty-sub">파일을 업로드하면 AI가 내용을 참조합니다</p>
        </div>
      ) : (
        <div className="file-list-items">
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              isSelected={selectedFileIds.includes(file.id)}
              onToggle={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
