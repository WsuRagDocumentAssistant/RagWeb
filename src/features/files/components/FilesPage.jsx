import React from "react";
import { useAppState } from "@/core/AppState";
import FileList from "./FileList";

export default function FilesPage() {
  const files = useAppState((s) => s.files);
  const fileLoading = useAppState((s) => s.fileLoading);
  const uploadProgress = useAppState((s) => s.uploadProgress);
  const selectedFileIds = useAppState((s) => s.selectedFileIds);
  const toggleFileSelection = useAppState((s) => s.toggleFileSelection);
  const uploadFile = useAppState((s) => s.uploadFile);

  return (
    <div className="files-panel">
      <FileList
        files={files}
        isLoading={fileLoading}
        uploadProgress={uploadProgress}
        selectedFileIds={selectedFileIds}
        onToggleSelect={toggleFileSelection}
        onUpload={uploadFile}
      />
    </div>
  );
}
