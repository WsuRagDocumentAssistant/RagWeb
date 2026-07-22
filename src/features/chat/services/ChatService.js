import { createApiUrl } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/**
 * @param {{ message: string, provider: string, sessionId?: string, fileIds?: string[] }} payload
 * @returns {Promise<{ reply: string, sessionId: string, sources?: { id: string, name: string }[] }>}
 */
export async function sendMessage(payload) {
  const token = getToken();
  const res = await fetch(createApiUrl("RAG", "CHAT"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `서버 오류 (${res.status})`);
  }
  return res.json();
}
