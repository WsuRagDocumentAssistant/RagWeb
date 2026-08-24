import { getTaskType, getTaskUrl, postTask } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/** @param {File} file @returns {Promise<string>} */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsDataURL(file);
  });
}

/**
 * 업로드 진행률(onProgress)을 받아야 해서 fetch 대신 XHR로 같은 task_type 봉투를 보낸다.
 * @param {File} file
 * @param {(progress: number) => void} [onProgress]
 * @param {{ area?: string, task?: string, docType?: string, subType?: string, category?: string, subCategory?: string, docDate?: string }} [metadata]
 * @returns {Promise<{ fileId: string, status: string, chunks?: number }>}
 */
export function uploadFile(file, onProgress, metadata) {
  return readFileAsBase64(file).then(
    (content) =>
      new Promise((resolve, reject) => {
        const token = getToken();
        const body = JSON.stringify({
          task_type: getTaskType("RAG", "UPLOAD_FILE"),
          session_id: null,
          payload: { name: file.name, mimeType: file.type, size: file.size, content, ...metadata },
        });

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          let res;
          try {
            res = JSON.parse(xhr.responseText);
          } catch {
            reject(new Error("응답 파싱 실패"));
            return;
          }
          if (xhr.status >= 200 && xhr.status < 300 && res.status !== "error" && res.status !== "timeout") {
            resolve(res.result);
          } else {
            reject(new Error(res.error_message ?? `업로드 실패 (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("네트워크 오류"));
        xhr.ontimeout = () => reject(new Error("요청 시간 초과"));
        xhr.open("POST", getTaskUrl());
        xhr.timeout = 60000;
        xhr.setRequestHeader("Content-Type", "application/json");
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(body);
      }),
  );
}

/** @returns {Promise<any[]>} */
export async function listFiles() {
  return postTask("RAG", "LIST_FILES", { token: getToken() });
}

/** @param {string} fileId */
export async function deleteFile(fileId) {
  await postTask("RAG", "DELETE_FILE", { token: getToken(), payload: { fileId } });
}
