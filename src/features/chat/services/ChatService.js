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
