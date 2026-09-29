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
