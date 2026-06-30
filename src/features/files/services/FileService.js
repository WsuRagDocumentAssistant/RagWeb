import { createApiUrl } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/**
 * @param {File} file
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<{ fileId: string, status: string }>}
 */
export function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error("응답 파싱 실패")); }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText).message ?? `업로드 실패 (${xhr.status})`)); }
        catch { reject(new Error(`업로드 실패 (${xhr.status})`)); }
      }
    };
    xhr.onerror = () => reject(new Error("네트워크 오류"));
    xhr.ontimeout = () => reject(new Error("요청 시간 초과"));
    xhr.open("POST", createApiUrl("RAG", "UPLOAD_FILE"));
    xhr.timeout = 60000;
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}

/** @returns {Promise<any[]>} */
export async function listFiles() {
  const token = getToken();
  const res = await fetch(createApiUrl("RAG", "LIST_FILES"), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`목록 조회 실패 (${res.status})`);
  return res.json();
}

/** @param {string} fileId */
export async function deleteFile(fileId) {
  const token = getToken();
  const res = await fetch(createApiUrl("RAG", "DELETE_FILE", { fileId }), {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`삭제 실패 (${res.status})`);
}
