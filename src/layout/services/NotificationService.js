import { postTask } from "@/config/ApiService";

import { getToken } from "@/config/authStorage";

// 알림은 서버(notifications 테이블)에 저장된다. 문서 색인 완료·실패, 기능 개선 요청 답변은
// 서버가 직접 만들고, 화면 작업의 결과(검색어 저장 등)는 createNotification 으로 남긴다.

/**
 * 내 알림 최신순(최대 50개).
 * @returns {Promise<{ notifications: { id: string, message: string, type: "success"|"error"|"info",
 *   link?: string | null, createdAt: number, read: boolean }[] }>}
 */
export async function listNotifications() {
  return postTask("NOTIFICATION", "LIST", { token: getToken() });
}

/**
 * 읽음 처리. ids를 생략하면 내 알림 전부.
 * @param {string[]} [ids]
 */
export async function markRead(ids) {
  return postTask("NOTIFICATION", "READ", { token: getToken(), payload: ids ? { ids } : {} });
}

/**
 * @param {string} message
 * @param {{ type?: "success"|"error"|"info", link?: string }} [opts]
 */
export async function createNotification(message, opts = {}) {
  return postTask("NOTIFICATION", "CREATE", {
    token: getToken(),
    payload: { message, type: opts.type ?? "info", link: opts.link ?? null },
  });
}
