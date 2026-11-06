import { postTask } from "@/config/ApiService";

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ access_token: string, user: any }>}
 */
export async function login(email, password) {
  return postTask("USER", "LOGIN", { payload: { email, password } });
}

/**
 * 학교 SSO에서 발급받은 sso_token을 서버에 검증 요청
 * @param {string} ssoToken
 * @returns {Promise<{ access_token: string, user: any }>}
 */
export async function ssoLogin(ssoToken) {
  return postTask("USER", "SSO_LOGIN", { payload: { sso_token: ssoToken } });
}

/** @param {string} [token] */
export async function logout(token) {
  return postTask("USER", "LOGOUT", { token });
}
