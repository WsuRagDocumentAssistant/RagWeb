import { postTask } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/**
 * @param {{ message: string, provider: string, sessionId?: string, fileIds?: string[] }} payload
 * @returns {Promise<{ reply: string, sessionId: string, sources?: { id: string, name: string }[] }>}
 */
export async function sendMessage({ message, provider, sessionId, fileIds }) {
  return postTask("RAG", "CHAT", {
    sessionId,
    token: getToken(),
    payload: { query: message, provider, fileIds },
  });
}

/**
 * 서로 다른 모델의 답변 여러 개를 하나로 병합해서 받아온다.
 * @param {{ query: string, answers: { provider: string, content: string }[], provider: string }} payload provider는 병합 작업을 수행할 모델
 * @returns {Promise<{ reply: string }>}
 */
export async function mergeResults({ query, answers, provider }) {
  return postTask("RAG", "MERGE", {
    token: getToken(),
    payload: { query, answers, provider },
  });
}

/**
 * 로그인한 사용자의 이전 대화 목록을 가져온다. 목록은 가볍게 유지하기 위해 메시지 내역은 포함하지 않는다
 * (내역은 getSessionMessages로 클릭 시 별도 조회).
 * @returns {Promise<{ sessions: { sessionId: string, title?: string, createdAt?: number }[] }>}
 */
export async function listSessions() {
  return postTask("RAG", "LIST_SESSIONS", { token: getToken() });
}

/**
 * 사이드바에서 특정 대화를 클릭했을 때 그 대화의 메시지 내역을 가져온다.
 * @param {string} sessionId
 * @returns {Promise<{ messages: any[] }>}
 */
export async function getSessionMessages(sessionId) {
  return postTask("RAG", "GET_SESSION_MESSAGES", { token: getToken(), payload: { sessionId } });
}

/**
 * 사이드바에서 대화를 삭제했을 때 서버에도 반영한다.
 * @param {string} sessionId
 */
export async function deleteSession(sessionId) {
  return postTask("RAG", "DELETE_SESSION", { token: getToken(), payload: { sessionId } });
}
