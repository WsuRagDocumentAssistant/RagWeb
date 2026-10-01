import { postTask } from "@/config/ApiService";

import { getToken } from "@/config/authStorage";

/** @returns {Promise<{ users: any[] }>} */
export async function listUsers() {
  return postTask("USER", "LIST", { token: getToken() });
}

/**
 * @param {string} email
 * @param {"admin"|"user"} role
 */
export async function setUserRole(email, role) {
  return postTask("USER", "SET_ROLE", { token: getToken(), payload: { email, role } });
}

/**
 * 학교 DB에서 학번/교번·이름·소속으로 구성원을 찾는다. account는 이미 가입한 사람만 있다.
 * @param {string} keyword 두 글자 이상
 * @returns {Promise<{ users: { id: string, name: string, department?: string, college?: string, status?: string,
 *   account: { email: string, role: "admin"|"user" } | null }[] }>}
 */
export async function searchSchoolUsers(keyword) {
  return postTask("USER", "SCHOOL_SEARCH", { token: getToken(), payload: { keyword } });
}
