import { postTask } from "@/config/ApiService";

import { getToken } from "@/config/authStorage";

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
 * 파일을 base64로 실어 WebSocket 메시지 하나로 보낸다. 진행률(onProgress)은 소켓이 실제로 내보낸 양이다.
 * 색인이 끝날 때까지 기다리지 않고 접수 즉시(1초 안) 응답한다 — 결과는 jobId로 JOB_STATUS를 폴링해서 받는다.
 * @param {File} file
 * @param {(progress: number) => void} [onProgress]
 * @param {{ workCategory?: string, task?: string, department?: string, reportType?: string, productionYear?: string }} [metadata]
 * @returns {Promise<{ jobId: string, status: "processing" }>}
 */
export async function uploadFile(file, onProgress, metadata) {
  const content = await readFileAsBase64(file);
  return postTask("RAG", "UPLOAD_FILE", {
    token: getToken(),
    payload: { name: file.name, mimeType: file.type, size: file.size, content, ...metadata },
    onProgress,
  });
}

/**
 * FILE_UPLOAD가 접수한 색인 작업의 진행 상태를 조회한다. ready/error는 한 번만 오고(서버가 그 즉시
 * 지움) 같은 jobId로 다시 물으면 unknown이 온다 — 받는 즉시 폴링을 멈춰야 한다.
 * @param {string} jobId
 * @returns {Promise<
 *   | { status: "processing" }
 *   | { status: "ready", result: { fileId: string, status: string, chunks?: number } }
 *   | { status: "error", error: string }
 *   | { status: "unknown" }
 * >}
 */
export async function getJobStatus(jobId) {
  return postTask("RAG", "JOB_STATUS", { token: getToken(), payload: { jobId } });
}

/** @returns {Promise<any[]>} */
export async function listFiles() {
  return postTask("RAG", "LIST_FILES", { token: getToken() });
}

/** @param {string} fileId */
export async function deleteFile(fileId) {
  await postTask("RAG", "DELETE_FILE", { token: getToken(), payload: { fileId } });
}

/**
 * 문서 원본 파일을 내려받을 수 있는 다운로드 URL을 요청한다.
 * @param {string} fileId
 * @returns {Promise<{ url: string }>}
 */
export async function downloadFile(fileId) {
  return postTask("RAG", "DOWNLOAD_FILE", { token: getToken(), payload: { fileId } });
}

/**
 * 문서 뷰어용 본문. 색인할 때와 같은 단락으로 나눈 원본 문서 전체를 순서대로 받는다.
 * 원본이 없거나 뷰어로 열 수 없는 형식이면 sections가 비고 reason에 이유가 온다.
 * @param {string} fileId
 * @returns {Promise<{ id: string, name: string, url: string | null, reason: string | null,
 *   sections: { heading: string, breadcrumb: string, content: string }[] }>}
 */
export async function getFileContent(fileId) {
  return postTask("RAG", "FILE_CONTENT", { token: getToken(), payload: { fileId } });
}
