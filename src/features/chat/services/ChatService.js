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
