import { postTask } from "@/config/ApiService";

const getToken = () => localStorage.getItem("auth_token");

/**
 * @param {string} [search]
 * @returns {Promise<{ entries: any[] }>}
 */
export async function listEntries(search) {
  return postTask("DICTIONARY", "LIST", { token: getToken(), payload: { search } });
}
