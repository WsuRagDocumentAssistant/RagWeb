import { postTask } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/**
 * 문서 하나에 속한 페이지 이미지 목록을 가져온다.
 * @param {string} fileId
 * @returns {Promise<{ images: any[] }>}
 */
export async function listImages(fileId) {
  return postTask("RAG", "LIST_FILE_IMAGES", { token: getToken(), payload: { fileId } });
}

/**
 * 이미지 설명(제목/부연설명/AI 요약/핵심 정보/키워드)을 저장한다.
 * @param {string} fileId
 * @param {string} imageId
 * @param {Record<string, any>} changes
 */
export async function saveImage(fileId, imageId, changes) {
  return postTask("RAG", "SAVE_FILE_IMAGE", { token: getToken(), payload: { fileId, imageId, ...changes } });
}

/**
 * 이미지 파일 자체를 교체 업로드한다. 업로드 진행률이 필요 없어 다른 파일 업로드와 달리 fetch 기반 postTask를 그대로 쓴다.
 * @param {string} fileId
 * @param {string} imageId
 * @param {File} file
 * @returns {Promise<{ imageUrl: string }>}
 */
export function uploadImage(fileId, imageId, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result).split(",")[1] ?? "";
      postTask("RAG", "UPLOAD_FILE_IMAGE", {
        token: getToken(),
        payload: { fileId, imageId, name: file.name, mimeType: file.type, content },
      }).then(resolve, reject);
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsDataURL(file);
  });
}
