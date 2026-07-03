import { createApiUrl } from "@/config/ApiService";

async function parseResponse(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message ?? body.detail ?? `요청 실패 (${res.status})`);
  }
  return body.data ?? body;
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ access_token: string, user: any }>}
 */
export async function login(email, password) {
  const res = await fetch(createApiUrl("USER", "LOGIN"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse(res);
}

/**
 * 학교 SSO에서 발급받은 sso_token을 서버에 검증 요청
 * @param {string} ssoToken
 * @returns {Promise<{ access_token: string, user: any }>}
 */
export async function ssoLogin(ssoToken) {
  const res = await fetch(createApiUrl("USER", "SSO_LOGIN"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sso_token: ssoToken }),
  });
  return parseResponse(res);
}

/** @param {string} [token] */
export async function logout(token) {
  const res = await fetch(createApiUrl("USER", "LOGOUT"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return parseResponse(res);
}
