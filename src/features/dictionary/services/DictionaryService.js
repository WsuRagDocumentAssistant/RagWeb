import { createApiUrl } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message ?? body.detail ?? `요청 실패 (${res.status})`);
  }
  return body.data ?? body;
}

/**
 * @param {string} [search]
 * @returns {Promise<{ entries: any[] }>}
 */
export async function listEntries(search) {
  const url = createApiUrl("DICTIONARY", "LIST");
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${url}${query}`, { headers: authHeaders() });
  return parseResponse(res);
}
