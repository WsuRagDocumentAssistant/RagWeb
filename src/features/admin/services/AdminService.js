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
 * 역할과 별개인 권한(문서 정보 입력 등)을 주거나 회수한다.
 * @param {string} email
 * @param {string} permission config/permissions.js 의 PERMISSIONS 값
 * @param {boolean} enabled
 */
export async function setUserPermission(email, permission, enabled) {
  return postTask("USER", "SET_PERMISSION", { token: getToken(), payload: { email, permission, enabled } });
}

/**
 * 학교 사용자 사본에서 학번/교번·이름·소속으로 구성원을 찾는다. account는 이미 가입한 사람만 있다.
 * copy는 사본 상태(행 수, 마지막 동기화 시각)다.
 * @param {string} keyword 한 글자 이상
 * @returns {Promise<{ users: { id: string, name: string, department?: string, college?: string, status?: string,
 *   account: { email: string, role: "admin"|"user" } | null }[], copy: { count: number, syncedAt: string | null } }>}
 */
export async function searchSchoolUsers(keyword) {
  return postTask("USER", "SCHOOL_SEARCH", { token: getToken(), payload: { keyword } });
}

/**
 * 학교 사용자 사본 상태 (인원·마지막 동기화).
 * @returns {Promise<{ count: number, syncedAt: string | null }>}
 */
export async function getSchoolStatus() {
  return postTask("USER", "SCHOOL_STATUS", { token: getToken() });
}

/**
 * 타이머를 기다리지 않고 학교 DB 뷰를 사본으로 바로 복사한다.
 * @returns {Promise<{ count: number, syncedAt: string | null }>}
 */
export async function syncSchoolUsers() {
  return postTask("USER", "SCHOOL_SYNC", { token: getToken() });
}
