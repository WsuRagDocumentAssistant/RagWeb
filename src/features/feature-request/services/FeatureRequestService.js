import { postTask } from "@/config/ApiService";

import { getToken } from "@/config/authStorage";

/**
 * @typedef {"received" | "in_progress" | "done" | "rejected"} FeatureRequestStatus
 * @typedef {{
 *   id: string, title: string, content: string | null, isSecret: boolean,
 *   authorId: string, authorName: string, createdAt: string, updatedAt?: string,
 *   status: FeatureRequestStatus, answer?: string | null, answeredAt?: string | null,
 * }} FeatureRequest
 */

/**
 * 비밀글은 작성자 본인과 관리자에게만 content/answer가 채워져 오고, 그 외 사용자에게는 null로 온다.
 * @returns {Promise<{ requests: FeatureRequest[] }>}
 */
export async function listRequests() {
  return postTask("FEATURE_REQUEST", "LIST", { token: getToken() });
}

/**
 * id가 있으면 수정, 없으면 새로 작성.
 * @param {{ id?: string, title: string, content: string, isSecret: boolean }} request
 * @returns {Promise<{ request: FeatureRequest }>}
 */
export async function saveRequest(request) {
  return postTask("FEATURE_REQUEST", "SAVE", { token: getToken(), payload: request });
}

/** @param {string} id */
export async function deleteRequest(id) {
  return postTask("FEATURE_REQUEST", "DELETE", { token: getToken(), payload: { id } });
}

/**
 * 관리자 전용 — 처리 상태를 바꾸고 답변을 남긴다.
 * @param {{ id: string, status: FeatureRequestStatus, answer: string }} reply
 * @returns {Promise<{ request: FeatureRequest }>}
 */
export async function replyRequest(reply) {
  return postTask("FEATURE_REQUEST", "REPLY", { token: getToken(), payload: reply });
}
